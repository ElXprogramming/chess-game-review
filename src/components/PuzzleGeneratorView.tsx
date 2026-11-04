import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  RotateCcw,
  Lightbulb,
  Eye,
  ArrowRight,
  Flame,
  Trophy,
  CheckCircle2,
  XCircle,
  Cpu,
  Layers,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { ChessPuzzle, PuzzleDifficulty, PuzzleTheme, PuzzleStats } from '../types/puzzle';
import { puzzleService } from '../services/puzzleService';
import { soundPlayer } from '../utils/soundPlayer';
import { ChessboardView } from './ChessboardView';
import { EvalBar } from './EvalBar';
import { LiveEnginePanel } from './LiveEnginePanel';
import { liveEngineInstance, LiveEngineState } from '../engine/liveEngine';

interface PuzzleGeneratorViewProps {
  boardTheme: 'classic' | 'wood' | 'midnight' | 'charcoal' | 'emerald';
  soundEnabled: boolean;
}

export const PuzzleGeneratorView: React.FC<PuzzleGeneratorViewProps> = ({
  boardTheme,
  soundEnabled,
}) => {
  // Puzzle state
  const [puzzle, setPuzzle] = useState<ChessPuzzle | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTheme, setSelectedTheme] = useState<PuzzleTheme>('any');
  const [selectedDifficulty, setSelectedDifficulty] = useState<PuzzleDifficulty>('any');

  // Interactive gameplay state
  const [currentFen, setCurrentFen] = useState<string>('');
  const [solutionStep, setSolutionStep] = useState<number>(0);
  const [status, setStatus] = useState<'playing' | 'opponent_turn' | 'solved' | 'failed'>('playing');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('Find the best move!');
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [hintText, setHintText] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  // Engine analysis toggle
  const [isEngineOpen, setIsEngineOpen] = useState<boolean>(false);
  const [liveEngineState, setLiveEngineState] = useState<LiveEngineState | null>(null);

  // Stats
  const [stats, setStats] = useState<PuzzleStats>(() => puzzleService.getStats());

  // Ref to hold current chess instance
  const chessRef = useRef<Chess>(new Chess());

  // Player orientation: side to move in initial puzzle FEN
  const playerColor = React.useMemo(() => {
    if (!puzzle) return 'white';
    const side = puzzle.fen.split(' ')[1];
    return side === 'w' ? 'white' : 'black';
  }, [puzzle]);

  // Load a puzzle
  const loadPuzzle = useCallback(
    async (theme: PuzzleTheme, difficulty: PuzzleDifficulty) => {
      setIsLoading(true);
      setHintLevel(0);
      setHintText(null);
      setStatus('playing');
      setFeedbackMessage('Find the best move!');

      try {
        const nextPuzzle = await puzzleService.getNextPuzzle(theme, difficulty);
        setPuzzle(nextPuzzle);

        const chess = new Chess(nextPuzzle.fen);
        chessRef.current = chess;
        setCurrentFen(chess.fen());
        setSolutionStep(0);
        setLastMove(nextPuzzle.lastMove);

        if (soundEnabled) {
          soundPlayer.playMove();
        }
      } catch (err) {
        console.error('[PuzzleGeneratorView] Failed to load puzzle:', err);
        setFeedbackMessage('Error loading puzzle. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [soundEnabled]
  );

  // Initial load
  useEffect(() => {
    loadPuzzle(selectedTheme, selectedDifficulty);
  }, []);

  // Update Stockfish analysis when FEN changes if engine enabled
  useEffect(() => {
    if (!isEngineOpen || !currentFen) {
      liveEngineInstance.stop();
      return;
    }

    liveEngineInstance.analyze(currentFen, { depth: 16, multiPv: 2 }, (state) => {
      setLiveEngineState(state);
    });

    return () => {
      liveEngineInstance.stop();
    };
  }, [isEngineOpen, currentFen]);

  // Handle User Move Attempt
  const handleUserMove = useCallback(
    (from: string, to: string, promotion?: string) => {
      if (status !== 'playing' || !puzzle || isLoading) return;

      const chess = chessRef.current;
      const expectedUci = puzzle.solution[solutionStep];
      if (!expectedUci) return;

      const moveAttemptUci = `${from}${to}${promotion ? promotion.toLowerCase() : ''}`;

      // Check if move matches expected solution move
      // (Also handle promotion suffix flexibility if user didn't specify promotion but expected has 'q')
      const isCorrect =
        moveAttemptUci === expectedUci ||
        (expectedUci.length === 5 && moveAttemptUci === expectedUci.slice(0, 4) && expectedUci.endsWith('q'));

      if (isCorrect) {
        // Legal & Correct move
        try {
          const moveRes = chess.move({
            from: from as Square,
            to: to as Square,
            promotion: (promotion || expectedUci[4] || 'q') as any,
          });

          if (!moveRes) return;

          setCurrentFen(chess.fen());
          setLastMove({ from, to });
          setHintText(null);

          if (soundEnabled) {
            if (chess.isCheckmate() || chess.inCheck()) {
              soundPlayer.playCheck();
            } else if (moveRes.captured) {
              soundPlayer.playCapture();
            } else if (moveRes.san === 'O-O' || moveRes.san === 'O-O-O') {
              soundPlayer.playCastle();
            } else {
              soundPlayer.playMove();
            }
          }

          const nextStep = solutionStep + 1;
          setSolutionStep(nextStep);

          // Check if puzzle is fully solved
          if (nextStep >= puzzle.solution.length) {
            setStatus('solved');
            setFeedbackMessage('Brilliant! Puzzle Solved!');
            if (soundEnabled) {
              soundPlayer.playBrilliant();
            }
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.7 },
            });
            const updated = puzzleService.recordResult(puzzle.id, true);
            setStats(updated);
            return;
          }

          // Opponent's counter-move exists
          setStatus('opponent_turn');
          setFeedbackMessage('Best move! Keep going...');

          const opponentUci = puzzle.solution[nextStep];
          setTimeout(() => {
            if (!opponentUci) return;

            const oppFrom = opponentUci.slice(0, 2);
            const oppTo = opponentUci.slice(2, 4);
            const oppPromo = opponentUci.slice(4) || 'q';

            const oppMove = chess.move({
              from: oppFrom as Square,
              to: oppTo as Square,
              promotion: oppPromo as any,
            });

            if (oppMove) {
              setCurrentFen(chess.fen());
              setLastMove({ from: oppFrom, to: oppTo });

              if (soundEnabled) {
                if (chess.inCheck()) {
                  soundPlayer.playCheck();
                } else if (oppMove.captured) {
                  soundPlayer.playCapture();
                } else {
                  soundPlayer.playMove();
                }
              }

              setSolutionStep(nextStep + 1);
              setStatus('playing');
              setFeedbackMessage('Your turn! Find the next move.');
            }
          }, 450);
        } catch (e) {
          console.warn('[Puzzle] Error applying correct move:', e);
        }
      } else {
        // Incorrect Move
        if (soundEnabled) {
          soundPlayer.playBlunder();
        }
        setStatus('failed');
        setFeedbackMessage('Incorrect move. Try again or view solution!');
        const updated = puzzleService.recordResult(puzzle.id, false);
        setStats(updated);
      }
    },
    [status, puzzle, solutionStep, isLoading, soundEnabled]
  );

  // Retry from failed move
  const handleRetry = () => {
    if (!puzzle) return;
    // Replay puzzle up to current solutionStep
    const chess = new Chess(puzzle.fen);
    for (let i = 0; i < solutionStep; i++) {
      const uci = puzzle.solution[i];
      chess.move({
        from: uci.slice(0, 2) as Square,
        to: uci.slice(2, 4) as Square,
        promotion: (uci[4] || 'q') as any,
      });
    }
    chessRef.current = chess;
    setCurrentFen(chess.fen());
    setStatus('playing');
    setFeedbackMessage('Your turn! Find the best move.');
  };

  // Restart puzzle from very beginning
  const handleRestart = () => {
    if (!puzzle) return;
    const chess = new Chess(puzzle.fen);
    chessRef.current = chess;
    setCurrentFen(chess.fen());
    setSolutionStep(0);
    setLastMove(puzzle.lastMove);
    setHintLevel(0);
    setHintText(null);
    setStatus('playing');
    setFeedbackMessage('Find the best move!');
  };

  // Hint button
  const handleHint = () => {
    if (!puzzle || status !== 'playing') return;
    const currentUci = puzzle.solution[solutionStep];
    if (!currentUci) return;

    const fromSquare = currentUci.slice(0, 2);
    const toSquare = currentUci.slice(2, 4);

    if (hintLevel === 0) {
      setHintLevel(1);
      setHintText(`Hint: Look at the piece on ${fromSquare.toUpperCase()}`);
    } else {
      setHintLevel(2);
      setHintText(`Hint: Move from ${fromSquare.toUpperCase()} to ${toSquare.toUpperCase()}`);
    }
  };

  // Show Solution
  const handleShowSolution = async () => {
    if (!puzzle) return;
    setStatus('solved');
    setFeedbackMessage('Here is the winning solution:');

    // Reset to start of puzzle
    const chess = new Chess(puzzle.fen);
    chessRef.current = chess;
    setCurrentFen(chess.fen());

    for (let i = 0; i < puzzle.solution.length; i++) {
      await new Promise((r) => setTimeout(r, 650));
      const uci = puzzle.solution[i];
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const promotion = uci[4] || 'q';

      const res = chess.move({
        from: from as Square,
        to: to as Square,
        promotion: promotion as any,
      });

      if (res) {
        setCurrentFen(chess.fen());
        setLastMove({ from, to });
        if (soundEnabled) {
          if (res.captured) soundPlayer.playCapture();
          else soundPlayer.playMove();
        }
      }
    }
  };

  // Next puzzle button
  const handleNextPuzzle = () => {
    loadPuzzle(selectedTheme, selectedDifficulty);
  };

  // Compute live engine / hint arrow
  const bestMoveArrowUci = React.useMemo(() => {
    if (hintLevel >= 2 && puzzle && status === 'playing') {
      return puzzle.solution[solutionStep] || null;
    }
    if (isEngineOpen && liveEngineState?.bestMoveUci) {
      return liveEngineState.bestMoveUci;
    }
    return null;
  }, [hintLevel, puzzle, solutionStep, status, isEngineOpen, liveEngineState]);

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Top Filter and Actions Toolbar */}
      <div className="bg-[#191a1e] border border-gray-800/90 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        {/* Left: Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Difficulty Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-gray-500" />
              Rating:
            </span>
            <select
              value={selectedDifficulty}
              onChange={(e) => {
                const diff = e.target.value as PuzzleDifficulty;
                setSelectedDifficulty(diff);
                loadPuzzle(selectedTheme, diff);
              }}
              className="bg-[#202227] hover:bg-[#282a30] text-gray-200 text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-700/80 focus:outline-none focus:border-chess-accent transition-colors"
            >
              <option value="any">All Ratings (Random)</option>
              <option value="beginner">Beginner (&lt;1250)</option>
              <option value="intermediate">Intermediate (1250–1700)</option>
              <option value="advanced">Advanced (1700–2100)</option>
              <option value="master">Master (2100+)</option>
            </select>
          </div>

          {/* Theme Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Theme:
            </span>
            <select
              value={selectedTheme}
              onChange={(e) => {
                const theme = e.target.value as PuzzleTheme;
                setSelectedTheme(theme);
                loadPuzzle(theme, selectedDifficulty);
              }}
              className="bg-[#202227] hover:bg-[#282a30] text-gray-200 text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-700/80 focus:outline-none focus:border-chess-accent transition-colors"
            >
              <option value="any">🎲 Mixed Tactics</option>
              <option value="mateIn1">👑 Checkmate in 1</option>
              <option value="mateIn2">👑 Checkmate in 2</option>
              <option value="mateIn3">👑 Checkmate in 3</option>
              <option value="fork">🔱 Fork / Double Attack</option>
              <option value="pin">🎯 Pin & Skewer</option>
              <option value="endgame">♟️ Endgame Tactics</option>
              <option value="hangingPiece">⚔️ Hanging Piece</option>
              <option value="deflection">🔄 Deflection</option>
              <option value="advantage">📈 Crushing Advantage</option>
            </select>
          </div>
        </div>

        {/* Right: Next Puzzle & Stockfish Toggle */}
        <div className="flex items-center gap-2">
          {/* Stockfish Engine Toggle */}
          <button
            onClick={() => setIsEngineOpen(!isEngineOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isEngineOpen
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                : 'bg-[#202227] text-gray-400 hover:text-white border-gray-700/80 hover:bg-[#282a30]'
            }`}
            title="Toggle Live Stockfish Analysis for this puzzle"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{isEngineOpen ? 'Engine ON' : 'Analyze'}</span>
          </button>

          {/* Next Puzzle Button */}
          <button
            onClick={handleNextPuzzle}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-chess-accent hover:bg-chess-accentHover disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-chess-accent/25 hover:shadow-chess-accent/40 active:scale-95"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5" />
            )}
            <span>Next Puzzle</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Board & Interactive Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Board + Eval Bar */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex gap-2.5 sm:gap-4 items-stretch justify-center">
            {/* Live Eval Bar (only active when engine is on or puzzle is solved) */}
            <EvalBar
              score={
                isEngineOpen && liveEngineState?.score && liveEngineState.fen === currentFen
                  ? liveEngineState.score
                  : { type: 'cp', value: 0, winProb: 50 }
              }
              orientation={playerColor}
            />

            {/* Chessboard */}
            <div className="flex-1 max-w-[560px]">
              <ChessboardView
                fen={currentFen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'}
                orientation={playerColor}
                onUserMove={handleUserMove}
                boardTheme={boardTheme}
                showBestMoveArrow={Boolean(bestMoveArrowUci)}
                liveBestMoveUci={bestMoveArrowUci}
                lastMove={lastMove}
              />
            </div>
          </div>

          {/* Under-Board Live Engine Panel if toggled */}
          {isEngineOpen && (
            <div className="mt-2">
              <LiveEnginePanel
                engineState={liveEngineState}
                multiPv={2}
                onToggleMultiPv={() => {}}
                isEnabled={true}
                onToggleEnabled={() => setIsEngineOpen(false)}
              />
            </div>
          )}
        </div>

        {/* Right Column: Puzzle Info, Status, Actions & Stats */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Status & Objective Banner */}
          <div
            className={`rounded-2xl p-4 border transition-all ${
              status === 'solved'
                ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                : status === 'failed'
                ? 'bg-rose-950/30 border-rose-500/50 text-rose-200'
                : 'bg-[#191a1e] border-gray-800 text-gray-100'
            }`}
          >
            {/* Turn & Objective */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full border ${
                    playerColor === 'white'
                      ? 'bg-white border-gray-400'
                      : 'bg-gray-900 border-gray-600'
                  }`}
                />
                <span className="font-bold text-sm text-white">
                  {playerColor === 'white' ? 'White to move' : 'Black to move'}
                </span>
              </div>

              {/* Status Badge */}
              {status === 'solved' && (
                <span className="flex items-center gap-1 text-xs font-extrabold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Solved
                </span>
              )}
              {status === 'failed' && (
                <span className="flex items-center gap-1 text-xs font-extrabold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/40">
                  <XCircle className="w-3.5 h-3.5" />
                  Failed
                </span>
              )}
              {status === 'opponent_turn' && (
                <span className="flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Opponent responding...
                </span>
              )}
            </div>

            <p className="text-sm font-medium mb-3">{feedbackMessage}</p>

            {/* Hint alert message */}
            {hintText && (
              <div className="mb-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                <Lightbulb className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{hintText}</span>
              </div>
            )}

            {/* Action Buttons inside Card */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-800/80">
              {status === 'failed' && (
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              )}

              {status === 'solved' && (
                <button
                  onClick={handleNextPuzzle}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex-1 justify-center"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Next Puzzle</span>
                </button>
              )}

              {status !== 'solved' && (
                <>
                  {/* Hint Button */}
                  <button
                    onClick={handleHint}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#22242a] hover:bg-[#2c2f37] text-gray-300 hover:text-white text-xs font-medium border border-gray-700/80 transition-colors"
                    title="Get a hint"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span>{hintLevel === 0 ? 'Hint' : 'Full Hint'}</span>
                  </button>

                  {/* Show Solution */}
                  <button
                    onClick={handleShowSolution}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#22242a] hover:bg-[#2c2f37] text-gray-300 hover:text-white text-xs font-medium border border-gray-700/80 transition-colors"
                    title="Give up and view solution"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    <span>View Solution</span>
                  </button>

                  {/* Restart */}
                  <button
                    onClick={handleRestart}
                    className="p-1.5 rounded-xl bg-[#22242a] hover:bg-[#2c2f37] text-gray-400 hover:text-white border border-gray-700/80 transition-colors ml-auto"
                    title="Restart Puzzle"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Puzzle Details Card */}
          {puzzle && (
            <div className="bg-[#191a1e] border border-gray-800/90 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">
                  Puzzle Information
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  Rating: {puzzle.rating}
                </span>
              </div>

              {/* Themes */}
              <div className="flex flex-wrap gap-1.5">
                {puzzle.themes.map((theme, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-[#22242a] text-gray-300 border border-gray-700/60 capitalize"
                  >
                    #{theme}
                  </span>
                ))}
              </div>

              {/* Game Origin Link */}
              {puzzle.gameId && (
                <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
                  <span>
                    Played {puzzle.plays.toLocaleString()} times
                  </span>
                  <a
                    href={`https://lichess.org/training/${puzzle.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-chess-accent hover:underline"
                  >
                    <span>Lichess Puzzle #{puzzle.id}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Stats & Streak Card */}
          <div className="bg-[#191a1e] border border-gray-800/90 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
            <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">
              Tactics Session Stats
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Current Streak */}
              <div className="bg-[#202227] rounded-xl p-2.5 flex flex-col items-center justify-center border border-gray-800">
                <div className="flex items-center gap-1 text-amber-400 font-bold text-base">
                  <Flame className="w-4 h-4 fill-amber-400" />
                  <span>{stats.currentStreak}</span>
                </div>
                <span className="text-[10px] text-gray-400 font-medium mt-0.5">Streak</span>
              </div>

              {/* Best Streak */}
              <div className="bg-[#202227] rounded-xl p-2.5 flex flex-col items-center justify-center border border-gray-800">
                <div className="flex items-center gap-1 text-emerald-400 font-bold text-base">
                  <Trophy className="w-4 h-4" />
                  <span>{stats.bestStreak}</span>
                </div>
                <span className="text-[10px] text-gray-400 font-medium mt-0.5">Best Streak</span>
              </div>

              {/* Solved */}
              <div className="bg-[#202227] rounded-xl p-2.5 flex flex-col items-center justify-center border border-gray-800">
                <div className="flex items-center gap-1 text-blue-400 font-bold text-base">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{stats.solvedCount}</span>
                </div>
                <span className="text-[10px] text-gray-400 font-medium mt-0.5">Solved</span>
              </div>

              {/* Accuracy */}
              <div className="bg-[#202227] rounded-xl p-2.5 flex flex-col items-center justify-center border border-gray-800">
                <div className="text-purple-400 font-bold text-base">
                  {stats.attemptedCount > 0
                    ? `${Math.round((stats.solvedCount / stats.attemptedCount) * 100)}%`
                    : '100%'}
                </div>
                <span className="text-[10px] text-gray-400 font-medium mt-0.5">Accuracy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
