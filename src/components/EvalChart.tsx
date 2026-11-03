import React from 'react';
import { MoveReview } from '../types/chess';
import { evalToWinProb } from '../engine/capsCalculator';

interface EvalChartProps {
  moves: MoveReview[];
  currentMoveIndex: number;
  onSelectMove: (index: number) => void;
}

export const EvalChart: React.FC<EvalChartProps> = ({
  moves,
  currentMoveIndex,
  onSelectMove,
}) => {
  if (!moves || moves.length === 0) return null;

  const width = 800;
  const height = 140;
  const paddingY = 15;
  const usableHeight = height - paddingY * 2;
  const centerY = height / 2;

  // Compute (x, y) coordinates for each move
  // y ranges from 0 (100% white win) to height (100% black win)
  // WinProb 50 = centerY
  const points = moves.map((m, idx) => {
    const x = (idx / Math.max(1, moves.length - 1)) * width;
    const winProb = evalToWinProb(m.evalAfter); // 0 to 100
    // invert so 100 (white winning) is at top (y=paddingY)
    const y = paddingY + ((100 - winProb) / 100) * usableHeight;
    return { x, y, move: m, index: idx };
  });

  // Construct SVG paths
  const linePath = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

  // White advantage area (above centerY)
  const whiteAreaPath = `${linePath} L ${width} ${centerY} L 0 ${centerY} Z`;

  // Active move point
  const activePoint = points[currentMoveIndex] || points[0];

  return (
    <div className="bg-[#1e2024] border border-gray-800 rounded-xl p-3 sm:p-4 shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Evaluation & Win Probability
        </h4>
        <div className="flex items-center gap-3 text-[11px] text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-white" /> White Advantage
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-700" /> Black Advantage
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Blunder
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Brilliant
          </span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-lg bg-[#141518] border border-gray-800/80 cursor-crosshair">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-28 sm:h-32 block"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="whiteAdvGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="blackAdvGradient" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Equality Center Line */}
          <line
            x1="0"
            y1={centerY}
            x2={width}
            y2={centerY}
            stroke="#4b5563"
            strokeWidth="1"
            strokeDasharray="4,4"
          />

          {/* Shaded Area */}
          <path d={whiteAreaPath} fill="url(#whiteAdvGradient)" />

          {/* Main Curve Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#9ca3af"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Critical Move Markers */}
          {points.map((p) => {
            if (p.move.classification === 'brilliant') {
              return (
                <polygon
                  key={p.index}
                  points={`${p.x},${p.y - 5} ${p.x + 5},${p.y} ${p.x},${p.y + 5} ${p.x - 5},${p.y}`}
                  fill="#26c2a3"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="cursor-pointer hover:scale-150 transition-transform"
                  onClick={() => onSelectMove(p.index)}
                />
              );
            }
            if (p.move.classification === 'blunder') {
              return (
                <circle
                  key={p.index}
                  cx={p.x}
                  cy={p.y}
                  r="4.5"
                  fill="#b33430"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="cursor-pointer hover:scale-150 transition-transform"
                  onClick={() => onSelectMove(p.index)}
                />
              );
            }
            return null;
          })}

          {/* Current Active Move Cursor */}
          {activePoint && (
            <g>
              <line
                x1={activePoint.x}
                y1={0}
                x2={activePoint.x}
                y2={height}
                stroke="#81b64c"
                strokeWidth="2"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="6"
                fill="#81b64c"
                stroke="#ffffff"
                strokeWidth="2"
                className="shadow-lg"
              />
            </g>
          )}

          {/* Invisible interactive click rects along X axis */}
          {points.map((p) => {
            const stepWidth = width / moves.length;
            return (
              <rect
                key={p.index}
                x={p.x - stepWidth / 2}
                y={0}
                width={stepWidth}
                height={height}
                fill="transparent"
                onClick={() => onSelectMove(p.index)}
                className="cursor-pointer"
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};
