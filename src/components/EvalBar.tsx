import React from 'react';
import { EvalScore } from '../types/chess';
import { evalToWinProb } from '../engine/capsCalculator';

interface EvalBarProps {
  score?: EvalScore;
  orientation?: 'white' | 'black';
}

export const EvalBar: React.FC<EvalBarProps> = ({ score, orientation = 'white' }) => {
  // Safe fallback if score is missing or invalid
  const safeScore: EvalScore =
    score && typeof score.value === 'number' && !isNaN(score.value)
      ? score
      : { type: 'cp', value: 0, winProb: 50 };

  // Calculate Win Probability (0.0 to 100.0) from White's perspective
  // Using standard sigmoid win probability formula from capsCalculator
  const winProb = evalToWinProb(safeScore);
  const clampedWhitePercent = Math.max(0, Math.min(100, winProb));

  // Format label text and determine advantage
  const isMate = safeScore.type === 'mate';
  const val = isMate ? safeScore.value : safeScore.value / 100;

  let label = '0.0';
  let isWhiteAhead = false;
  let isBlackAhead = false;

  if (isMate) {
    label = `M${Math.abs(safeScore.value)}`;
    isWhiteAhead = safeScore.value > 0;
    isBlackAhead = safeScore.value < 0;
  } else {
    const absVal = Math.abs(val);
    if (absVal < 0.05) {
      label = '0.0';
    } else {
      label = absVal.toFixed(1);
      if (val > 0) {
        label = `+${label}`;
        isWhiteAhead = true;
      } else {
        label = `-${label}`;
        isBlackAhead = true;
      }
    }
  }

  // Label placement:
  // - White ahead: placed on White's portion (bottom if orientation='white', top if orientation='black')
  // - Black ahead: placed on Black's portion (top if orientation='white', bottom if orientation='black')
  // - Equal (0.0): placed on player's side (bottom)
  const showAtBottom = isWhiteAhead
    ? orientation === 'white'
    : isBlackAhead
    ? orientation === 'black'
    : true;

  // Whether the label sits on White's background (needs dark text) or Black's (needs light text)
  const sitsOnWhite = showAtBottom ? orientation === 'white' : orientation === 'black';

  return (
    <div
      className="relative w-8 sm:w-9 self-stretch bg-[#27282d] rounded-lg overflow-hidden border border-gray-800 shadow-inner select-none flex-shrink-0"
      title={`Evaluation: ${label} (${clampedWhitePercent.toFixed(1)}% White advantage)`}
      aria-label={`Evaluation: ${label}`}
    >
      {/* White's share of the bar (fills from bottom for white orientation, top for black orientation) */}
      <div
        className={`absolute left-0 right-0 bg-[#f0f0f0] transition-all duration-300 ease-out ${
          orientation === 'white' ? 'bottom-0' : 'top-0'
        }`}
        style={{ height: `${clampedWhitePercent}%` }}
      />

      {/* Center 0.0 tick line */}
      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gray-500/40 -translate-y-1/2 pointer-events-none z-10" />

      {/* Score Badge */}
      <div
        className={`absolute left-0 right-0 flex justify-center z-20 pointer-events-none transition-all duration-300 ${
          showAtBottom ? 'bottom-1.5' : 'top-1.5'
        }`}
      >
        <span
          className={`text-[10px] sm:text-[11px] font-bold px-1 py-0.5 rounded shadow-sm tracking-tight ${
            sitsOnWhite
              ? 'text-gray-900 bg-white/85'
              : 'text-gray-100 bg-black/60'
          }`}
        >
          {label}
        </span>
      </div>
    </div>
  );
};
