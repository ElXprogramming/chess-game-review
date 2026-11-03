import React from 'react';
import { Volume2, VolumeX, RotateCw, PlusCircle, Download, Palette, Cpu, FilePlus, Sparkles, LayoutDashboard } from 'lucide-react';

interface NavbarProps {
  activeMode: 'review' | 'puzzles';
  onSelectMode: (mode: 'review' | 'puzzles') => void;
  onOpenPgnModal: () => void;
  onFlipBoard: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  boardTheme: 'classic' | 'wood' | 'midnight' | 'charcoal' | 'emerald';
  onChangeTheme: (theme: 'classic' | 'wood' | 'midnight' | 'charcoal' | 'emerald') => void;
  onExportPgn?: () => void;
  onNewBoard?: () => void;
  hasGame: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeMode,
  onSelectMode,
  onOpenPgnModal,
  onFlipBoard,
  soundEnabled,
  onToggleSound,
  boardTheme,
  onChangeTheme,
  onExportPgn,
  onNewBoard,
  hasGame,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#16171a]/95 backdrop-blur-md border-b border-gray-800/80 px-4 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Logo and Engine Tag */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-chess-accent to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-chess-accent/20 shrink-0">
            <svg
              className="w-5 h-5 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M19 22H5v-2h14v2zm-4.73-14.88c.84-.79 1.37-1.92 1.37-3.12C15.64 1.79 14.01 0 12 0S8.36 1.79 8.36 4c0 1.2.53 2.33 1.37 3.12l-2.02 5.05L6.6 13c-.38.7-.6 1.49-.6 2.32 0 1.47.7 2.78 1.78 3.68H16.22c1.08-.9 1.78-2.21 1.78-3.68 0-.83-.22-1.62-.6-2.32l-1.11-.83-2.02-5.05z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-tight">
                ChessGameReview
              </span>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <Cpu className="w-3 h-3" />
                Stockfish Live
              </span>
            </div>
            <p className="text-[11px] text-gray-400 hidden lg:block">
              Interactive Board, Live Engine Analysis & Puzzles
            </p>
          </div>
        </div>

        {/* Center: Mode Switcher (Review vs Puzzles) */}
        <div className="flex items-center p-1 rounded-xl bg-[#202227] border border-gray-800">
          <button
            onClick={() => onSelectMode('review')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'review'
                ? 'bg-[#2b2e35] text-white shadow-sm shadow-black/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Game Review</span>
          </button>

          <button
            onClick={() => onSelectMode('puzzles')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'puzzles'
                ? 'bg-chess-accent text-white shadow-sm shadow-chess-accent/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Puzzles</span>
            <span className="hidden sm:inline-block ml-0.5 px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[9px] font-extrabold rounded-md uppercase tracking-wider">
              Unlimited
            </span>
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* New Board (Free Play / Clear) */}
          {hasGame && onNewBoard && (
            <button
              onClick={onNewBoard}
              title="Start New Free Play Board"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#202227] hover:bg-[#2b2e35] text-xs font-semibold text-gray-300 hover:text-white transition-colors border border-gray-800"
            >
              <FilePlus className="w-3.5 h-3.5 text-gray-400" />
              <span>New Board</span>
            </button>
          )}

          {/* Flip Board */}
          <button
            onClick={onFlipBoard}
            title="Flip Board"
            className="p-2 rounded-lg bg-[#202227] hover:bg-[#2b2e35] text-gray-300 hover:text-white transition-colors border border-gray-800"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
            className="p-2 rounded-lg bg-[#202227] hover:bg-[#2b2e35] text-gray-300 hover:text-white transition-colors border border-gray-800"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
          </button>

          {/* Theme Dropdown */}
          <div className="relative group">
            <button
              title="Change Board Theme"
              className="p-2 rounded-lg bg-[#202227] hover:bg-[#2b2e35] text-gray-300 hover:text-white transition-colors border border-gray-800 flex items-center gap-1"
            >
              <Palette className="w-4 h-4" />
            </button>
            <div className="absolute right-0 mt-1 w-32 bg-[#1e2024] border border-gray-700 rounded-xl shadow-2xl py-1 hidden group-hover:block z-50">
              {(['classic', 'wood', 'midnight', 'charcoal', 'emerald'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => onChangeTheme(t)}
                  className={`w-full text-left px-3 py-1.5 text-xs capitalize hover:bg-gray-800 transition-colors ${
                    boardTheme === t ? 'text-chess-accent font-bold' : 'text-gray-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Export PGN */}
          {hasGame && onExportPgn && (
            <button
              onClick={onExportPgn}
              title="Download Annotated PGN"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202227] hover:bg-[#2b2e35] text-xs font-semibold text-gray-200 border border-gray-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PGN</span>
            </button>
          )}

          {/* Review PGN Button */}
          <button
            onClick={onOpenPgnModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-chess-accent hover:bg-chess-accentHover text-xs font-bold text-white transition-colors shadow-md shadow-chess-accent/20"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Review PGN</span>
          </button>

          {/* GitHub Link */}
          <a
            href="https://github.com/ElXprogramming/chess-game-review"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub Repository"
            className="p-2 rounded-lg bg-[#202227] hover:bg-[#2b2e35] text-gray-400 hover:text-white transition-colors border border-gray-800"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
};
