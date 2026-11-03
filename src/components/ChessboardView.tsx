import React, { useState } from 'react';
import { Chess, Square } from 'chess.js';
import { ChessPieceSvg } from './chessPieces';
import { MoveReview } from '../types/chess';
import { ClassificationBadge } from './ClassificationBadge';

interface ChessboardViewProps {
  fen: string;
  orientation?: 'white' | 'black';
  activeReview?: MoveReview | null;
  onUserMove?: (from: string, to: string) => void;
  boardTheme?: 'classic' | 'wood' | 'midnight' | 'charcoal' | 'emerald';
  showBestMoveArrow?: boolean;
}

const THEME_COLORS = {
  classic: { light: '#eeeed2', dark: '#769656' },
  wood: { light: '#ead8b7', dark: '#b88b4a' },
  midnight: { light: '#cbd5e1', dark: '#475569' },
  charcoal: { light: '#94a3b8', dark: '#334155' },
  emerald: { light: '#e2e8f0', dark: '#059669' },
};

export const ChessboardView: React.FC<ChessboardViewProps> = ({
  fen,
  orientation = 'white',
  activeReview,
  onUserMove,
  boardTheme = 'classic',
  showBestMoveArrow = true,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  // Parse chess instance to compute legal moves and board piece positions
  const chess = React.useMemo(() => {
    try {
      return new Chess(fen);
    } catch {
      return new Chess();
    }
  }, [fen]);

  const board = chess.board();

  // Legal moves for selected square
  const legalDestinations = React.useMemo(() => {
    if (!selectedSquare) return [];
    try {
      const moves = chess.moves({ square: selectedSquare as Square, verbose: true });
      return moves.map((m) => m.to);
    } catch {
      return [];
    }
  }, [chess, selectedSquare]);

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayFiles = orientation === 'white' ? files : [...files].reverse();
  const displayRanks = orientation === 'white' ? ranks : [...ranks].reverse();

  const handleSquareClick = (square: string) => {
    if (!onUserMove) return;

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      if ((legalDestinations as string[]).includes(square)) {
        onUserMove(selectedSquare, square);
        setSelectedSquare(null);
        return;
      }
    }

    const piece = chess.get(square as Square);
    if (piece && ((orientation === 'white' && piece.color === 'w') || (orientation === 'black' && piece.color === 'b') || true)) {
      setSelectedSquare(square);
    } else {
      setSelectedSquare(null);
    }
  };

  // Coordinates helper for arrows (0 to 7 index in current orientation)
  const getSquareCoordinates = (square: string) => {
    if (!square || square.length < 2) return null;
    const file = square[0];
    const rank = square[1];

    const fileIndex = displayFiles.indexOf(file);
    const rankIndex = displayRanks.indexOf(rank);

    if (fileIndex === -1 || rankIndex === -1) return null;

    // percentage center (0% - 100%)
    const x = (fileIndex + 0.5) * 12.5;
    const y = (rankIndex + 0.5) * 12.5;
    return { x, y, fileIndex, rankIndex };
  };

  const theme = THEME_COLORS[boardTheme] || THEME_COLORS.classic;

  // Helper to trim arrows so they don't cover the piece centers
  const shortenVector = (from: { x: number; y: number }, to: { x: number; y: number }, trimStart = 2, trimEnd = 3.2) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy);
    if (len < 5) return { from, to };
    return {
      from: {
        x: from.x + (dx / len) * trimStart,
        y: from.y + (dy / len) * trimStart,
      },
      to: {
        x: to.x - (dx / len) * trimEnd,
        y: to.y - (dy / len) * trimEnd,
      },
    };
  };

  // Arrow calculations
  const playedArrow = React.useMemo(() => {
    if (!activeReview || !activeReview.from || !activeReview.to) return null;
    const fromCoord = getSquareCoordinates(activeReview.from);
    const toCoord = getSquareCoordinates(activeReview.to);
    if (!fromCoord || !toCoord) return null;
    return shortenVector(fromCoord, toCoord);
  }, [activeReview, orientation]);

  const bestMoveArrow = React.useMemo(() => {
    if (!showBestMoveArrow || !activeReview || !activeReview.bestMoveUci) return null;
    const uci = activeReview.bestMoveUci;
    if (uci === activeReview.uci) return null; // Don't duplicate if played move was already best move

    const fromSquare = uci.substring(0, 2);
    const toSquare = uci.substring(2, 4);

    const fromCoord = getSquareCoordinates(fromSquare);
    const toCoord = getSquareCoordinates(toSquare);
    if (!fromCoord || !toCoord) return null;
    return shortenVector(fromCoord, toCoord);
  }, [activeReview, showBestMoveArrow, orientation]);

  // King check highlight
  const inCheck = chess.inCheck();
  let checkKingSquare: string | null = null;
  if (inCheck) {
    const turn = chess.turn();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === turn) {
          checkKingSquare = `${files[c]}${8 - r}`;
        }
      }
    }
  }

  return (
    <div className="relative w-full max-w-[560px] aspect-square rounded-xl overflow-hidden shadow-2xl border-2 border-gray-800 select-none bg-chess-dark">
      {/* 8x8 Chess Grid */}
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {displayRanks.map((rank, rankIdx) =>
          displayFiles.map((file, fileIdx) => {
            const square = `${file}${rank}`;
            const isLight = (fileIdx + rankIdx) % 2 === 0;
            const piece = chess.get(square as Square);

            const isSelected = selectedSquare === square;
            const isLegalDest = (legalDestinations as string[]).includes(square);
            const isLastMoveFrom = activeReview?.from === square;
            const isLastMoveTo = activeReview?.to === square;
            const isCheckSquare = checkKingSquare === square;

            // Background color for square
            let bgColor = isLight ? theme.light : theme.dark;

            // Move highlights
            let highlightClass = '';
            if (isLastMoveFrom || isLastMoveTo) {
              highlightClass = 'bg-yellow-400/35';
            }
            if (isSelected) {
              highlightClass = 'bg-blue-400/50';
            }
            if (isCheckSquare) {
              highlightClass = 'bg-red-500/60 animate-pulse';
            }

            return (
              <div
                key={square}
                onClick={() => handleSquareClick(square)}
                className="relative flex items-center justify-center cursor-pointer transition-colors"
                style={{ backgroundColor: bgColor }}
              >
                {/* Highlight overlay */}
                {highlightClass && <div className={`absolute inset-0 pointer-events-none ${highlightClass}`} />}

                {/* Rank & File Coordinates */}
                {fileIdx === 0 && (
                  <span
                    className={`absolute top-0.5 left-1 text-[10px] sm:text-xs font-bold pointer-events-none select-none ${
                      isLight ? 'text-gray-700/70' : 'text-gray-200/70'
                    }`}
                  >
                    {rank}
                  </span>
                )}
                {rankIdx === 7 && (
                  <span
                    className={`absolute bottom-0.5 right-1 text-[10px] sm:text-xs font-bold pointer-events-none select-none ${
                      isLight ? 'text-gray-700/70' : 'text-gray-200/70'
                    }`}
                  >
                    {file}
                  </span>
                )}

                {/* Legal destination indicator */}
                {isLegalDest && (
                  <div
                    className={`absolute z-10 pointer-events-none ${
                      piece
                        ? 'w-full h-full border-4 border-black/30 rounded-full'
                        : 'w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-black/25'
                    }`}
                  />
                )}

                {/* Chess Piece */}
                {piece && (
                  <div className="relative z-10 w-[84%] h-[84%] flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
                    <ChessPieceSvg piece={`${piece.color}${piece.type.toUpperCase()}`} />
                  </div>
                )}

                {/* Badge on Destination Square */}
                {isLastMoveTo && activeReview && (
                  <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 z-20">
                    <ClassificationBadge classification={activeReview.classification} size="square" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* SVG Layer for Best Move & Played Move Arrows */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 100 100">
        <defs>
          {/* Arrow marker for engine recommendation */}
          <marker
            id="arrow-best"
            viewBox="0 0 6 6"
            refX="4.5"
            refY="3"
            markerWidth="2.8"
            markerHeight="2.8"
            orient="auto-start-reverse"
          >
            <path d="M 0 0.8 L 4.5 3 L 0 5.2 z" fill="#10b981" fillOpacity="0.5" />
          </marker>
          {/* Arrow marker for played move */}
          <marker
            id="arrow-played"
            viewBox="0 0 6 6"
            refX="4.5"
            refY="3"
            markerWidth="2.8"
            markerHeight="2.8"
            orient="auto-start-reverse"
          >
            <path d="M 0 0.8 L 4.5 3 L 0 5.2 z" fill="#f59e0b" fillOpacity="0.45" />
          </marker>
        </defs>

        {/* Played Move Arrow (Amber/Yellow) */}
        {playedArrow && (
          <line
            x1={playedArrow.from.x}
            y1={playedArrow.from.y}
            x2={playedArrow.to.x}
            y2={playedArrow.to.y}
            stroke="#f59e0b"
            strokeWidth="1.4"
            strokeOpacity="0.4"
            strokeLinecap="round"
            markerEnd="url(#arrow-played)"
          />
        )}

        {/* Engine Best Move Recommendation Arrow (Green) */}
        {bestMoveArrow && (
          <line
            x1={bestMoveArrow.from.x}
            y1={bestMoveArrow.from.y}
            x2={bestMoveArrow.to.x}
            y2={bestMoveArrow.to.y}
            stroke="#10b981"
            strokeWidth="1.4"
            strokeDasharray="2.5,2"
            strokeOpacity="0.45"
            strokeLinecap="round"
            markerEnd="url(#arrow-best)"
          />
        )}
      </svg>
    </div>
  );
};
