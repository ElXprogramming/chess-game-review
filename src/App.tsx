import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';
import confetti from 'canvas-confetti';
import { GameReview, MoveReview, ReviewProgress, EvalScore } from './types/chess';
import { parsePgn } from './utils/pgnParser';
import { reviewGame } from './engine/reviewEngine';
import { liveEngineInstance, LiveEngineState } from './engine/liveEngine';
import { soundPlayer } from './utils/soundPlayer';
import { exportAnnotatedPgn, downloadTextFile } from './utils/exportPgn';

import { Navbar } from './components/Navbar';
import { ChessboardView } from './components/ChessboardView';
import { EvalBar } from './components/EvalBar';
import { LiveEnginePanel } from './components/LiveEnginePanel';
import { CoachCard } from './components/CoachCard';
import { AccuracySummary } from './components/AccuracySummary';
import { EvalChart } from './components/EvalChart';
import { MoveList } from './components/MoveList';
import { PgnInputModal } from './components/PgnInputModal';
import { ReviewProgressBar } from './components/ReviewProgressBar';

import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  LayoutDashboard,
  FileText,
  PlusCircle,
  RotateCcw,
  Sparkles,
  GitBranch,
  ArrowLeft,
} from 'lucide-react';

export interface CustomMoveRecord {
  from: string;
  to: string;
  promotion?: string;
  san: string;
  fenBefore: string;
  fenAfter: string;
  captured?: string;
  isCheck?: boolean;
  turn: 'w' | 'b';
  moveNumber: number;
}

