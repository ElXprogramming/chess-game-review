import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { GameReview, MoveReview, ReviewProgress } from './types/chess';
import { parsePgn } from './utils/pgnParser';
import { reviewGame } from './engine/reviewEngine';
import { soundPlayer } from './utils/soundPlayer';
import { exportAnnotatedPgn, downloadTextFile } from './utils/exportPgn';

import { Navbar } from './components/Navbar';
import { ChessboardView } from './components/ChessboardView';
import { EvalBar } from './components/EvalBar';
import { CoachCard } from './components/CoachCard';
import { AccuracySummary } from './components/AccuracySummary';
import { EvalChart } from './components/EvalChart';
import { MoveList } from './components/MoveList';
import { PgnInputModal } from './components/PgnInputModal';
import { ReviewProgressBar } from './components/ReviewProgressBar';

import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight, BarChart2, LayoutDashboard, FileText, PlusCircle } from 'lucide-react';

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

  const abortRef = useRef<boolean>(false);
  const autoPlayTimerRef = useRef<any>(null);

  // Sound enable sync
  useEffect(() => {
    soundPlayer.enabled = soundEnabled;
  }, [soundEnabled]);

  const handleStartReview = async (pgnString: string, depth = 14) => {
    try {
      const parsed = parsePgn(pgnString);
      if (parsed.moves.length === 0) return;

      setIsAnalyzing(true);
      abortRef.current = false;

      const result = await reviewGame(parsed, {
        depth,
        onProgress: (p) => setProgress(p),
        shouldAbort: () => abortRef.current,
      });

      setReview(result);
      setCurrentMoveIndex(result.moves.length > 0 ? 0 : -1);
      setIsAnalyzing(false);
      setProgress(null);

      // Celebration confetti for review completion
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

  // Current move and FEN
  const currentReview: MoveReview | null =
    review && currentMoveIndex >= 0 && currentMoveIndex < review.moves.length
      ? review.moves[currentMoveIndex]
      : null;

  const currentFen = currentReview
    ? currentReview.fenAfter
    : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  const currentEval = currentReview
    ? currentReview.evalAfter
    : { type: 'cp' as const, value: 0, winProb: 50 };

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

  // Navigation handlers
  const handleSelectMove = (index: number) => {
    if (!review) return;
    const clamped = Math.max(-1, Math.min(review.moves.length - 1, index));
    setCurrentMoveIndex(clamped);

    if (clamped >= 0 && review.moves[clamped]) {
      playMoveSfx(review.moves[clamped]);
    }
  };

  const handleNextMove = () => {
    if (!review || currentMoveIndex >= review.moves.length - 1) return;
    handleSelectMove(currentMoveIndex + 1);
  };

  const handlePrevMove = () => {
    if (!review || currentMoveIndex < 0) return;
    handleSelectMove(currentMoveIndex - 1);
  };

  const handleFirstMove = () => handleSelectMove(-1);
  const handleLastMove = () => {
    if (review) handleSelectMove(review.moves.length - 1);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in modal or textarea
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [review, currentMoveIndex]);

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
            <span>Board & Coach</span>
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
          {/* Left Column: Interactive Chessboard & Eval Bar (7 cols on desktop) */}
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
                  activeReview={currentReview}
                  boardTheme={boardTheme}
                  showBestMoveArrow={true}
                />

                {/* Bottom Board Controls */}
                <div className="mt-3 flex items-center justify-between bg-[#191a1e] border border-gray-800/80 rounded-xl p-2 sm:px-4">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <span className="font-mono">
                      {currentMoveIndex >= 0 ? `Move ${Math.floor(currentMoveIndex / 2) + 1}` : 'Start Pos'}
                    </span>
                    <span className="text-gray-600">•</span>
                    <span className="text-chess-accent font-semibold">
                      {orientation === 'white' ? 'White POV' : 'Black POV'}
                    </span>
                  </div>

                  {/* Playback Buttons */}
                  <div className="flex items-center gap-1 sm:gap-2">
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
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      title={isPlaying ? 'Pause auto-play' : 'Auto-play (Space)'}
                      className="p-2 rounded-lg bg-chess-accent hover:bg-chess-accentHover text-white transition-colors shadow"
                    >
                      {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                    </button>
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

            {/* Virtual Coach Card */}
            <CoachCard
              review={currentReview}
              onNextMove={handleNextMove}
              onPrevMove={handlePrevMove}
              canNext={review ? currentMoveIndex < review.moves.length - 1 : false}
              canPrev={currentMoveIndex > -1}
            />

            {/* Interactive Advantage / Eval Curve Chart */}
            {review && (
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
            {/* Empty State when no game has been reviewed yet */}
            {!review && (
              <div className="bg-[#1e2024] border border-gray-800 rounded-xl p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-4 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-chess-accent/15 border border-chess-accent/30 flex items-center justify-center text-chess-accent">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Analyze Any Chess Game</h3>
                  <p className="text-xs text-gray-400 max-w-sm">
                    Paste your Portable Game Notation (PGN) or upload a game file to get instant move-by-move Stockfish analysis, accuracy percentage, and Grandmaster coach insights.
                  </p>
                </div>
                <button
                  onClick={() => setIsPgnModalOpen(true)}
                  className="mt-2 flex items-center gap-2 px-6 py-2.5 rounded-xl bg-chess-accent hover:bg-chess-accentHover text-white text-sm font-bold shadow-lg shadow-chess-accent/25 transition-all hover:scale-105"
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
