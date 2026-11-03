import React from 'react';
import { GameReview, MoveClassification } from '../types/chess';
import { CLASSIFICATION_CONFIGS } from './ClassificationBadge';
import { Trophy, Clock } from 'lucide-react';

interface AccuracySummaryProps {
  review: GameReview;
}

const CLASSIFICATION_ORDER: MoveClassification[] = [
  'brilliant',
  'great',
  'best',
  'excellent',
  'good',
  'book',
  'inaccuracy',
  'mistake',
  'miss',
  'blunder',
];

export const AccuracySummary: React.FC<AccuracySummaryProps> = ({ review }) => {
  const { meta, whiteAccuracy, blackAccuracy, whiteEloEstimate, blackEloEstimate, whiteCounts, blackCounts, opening } = review;

  return (
    <div className="bg-[#1e2024] border border-gray-800 rounded-xl p-4 sm:p-6 shadow-xl">
      {/* Header: Opening and Game Meta */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
              {opening.eco || meta.eco || 'A00'}
            </span>
            <h3 className="font-bold text-white text-base sm:text-lg">
              {opening.name || meta.opening || 'Chess Opening'}
            </h3>
          </div>
          {meta.event && (
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
              <span>{meta.event}</span>
              {meta.date && <span>• {meta.date}</span>}
              {meta.site && <span>• {meta.site}</span>}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-gray-400 bg-[#16171a] px-3 py-1.5 rounded-lg border border-gray-800">
          <Clock className="w-3.5 h-3.5 text-gray-500" />
          <span>Review time: {(review.reviewDurationMs / 1000).toFixed(1)}s</span>
        </div>
      </div>

      {/* Accuracy & Estimated Elo Comparison Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
        {/* White Card */}
        <div className="bg-[#16171a] border border-gray-800/90 rounded-xl p-3 sm:p-4 flex flex-col items-center text-center relative overflow-hidden">
          <div className="w-full flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-white border border-gray-400" />
              <span className="font-bold text-sm text-white truncate max-w-[120px] sm:max-w-[160px]">
                {meta.white}
              </span>
            </div>
            {meta.whiteElo && (
              <span className="text-xs text-gray-400 font-mono">({meta.whiteElo})</span>
            )}
          </div>

          {/* Accuracy Score */}
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {whiteAccuracy}%
            </span>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">
              Accuracy
            </p>
          </div>

          {/* Estimated Elo Performance */}
          <div className="w-full mt-2 pt-2 border-t border-gray-800/80 flex items-center justify-between text-xs">
            <span className="text-gray-400 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Est. Elo
            </span>
            <span className="font-mono font-bold text-emerald-400">
              ~{whiteEloEstimate}
            </span>
          </div>
        </div>

        {/* Black Card */}
        <div className="bg-[#16171a] border border-gray-800/90 rounded-xl p-3 sm:p-4 flex flex-col items-center text-center relative overflow-hidden">
          <div className="w-full flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-gray-900 border border-gray-600" />
              <span className="font-bold text-sm text-white truncate max-w-[120px] sm:max-w-[160px]">
                {meta.black}
              </span>
            </div>
            {meta.blackElo && (
              <span className="text-xs text-gray-400 font-mono">({meta.blackElo})</span>
            )}
          </div>

          {/* Accuracy Score */}
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {blackAccuracy}%
            </span>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">
              Accuracy
            </p>
          </div>

          {/* Estimated Elo Performance */}
          <div className="w-full mt-2 pt-2 border-t border-gray-800/80 flex items-center justify-between text-xs">
            <span className="text-gray-400 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Est. Elo
            </span>
            <span className="font-mono font-bold text-emerald-400">
              ~{blackEloEstimate}
            </span>
          </div>
        </div>
      </div>

      {/* Move Classification Breakdown Table */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">
          Move Quality Breakdown
        </h4>
        <div className="space-y-1.5">
          {CLASSIFICATION_ORDER.map((classification) => {
            const conf = CLASSIFICATION_CONFIGS[classification];
            const wCount = whiteCounts[classification] || 0;
            const bCount = blackCounts[classification] || 0;

            // Don't show rows where both players have 0 moves (e.g. 0 brilliancies)
            if (wCount === 0 && bCount === 0 && !['best', 'blunder'].includes(classification)) {
              return null;
            }

            return (
              <div
                key={classification}
                className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-[#16171a]/70 hover:bg-[#16171a] transition-colors text-xs"
              >
                {/* White count */}
                <span className="w-8 font-mono font-bold text-white text-center">
                  {wCount}
                </span>

                {/* Badge Label and Symbol */}
                <div className="flex items-center gap-2 flex-1 justify-center">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ backgroundColor: conf.color }}
                  >
                    {conf.symbol}
                  </span>
                  <span className={`font-semibold ${conf.textColor}`}>
                    {conf.label}
                  </span>
                </div>

                {/* Black count */}
                <span className="w-8 font-mono font-bold text-white text-center">
                  {bCount}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