export const App: React.FC = () => {
  const [review, setReview] = useState<GameReview | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(-1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<ReviewProgress | null>(null);
  const [isPgnModalOpen, setIsPgnModalOpen] = useState(false);
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [boardTheme, setBoardTheme] = useState<'classic' | 'wood' | 'midnight' | 'charcoal' | 'emerald'>('classic');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'review' | 'report'>('review');

  // Live Engine state
  const [liveEngineEnabled, setLiveEngineEnabled] = useState<boolean>(true);
  const [liveEngineMultiPv, setLiveEngineMultiPv] = useState<number>(1);
  const [liveEngineState, setLiveEngineState] = useState<LiveEngineState | null>(null);

  // Custom Moves / Free Play & Variation Exploration states
  const [sandboxHistory, setSandboxHistory] = useState<CustomMoveRecord[]>([]);
  const [sandboxMoveIndex, setSandboxMoveIndex] = useState<number>(-1);

  const [variationBaseIndex, setVariationBaseIndex] = useState<number | null>(null);
  const [variationHistory, setVariationHistory] = useState<CustomMoveRecord[]>([]);
  const [variationIndex, setVariationIndex] = useState<number>(-1);

  const abortRef = useRef<boolean>(false);
  const autoPlayTimerRef = useRef<any>(null);

  // Sound enable sync
  useEffect(() => {
    soundPlayer.enabled = soundEnabled;
  }, [soundEnabled]);

  const isExploringVariation = variationBaseIndex !== null && variationHistory.length > 0;

  // Compute current FEN based on active state
  const currentFen = useMemo(() => {
    if (isExploringVariation) {
      if (variationIndex === -1 && variationBaseIndex !== null) {
        return variationBaseIndex === -1
          ? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
          : review?.moves[variationBaseIndex]?.fenAfter || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      }
      return (
        variationHistory[variationIndex]?.fenAfter ||
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      );
    }

    if (review) {
      if (currentMoveIndex === -1) {
        return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      }
      return (
        review.moves[currentMoveIndex]?.fenAfter ||
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      );
    }

    // Sandbox / Free play mode
    if (sandboxMoveIndex === -1) {
      return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    }
    return (
      sandboxHistory[sandboxMoveIndex]?.fenAfter ||
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    );
  }, [
    review,
    currentMoveIndex,
    isExploringVariation,
    variationBaseIndex,
    variationHistory,
    variationIndex,
    sandboxMoveIndex,
    sandboxHistory,
  ]);

  // Compute last played move for square highlights and arrows
  const currentLastMove = useMemo(() => {
    if (isExploringVariation) {
      if (variationIndex >= 0 && variationHistory[variationIndex]) {
        return {
          from: variationHistory[variationIndex].from,
          to: variationHistory[variationIndex].to,
        };
      }
      if (variationBaseIndex !== null && variationBaseIndex >= 0 && review?.moves[variationBaseIndex]) {
        return {
          from: review.moves[variationBaseIndex].from,
          to: review.moves[variationBaseIndex].to,
        };
      }
      return null;
    }

    if (review && currentMoveIndex >= 0 && review.moves[currentMoveIndex]) {
      return {
        from: review.moves[currentMoveIndex].from,
        to: review.moves[currentMoveIndex].to,
      };
    }

    if (!review && sandboxMoveIndex >= 0 && sandboxHistory[sandboxMoveIndex]) {
      return {
        from: sandboxHistory[sandboxMoveIndex].from,
        to: sandboxHistory[sandboxMoveIndex].to,
      };
    }

    return null;
  }, [
    isExploringVariation,
    variationIndex,
    variationHistory,
    variationBaseIndex,
    review,
    currentMoveIndex,
    sandboxMoveIndex,
    sandboxHistory,
  ]);

  // Current move review object (only active when directly viewing review without variation)
  const currentReview: MoveReview | null =
    review && !isExploringVariation && currentMoveIndex >= 0 && currentMoveIndex < review.moves.length
      ? review.moves[currentMoveIndex]
      : null;

  // Live evaluation score for the EvalBar
  const currentEval: EvalScore = useMemo(() => {
    if (liveEngineEnabled && liveEngineState?.score) {
      return liveEngineState.score;
    }
    if (currentReview?.evalAfter) {
      return currentReview.evalAfter;
    }
    return { type: 'cp', value: 0, winProb: 50 };
  }, [liveEngineEnabled, liveEngineState, currentReview]);

  // Start live engine evaluation when board FEN changes
  useEffect(() => {
    if (!liveEngineEnabled || isAnalyzing) {
      liveEngineInstance.stop();
      return;
    }

    liveEngineInstance.analyze(
      currentFen,
      { depth: 18, multiPv: liveEngineMultiPv },
      (state) => {
        setLiveEngineState(state);
      }
    );

    return () => {
      liveEngineInstance.stop();
    };
  }, [currentFen, liveEngineEnabled, liveEngineMultiPv, isAnalyzing]);

  // Handle move making by user (click or drag-and-drop)
  const handleUserMove = useCallback(
    (from: string, to: string, promotion?: string) => {
      try {
        const chess = new Chess(currentFen);
        const moveRes = chess.move({ from, to, promotion: promotion || 'q' });
        if (!moveRes) return;

        const isCheck = chess.inCheck();
        const isCheckmate = chess.isCheckmate();

        // Sound triggers
        if (soundEnabled) {
          if (isCheck || isCheckmate) {
            soundPlayer.playCheck();
          } else if (moveRes.captured) {
            soundPlayer.playCapture();
          } else if (moveRes.san === 'O-O' || moveRes.san === 'O-O-O') {
            soundPlayer.playCastle();
          } else {
            soundPlayer.playMove();
          }
        }

        const newRecord: CustomMoveRecord = {
          from,
          to,
          promotion: moveRes.promotion,
          san: moveRes.san,
          fenBefore: currentFen,
          fenAfter: chess.fen(),
          captured: moveRes.captured,
          isCheck,
          turn: moveRes.color,
          moveNumber: chess.moveNumber(),
        };

        if (review) {
          // In review mode: branch into variation exploration
          if (variationBaseIndex === null) {
            setVariationBaseIndex(currentMoveIndex);
            setVariationHistory([newRecord]);
            setVariationIndex(0);
          } else {
            const nextHistory = [...variationHistory.slice(0, variationIndex + 1), newRecord];
            setVariationHistory(nextHistory);
            setVariationIndex(nextHistory.length - 1);
          }
        } else {
          // Sandbox free play mode
          const nextHistory = [...sandboxHistory.slice(0, sandboxMoveIndex + 1), newRecord];
          setSandboxHistory(nextHistory);
          setSandboxMoveIndex(nextHistory.length - 1);
        }
      } catch (e) {
        console.warn('[App] Illegal move attempt:', e);
      }
    },
    [
      currentFen,
      soundEnabled,
      review,
      variationBaseIndex,
      currentMoveIndex,
      variationHistory,
      variationIndex,
      sandboxHistory,
      sandboxMoveIndex,
    ]
  );

  // Sound triggers on move change
  const playMoveSfx = useCallback(
    (m: MoveReview) => {
      if (!soundEnabled) return;
      if (m.classification === 'brilliant') {
        soundPlayer.playBrilliant();
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
      } else if (m.classification === 'blunder') {
        soundPlayer.playBlunder();
      } else if (m.isCheck || m.isCheckmate) {
        soundPlayer.playCheck();
      } else if (m.captured) {
        soundPlayer.playCapture();
      } else if (m.san === 'O-O' || m.san === 'O-O-O') {
        soundPlayer.playCastle();
      } else {
        soundPlayer.playMove();
      }
    },
    [soundEnabled]
  );

  // Start full game review
  const handleStartReview = async (pgnString: string, depth = 14) => {
    try {
      const parsed = parsePgn(pgnString);
      if (parsed.moves.length === 0) return;

      liveEngineInstance.stop();
      setIsAnalyzing(true);
      abortRef.current = false;

      const result = await reviewGame(parsed, {
        depth,
        onProgress: (p) => setProgress(p),
        shouldAbort: () => abortRef.current,
      });

      setReview(result);
      setCurrentMoveIndex(result.moves.length > 0 ? 0 : -1);
      setVariationBaseIndex(null);
      setVariationHistory([]);
      setVariationIndex(-1);
      setSandboxHistory([]);
      setSandboxMoveIndex(-1);
      setIsAnalyzing(false);
      setProgress(null);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (e: any) {
      console.warn('[Review App] Review interrupted or error:', e.message);
      setIsAnalyzing(false);
      setProgress(null);
    }
  };

  const handleCancelReview = () => {
    abortRef.current = true;
    setIsAnalyzing(false);
    setProgress(null);
  };

  // Exit variation exploration
  const handleResetVariation = () => {
    setVariationBaseIndex(null);
    setVariationHistory([]);
    setVariationIndex(-1);
  };

  // Reset sandbox free play board
  const handleResetSandbox = () => {
    setSandboxHistory([]);
    setSandboxMoveIndex(-1);
  };

  // Start fresh board from review mode
  const handleNewBoard = () => {
    setReview(null);
    setCurrentMoveIndex(-1);
    setVariationBaseIndex(null);
    setVariationHistory([]);
    setVariationIndex(-1);
    setSandboxHistory([]);
    setSandboxMoveIndex(-1);
  };

  // Review sandbox game moves
  const handleReviewSandboxGame = () => {
    if (sandboxHistory.length === 0) return;
    const chess = new Chess();
    for (const m of sandboxHistory) {
      chess.move({ from: m.from, to: m.to, promotion: m.promotion });
    }
    const pgn = chess.pgn();
    handleStartReview(pgn);
  };

  // Navigation handlers
  const handleSelectMove = (index: number) => {
    if (!review) return;
    if (isExploringVariation) {
      handleResetVariation();
    }
    const clamped = Math.max(-1, Math.min(review.moves.length - 1, index));
    setCurrentMoveIndex(clamped);

    if (clamped >= 0 && review.moves[clamped]) {
      playMoveSfx(review.moves[clamped]);
    }
  };

  const handleNextMove = () => {
    if (isExploringVariation) {
      if (variationIndex < variationHistory.length - 1) {
        setVariationIndex(variationIndex + 1);
      }
      return;
    }

    if (!review) {
      if (sandboxMoveIndex < sandboxHistory.length - 1) {
        setSandboxMoveIndex(sandboxMoveIndex + 1);
      }
      return;
    }

    if (currentMoveIndex >= review.moves.length - 1) return;
    handleSelectMove(currentMoveIndex + 1);
  };

  const handlePrevMove = () => {
    if (isExploringVariation) {
      if (variationIndex > -1) {
        setVariationIndex(variationIndex - 1);
      }
      return;
    }

    if (!review) {
      if (sandboxMoveIndex > -1) {
        setSandboxMoveIndex(sandboxMoveIndex - 1);
      }
      return;
    }

    if (currentMoveIndex < 0) return;
    handleSelectMove(currentMoveIndex - 1);
  };

  const handleFirstMove = () => {
    if (isExploringVariation) {
      setVariationIndex(-1);
      return;
    }
    if (!review) {
      setSandboxMoveIndex(-1);
      return;
    }
    handleSelectMove(-1);
  };

  const handleLastMove = () => {
    if (isExploringVariation) {
      setVariationIndex(variationHistory.length - 1);
      return;
    }
    if (!review) {
      setSandboxMoveIndex(sandboxHistory.length - 1);
      return;
    }
    handleSelectMove(review.moves.length - 1);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevMove();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextMove();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleFirstMove();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleLastMove();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === 'Escape' && isExploringVariation) {
        e.preventDefault();
        handleResetVariation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    review,
    currentMoveIndex,
    isExploringVariation,
    variationIndex,
    variationHistory.length,
    sandboxMoveIndex,
    sandboxHistory.length,
  ]);

  // Autoplay loop
  useEffect(() => {
    if (isPlaying) {
      autoPlayTimerRef.current = setInterval(() => {
        if (!review || currentMoveIndex >= review.moves.length - 1) {
          setIsPlaying(false);
          return;
        }
        handleNextMove();
      }, 1200);
    } else {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    }

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isPlaying, review, currentMoveIndex]);

  const handleExport = () => {
    if (!review) return;
    const pgnContent = exportAnnotatedPgn(review);
    const whitePlayer = review.meta.white.replace(/\s+/g, '_') || 'white';
    const blackPlayer = review.meta.black.replace(/\s+/g, '_') || 'black';
    downloadTextFile(`game_review_${whitePlayer}_vs_${blackPlayer}.pgn`, pgnContent);
  };

  return (
    <div className="min-h-screen bg-[#121316] text-gray-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        onOpenPgnModal={() => setIsPgnModalOpen(true)}
        onFlipBoard={() => setOrientation(orientation === 'white' ? 'black' : 'white')}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        boardTheme={boardTheme}
        onChangeTheme={setBoardTheme}
        onExportPgn={handleExport}
        onNewBoard={handleNewBoard}
        hasGame={Boolean(review)}
      />

      {/* Main Review Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 flex flex-col gap-5">
        {/* Mobile View Switcher */}
        <div className="flex sm:hidden border-b border-gray-800 pb-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('review')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'review' ? 'bg-chess-accent text-white' : 'bg-[#1e2024] text-gray-400'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Board & Engine</span>
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'report' ? 'bg-chess-accent text-white' : 'bg-[#1e2024] text-gray-400'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Accuracy & Moves</span>
          </button>
        </div>

        {/* Primary Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Interactive Chessboard, Eval Bar & Live Engine Panel (7 cols on desktop) */}
          <div
            className={`lg:col-span-7 flex flex-col gap-4 ${
              activeTab === 'report' ? 'hidden sm:flex' : 'flex'
            }`}
          >
            {/* Board and Eval Bar row */}
            <div className="flex gap-2.5 sm:gap-4 items-stretch justify-center">
              {/* Vertical Eval Bar */}
              <EvalBar score={currentEval} orientation={orientation} />

              {/* Interactive Chessboard */}
              <div className="flex-1 max-w-[560px]">
                <ChessboardView
                  fen={currentFen}
                  orientation={orientation}
                  activeReview={isExploringVariation ? null : currentReview}
                  onUserMove={handleUserMove}
                  boardTheme={boardTheme}
                  showBestMoveArrow={true}
                  liveBestMoveUci={liveEngineEnabled ? liveEngineState?.bestMoveUci : null}
                  lastMove={currentLastMove}
                />

                {/* Bottom Board Controls */}
                <div className="mt-3 flex items-center justify-between bg-[#191a1e] border border-gray-800/80 rounded-xl p-2 sm:px-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    {isExploringVariation ? (
                      <span className="flex items-center gap-1 font-semibold text-amber-400">
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>Var ({variationIndex + 1}/{variationHistory.length})</span>
                      </span>
                    ) : review ? (
                      <span className="font-mono">
                        {currentMoveIndex >= 0
                          ? `Move ${Math.floor(currentMoveIndex / 2) + 1}`
                          : 'Start Pos'}
                      </span>
                    ) : (
                      <span className="font-semibold text-emerald-400">
                        {sandboxMoveIndex >= 0
                          ? `Move ${Math.floor(sandboxMoveIndex / 2) + 1}`
                          : 'Sandbox'}
                      </span>
                    )}

                    <span className="text-gray-600">•</span>
                    <span className="text-chess-accent font-semibold">
                      {orientation === 'white' ? 'White POV' : 'Black POV'}
                    </span>
                  </div>

                  {/* Playback & Reset Buttons */}
                  <div className="flex items-center gap-1 sm:gap-2">
                    {/* Reset variation / Reset sandbox button */}
                    {isExploringVariation && (
                      <button
                        onClick={handleResetVariation}
                        title="Return to main game move"
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs font-semibold transition-colors border border-amber-500/30"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Back to Game</span>
                      </button>
                    )}

                    {!review && sandboxHistory.length > 0 && (
                      <button
                        onClick={handleResetSandbox}
                        title="Reset board to starting position"
                        className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={handleFirstMove}
                      title="First move"
                      className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handlePrevMove}
                      title="Previous move (Left arrow)"
                      className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {review && !isExploringVariation && (
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        title={isPlaying ? 'Pause auto-play' : 'Auto-play (Space)'}
                        className="p-2 rounded-lg bg-chess-accent hover:bg-chess-accentHover text-white transition-colors shadow"
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current" />
                        )}
                      </button>
                    )}

                    <button
                      onClick={handleNextMove}
                      title="Next move (Right arrow)"
                      className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleLastMove}
                      title="Last move"
                      className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Variation Exploration Notice Banner */}
            {isExploringVariation && (
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                    <GitBranch className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-amber-300">
                      Exploring alternate line
                    </span>{' '}
                    <span className="text-gray-300">
                      from move{' '}
                      {variationBaseIndex !== null && variationBaseIndex >= 0
                        ? `${Math.floor(variationBaseIndex / 2) + 1}. ${review?.moves[variationBaseIndex]?.san}`
                        : 'start'}
                    </span>
                    <div className="font-mono text-gray-400 mt-0.5">
                      {variationHistory.map((v, idx) => (
                        <span
                          key={idx}
                          className={`mr-1.5 ${
                            idx === variationIndex
                              ? 'text-white font-bold underline'
                              : 'text-gray-400'
                          }`}
                        >
                          {v.moveNumber}.{v.turn === 'b' ? '..' : ''}
                          {v.san}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleResetVariation}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all shadow"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Game</span>
                </button>
              </div>
            )}

            {/* Live Engine Analysis Panel */}
            <LiveEnginePanel
              engineState={liveEngineState}
              isEnabled={liveEngineEnabled}
              onToggleEnabled={() => setLiveEngineEnabled(!liveEngineEnabled)}
              multiPv={liveEngineMultiPv}
              onToggleMultiPv={() => setLiveEngineMultiPv(liveEngineMultiPv === 1 ? 2 : 1)}
              onPlayMove={handleUserMove}
            />

            {/* Virtual Coach Card (when viewing game review) */}
            {review && !isExploringVariation && (
              <CoachCard
                review={currentReview}
                onNextMove={handleNextMove}
                onPrevMove={handlePrevMove}
                canNext={review ? currentMoveIndex < review.moves.length - 1 : false}
                canPrev={currentMoveIndex > -1}
              />
            )}

            {/* Interactive Advantage / Eval Curve Chart */}
            {review && !isExploringVariation && (
              <EvalChart
                moves={review.moves}
                currentMoveIndex={currentMoveIndex}
                onSelectMove={handleSelectMove}
              />
            )}
          </div>

          {/* Right Column: Accuracy Summary & Move List (5 cols on desktop) */}
          <div
            className={`lg:col-span-5 flex flex-col gap-4 ${
              activeTab === 'review' ? 'hidden sm:flex' : 'flex'
            }`}
          >
            {/* Free Play / Sandbox Moves List (when no reviewed game is active) */}
            {!review && sandboxHistory.length > 0 && (
              <div className="bg-[#1e2024] border border-gray-800 rounded-xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">Played Moves</span>
                    <span className="text-xs font-mono text-gray-400 px-2 py-0.5 rounded-full bg-gray-800">
                      {sandboxHistory.length} moves
                    </span>
                  </div>
                  <button
                    onClick={handleResetSandbox}
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </div>

                {/* Move list grid */}
                <div className="max-h-[220px] overflow-y-auto space-y-1 font-mono text-xs pr-1 scrollbar-thin scrollbar-thumb-gray-700">
                  {sandboxHistory.map((m, idx) => {
                    const isActive = idx === sandboxMoveIndex;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSandboxMoveIndex(idx)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-chess-accent/30 text-white font-bold border border-chess-accent/50'
                            : 'text-gray-300 hover:bg-[#282a30]'
                        }`}
                      >
                        <span className="text-gray-500 w-8">
                          {idx % 2 === 0 ? `${Math.floor(idx / 2) + 1}.` : ''}
                        </span>
                        <span className="flex-1 font-bold">{m.san}</span>
                        <span className="text-[11px] text-gray-500">
                          {m.from}→{m.to}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* CTA to Review current game with Stockfish */}
                <button
                  onClick={handleReviewSandboxGame}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-chess-accent hover:bg-chess-accentHover text-white text-xs font-bold shadow-lg shadow-chess-accent/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Review Game with Coach</span>
                </button>
              </div>
            )}

            {/* Empty State / Welcome card when no game has been reviewed yet */}
            {!review && (
              <div className="bg-[#1e2024] border border-gray-800 rounded-xl p-6 text-center flex flex-col items-center justify-center gap-4 shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-chess-accent/15 border border-chess-accent/30 flex items-center justify-center text-chess-accent">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Free Play & Game Review
                  </h3>
                  <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                    Move any piece directly on the board to test moves with live Stockfish analysis, or paste a PGN for full game evaluation with accuracy metrics and GM coaching.
                  </p>
                </div>
                <button
                  onClick={() => setIsPgnModalOpen(true)}
                  className="mt-1 flex items-center gap-2 px-5 py-2 rounded-xl bg-chess-accent hover:bg-chess-accentHover text-white text-xs font-bold shadow-lg shadow-chess-accent/25 transition-all hover:scale-105"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Paste PGN to Review</span>
                </button>
              </div>
            )}

            {/* Accuracy Breakdown Card */}
            {review && <AccuracySummary review={review} />}

            {/* Move List Table */}
            {review && (
              <MoveList
                moves={review.moves}
                currentMoveIndex={currentMoveIndex}
                onSelectMove={handleSelectMove}
              />
            )}
          </div>
        </div>
      </main>

      {/* Floating Analysis Progress Banner */}
      {isAnalyzing && progress && (
        <ReviewProgressBar progress={progress} onCancel={handleCancelReview} />
      )}

      {/* Modal for PGN Input & Sample Games */}
      <PgnInputModal
        isOpen={isPgnModalOpen}
        onClose={() => setIsPgnModalOpen(false)}
        onSubmitPgn={handleStartReview}
      />
    </div>
  );
};

export default App;
