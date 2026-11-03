import React from 'react';
import { LiveEngineState } from '../engine/liveEngine';
import { Cpu, Play, Pause, Zap, Layers } from 'lucide-react';

interface LiveEnginePanelProps {
  engineState: LiveEngineState | null;
  isEnabled: boolean;
  onToggleEnabled: () => void;
  multiPv: number;
  onToggleMultiPv: () => void;
  onPlayMove?: (from: string, to: string, promotion?: string) => void;
}

export const LiveEnginePanel: React.FC<LiveEnginePanelProps> = ({
  engineState,
  isEnabled,
  onToggleEnabled,
  multiPv,
  onToggleMultiPv,
  onPlayMove,
}) => {
  // Format score display text
  const formatScore = (score?: { type: 'cp' | 'mate'; value: number }) => {
    if (!score) return '0.0';
    if (score.type === 'mate') {
      return score.value > 0 ? `+M${score.value}` : `-M${Math.abs(score.value)}`;
    }
    const val = score.value / 100;
    if (Math.abs(val) < 0.05) return '0.0';
    return val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
  };

  const getScoreColor = (score?: { type: 'cp' | 'mate'; value: number }) => {
    if (!score) return 'text-gray-300 bg-gray-800';
    if (score.type === 'mate') {
      return score.value > 0
        ? 'text-white bg-emerald-600 font-extrabold shadow-sm shadow-emerald-500/30'
        : 'text-white bg-rose-600 font-extrabold shadow-sm shadow-rose-500/30';
    }
    if (score.value >= 100) {
      return 'text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 font-bold';
    }
    if (score.value <= -100) {
      return 'text-rose-300 bg-rose-950/70 border border-rose-500/40 font-bold';
    }
    return 'text-gray-200 bg-gray-800/90 border border-gray-700 font-semibold';
  };

  const bestLine = engineState?.lines[0];
  const secondLine = engineState?.lines[1];

  const handlePlayBestMove = () => {
    if (!onPlayMove || !bestLine?.bestMoveUci) return;
    const uci = bestLine.bestMoveUci;
    const from = uci.substring(0, 2);
    const to = uci.substring(2, 4);
    const promotion = uci.length > 4 ? uci.substring(4, 5) : undefined;
    onPlayMove(from, to, promotion);
  };

  return (
    <div className="bg-[#191a1e] border border-gray-800/90 rounded-xl p-3 sm:p-4 shadow-xl transition-all">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 border-b border-gray-800/80 pb-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <Cpu className="w-4 h-4 text-emerald-400" />
            {isEnabled && engineState?.isSearching && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
          <span className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
            Live Engine
          </span>
          {isEnabled && engineState && (
            <span className="text-[11px] font-mono text-gray-400 px-1.5 py-0.5 rounded bg-gray-800/70 border border-gray-700/60">
              d={engineState.depth}
              {engineState.isSearching && <span className="animate-pulse">...</span>}
            </span>
          )}
        </div>

        {/* Engine Controls: Toggle, MultiPV, and Best Move Trigger */}
        <div className="flex items-center gap-1.5">
          {/* MultiPV button */}
          {isEnabled && (
            <button
              onClick={onToggleMultiPv}
              title={`Engine lines: ${multiPv} line${multiPv > 1 ? 's' : ''}`}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#22242a] hover:bg-[#2b2e36] text-[11px] font-medium text-gray-300 border border-gray-700/70 transition-colors"
            >
              <Layers className="w-3 h-3 text-emerald-400" />
              <span>{multiPv}L</span>
            </button>
          )}

          {/* Quick Play Best Move button */}
          {isEnabled && bestLine?.bestMoveUci && onPlayMove && !engineState?.gameOverMessage && (
            <button
              onClick={handlePlayBestMove}
              title={`Play engine best move (${bestLine.bestMoveSan || bestLine.bestMoveUci})`}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold border border-emerald-500/30 transition-all hover:scale-105 active:scale-95"
            >
              <Zap className="w-3 h-3 fill-current" />
              <span>Play {bestLine.bestMoveSan || bestLine.bestMoveUci}</span>
            </button>
          )}

          {/* On/Off Toggle Button */}
          <button
            onClick={onToggleEnabled}
            title={isEnabled ? 'Pause Live Engine' : 'Resume Live Engine'}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border ${
              isEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {isEnabled ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
            <span className="hidden sm:inline">{isEnabled ? 'Engine ON' : 'Engine OFF'}</span>
          </button>
        </div>
      </div>

      {/* Engine Status / Off State */}
      {!isEnabled && (
        <div className="py-2 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
          <Pause className="w-3.5 h-3.5 text-gray-500" />
          <span>Live engine evaluation is paused. Turn ON to inspect live lines.</span>
        </div>
      )}

      {/* Game Over Message */}
      {isEnabled && engineState?.gameOverMessage && (
        <div className="py-2.5 px-3 bg-amber-500/15 border border-amber-500/30 rounded-lg text-center text-xs font-bold text-amber-300 flex items-center justify-center gap-2">
          <span>{engineState.gameOverMessage}</span>
        </div>
      )}

      {/* Primary Engine Line */}
      {isEnabled && !engineState?.gameOverMessage && (
        <div className="space-y-2">
          {/* Line 1 */}
          <div className="flex items-start gap-2.5 bg-[#141518] p-2.5 rounded-lg border border-gray-800">
            {/* Score Badge */}
            <div
              className={`px-2 py-1 rounded text-xs font-mono shrink-0 select-none ${getScoreColor(
                bestLine?.score || engineState?.score
              )}`}
            >
              {formatScore(bestLine?.score || engineState?.score)}
            </div>

            {/* Line Body */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                {bestLine?.bestMoveSan && (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    {bestLine.bestMoveSan}
                  </span>
                )}
                <span className="text-xs font-mono text-gray-300 leading-relaxed break-words">
                  {bestLine?.formattedLine || engineState?.formattedLine || (
                    <span className="text-gray-500 italic">Calculating best line...</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Line 2 (if MultiPV = 2) */}
          {multiPv > 1 && secondLine && (
            <div className="flex items-start gap-2.5 bg-[#141518]/60 p-2 rounded-lg border border-gray-800/60">
              <div
                className={`px-2 py-0.5 rounded text-[11px] font-mono shrink-0 select-none ${getScoreColor(
                  secondLine.score
                )}`}
              >
                {formatScore(secondLine.score)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {secondLine.bestMoveSan && (
                    <span className="text-[11px] font-semibold text-gray-300 bg-gray-800 px-1.5 py-0.5 rounded">
                      2. {secondLine.bestMoveSan}
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-gray-400 leading-relaxed break-words">
                    {secondLine.formattedLine}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
