import React from 'react';
import { ReviewProgress } from '../types/chess';
import { Loader2, XCircle } from 'lucide-react';

interface ReviewProgressBarProps {
  progress: ReviewProgress;
  onCancel: () => void;
}

export const ReviewProgressBar: React.FC<ReviewProgressBarProps> = ({
  progress,
  onCancel,
}) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-[#1e2024] border border-chess-accent/40 rounded-xl p-4 shadow-2xl max-w-sm w-full animate-bounce-subtle backdrop-blur-md bg-opacity-95">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <Loader2 className="w-4 h-4 text-chess-accent animate-spin" />
          <span>Stockfish Reviewing...</span>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-rose-400 transition-colors p-1"
          title="Cancel review"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-gray-300 mb-2 font-mono flex items-center justify-between">
        <span>
          Move {progress.currentMove} / {progress.totalMoves} ({progress.currentSan})
        </span>
        <span className="text-chess-accent font-bold">Depth {progress.depth}</span>
      </p>

      {/* Progress track */}
      <div className="w-full bg-[#141518] rounded-full h-2.5 overflow-hidden border border-gray-800">
        <div
          className="bg-gradient-to-r from-chess-accent to-emerald-400 h-full rounded-full transition-all duration-200"
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono mt-1.5">
        <span>WebAssembly Engine</span>
        <span>{progress.percent}% Completed</span>
      </div>
    </div>
  );
};
