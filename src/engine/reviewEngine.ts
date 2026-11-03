import { Chess } from 'chess.js';
import { GameReview, MoveReview, MoveClassification, ReviewProgress } from '../types/chess';
import { ParsedGame } from '../utils/pgnParser';
import { engineInstance } from './stockfishWorker';
import { classifyMove } from './classifier';
import { calculateMoveAccuracy, calculateGameAccuracy, estimatePerformanceElo } from './capsCalculator';
import { generateCoachDialogue } from './coachNarrator';
import { identifyOpening } from './openingBook';

export interface ReviewOptions {
  depth: number;
  onProgress?: (progress: ReviewProgress) => void;
  shouldAbort?: () => boolean;
}

/**
 * Convert UCI move (e.g. "e2e4", "g1f3") to SAN notation in a given FEN
 */
function uciToSan(fen: string, uci: string): string {
  if (!uci || uci.length < 4) return '';
  try {
    const chess = new Chess(fen);
    const from = uci.substring(0, 2);
    const to = uci.substring(2, 4);
    const promotion = uci.length > 4 ? uci.substring(4, 5) : undefined;
    const move = chess.move({ from, to, promotion });
    return move ? move.san : uci;
  } catch {
    return uci;
  }
}

/**
 * Review an entire game move by move with Stockfish WASM
 */
export async function reviewGame(
  game: ParsedGame,
  options: ReviewOptions
): Promise<GameReview> {
  const startTime = Date.now();
  const totalMoves = game.moves.length;
  const depth = options.depth || 14;

  const moveReviews: MoveReview[] = [];
  const playedSans = game.moves.map((m) => m.san);

  const whiteAccuracies: number[] = [];
  const blackAccuracies: number[] = [];

  const whiteCounts: Record<MoveClassification, number> = {
    brilliant: 0,
    great: 0,
    best: 0,
    excellent: 0,
    good: 0,
    book: 0,
    inaccuracy: 0,
    mistake: 0,
    miss: 0,
    blunder: 0,
    forced: 0,
  };

  const blackCounts: Record<MoveClassification, number> = {
    brilliant: 0,
    great: 0,
    best: 0,
    excellent: 0,
    good: 0,
    book: 0,
    inaccuracy: 0,
    mistake: 0,
    miss: 0,
    blunder: 0,
    forced: 0,
  };

  const keyMoments: number[] = [];

  // Evaluate initial position before move 1
  let prevEval = (await engineInstance.evaluateFen(game.initialFen, depth)).bestScore;

  for (let i = 0; i < totalMoves; i++) {
    if (options.shouldAbort && options.shouldAbort()) {
      throw new Error('Analysis cancelled by user');
    }

    const m = game.moves[i];

    if (options.onProgress) {
      options.onProgress({
        currentMove: i + 1,
        totalMoves,
        currentSan: m.san,
        currentPly: m.ply,
        percent: Math.round(((i + 1) / totalMoves) * 100),
        depth,
        isAnalyzing: true,
        isPaused: false,
      });
    }

    // 1. Evaluate position before move to get best move & alternative lines
    const analysisBefore = await engineInstance.evaluateFen(m.fenBefore, depth);
    const bestMoveUci = analysisBefore.bestMoveUci || m.uci;
    const bestMoveSan = uciToSan(m.fenBefore, bestMoveUci);
    const bestMoveEval = analysisBefore.bestScore;
    const secondBestMoveEval = analysisBefore.secondBestScore;

    // 2. Evaluate position after move
    const analysisAfter = await engineInstance.evaluateFen(m.fenAfter, depth);
    const evalAfter = analysisAfter.bestScore;

    // 3. Classify move
    const { classification, winProbLoss, isSacrifice, isOnlyMove } = classifyMove({
      moveIndex: i,
      turn: m.turn,
      san: m.san,
      uci: m.uci,
      from: m.from,
      to: m.to,
      piece: m.piece,
      captured: m.captured,
      fenBefore: m.fenBefore,
      fenAfter: m.fenAfter,
      evalBefore: prevEval,
      evalAfter,
      bestMoveUci,
      bestMoveSan,
      bestMoveEval,
      secondBestMoveEval,
      playedSans,
    });

    // 4. Calculate accuracy
    const accuracy = calculateMoveAccuracy(winProbLoss);
    if (m.turn === 'w') {
      whiteAccuracies.push(accuracy);
      whiteCounts[classification]++;
    } else {
      blackAccuracies.push(accuracy);
      blackCounts[classification]++;
    }

    // 5. Generate coach commentary
    const coach = generateCoachDialogue({
      moveNumber: m.moveNumber,
      turn: m.turn,
      san: m.san,
      piece: m.piece,
      from: m.from,
      to: m.to,
      captured: m.captured,
      isCheck: m.isCheck,
      isCheckmate: m.isCheckmate,
      fenBefore: m.fenBefore,
      fenAfter: m.fenAfter,
      evalBefore: prevEval,
      evalAfter,
      bestMoveSan,
      bestMoveUci,
      classification,
      winProbLoss,
      isSacrifice,
      isOnlyMove,
    });

    if (['brilliant', 'great', 'mistake', 'miss', 'blunder'].includes(classification)) {
      keyMoments.push(i);
    }

    const reviewItem: MoveReview = {
      moveIndex: i,
      ply: m.ply,
      moveNumber: m.moveNumber,
      turn: m.turn,
      san: m.san,
      uci: m.uci,
      from: m.from,
      to: m.to,
      piece: m.piece,
      captured: m.captured,
      isCheck: m.isCheck,
      isCheckmate: m.isCheckmate,
      fenBefore: m.fenBefore,
      fenAfter: m.fenAfter,
      evalBefore: prevEval,
      evalAfter,
      bestMoveUci,
      bestMoveSan,
      bestMoveEval,
      secondBestMoveUci: analysisBefore.secondBestMoveUci,
      classification,
      winProbLoss,
      accuracy,
      coachCommentary: coach.commentary,
      coachTitle: coach.title,
      tacticalTheme: coach.tacticalTheme,
      isSacrifice,
      isOnlyMove,
      variation: analysisBefore.lines[0]?.moves.slice(0, 5),
    };

    moveReviews.push(reviewItem);
    prevEval = evalAfter;
  }

  const whiteAccuracy = calculateGameAccuracy(whiteAccuracies);
  const blackAccuracy = calculateGameAccuracy(blackAccuracies);

  const whiteEloEstimate = estimatePerformanceElo(whiteAccuracy, whiteCounts, game.meta.whiteElo);
  const blackEloEstimate = estimatePerformanceElo(blackAccuracy, blackCounts, game.meta.blackElo);

  const opening = identifyOpening(playedSans);

  return {
    meta: {
      ...game.meta,
      opening: game.meta.opening || opening.name,
      eco: game.meta.eco || opening.eco,
    },
    moves: moveReviews,
    whiteAccuracy,
    blackAccuracy,
    whiteEloEstimate,
    blackEloEstimate,
    whiteCounts,
    blackCounts,
    opening,
    keyMoments,
    reviewDurationMs: Date.now() - startTime,
  };
}
