import React from 'react';
import { EvalScore } from '../types/chess';
import { evalToWinProb } from '../engine/capsCalculator';

interface EvalBarProps {
  score: EvalScore;
  orientation?: 'white' | 'black';
}

export const EvalBar: React.FC<EvalBarProps> = ({ score, orientation = 'white' }) => {
  const winProb = evalToWinProb(score); // 0 (black win) to 100 (white win)

  // Height percentage of white portion
  let whitePercent = winProb;
  if (score.type === 'mate') {
    whitePercent = score.value > 0 ? 100 : 0;
  } else {
    // Expand middle range slightly for better visual feedback
    const cp = score.value;
    const clampedCp = Math.max(-1000, Math.min(1000, cp));
    whitePercent = 50 + (clampedCp / 1000) * 45;
  }

  // Format label text
  let label = '0.0';
  let isWhiteWinning = true;

  if (score.type === 'mate') {
    label = `M${Math.abs(score.value)}`;
    isWhiteWinning = score.value > 0;
  } else {
    const val = score.value / 100;
    label = Math.abs(val) < 0.05 ? '0.0' : `${Math.abs(val).toFixed(1)}`;
    if (val > 0.05) label = `+${label}`;
    else if (val < -0.05) label = `-${label}`;
    isWhiteWinning = score.value >= 0;
  }

  // If orientation is black, flip the bar display
  const topPercent = orientation === 'white' ? 100 - whitePercent : whitePercent;

  return (
    <div className="relative w-8 md:w-9 h-full min-h-[400px] bg-[#16171a] rounded-lg overflow-hidden border border-gray-800 shadow-inner flex flex-col justify-between select-none">
      {/* Black's share (top) */}
      <div
        className="w-full bg-[#27282d] transition-all duration-300 ease-out flex items-start justify-center pt-2"
        style={{ height: `${topPercent}%` }}
      >
        {!isWhiteWinning && (
          <span className="text-[11px] font-mono font-bold text-gray-200 px-1 py-0.5 rounded bg-black/40">
            {label}
          </span>
        )}
      </div>

      {/* White's share (bottom) */}
      <div
        className="w-full bg-[#f0f0f0] transition-all duration-300 ease-out flex items-end justify-center pb-2"
        style={{ height: `${100 - topPercent}%` }}
      >
        {isWhiteWinning && (
          <span className="text-[11px] font-mono font-bold text-gray-900 px-1 py-0.5 rounded bg-white/70">
            {label}
          </span>
        )}
      </div>

      {/* Center 0.0 tick */}
      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gray-500/30 -translate-y-1/2 pointer-events-none" />
    </div>
  );
};
