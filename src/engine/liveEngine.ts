import { Chess } from 'chess.js';
import { EvalScore } from '../types/chess';
import { cpToWinProb } from './capsCalculator';

export interface LivePvLine {
  multipv: number;
  score: EvalScore;
  depth: number;
  bestMoveUci: string;
  bestMoveSan: string;
  pvUci: string[];
  pvSan: string[];
  formattedLine: string;
}

export interface LiveEngineState {
  fen: string;
  depth: number;
  score: EvalScore;
  bestMoveUci: string;
  bestMoveSan: string;
  pvUci: string[];
  pvSan: string[];
  formattedLine: string;
  isSearching: boolean;
  lines: LivePvLine[];
  gameOverMessage?: string;
  nodes?: number;
  nps?: number;
}

/**
 * Converts a sequence of UCI moves (e.g. ["e2e4", "e7e5", "g1f3"])
 * into readable SAN notation with move numbers from a given starting FEN.
 */
export function formatPvLine(
  fen: string,
  uciMoves: string[]
): {
  pvSan: string[];
  formattedLine: string;
  bestMoveSan: string;
  bestMoveUci: string;
} {
  if (!uciMoves || uciMoves.length === 0) {
    return { pvSan: [], formattedLine: '', bestMoveSan: '', bestMoveUci: '' };
  }

  const bestMoveUci = uciMoves[0] || '';
  let bestMoveSan = '';

  try {
    const chess = new Chess(fen);
    const pvSan: string[] = [];
    const formattedParts: string[] = [];

    for (let i = 0; i < uciMoves.length; i++) {
      const uci = uciMoves[i];
      if (!uci || uci.length < 4) break;

      const from = uci.substring(0, 2);
      const to = uci.substring(2, 4);
      const promotion = uci.length > 4 ? uci.substring(4, 5) : undefined;

      const turn = chess.turn();
      const moveNum = chess.moveNumber();

      const move = chess.move({ from, to, promotion });
      if (!move) break;

      if (i === 0) {
        bestMoveSan = move.san;
      }

      pvSan.push(move.san);

      if (turn === 'w') {
        formattedParts.push(`${moveNum}. ${move.san}`);
      } else {
        if (formattedParts.length === 0) {
          formattedParts.push(`${moveNum}... ${move.san}`);
        } else {
          formattedParts.push(move.san);
        }
      }
    }

    return {
      pvSan,
      formattedLine: formattedParts.join(' '),
      bestMoveSan: bestMoveSan || bestMoveUci,
      bestMoveUci,
    };
  } catch {
    return {
      pvSan: uciMoves,
      formattedLine: uciMoves.join(' '),
      bestMoveSan: bestMoveUci,
      bestMoveUci,
    };
  }
}

export class LiveStockfishService {
  private worker: Worker | null = null;
  private isReady = false;
  private initPromise: Promise<void> | null = null;
  private currentSearchId = 0;
  private currentFen = '';
  private currentTurn: 'w' | 'b' = 'w';
  private linesMap: Map<number, LivePvLine> = new Map();
  private onUpdateCallback: ((state: LiveEngineState) => void) | null = null;
  private fallbackMode = false;
  private depthLimit = 18;
  private multiPvCount = 2;
  private isSearching = false;

  constructor() {}

