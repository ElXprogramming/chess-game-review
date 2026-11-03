import { EvalScore, MoveClassification } from '../types/chess';

/**
 * Convert centipawns to Win Probability (0.0% to 100.0%) from White's perspective.
 * Standard Chess.com / Lichess sigmoid model.
 */
export function cpToWinProb(cp: number): number {
  // Using the refined sigmoid matching modern chess engines:
  // W = 50 + 50 * (2 / (1 + exp(-0.00368208 * cp)) - 1)
  const x = -0.00368208 * cp;
  // Guard against extreme values
  if (x > 20) return 0;
  if (x < -20) return 100;
  return 50 + 50 * (2 / (1 + Math.exp(x)) - 1);
}

/**
 * Convert an EvalScore to Win Probability from White's perspective (0 - 100)
 */
export function evalToWinProb(score: EvalScore): number {
  if (score.type === 'mate') {
    if (score.value > 0) {
      // White has forced mate in N moves
      return Math.max(99.0, 100 - Math.min(score.value, 10) * 0.1);
    } else if (score.value < 0) {
      // Black has forced mate in |N| moves
      return Math.min(1.0, Math.abs(score.value) * 0.1);
    } else {
      return 50;
    }
  }

  return cpToWinProb(score.value);
}

/**
 * Calculate expected win percentage drop (0 - 100) for the moving side.
 * Both bestWinProb and afterWinProb are passed from White's perspective.
 */
export function calculateWinProbLoss(
  turn: 'w' | 'b',
  bestScore: EvalScore,
  playedScore: EvalScore
): number {
  const bestWhiteProb = evalToWinProb(bestScore);
  const playedWhiteProb = evalToWinProb(playedScore);

  if (turn === 'w') {
    // White wants higher white prob
    const loss = bestWhiteProb - playedWhiteProb;
    return Math.max(0, Math.min(100, loss));
  } else {
    // Black wants lower white prob (higher black prob)
    const bestBlackProb = 100 - bestWhiteProb;
    const playedBlackProb = 100 - playedWhiteProb;
    const loss = bestBlackProb - playedBlackProb;
    return Math.max(0, Math.min(100, loss));
  }
}

/**
 * Calculate individual move accuracy (0% - 100%) from win probability loss
 * using CAPS exponential model.
 */
export function calculateMoveAccuracy(winProbLoss: number): number {
  if (winProbLoss <= 0.05) return 100;
  // CAPS exponential decay formula
  const raw = 103.1668 * Math.exp(-0.04354 * winProbLoss) - 3.1668;
  return Math.max(0, Math.min(100, Math.round(raw * 10) / 10));
}

/**
 * Calculate overall game accuracy for a player using weighted harmonic mean
 */
export function calculateGameAccuracy(moveAccuracies: number[]): number {
  if (moveAccuracies.length === 0) return 100;

  // We weight non-book moves with higher significance
  let total = 0;
  for (const acc of moveAccuracies) {
    total += acc;
  }
  const mean = total / moveAccuracies.length;
  return Math.round(mean * 10) / 10;
}

/**
 * Estimate player's performance Elo based on accuracy, blunders, and game depth
 */
export function estimatePerformanceElo(
  accuracy: number,
  counts: Record<MoveClassification, number>,
  baseElo?: string
): number {
  // If baseline Elo is provided in PGN tags, we anchor to it
  let base = 1500;
  if (baseElo && !isNaN(parseInt(baseElo))) {
    base = parseInt(baseElo);
  }

  // Pure accuracy based rating curve
  // 98% -> ~2600+
  // 92% -> ~2200
  // 85% -> ~1800
  // 75% -> ~1400
  // 65% -> ~1000
  // 50% -> ~600
  let calculated = 200 + Math.pow(accuracy / 100, 2.5) * 2600;

  // Penalize blunders and misses heavily
  const blunders = counts['blunder'] || 0;
  const misses = counts['miss'] || 0;
  const mistakes = counts['mistake'] || 0;
  const brilliancies = counts['brilliant'] || 0;
  const greats = counts['great'] || 0;

  calculated -= blunders * 75;
  calculated -= misses * 45;
  calculated -= mistakes * 25;
  calculated += brilliancies * 60;
  calculated += greats * 30;

  // If baseElo was given, blend 60% calculated performance with 40% baseElo
  if (baseElo && !isNaN(parseInt(baseElo))) {
    calculated = calculated * 0.65 + base * 0.35;
  }

  return Math.max(400, Math.min(3100, Math.round(calculated / 10) * 10));
}
