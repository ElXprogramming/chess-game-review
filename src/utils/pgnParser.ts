import { Chess } from 'chess.js';
import { PgnMeta } from '../types/chess';

export interface ParsedMove {
  moveIndex: number;
  ply: number;
  moveNumber: number;
  turn: 'w' | 'b';
  san: string;
  uci: string;
  from: string;
  to: string;
  piece: string;
  captured?: string;
  isCheck: boolean;
  isCheckmate: boolean;
  fenBefore: string;
  fenAfter: string;
}

export interface ParsedGame {
  meta: PgnMeta;
  moves: ParsedMove[];
  initialFen: string;
  error?: string;
}

/**
 * Robustly parses PGN string into structured game metadata and moves
 */
export function parsePgn(pgnString: string): ParsedGame {
  const meta: PgnMeta = {
    white: 'White Player',
    black: 'Black Player',
    result: '*',
  };

  // 1. Extract PGN header tags [Key "Value"]
  const tagRegex = /\[(\w+)\s+"([^"]*)"\]/g;
  let match;
  while ((match = tagRegex.exec(pgnString)) !== null) {
    const key = match[1].toLowerCase();
    const val = match[2];

    if (key === 'white') meta.white = val;
    else if (key === 'black') meta.black = val;
    else if (key === 'whiteelo') meta.whiteElo = val;
    else if (key === 'blackelo') meta.blackElo = val;
    else if (key === 'result') meta.result = val;
    else if (key === 'date') meta.date = val;
    else if (key === 'event') meta.event = val;
    else if (key === 'round') meta.round = val;
    else if (key === 'site') meta.site = val;
    else if (key === 'eco') meta.eco = val;
    else if (key === 'opening') meta.opening = val;
    else if (key === 'timecontrol') meta.timeControl = val;
  }

  // 2. Load game into chess.js to replay and extract all move details
  const chess = new Chess();
  try {
    chess.loadPgn(pgnString);
  } catch (err: any) {
    // If standard loadPgn failed, clean comments and clocks and retry
    try {
      const cleaned = cleanPgnBody(pgnString);
      chess.loadPgn(cleaned);
    } catch (e2: any) {
      return {
        meta,
        moves: [],
        initialFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        error: `Could not parse PGN: ${err?.message || 'Invalid format'}`,
      };
    }
  }

  // Replay moves from start to capture FENs and exact states
  const history = chess.history({ verbose: true });
  const replayChess = new Chess();
  const initialFen = replayChess.fen();

  const moves: ParsedMove[] = [];

  for (let i = 0; i < history.length; i++) {
    const fenBefore = replayChess.fen();
    const move = history[i];
    const turn = replayChess.turn();
    const moveNumber = Math.floor(i / 2) + 1;

    // Apply move
    replayChess.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion,
    });

    const fenAfter = replayChess.fen();
    const uci = `${move.from}${move.to}${move.promotion || ''}`;

    moves.push({
      moveIndex: i,
      ply: i + 1,
      moveNumber,
      turn,
      san: move.san,
      uci,
      from: move.from,
      to: move.to,
      piece: move.piece,
      captured: move.captured,
      isCheck: replayChess.inCheck(),
      isCheckmate: replayChess.isCheckmate(),
      fenBefore,
      fenAfter,
    });
  }

  return {
    meta,
    moves,
    initialFen,
  };
}

/**
 * Remove comments, clock annotations, and glyphs from PGN text
 */
function cleanPgnBody(pgn: string): string {
  return pgn
    .replace(/\{[^}]*\}/g, '') // Remove comments { ... }
    .replace(/\([^)]*\)/g, '') // Remove variations ( ... )
    .replace(/\$[0-9]+/g, '') // Remove NAGs
    .replace(/\s+/g, ' ')
    .trim();
}
