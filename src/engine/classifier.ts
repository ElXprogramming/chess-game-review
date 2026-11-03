import { Chess } from 'chess.js';
import { EvalScore, MoveClassification } from '../types/chess';
import { calculateWinProbLoss, evalToWinProb } from './capsCalculator';
import { isMoveInBook } from './openingBook';

export interface ClassificationContext {
  moveIndex: number;
  turn: 'w' | 'b';
  san: string;
  uci: string;
  from: string;
  to: string;
  piece: string;
  captured?: string;
  fenBefore: string;
  fenAfter: string;
  evalBefore: EvalScore;
  evalAfter: EvalScore;
  bestMoveUci: string;
  bestMoveSan: string;
  bestMoveEval: EvalScore;
  secondBestMoveEval?: EvalScore;
  playedSans: string[];
}

const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 100,
};

/**
 * Check if the position only had a single legal move (Forced)
 */
function isOnlyLegalMove(fenBefore: string): boolean {
  try {
    const chess = new Chess(fenBefore);
    return chess.moves().length === 1;
  } catch {
    return false;
  }
}

/**
 * Detect if the played move involves a genuine piece sacrifice
 */
function isSacrificeMove(ctx: ClassificationContext): boolean {
  try {
    const chess = new Chess(ctx.fenAfter);
    // Is the moving piece or another piece hanging and undefended/under-defended?
    const movedVal = PIECE_VALUES[ctx.piece.toLowerCase()] || 0;
    if (movedVal < 3) return false; // Pawns are not piece sacrifices

    // Check if the destination square is attacked by opponent pawns or lower pieces
    const opponentTurn = ctx.turn === 'w' ? 'b' : 'w';
    const moves = chess.moves({ verbose: true });

    // Look for opponent captures targeting ctx.to
    for (const m of moves) {
      if (m.to === ctx.to && m.color === opponentTurn) {
        const attackerVal = PIECE_VALUES[m.piece.toLowerCase()] || 0;
        // If captured by pawn or lesser piece, or if undefended
        if (attackerVal <= movedVal) {
          // If the engine still considers our position good (>= -50 cp or winProb >= 50%)
          const playerProb = ctx.turn === 'w' ? evalToWinProb(ctx.evalAfter) : 100 - evalToWinProb(ctx.evalAfter);
          if (playerProb >= 55) {
            return true;
          }
        }
      }
    }
  } catch {
    // ignore
  }
  return false;
}

/**
 * Main classification function determining the badge for a move
 */
export function classifyMove(ctx: ClassificationContext): {
  classification: MoveClassification;
  winProbLoss: number;
  isSacrifice: boolean;
  isOnlyMove: boolean;
} {
  // 1. Check if forced (only 1 legal move)
  if (isOnlyLegalMove(ctx.fenBefore)) {
    return {
      classification: 'forced',
      winProbLoss: 0,
      isSacrifice: false,
      isOnlyMove: true,
    };
  }

  // 2. Check if opening book move
  if (isMoveInBook(ctx.playedSans, ctx.moveIndex)) {
    return {
      classification: 'book',
      winProbLoss: 0,
      isSacrifice: false,
      isOnlyMove: false,
    };
  }

  // Calculate Win Probability Loss
  const winProbLoss = calculateWinProbLoss(ctx.turn, ctx.bestMoveEval, ctx.evalAfter);
  const isTopChoice = ctx.uci.toLowerCase() === ctx.bestMoveUci.toLowerCase() || winProbLoss <= 0.8;

  const playerProbBefore = ctx.turn === 'w' ? evalToWinProb(ctx.evalBefore) : 100 - evalToWinProb(ctx.evalBefore);
  const playerProbAfter = ctx.turn === 'w' ? evalToWinProb(ctx.evalAfter) : 100 - evalToWinProb(ctx.evalAfter);

  const sacrifice = isSacrificeMove(ctx);

  // 3. Brilliant (!!)
  // Piece sacrifice that maintains winning advantage or equalizes from a losing position
  if (isTopChoice && sacrifice && playerProbAfter >= 52) {
    return {
      classification: 'brilliant',
      winProbLoss,
      isSacrifice: true,
      isOnlyMove: false,
    };
  }

  // 4. Great Move (!)
  // A move that is the ONLY good move (second best move is drastically worse),
  // finding a critical defensive resource or winning stroke
  if (isTopChoice && ctx.secondBestMoveEval) {
    const secondLoss = calculateWinProbLoss(ctx.turn, ctx.bestMoveEval, ctx.secondBestMoveEval);
    // If second best move drops more than 15% win probability
    if (secondLoss >= 16.0 && playerProbAfter >= 45) {
      return {
        classification: 'great',
        winProbLoss,
        isSacrifice: sacrifice,
        isOnlyMove: true,
      };
    }
  }

  // 5. Best Move (★)
  if (isTopChoice || winProbLoss <= 1.2) {
    return {
      classification: 'best',
      winProbLoss,
      isSacrifice: sacrifice,
      isOnlyMove: false,
    };
  }

  // 6. Excellent (👍)
  if (winProbLoss <= 3.8) {
    return {
      classification: 'excellent',
      winProbLoss,
      isSacrifice: false,
      isOnlyMove: false,
    };
  }

  // 7. Good (✓)
  if (winProbLoss <= 7.5) {
    return {
      classification: 'good',
      winProbLoss,
      isSacrifice: false,
      isOnlyMove: false,
    };
  }

  // 8. Miss (❌)
  // Player had a winning tactic (playerProbBefore >= 75% or evalBefore had mate/heavy advantage),
  // but missed it, dropping the advantage back towards equal or worse
  if (playerProbBefore >= 78 && playerProbAfter < 62 && winProbLoss >= 15.0) {
    return {
      classification: 'miss',
      winProbLoss,
      isSacrifice: false,
      isOnlyMove: false,
    };
  }

  // 9. Inaccuracy (?!)
  if (winProbLoss <= 15.0) {
    return {
      classification: 'inaccuracy',
      winProbLoss,
      isSacrifice: false,
      isOnlyMove: false,
    };
  }

  // 10. Mistake (?)
  if (winProbLoss <= 25.0) {
    return {
      classification: 'mistake',
      winProbLoss,
      isSacrifice: false,
      isOnlyMove: false,
    };
  }

  // 11. Blunder (??)
  return {
    classification: 'blunder',
    winProbLoss,
    isSacrifice: false,
    isOnlyMove: false,
  };
}
