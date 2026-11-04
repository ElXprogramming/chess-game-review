import React from 'react';
import { EvalScore } from '../types/chess';
import { evalToWinProb } from '../engine/capsCalculator';

interface EvalBarProps {
  score?: EvalScore;
  orientation?: 'white' | 'black';
}

export const EvalBar: React.FC<EvalBarProps> = ({ score, orientation = 'white' }) => {
  const safeScore: EvalScore =
    score && typeof score.value === 'number' && !isNaN(score.value)
      ? score
      : { type: 'cp', value: 0, winProb: 50 };

  // Height percentage of white portion (0 to 100)
  let whitePercent = evalToWinProb(safeScore);
  if (safeScore.type === 'mate') {
    whitePercent = safeScore.value > 0 ? 100 : safeScore.value < 0 ? 0 : 50;
  }
  whitePercent = Math.max(0, Math.min(100, whitePercent));

  // Determine winning state
  const isWhiteWinning =
    safeScore.type === 'mate' ? safeScore.value > 0 : safeScore.value > 5;
  const isBlackWinning =
    safeScore.type === 'mate' ? safeScore.value < 0 : safeScore.value < -5;
  const isEqual = !isWhiteWinning && !isBlackWinning;

  // Format label text
  let label = '0.0';
  if (safeScore.type === 'mate') {
    const mateVal = Math.abs(safeScore.value);
    label = safeScore.value > 0 ? `+M${mateVal}` : `-M${mateVal}`;
  } else {
    const val = safeScore.value / 100;
    if (Math.abs(val) < 0.05) {
      label = '0.0';
    } else {
      const formatted = Math.abs(val).toFixed(1);
      label = val > 0 ? `+${formatted}` : `-${formatted}`;
    }
  }

  // Top and bottom section configuration based on orientation:
  // When orientation === 'white': Black is on top, White is on bottom
  // When orientation === 'black': White is on top, Black is on bottom
  const isWhiteOnBottom = orientation === 'white';

  const topColor = isWhiteOnBottom ? 'black' : 'white';
  const bottomColor = isWhiteOnBottom ? 'white' : 'black';

  const topPercent = isWhiteOnBottom ? 100 - whitePercent : whitePercent;
  const bottomPercent = 100 - topPercent;

  // Which section should render the score label?
  // The label belongs to whichever side is winning.
  // When exactly equal (0.0), render on the player's side (bottom).
  const showTopLabel = isWhiteOnBottom ? isBlackWinning : isWhiteWinning;
  const showBottomLabel = isWhiteOnBottom
    ? isWhiteWinning || isEqual
    : isBlackWinning || isEqual;

  return (
    <div
      title={`Evaluation: ${label} (${orientation === 'white' ? 'White POV' : 'Black POV'})`}
      className="relative w-8 md:w-9 h-full min-h-[400px] bg-[#16171a] rounded-lg overflow-hidden border border-gray-800 shadow-inner flex flex-col justify-between select-none"
    >
      {/* Top share */}
      <div
        className={`w-full transition-all duration-300 ease-out flex items-start justify-center ${
          topColor === 'white' ? 'bg-[#f0f0f0]' : 'bg-[#27282d]'
        }`}
        style={{ height: `${topPercent}%` }}
      >
        {showTopLabel && (
          <span
            className={`mt-2 text-[11px] font-mono font-bold px-1 py-0.5 rounded shadow-sm ${
              topColor === 'white'
                ? 'text-gray-900 bg-white/80 border border-black/10'
                : 'text-gray-200 bg-black/60 border border-white/10'
            }`}
          >
            {label}
          </span>
        )}
      </div>

      {/* Bottom share */}
      <div
        className={`w-full transition-all duration-300 ease-out flex items-end justify-center ${
          bottomColor === 'white' ? 'bg-[#f0f0f0]' : 'bg-[#27282d]'
        }`}
        style={{ height: `${bottomPercent}%` }}
      >
        {showBottomLabel && (
          <span
            className={`mb-2 text-[11px] font-mono font-bold px-1 py-0.5 rounded shadow-sm ${
              bottomColor === 'white'
                ? 'text-gray-900 bg-white/80 border border-black/10'
                : 'text-gray-200 bg-black/60 border border-white/10'
            }`}
          >
            {label}
          </span>
        )}
      </div>

      {/* Center 0.0 tick line */}
      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gray-500/40 -translate-y-1/2 pointer-events-none z-10" />
    </div>
  );
};
