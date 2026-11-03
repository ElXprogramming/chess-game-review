import React, { useRef, useEffect, useState } from 'react';
import { MoveReview } from '../types/chess';
import { ClassificationBadge } from './ClassificationBadge';

interface MoveListProps {
  moves: MoveReview[];
  currentMoveIndex: number;
  onSelectMove: (index: number) => void;
}

export const MoveList: React.FC<MoveListProps> = ({
  moves,
  currentMoveIndex,
  onSelectMove,
}) => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'blunders' | 'brilliant'>('all');
  const activeRowRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Group moves into turns (white move + optional black move)
  const pairedTurns = React.useMemo(() => {
    const turns: { moveNumber: number; white?: MoveReview; black?: MoveReview }[] = [];
    for (let i = 0; i < moves.length; i++) {
      const m = moves[i];
      if (m.turn === 'w') {
        turns.push({ moveNumber: m.moveNumber, white: m });
      } else {
        if (turns.length > 0 && turns[turns.length - 1].moveNumber === m.moveNumber) {
          turns[turns.length - 1].black = m;
        } else {
          turns.push({ moveNumber: m.moveNumber, black: m });
        }
      }
    }
    return turns;
  }, [moves]);

  // Auto scroll to active move
  useEffect(() => {
    if (activeRowRef.current && containerRef.current) {
      activeRowRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentMoveIndex]);

  return (
    <div className="bg-[#1e2024] border border-gray-800 rounded-xl flex flex-col h-full shadow-xl overflow-hidden">
      {/* Header and Filter Tabs */}
      <div className="p-3 border-b border-gray-800 bg-[#191a1e] flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Moves ({moves.length})
        </span>

        <div className="flex items-center gap-1 text-[11px]">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-1 rounded font-medium transition-colors ${
              filter === 'all'
                ? 'bg-chess-accent text-white font-bold'
                : 'text-gray-400 hover:text-white bg-[#141518]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`px-2 py-1 rounded font-medium transition-colors ${
              filter === 'critical'
                ? 'bg-amber-500 text-black font-bold'
                : 'text-gray-400 hover:text-white bg-[#141518]'
            }`}
          >
            Critical
          </button>
          <button
            onClick={() => setFilter('blunders')}
            className={`px-2 py-1 rounded font-medium transition-colors ${
              filter === 'blunders'
                ? 'bg-rose-500 text-white font-bold'
                : 'text-gray-400 hover:text-white bg-[#141518]'
            }`}
          >
            Blunders
          </button>
          <button
            onClick={() => setFilter('brilliant')}
            className={`px-2 py-1 rounded font-medium transition-colors ${
              filter === 'brilliant'
                ? 'bg-emerald-500 text-white font-bold'
                : 'text-gray-400 hover:text-white bg-[#141518]'
            }`}
          >
            Brilliant
          </button>
        </div>
      </div>

      {/* Move Rows Scrollable List */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs font-mono max-h-[380px] sm:max-h-[460px] scrollbar-thin scrollbar-thumb-gray-700"
      >
        {pairedTurns.map((turn) => {
          const wMove = turn.white;
          const bMove = turn.black;

          // Filtering
          if (filter === 'critical') {
            const hasCritical =
              (wMove && ['brilliant', 'great', 'mistake', 'miss', 'blunder'].includes(wMove.classification)) ||
              (bMove && ['brilliant', 'great', 'mistake', 'miss', 'blunder'].includes(bMove.classification));
            if (!hasCritical) return null;
          } else if (filter === 'blunders') {
            const hasBlunder =
              (wMove && ['blunder', 'miss'].includes(wMove.classification)) ||
              (bMove && ['blunder', 'miss'].includes(bMove.classification));
            if (!hasBlunder) return null;
          } else if (filter === 'brilliant') {
            const hasBrilliant =
              (wMove && ['brilliant', 'great'].includes(wMove.classification)) ||
              (bMove && ['brilliant', 'great'].includes(bMove.classification));
            if (!hasBrilliant) return null;
          }

          const isWhiteActive = wMove && wMove.moveIndex === currentMoveIndex;
          const isBlackActive = bMove && bMove.moveIndex === currentMoveIndex;

          return (
            <div
              key={turn.moveNumber}
              ref={isWhiteActive || isBlackActive ? activeRowRef : null}
              className="grid grid-cols-12 items-center py-1 px-2 rounded hover:bg-[#282a30] transition-colors"
            >
              {/* Move Number */}
              <span className="col-span-2 text-gray-500 font-bold select-none">
                {turn.moveNumber}.
              </span>

              {/* White Move */}
              <div
                onClick={() => wMove && onSelectMove(wMove.moveIndex)}
                className={`col-span-5 flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors ${
                  isWhiteActive
                    ? 'bg-chess-accent/30 text-white font-bold border border-chess-accent/50'
                    : 'text-gray-200 hover:bg-[#32353d]'
                }`}
              >
                <span>{wMove?.san || ''}</span>
                {wMove && (
                  <ClassificationBadge
                    classification={wMove.classification}
                    size="sm"
                    showLabel={false}
                  />
                )}
              </div>

              {/* Black Move */}
              <div
                onClick={() => bMove && onSelectMove(bMove.moveIndex)}
                className={`col-span-5 flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors ${
                  isBlackActive
                    ? 'bg-chess-accent/30 text-white font-bold border border-chess-accent/50'
                    : 'text-gray-200 hover:bg-[#32353d]'
                }`}
              >
                <span>{bMove?.san || ''}</span>
                {bMove && (
                  <ClassificationBadge
                    classification={bMove.classification}
                    size="sm"
                    showLabel={false}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
