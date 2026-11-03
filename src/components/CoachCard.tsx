import React, { useState } from 'react';
import { MoveReview } from '../types/chess';
import { ClassificationBadge } from './ClassificationBadge';
import { Sparkles, Brain, Award, ChevronRight, ChevronLeft, Eye, RotateCcw } from 'lucide-react';

interface CoachCardProps {
  review?: MoveReview | null;
  onNextMove?: () => void;
  onPrevMove?: () => void;
  onShowBestMove?: () => void;
  onResetToMove?: () => void;
  canNext?: boolean;
  canPrev?: boolean;
}

export const CoachCard: React.FC<CoachCardProps> = ({
  review,
  onNextMove,
  onPrevMove,
  onShowBestMove,
  onResetToMove,
  canNext,
  canPrev,
}) => {
  const [showAlternative, setShowAlternative] = useState(false);

  if (!review) {
    return (
      <div className="bg-[#1e2024] border border-gray-800 rounded-xl p-5 shadow-lg flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-chess-accent/20 border border-chess-accent/40 flex items-center justify-center text-chess-accent">
          <Brain className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-200">Virtual Grandmaster Coach</h4>
          <p className="text-sm text-gray-400">
            Select or step through any move to inspect deep computer analysis and coach commentary.
          </p>
        </div>
      </div>
    );
  }

  const isBlunderOrMistake = ['blunder', 'mistake', 'miss', 'inaccuracy'].includes(review.classification);
  const isBrilliantOrGreat = ['brilliant', 'great', 'best'].includes(review.classification);

  return (
    <div className="bg-[#1e2024] border border-gray-800 rounded-xl p-4 sm:p-5 shadow-xl transition-all duration-300">
      {/* Header: Coach Info & Classification */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {/* Coach Avatar */}
          <div className="relative">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-chess-dark to-chess-card border border-gray-700 flex items-center justify-center shadow">
              {isBrilliantOrGreat ? (
                <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
              ) : isBlunderOrMistake ? (
                <Brain className="w-5 h-5 text-rose-400" />
              ) : (
                <Award className="w-5 h-5 text-chess-accent" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#1e2024]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Coach Insight</span>
              {review.tacticalTheme && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-800 text-gray-300 border border-gray-700">
                  {review.tacticalTheme}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg font-bold text-white">
                {review.moveNumber}.{review.turn === 'b' ? '..' : ''} {review.san}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {review.accuracy}% Accuracy
              </span>
            </div>
          </div>
        </div>

        {/* Classification Badge */}
        <ClassificationBadge classification={review.classification} size="md" />
      </div>

      {/* Coach Dialogue / Speech Bubble */}
      <div className="bg-[#16171a] border border-gray-800/80 rounded-lg p-3 sm:p-4 text-sm text-gray-200 leading-relaxed relative mb-4">
        <p className="font-medium text-white mb-1 flex items-center gap-1.5">
          <span className="text-chess-accent font-bold">»</span> {review.coachTitle}
        </p>
        <p className="text-gray-300 text-sm">{review.coachCommentary}</p>

        {/* Tactical Recommendation for Errors */}
        {isBlunderOrMistake && review.bestMoveSan && (
          <div className="mt-3 pt-3 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-gray-300">
              <span className="text-emerald-400 font-semibold">Engine Favorite:</span>
              <span className="font-mono font-bold text-white px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700">
                {review.bestMoveSan}
              </span>
            </div>
            {onShowBestMove && (
              <button
                onClick={() => {
                  setShowAlternative(!showAlternative);
                  if (onShowBestMove) onShowBestMove();
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-medium transition-colors border border-emerald-500/30"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showAlternative ? 'Hide Engine Line' : 'Show Engine Line'}</span>
              </button>
            )}
          </div>
        )}

        {/* Alternative Engine Variation (PV) */}
        {showAlternative && review.variation && review.variation.length > 0 && (
          <div className="mt-2.5 p-2 bg-[#202227] rounded text-xs font-mono text-gray-300 border border-gray-700">
            <span className="text-emerald-400 font-bold mr-1">PV:</span>
            {review.variation.join(' ')}
          </div>
        )}
      </div>

      {/* Footer Navigation Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {onResetToMove && (
            <button
              onClick={onResetToMove}
              title="Reset position"
              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <span className="text-xs text-gray-400 font-mono">
            Ply {review.ply}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onPrevMove}
            disabled={!canPrev}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-gray-800 text-xs font-semibold text-gray-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </button>
          <button
            onClick={onNextMove}
            disabled={!canNext}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-chess-accent hover:bg-chess-accentHover disabled:opacity-40 disabled:hover:bg-chess-accent text-xs font-bold text-white transition-colors shadow"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
