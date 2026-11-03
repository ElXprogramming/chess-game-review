import { Chess } from 'chess.js';
import { MoveClassification, EvalScore } from '../types/chess';

export interface NarratorInput {
  moveNumber: number;
  turn: 'w' | 'b';
  san: string;
  piece: string;
  from: string;
  to: string;
  captured?: string;
  isCheck?: boolean;
  isCheckmate?: boolean;
  fenBefore: string;
  fenAfter: string;
  evalBefore: EvalScore;
  evalAfter: EvalScore;
  bestMoveSan: string;
  bestMoveUci: string;
  classification: MoveClassification;
  winProbLoss: number;
  isSacrifice?: boolean;
  isOnlyMove?: boolean;
}

const PIECE_NAMES: Record<string, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
};

/**
 * Detect tactical themes in the position
 */
function detectTacticalTheme(input: NarratorInput): string | undefined {
  if (input.isCheckmate) return 'Checkmate';
  if (input.isSacrifice) return 'Material Sacrifice';

  try {
    const chess = new Chess(input.fenAfter);
    const moves = chess.moves({ verbose: true });

    if (input.isCheck) {
      if (input.classification === 'blunder' || input.classification === 'mistake') {
        return 'Spite Check';
      }
      return 'Checking Attack';
    }

    // Check for knight fork
    if (input.piece.toLowerCase() === 'n') {
      const targets = moves.filter((m) => m.from === input.to && m.captured);
      const highValTargets = targets.filter((m) => ['r', 'q', 'k'].includes(m.captured || ''));
      if (highValTargets.length >= 2) {
        return 'Knight Fork';
      }
    }

    // Check for back rank weakness
    const rank = input.to[1];
    if (['r', 'q'].includes(input.piece.toLowerCase()) && (rank === '8' || rank === '1')) {
      if (input.isCheck) return 'Back Rank Attack';
    }

    // Passed pawn advance
    if (input.piece.toLowerCase() === 'p') {
      if (input.turn === 'w' && parseInt(rank) >= 6) return 'Passed Pawn Advance';
      if (input.turn === 'b' && parseInt(rank) <= 3) return 'Passed Pawn Advance';
    }
  } catch {
    // ignore
  }

  return undefined;
}

export function generateCoachDialogue(input: NarratorInput): {
  title: string;
  commentary: string;
  tacticalTheme?: string;
} {
  const pieceName = PIECE_NAMES[input.piece.toLowerCase()] || 'piece';
  const player = input.turn === 'w' ? 'White' : 'Black';
  const tacticalTheme = detectTacticalTheme(input);

  switch (input.classification) {
    case 'brilliant':
      return {
        title: 'Brilliant Move!!',
        commentary: `You sacrificed your ${pieceName} with ${input.san}!! This daring and precise tactical strike completely dismantles your opponent's defense while securing a decisive positional advantage.`,
        tacticalTheme: tacticalTheme || 'Tactical Sacrifice',
      };

    case 'great':
      return {
        title: 'Great Move!',
        commentary: `${input.san} was the only move that maintains the advantage! Finding this critical continuation under pressure proves great calculation.`,
        tacticalTheme: tacticalTheme || 'Critical Defense',
      };

    case 'best':
      if (input.isCheckmate) {
        return {
          title: 'Checkmate!',
          commentary: `Clinical finish! ${input.san} delivers checkmate and ends the contest in style.`,
          tacticalTheme: 'Checkmate',
        };
      }
      return {
        title: 'Best Move ★',
        commentary: `${input.san} is the top computer choice. It activates your pieces, controls key squares, and gives ${player} the best chances.`,
        tacticalTheme,
      };

    case 'excellent':
      return {
        title: 'Excellent Move 👍',
        commentary: `A very strong move! ${input.san} is almost as good as the engine's favorite and keeps the game under solid control.`,
        tacticalTheme,
      };

    case 'good':
      return {
        title: 'Good Move ✓',
        commentary: `Solid play. ${input.san} develops your position without conceding significant weaknesses.`,
        tacticalTheme,
      };

    case 'book':
      return {
        title: 'Book Move 📖',
        commentary: `Following established master opening theory. ${input.san} is well-studied and keeps equal or standard chances.`,
        tacticalTheme: 'Opening Theory',
      };

    case 'inaccuracy':
      return {
        title: 'Inaccuracy ?!',
        commentary: `${input.san} is a slight inaccuracy that gives away some of your initiative. Better was ${input.bestMoveSan}, which exerts more immediate pressure.`,
        tacticalTheme: tacticalTheme || 'Suboptimal Development',
      };

    case 'mistake':
      return {
        title: 'Mistake ?',
        commentary: `A clear mistake! ${input.san} weakens your position and allows your opponent to equalize or gain momentum. You should have opted for ${input.bestMoveSan}.`,
        tacticalTheme: tacticalTheme || 'Positional Slip',
      };

    case 'miss':
      return {
        title: 'Missed Win ❌',
        commentary: `You missed a winning opportunity! You had ${input.bestMoveSan}, which would have seized commanding material or a crushing attack. Instead, ${input.san} lets the opponent off the hook.`,
        tacticalTheme: tacticalTheme || 'Missed Tactic',
      };

    case 'blunder':
      return {
        title: 'Blunder ??',
        commentary: `A critical blunder! ${input.san} dramatically swings the evaluation in your opponent's favor. The essential move was ${input.bestMoveSan} to stay in the game.`,
        tacticalTheme: tacticalTheme || 'Severe Oversight',
      };

    case 'forced':
      return {
        title: 'Forced Move —',
        commentary: `${input.san} was the only legal move available on the board.`,
        tacticalTheme: 'Forced Move',
      };

    default:
      return {
        title: 'Move Played',
        commentary: `${input.san} was played.`,
      };
  }
}
