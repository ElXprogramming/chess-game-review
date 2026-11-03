import { ChessPuzzle, PuzzleDifficulty, PuzzleTheme, PuzzleStats } from '../types/puzzle';
import { OFFLINE_PUZZLES } from '../data/offlinePuzzles';

const STATS_KEY = 'chess_puzzle_generator_stats';

export class PuzzleService {
  private preloadedPuzzle: ChessPuzzle | null = null;
  private isPreloading = false;
  private recentPuzzleIds: Set<string> = new Set();

  /**
   * Fetch a tactical puzzle matching theme and difficulty criteria.
   * Uses Lichess Public Puzzle API (4,000,000+ open puzzles) with offline fallback.
   */
  public async getNextPuzzle(
    theme: PuzzleTheme = 'any',
    difficulty: PuzzleDifficulty = 'any'
  ): Promise<ChessPuzzle> {
    // If we have a preloaded puzzle matching criteria, return it immediately
    if (this.preloadedPuzzle && this.matchesCriteria(this.preloadedPuzzle, theme, difficulty)) {
      const puzzle = this.preloadedPuzzle;
      this.preloadedPuzzle = null;
      this.recentPuzzleIds.add(puzzle.id);
      this.triggerPreload(theme, difficulty);
      return puzzle;
    }

    // Try fetching live from Lichess with up to 2 attempts for difficulty matching
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const livePuzzle = await this.fetchFromLichess(theme);
        if (livePuzzle && !this.recentPuzzleIds.has(livePuzzle.id)) {
          if (difficulty === 'any' || this.matchesDifficulty(livePuzzle.rating, difficulty)) {
            this.recentPuzzleIds.add(livePuzzle.id);
            this.triggerPreload(theme, difficulty);
            return livePuzzle;
          }
        }
      } catch (err) {
        console.warn('[PuzzleService] Live fetch failed, using offline bank', err);
        break;
      }
    }

    // Fallback: pick from offline puzzle database
    const offlinePuzzle = this.getOfflinePuzzle(theme, difficulty);
    this.recentPuzzleIds.add(offlinePuzzle.id);
    return offlinePuzzle;
  }

  private async fetchFromLichess(theme: PuzzleTheme): Promise<ChessPuzzle> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    let url = 'https://lichess.org/api/puzzle/next';
    if (theme && theme !== 'any') {
      url += `?angle=${encodeURIComponent(theme)}`;
    }

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Lichess API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    return this.parseLichessPuzzle(data);
  }

  private parseLichessPuzzle(data: any): ChessPuzzle {
    const p = data.puzzle;
    const lastMoveRaw = p.lastMove || '';

    return {
      id: p.id,
      rating: p.rating || 1500,
      plays: p.plays || 0,
      fen: p.fen,
      lastMove: {
        from: lastMoveRaw.slice(0, 2),
        to: lastMoveRaw.slice(2, 4),
      },
      solution: p.solution || [],
      themes: p.themes || [],
      gameId: data.game?.id,
      whitePlayer: data.game?.players?.[0]
        ? { name: data.game.players[0].name, rating: data.game.players[0].rating }
        : undefined,
      blackPlayer: data.game?.players?.[1]
        ? { name: data.game.players[1].name, rating: data.game.players[1].rating }
        : undefined,
    };
  }

  private getOfflinePuzzle(theme: PuzzleTheme, difficulty: PuzzleDifficulty): ChessPuzzle {
    let pool = OFFLINE_PUZZLES.filter((p) => !this.recentPuzzleIds.has(p.id));
    if (pool.length === 0) {
      this.recentPuzzleIds.clear();
      pool = OFFLINE_PUZZLES;
    }

    // Filter by theme if possible
    let filtered = pool;
    if (theme !== 'any') {
      const themeMatches = pool.filter((p) => p.themes.includes(theme));
      if (themeMatches.length > 0) filtered = themeMatches;
    }

    // Filter by difficulty if possible
    if (difficulty !== 'any') {
      const diffMatches = filtered.filter((p) => this.matchesDifficulty(p.rating, difficulty));
      if (diffMatches.length > 0) filtered = diffMatches;
    }

    const randomIndex = Math.floor(Math.random() * filtered.length);
    return filtered[randomIndex] || OFFLINE_PUZZLES[0];
  }

  private matchesCriteria(puzzle: ChessPuzzle, theme: PuzzleTheme, difficulty: PuzzleDifficulty): boolean {
    if (theme !== 'any' && !puzzle.themes.includes(theme)) return false;
    if (difficulty !== 'any' && !this.matchesDifficulty(puzzle.rating, difficulty)) return false;
    return true;
  }

  private matchesDifficulty(rating: number, difficulty: PuzzleDifficulty): boolean {
    switch (difficulty) {
      case 'beginner':
        return rating < 1250;
      case 'intermediate':
        return rating >= 1250 && rating < 1700;
      case 'advanced':
        return rating >= 1700 && rating < 2100;
      case 'master':
        return rating >= 2100;
      default:
        return true;
    }
  }

  private triggerPreload(theme: PuzzleTheme, difficulty: PuzzleDifficulty) {
    if (this.isPreloading) return;
    this.isPreloading = true;

    setTimeout(async () => {
      try {
        const puzzle = await this.fetchFromLichess(theme);
        if (this.matchesCriteria(puzzle, theme, difficulty)) {
          this.preloadedPuzzle = puzzle;
        }
      } catch {
        // Preload failure is silent; fallback will handle when requested
      } finally {
        this.isPreloading = false;
      }
    }, 500);
  }

  // --- Stats & Streak Management ---

  public getStats(): PuzzleStats {
    try {
      const stored = localStorage.getItem(STATS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return {
      solvedCount: 0,
      attemptedCount: 0,
      currentStreak: 0,
      bestStreak: 0,
    };
  }

  public recordResult(puzzleId: string, solved: boolean): PuzzleStats {
    const stats = this.getStats();
    stats.attemptedCount += 1;

    if (solved) {
      stats.solvedCount += 1;
      stats.currentStreak += 1;
      if (stats.currentStreak > stats.bestStreak) {
        stats.bestStreak = stats.currentStreak;
      }
      stats.lastSolvedId = puzzleId;
    } else {
      stats.currentStreak = 0;
    }

    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {
      // ignore
    }

    return stats;
  }
}

export const puzzleService = new PuzzleService();