  public async init(): Promise<void> {
    if (this.isReady) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise<void>((resolve) => {
      try {
        if (typeof window === 'undefined' || typeof Worker === 'undefined') {
          console.warn('[Live Stockfish] Worker not available, using heuristic fallback');
          this.fallbackMode = true;
          this.isReady = true;
          resolve();
          return;
        }

        const wasmSupported =
          typeof WebAssembly === 'object' &&
          typeof WebAssembly.validate === 'function' &&
          WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]));

        const workerScript = wasmSupported ? '/engine/stockfish.wasm.js' : '/engine/stockfish.js';
        this.worker = new Worker(workerScript);

        const timeout = setTimeout(() => {
          if (!this.isReady) {
            console.warn('[Live Stockfish] Worker init timed out, using fallback');
            this.fallbackMode = true;
            this.isReady = true;
            resolve();
          }
        }, 4000);

        this.worker.onmessage = (e: MessageEvent) => {
          const line: string = typeof e.data === 'string' ? e.data : '';
          this.handleWorkerMessage(line, resolve, timeout);
        };

        this.worker.onerror = (err) => {
          console.error('[Live Stockfish Error]', err);
          clearTimeout(timeout);
          this.fallbackMode = true;
          this.isReady = true;
          resolve();
        };

        this.worker.postMessage('uci');
      } catch (err) {
        console.error('[Live Stockfish] Init error:', err);
        this.fallbackMode = true;
        this.isReady = true;
        resolve();
      }
    });

    return this.initPromise;
  }

  private handleWorkerMessage(line: string, onReady?: () => void, timeoutHandle?: any) {
    if (line === 'uciok') {
      if (this.worker) {
        this.worker.postMessage(`setoption name MultiPV value ${this.multiPvCount}`);
        this.worker.postMessage('setoption name Hash value 32');
        this.worker.postMessage('isready');
      }
      return;
    }

    if (line === 'readyok') {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      this.isReady = true;
      if (onReady) onReady();
      return;
    }

    if (line.startsWith('info ') && line.includes(' score ')) {
      this.parseInfoLine(line);
      return;
    }

    if (line.startsWith('bestmove ')) {
      this.isSearching = false;
      this.notifyUpdate(false);
    }
  }

  private parseInfoLine(line: string) {
    const depthMatch = line.match(/\bdepth (\d+)\b/);
    const multipvMatch = line.match(/\bmultipv (\d+)\b/);
    const scoreCpMatch = line.match(/\bscore cp (-?\d+)\b/);
    const scoreMateMatch = line.match(/\bscore mate (-?\d+)\b/);
    const nodesMatch = line.match(/\bnodes (\d+)\b/);
    const npsMatch = line.match(/\bnps (\d+)\b/);
    const pvIndex = line.indexOf(' pv ');

    const depth = depthMatch ? parseInt(depthMatch[1], 10) : 1;
    const multipv = multipvMatch ? parseInt(multipvMatch[1], 10) : 1;
    let evalScore: EvalScore = { type: 'cp', value: 0, winProb: 50 };

    if (scoreMateMatch) {
      const mateVal = parseInt(scoreMateMatch[1], 10);
      const whiteMate = this.currentTurn === 'w' ? mateVal : -mateVal;
      evalScore = {
        type: 'mate',
        value: whiteMate,
        winProb: whiteMate > 0 ? 100 : 0,
      };
    } else if (scoreCpMatch) {
      const rawCp = parseInt(scoreCpMatch[1], 10);
      const whiteCp = this.currentTurn === 'w' ? rawCp : -rawCp;
      evalScore = {
        type: 'cp',
        value: whiteCp,
        winProb: cpToWinProb(whiteCp),
      };
    }

    let uciMoves: string[] = [];
    if (pvIndex !== -1) {
      uciMoves = line.substring(pvIndex + 4).trim().split(' ').filter(Boolean);
    }

    const { pvSan, formattedLine, bestMoveSan, bestMoveUci } = formatPvLine(
      this.currentFen,
      uciMoves
    );

    this.linesMap.set(multipv, {
      multipv,
      score: evalScore,
      depth,
      bestMoveUci,
      bestMoveSan,
      pvUci: uciMoves,
      pvSan,
      formattedLine,
    });

    const nodes = nodesMatch ? parseInt(nodesMatch[1], 10) : undefined;
    const nps = npsMatch ? parseInt(npsMatch[1], 10) : undefined;

    this.notifyUpdate(true, nodes, nps);
  }

  private notifyUpdate(isSearching: boolean, nodes?: number, nps?: number) {
    if (!this.onUpdateCallback) return;

    const sortedLines = Array.from(this.linesMap.values()).sort(
      (a, b) => a.multipv - b.multipv
    );

    const bestLine = sortedLines[0];
    if (!bestLine) return;

    this.onUpdateCallback({
      fen: this.currentFen,
      depth: bestLine.depth,
      score: bestLine.score,
      bestMoveUci: bestLine.bestMoveUci,
      bestMoveSan: bestMoveSan(bestLine),
      pvUci: bestLine.pvUci,
      pvSan: bestLine.pvSan,
      formattedLine: bestLine.formattedLine,
      isSearching,
      lines: sortedLines,
      nodes,
      nps,
    });
  }

  public setMultiPv(count: number) {
    this.multiPvCount = Math.max(1, Math.min(3, count));
    if (this.worker && this.isReady) {
      this.worker.postMessage(`setoption name MultiPV value ${this.multiPvCount}`);
    }
  }

  public async analyze(
    fen: string,
    options?: { depth?: number; multiPv?: number },
    onUpdate?: (state: LiveEngineState) => void
  ) {
    this.onUpdateCallback = onUpdate || null;
    const searchId = ++this.currentSearchId;
    this.currentFen = fen;

    // Check game over first
    try {
      const chess = new Chess(fen);
      this.currentTurn = chess.turn();

      if (chess.isGameOver()) {
        let msg = 'Game Over';
        let score: EvalScore = { type: 'cp', value: 0, winProb: 50 };

        if (chess.isCheckmate()) {
          const winner = chess.turn() === 'w' ? 'Black' : 'White';
          msg = `Checkmate — ${winner} wins!`;
          score = {
            type: 'mate',
            value: chess.turn() === 'w' ? -1 : 1,
            winProb: chess.turn() === 'w' ? 0 : 100,
          };
        } else if (chess.isStalemate()) {
          msg = 'Draw by Stalemate';
        } else if (chess.isThreefoldRepetition()) {
          msg = 'Draw by Repetition';
        } else if (chess.isInsufficientMaterial()) {
          msg = 'Draw by Insufficient Material';
        } else {
          msg = 'Draw';
        }

        const state: LiveEngineState = {
          fen,
          depth: 0,
          score,
          bestMoveUci: '',
          bestMoveSan: '',
          pvUci: [],
          pvSan: [],
          formattedLine: msg,
          isSearching: false,
          lines: [],
          gameOverMessage: msg,
        };

        if (this.onUpdateCallback) {
          this.onUpdateCallback(state);
        }
        return;
      }
    } catch {
      // ignore
    }

    await this.init();

    // Check if this search is still current
    if (searchId !== this.currentSearchId) return;

    if (options?.multiPv && options.multiPv !== this.multiPvCount) {
      this.setMultiPv(options.multiPv);
    }

    const depth = options?.depth || this.depthLimit;

    if (this.fallbackMode || !this.worker) {
      const fallback = this.heuristicFallback(fen);
      if (this.onUpdateCallback) {
        this.onUpdateCallback(fallback);
      }
      return;
    }

    // Stop ongoing search if any
    if (this.isSearching) {
      this.worker.postMessage('stop');
    }

    this.linesMap.clear();
    this.isSearching = true;

    this.worker.postMessage(`position fen ${fen}`);
    this.worker.postMessage(`go depth ${depth}`);
  }

  public stop() {
    this.isSearching = false;
    if (this.worker && this.isReady) {
      this.worker.postMessage('stop');
    }
  }

  private heuristicFallback(fen: string): LiveEngineState {
    const boardPart = fen.split(' ')[0];
    let cp = 0;
    const values: Record<string, number> = {
      p: 100,
      n: 320,
      b: 330,
      r: 500,
      q: 900,
      k: 0,
      P: 100,
      N: 320,
      B: 330,
      R: 500,
      Q: 900,
      K: 0,
    };

    for (const char of boardPart) {
      if (values[char] !== undefined) {
        if (char === char.toUpperCase()) {
          cp += values[char];
        } else {
          cp -= values[char];
        }
      }
    }

    const score: EvalScore = {
      type: 'cp',
      value: cp,
      winProb: cpToWinProb(cp),
    };

    return {
      fen,
      depth: 1,
      score,
      bestMoveUci: '',
      bestMoveSan: '',
      pvUci: [],
      pvSan: [],
      formattedLine: 'Evaluation based on material count (engine fallback)',
      isSearching: false,
      lines: [
        {
          multipv: 1,
          score,
          depth: 1,
          bestMoveUci: '',
          bestMoveSan: '',
          pvUci: [],
          pvSan: [],
          formattedLine: '',
        },
      ],
    };
  }

  public terminate() {
    this.stop();
    if (this.worker) {
      try {
        this.worker.postMessage('quit');
        this.worker.terminate();
      } catch {
        // ignore
      }
      this.worker = null;
      this.isReady = false;
      this.initPromise = null;
    }
  }
}

function bestMoveSan(line: LivePvLine): string {
  return line.bestMoveSan || line.bestMoveUci || '';
}

export const liveEngineInstance = new LiveStockfishService();
