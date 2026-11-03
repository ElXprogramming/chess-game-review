import React from 'react';
import { MoveClassification } from '../types/chess';

export interface BadgeConfig {
  label: string;
  symbol: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  textColor: string;
}

export const CLASSIFICATION_CONFIGS: Record<MoveClassification, BadgeConfig> = {
  brilliant: {
    label: 'Brilliant',
    symbol: '!!',
    color: '#26c2a3',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-400',
    glowColor: 'shadow-[0_0_15px_rgba(38,194,163,0.5)]',
    textColor: 'text-[#26c2a3]',
  },
  great: {
    label: 'Great Move',
    symbol: '!',
    color: '#5b8baf',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-400',
    glowColor: 'shadow-[0_0_12px_rgba(91,139,175,0.4)]',
    textColor: 'text-[#5b8baf]',
  },
  best: {
    label: 'Best Move',
    symbol: '★',
    color: '#81b64c',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-400',
    glowColor: 'shadow-[0_0_12px_rgba(129,182,76,0.4)]',
    textColor: 'text-[#81b64c]',
  },
  excellent: {
    label: 'Excellent',
    symbol: '👍',
    color: '#9ecb6a',
    bgColor: 'bg-lime-500/20',
    borderColor: 'border-lime-400',
    glowColor: 'shadow-[0_0_10px_rgba(158,203,106,0.3)]',
    textColor: 'text-[#9ecb6a]',
  },
  good: {
    label: 'Good',
    symbol: '✓',
    color: '#a8b98b',
    bgColor: 'bg-teal-500/15',
    borderColor: 'border-teal-400',
    glowColor: '',
    textColor: 'text-[#a8b98b]',
  },
  book: {
    label: 'Book',
    symbol: '📖',
    color: '#d5a47e',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-400',
    glowColor: '',
    textColor: 'text-[#d5a47e]',
  },
  inaccuracy: {
    label: 'Inaccuracy',
    symbol: '?!',
    color: '#e69d27',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-400',
    glowColor: '',
    textColor: 'text-[#e69d27]',
  },
  mistake: {
    label: 'Mistake',
    symbol: '?',
    color: '#e67327',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-400',
    glowColor: 'shadow-[0_0_10px_rgba(230,115,39,0.3)]',
    textColor: 'text-[#e67327]',
  },
  miss: {
    label: 'Miss',
    symbol: '❌',
    color: '#db4d4d',
    bgColor: 'bg-rose-500/20',
    borderColor: 'border-rose-400',
    glowColor: 'shadow-[0_0_12px_rgba(219,77,77,0.4)]',
    textColor: 'text-[#db4d4d]',
  },
  blunder: {
    label: 'Blunder',
    symbol: '??',
    color: '#b33430',
    bgColor: 'bg-red-600/25',
    borderColor: 'border-red-500',
    glowColor: 'shadow-[0_0_15px_rgba(179,52,48,0.5)]',
    textColor: 'text-[#f87171]',
  },
  forced: {
    label: 'Forced',
    symbol: '—',
    color: '#94a3b8',
    bgColor: 'bg-slate-500/20',
    borderColor: 'border-slate-400',
    glowColor: '',
    textColor: 'text-slate-400',
  },
};

interface ClassificationBadgeProps {
  classification: MoveClassification;
  size?: 'sm' | 'md' | 'lg' | 'square';
  showLabel?: boolean;
}

export const ClassificationBadge: React.FC<ClassificationBadgeProps> = ({
  classification,
  size = 'md',
  showLabel = true,
}) => {
  const conf = CLASSIFICATION_CONFIGS[classification] || CLASSIFICATION_CONFIGS.good;

  if (size === 'square') {
    // Square icon badge overlayed on chessboard
    return (
      <div
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm text-white shadow-lg border border-white/40 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-20 ${conf.glowColor}`}
        style={{ backgroundColor: conf.color }}
      >
        <span className="leading-none drop-shadow-sm font-sans">{conf.symbol}</span>
      </div>
    );
  }

  if (size === 'sm') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold border ${conf.bgColor} ${conf.borderColor} ${conf.textColor}`}
      >
        <span className="font-bold">{conf.symbol}</span>
        {showLabel && <span>{conf.label}</span>}
      </span>
    );
  }

  if (size === 'lg') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold border ${conf.bgColor} ${conf.borderColor} ${conf.textColor} ${conf.glowColor}`}
      >
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-black shadow"
          style={{ backgroundColor: conf.color }}
        >
          {conf.symbol}
        </span>
        <span>{conf.label}</span>
      </div>
    );
  }

  // md default
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${conf.bgColor} ${conf.borderColor} ${conf.textColor}`}
    >
      <span
        className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
        style={{ backgroundColor: conf.color }}
      >
        {conf.symbol}
      </span>
      {showLabel && <span>{conf.label}</span>}
    </span>
  );
};
