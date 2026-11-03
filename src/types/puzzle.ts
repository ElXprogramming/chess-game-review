export interface ChessPuzzle {
  id: string;
  rating: number;
  plays: number;
  fen: string; // The position where the user makes their first move
  lastMove: {
    from: string;
    to: string;
  };
  solution: string[]; // Sequence of UCI moves (e.g. ['g1g6', 'h5h4', 'g6h6'])
  themes: string[];
  gameId?: string;
  whitePlayer?: { name: string; rating?: number };
  blackPlayer?: { name: string; rating?: number };
}

export type PuzzleDifficulty = 'any' | 'beginner' | 'intermediate' | 'advanced' | 'master';

export type PuzzleTheme =
  | 'any'
  | 'mateIn1'
  | 'mateIn2'
  | 'mateIn3'
  | 'fork'
  | 'pin'
  | 'skewer'
  | 'advantage'
  | 'endgame'
  | 'hangingPiece'
  | 'deflection';

export interface PuzzleStats {
  solvedCount: number;
  attemptedCount: number;
  currentStreak: number;
  bestStreak: number;
  lastSolvedId?: string;
}
