import { EvalScore } from '../types/chess';
import { cpToWinProb } from './capsCalculator';

export interface PvLine {
  multipv: number;
  score: EvalScore;
  moves: string[]; // UCI moves
  depth: number;
}

export interface PositionAnalysis {
  bestMoveUci: string;
  bestScore: EvalScore;
  secondBestMoveUci?: string;
  secondBestScore?: EvalScore;
  depthReached: number;
  lines: PvLine[];
}

export class StockfishService {
  private worker: Worker | null = null;
  private isReady = false;
  private initPromise: Promise<void> | null = null;
  private currentResolver: ((analysis: PositionAnalysis) => void) | null = null;
  private currentTurn: 'w' | 'b' = 'w';
  private currentLines: Map<number, PvLine> = new Map();
  private maxDepth = 14;
  private fallbackMode = false;

  constructor() {}

  /**
   * Initialize the Stockfish web worker
   */
  public async init(): Promise<void> {
    if (this.isReady) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise<void>((resolve) => {
      try {
        if (typeof window === 'undefined' || typeof Worker === 'undefined') {
          console.warn('[Stockfish] Web Workers not supported in this environment, using fallback.');
          this.fallbackMode = true;
          this.isReady = true;
          resolve();
          return;
        }

        // Check if WebAssembly is supported
        const wasmSupported =
          typeof WebAssembly === 'object' &&
          typeof WebAssembly.validate === 'function' &&
          WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]));

        const workerScript = wasmSupported ? '/engine/stockfish.wasm.js' : '/engine/stockfish.js';

        this.worker = new Worker(workerScript);

        const timeout = setTimeout(() => {
          if (!this.isReady) {
            console.warn('[Stockfish] Initialization timeout, trying fallback stockfish.js');
            this.tryFallbackWorker(resolve);
          }
        }, 4000);

        this.worker.onmessage = (e: MessageEvent) => {
          const line: string = typeof e.data === 'string' ? e.data : '';
          this.handleWorkerMessage(line, resolve, timeout);
        };

        this.worker.onerror = (err) => {
          console.error('[Stockfish Worker Error]', err);
          clearTimeout(timeout);
          this.tryFallbackWorker(resolve);
        };

        // Send UCI init commands
        this.worker.postMessage('uci');
      } catch (e) {
        console.error('[Stockfish] Failed to initialize worker', e);
        this.fallbackMode = true;
        this.isReady = true;
        resolve();
      }
    });

    return this.initPromise;
  }

  private tryFallbackWorker(finalResolve: () => void) {
    if (this.worker) {
      try {
        this.worker.terminate();
      } catch {
        // ignore
      }
      this.worker = null;
    }

    try {
      this.worker = new Worker('/engine/stockfish.js');
      const fallbackTimeout = setTimeout(() => {
        if (!this.isReady) {
          console.warn('[Stockfish] Pure JS worker timed out, using JS engine fallback');
          this.fallbackMode = true;
          this.isReady = true;
          finalResolve();
        }
      }, 4000);

      this.worker.onmessage = (e: MessageEvent) => {
        const line = typeof e.data === 'string' ? e.data : '';
        this.handleWorkerMessage(line, finalResolve, fallbackTimeout);
      };

      this.worker.onerror = () => {
        clearTimeout(fallbackTimeout);
        this.fallbackMode = true;
        this.isReady = true;
        finalResolve();
      };

      this.worker.postMessage('uci');
    } catch {
      this.fallbackMode = true;
      this.isReady = true;
      finalResolve();
    }
  }

  private handleWorkerMessage(line: string, onReady?: () => void, timeoutHandle?: any) {
    if (line === 'uciok') {
      if (this.worker) {
        this.worker.postMessage('setoption name MultiPV value 2');
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

    // Parse engine search evaluation info
    if (line.startsWith('info ') && line.includes(' score ')) {
      this.parseInfoLine(line);
      return;
    }

    // Best move reached - finalize analysis
    if (line.startsWith('bestmove ')) {
      const parts = line.split(' ');
      const bestMoveUci = parts[1] || '';
      this.finishCurrentAnalysis(bestMoveUci);
    }
  }

  private parseInfoLine(line: string) {
    // Example: info depth 14 seldepth 18 multipv 1 score cp 42 nodes 12345 pv e2e4 e7e5
    const depthMatch = line.match(/\bdepth (\d+)\b/);
    const multipvMatch = line.match(/\bmultipv (\d+)\b/);
    const scoreCpMatch = line.match(/\bscore cp (-?\d+)\b/);
    const scoreMateMatch = line.match(/\bscore mate (-?\d+)\b/);
    const pvIndex = line.indexOf(' pv ');

    const depth = depthMatch ? parseInt(depthMatch[1], 10) : 0;
    const multipv = multipvMatch ? parseInt(multipvMatch[1], 10) : 1;
    let evalScore: EvalScore = { type: 'cp', value: 0, winProb: 50 };

    if (scoreMateMatch) {
      const mateVal = parseInt(scoreMateMatch[1], 10);
      // In UCI, mate score is relative to side to move
      const whiteMate = this.currentTurn === 'w' ? mateVal : -mateVal;
      evalScore = {
        type: 'mate',
        value: whiteMate,
        winProb: whiteMate > 0 ? 100 : 0,
      };
    } else if (scoreCpMatch) {
      const rawCp = parseInt(scoreCpMatch[1], 10);
      // In UCI, centipawn score is relative to side to move
      const whiteCp = this.currentTurn === 'w' ? rawCp : -rawCp;
      evalScore = {
        type: 'cp',
        value: whiteCp,
        winProb: cpToWinProb(whiteCp),
      };
    }

    let moves: string[] = [];
    if (pvIndex !== -1) {
      moves = line.substring(pvIndex + 4).trim().split(' ');
    }

    this.currentLines.set(multipv, {
      multipv,
      score: evalScore,
      moves,
      depth,
    });
  }

  private finishCurrentAnalysis(bestMoveUci: string) {
    if (!this.currentResolver) return;

    const line1 = this.currentLines.get(1);
    const line2 = this.currentLines.get(2);

    const actualBestMove = bestMoveUci !== '(none)' ? bestMoveUci : (line1?.moves[0] || '');
    const actualScore: EvalScore = line1?.score || { type: 'cp', value: 0, winProb: 50 };

    const analysis: PositionAnalysis = {
      bestMoveUci: actualBestMove,
      bestScore: actualScore,
      secondBestMoveUci: line2?.moves[0],
      secondBestScore: line2?.score,
      depthReached: line1?.depth || this.maxDepth,
      lines: Array.from(this.currentLines.values()),
    };

    const resolver = this.currentResolver;
    this.currentResolver = null;
    this.currentLines.clear();
    resolver(analysis);
  }

  /**
   * Evaluate a chess position given its FEN string
   */
  public async evaluateFen(fen: string, depth = 14): Promise<PositionAnalysis> {
    await this.init();

    this.maxDepth = depth;
    // Extract side to move from FEN (second field: 'w' or 'b')
    const fenParts = fen.split(' ');
    this.currentTurn = (fenParts[1] as 'w' | 'b') || 'w';

    if (this.fallbackMode || !this.worker) {
      return this.heuristicFallbackEval(fen);
    }

    return new Promise<PositionAnalysis>((resolve) => {
      this.currentResolver = resolve;
      this.currentLines.clear();

      // Guard with timeout
      const safetyTimer = setTimeout(() => {
        if (this.currentResolver) {
          console.warn('[Stockfish] Analysis safety timeout triggered for fen:', fen);
          const fallback = this.heuristicFallbackEval(fen);
          const res = this.currentResolver;
          this.currentResolver = null;
          res(fallback);
        }
      }, 12000);

      const originalResolver = this.currentResolver;
      this.currentResolver = (res) => {
        clearTimeout(safetyTimer);
        originalResolver(res);
      };

      this.worker!.postMessage(`position fen ${fen}`);
      this.worker!.postMessage(`go depth ${depth}`);
    });
  }

  /**
   * Fast heuristic evaluation fallback in case worker is completely unavailable
   */
  private heuristicFallbackEval(fen: string): PositionAnalysis {
    // Count material from FEN
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
      bestMoveUci: '',
      bestScore: score,
      depthReached: 1,
      lines: [
        {
          multipv: 1,
          score,
          moves: [],
          depth: 1,
        },
      ],
    };
  }

  public terminate() {
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

// Singleton engine instance
export const engineInstance = new StockfishService();
