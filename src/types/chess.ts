export type MoveClassification =
  | 'brilliant'
  | 'great'
  | 'best'
  | 'excellent'
  | 'good'
  | 'book'
  | 'inaccuracy'
  | 'mistake'
  | 'miss'
  | 'blunder'
  | 'forced';

export interface EvalScore {
  type: 'cp' | 'mate';
  value: number; // centipawns or mate distance (+ for white, - for black)
  winProb: number; // 0 - 100% win probability for white
}

export interface MoveReview {
  moveIndex: number; // 0-indexed in the move list
  ply: number; // 1-indexed (1 = 1st white move, 2 = 1st black move, etc.)
  moveNumber: number; // 1, 2, 3...
  turn: 'w' | 'b';
  san: string; // "e4", "Nf3", "O-O"
  uci: string; // "e2e4", "g1f3", "e1g1"
  from: string; // "e2"
  to: string; // "e4"
  piece: string; // "p", "n", "b", "r", "q", "k"
  captured?: string;
  isCheck?: boolean;
  isCheckmate?: boolean;
  fenBefore: string;
  fenAfter: string;
  evalBefore: EvalScore;
  evalAfter: EvalScore;
  bestMoveUci: string;
  bestMoveSan: string;
  bestMoveEval: EvalScore;
  secondBestMoveUci?: string;
  classification: MoveClassification;
  winProbLoss: number; // 0 to 100
  accuracy: number; // 0 to 100
  coachCommentary: string;
  coachTitle: string;
  tacticalTheme?: string;
  isSacrifice?: boolean;
  isOnlyMove?: boolean;
  variation?: string[]; // PV line
}

export interface PgnMeta {
  white: string;
  black: string;
  whiteElo?: string;
  blackElo?: string;
  result: string;
  date?: string;
  event?: string;
  round?: string;
  site?: string;
  eco?: string;
  opening?: string;
  timeControl?: string;
}

export interface GameReview {
  meta: PgnMeta;
  moves: MoveReview[];
  whiteAccuracy: number;
  blackAccuracy: number;
  whiteEloEstimate: number;
  blackEloEstimate: number;
  whiteCounts: Record<MoveClassification, number>;
  blackCounts: Record<MoveClassification, number>;
  opening: {
    eco: string;
    name: string;
  };
  keyMoments: number[]; // indices of critical moves (brilliant, great, mistake, miss, blunder)
  reviewDurationMs: number;
}

export interface ReviewProgress {
  currentMove: number;
  totalMoves: number;
  currentSan: string;
  currentPly: number;
  percent: number;
  depth: number;
  isAnalyzing: boolean;
  isPaused: boolean;
}

export interface EngineSettings {
  depth: number; // 12, 14, 16, 18, 20
  multiPv: number; // 2
  soundEnabled: boolean;
  boardTheme: 'classic' | 'wood' | 'midnight' | 'charcoal' | 'emerald';
  pieceTheme: 'neo' | 'classic' | 'wood';
}
