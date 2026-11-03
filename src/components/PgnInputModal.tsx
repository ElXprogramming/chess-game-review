import React, { useState } from 'react';
import { SAMPLE_GAMES, SampleGame } from '../utils/sampleGames';
import { parsePgn } from '../utils/pgnParser';
import { Upload, FileText, Sparkles, X, Play, AlertCircle } from 'lucide-react';

interface PgnInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitPgn: (pgn: string, depth: number) => void;
  initialDepth?: number;
}

export const PgnInputModal: React.FC<PgnInputModalProps> = ({
  isOpen,
  onClose,
  onSubmitPgn,
  initialDepth = 14,
}) => {
  const [tab, setTab] = useState<'paste' | 'upload' | 'samples'>('paste');
  const [pgnText, setPgnText] = useState('');
  const [selectedDepth, setSelectedDepth] = useState<number>(initialDepth);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleValidateAndSubmit = (pgnToReview: string) => {
    if (!pgnToReview.trim()) {
      setError('Please provide a valid PGN string.');
      return;
    }

    const parsed = parsePgn(pgnToReview);
    if (parsed.moves.length === 0) {
      setError(parsed.error || 'Could not parse any chess moves from this PGN.');
      return;
    }

    setError(null);
    onSubmitPgn(pgnToReview, selectedDepth);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPgnText(content);
        setTab('paste');
      }
    };
    reader.readAsText(file);
  };

  const handleSelectSample = (sample: SampleGame) => {
    setPgnText(sample.pgn);
    handleValidateAndSubmit(sample.pgn);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1e2024] border border-gray-700/80 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-gray-800 flex items-center justify-between bg-[#191a1e]">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-chess-accent/20 border border-chess-accent/40 flex items-center justify-center text-chess-accent">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-white text-base sm:text-lg">Review Chess Game</h3>
              <p className="text-xs text-gray-400">Powered by Stockfish WebAssembly & CAPS2</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-800 bg-[#16171a] px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setTab('paste')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === 'paste'
                ? 'border-chess-accent text-chess-accent'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste PGN</span>
          </button>
          <button
            onClick={() => setTab('upload')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === 'upload'
                ? 'border-chess-accent text-chess-accent'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
          <button
            onClick={() => setTab('samples')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === 'samples'
                ? 'border-chess-accent text-chess-accent'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sample Games</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'paste' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Paste PGN Notation
              </label>
              <textarea
                value={pgnText}
                onChange={(e) => {
                  setPgnText(e.target.value);
                  setError(null);
                }}
                placeholder="1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6... or full PGN with headers"
                rows={7}
                className="w-full bg-[#141518] border border-gray-700 rounded-xl p-3 text-xs font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-chess-accent transition-colors resize-none"
              />
            </div>
          )}

          {tab === 'upload' && (
            <div className="border-2 border-dashed border-gray-700 hover:border-chess-accent rounded-xl p-8 text-center transition-colors bg-[#141518]">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-200 mb-1">
                Upload your .pgn file
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Drag and drop here, or browse files from your computer
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-chess-accent hover:bg-chess-accentHover text-white text-xs font-bold cursor-pointer transition-colors shadow">
                <span>Select PGN File</span>
                <input
                  type="file"
                  accept=".pgn,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {tab === 'samples' && (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {SAMPLE_GAMES.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className="p-3 rounded-xl bg-[#16171a] hover:bg-[#25272e] border border-gray-800 hover:border-chess-accent/50 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div>
                    <h4 className="font-bold text-white text-xs sm:text-sm group-hover:text-chess-accent transition-colors">
                      {sample.title}
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">{sample.subtitle}</p>
                    <span className="text-[10px] font-mono text-gray-500 mt-1 inline-block">
                      {sample.white} vs {sample.black} ({sample.result})
                    </span>
                  </div>
                  <Play className="w-4 h-4 text-gray-400 group-hover:text-chess-accent transition-colors shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* Depth Setting */}
          <div className="pt-3 border-t border-gray-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Stockfish Analysis Depth
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { depth: 12, label: 'Fast (12)', time: '~5s' },
                { depth: 14, label: 'Balanced (14)', time: '~15s' },
                { depth: 18, label: 'Deep (18)', time: '~35s' },
              ].map((item) => (
                <button
                  key={item.depth}
                  type="button"
                  onClick={() => setSelectedDepth(item.depth)}
                  className={`py-2 px-2 rounded-lg text-center border transition-all text-xs ${
                    selectedDepth === item.depth
                      ? 'border-chess-accent bg-chess-accent/15 text-white font-bold shadow'
                      : 'border-gray-800 bg-[#16171a] text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <div className="font-semibold">{item.label}</div>
                  <div className="text-[10px] text-gray-500">{item.time}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-800 bg-[#191a1e] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleValidateAndSubmit(pgnText)}
            className="px-5 py-2 rounded-lg bg-chess-accent hover:bg-chess-accentHover text-white text-xs font-bold transition-colors shadow flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Review</span>
          </button>
        </div>
      </div>
    </div>
  );
};
