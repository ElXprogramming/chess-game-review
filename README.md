# Grandmaster Review ♟️⚡
### The Ultimate In-Browser Chess Engine & Game Review Web Application

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Engine: Stockfish WASM](https://img.shields.io/badge/Engine-Stockfish%20WASM%2016-81b64c.svg)](https://stockfishchess.org/)
[![CAPS2: Accuracy Engine](https://img.shields.io/badge/Accuracy-CAPS2%20Model-blue.svg)](#)
[![Client-Side: 100% Zero-Server](https://img.shields.io/badge/Privacy-100%25%20In--Browser-purple.svg)](#)

**Grandmaster Review** is a high-performance, browser-native chess engine and full game review web application. It runs **Stockfish (WebAssembly / asm.js)** directly inside browser Web Workers with zero server dependencies, evaluating any PGN (Portable Game Notation) game in seconds, calculating **CAPS2 accuracy percentages**, classifying every move with badges, providing natural language virtual coach commentary, and displaying an interactive evaluation advantage chart.

---

## 🌟 Key Features

### 1. In-Browser Stockfish Engine (WebAssembly Web Worker)
- **100% Client-Side Evaluation**: Analyzes chess positions directly on your device's CPU using WebAssembly and Web Workers.
- **MultiPV Depth Search**: Computes top engine moves and alternative variations simultaneously to determine tactical differences.
- **Configurable Search Depth**:
  - **Fast Review (Depth 12)**: Ultra-rapid ~5s complete game analysis.
  - **Balanced Review (Depth 14)**: Great balance of precision and speed (~15s).
  - **Deep Grandmaster Review (Depth 18)**: Master-level tactical precision (~35s).
- **Graceful Fallback**: Automatically loads `stockfish.wasm.js` when WebAssembly is supported, falling back to pure JavaScript `stockfish.js` on legacy devices.

### 2. Move Classification Badges (Chess.com / Lichess Standard)
Every move is classified using win probability curves ($\Delta W$):
| Classification | Symbol | Color | Description |
| :--- | :---: | :---: | :--- |
| **Brilliant** | `!!` | Cyan / Emerald | Genuine piece sacrifice maintaining a winning attack or holding equality. |
| **Great Move** | `!` | Teal / Blue | The only finding move in a position where all alternatives fail. |
| **Best Move** | `★` | Green | The engine's top choice ($\Delta W \le 1.0\%$). |
| **Excellent** | `👍` | Lime Green | Near-perfect move with negligible drop ($\Delta W \le 3.5\%$). |
| **Good** | `✓` | Soft Green | Solid, playable move keeping the balance ($\Delta W \le 7.5\%$). |
| **Book Move** | `📖` | Amber / Tan | Move matching established opening theory from the ECO database. |
| **Inaccuracy** | `?!` | Yellow | Minor inaccuracy giving away initiative ($7.5\% < \Delta W \le 15\%$). |
| **Mistake** | `?` | Orange | Notable error handing advantage to the opponent ($15\% < \Delta W \le 25\%$). |
| **Miss** | `❌` | Rose / Magenta | Missed tactical win or checkmate that was available before the move. |
| **Blunder** | `??` | Crimson Red | Catastrophic blunder swinging the game ($\Delta W > 25\%$). |
| **Forced** | `—` | Slate Gray | The only legal move available under check or pin. |

### 3. CAPS2 Accuracy & Performance Rating Calculation
- **Win Probability Conversion**: Uses the standard logistic sigmoid:
  $$W = 50 + 50 \cdot \left(\frac{2}{1 + \exp(-0.00368208 \cdot cp)} - 1\right)$$
- **Move Accuracy Decay**: Computes move precision with the CAPS exponential loss model:
  $$\text{Accuracy}(\Delta W) = 103.1668 \cdot \exp(-0.04354 \cdot \Delta W) - 3.1668$$
- **Overall Game Accuracy**: Side-by-side White and Black accuracy gauges (e.g. 88.4% vs 72.1%).
- **Estimated Performance Elo**: Performance ratings calculated from move quality, blunder frequency, and opponent rating.

### 4. Interactive Virtual Coach
- **Natural Language Dialogue**: Explains *why* a move was brilliant, what tactic was missed, or what threat was overlooked.
- **Tactical Themes**: Automatic recognition of forks, pins, skewers, back-rank weaknesses, discovered checks, and passed pawns.
- **"Show Engine Line" Mode**: Displays the engine's principal variation (PV) and allows you to test alternative moves.

### 5. Interactive Chessboard & Advantage Chart
- **Board Badges**: Visual move badges displayed directly on the destination square (`!!`, `??`, `★`, `!`).
- **Engine Recommendation Arrows**: Green dashed arrows showing what Stockfish recommended vs amber arrows for the played move.
- **Evaluation Bar**: Vertical animated eval bar displaying centipawns (`+1.8`) and forced mate (`M2`).
- **Interactive Eval Chart**: Area graph showing the evaluation curve across the whole game. Click any point on the chart to jump directly to that move!
- **Keyboard Navigation**: Use Left/Right arrow keys to navigate moves, Up/Down for start/end, and Space to auto-play.
- **Procedural Audio**: Web Audio API sound synthesis for moves, captures, checks, castling, blunders, and brilliancies with zero external audio assets.
- **Customizable Themes**: Classic Olive, Wood, Midnight Slate, Charcoal, and Emerald.

### 6. PGN Parsing & Export
- **Flexible PGN Input**: Paste raw PGN text or drag-and-drop `.pgn` files.
- **Pre-Loaded Famous Games**:
  - *Donald Byrne vs Bobby Fischer (1956)* - "Game of the Century" (`17... Be6!!`)
  - *Paul Morphy vs Duke & Count (1858)* - "The Opera Game" (`16. Qb8+!!`)
  - *Garry Kasparov vs Veselin Topalov (1999)* - "Kasparov's Immortal" (`24. Rxd4!!`)
  - *Club Championship Tactical Drama* - Sharp tactical duel with blunders & tactical turnarounds
- **Annotated PGN Export**: Export reviewed games with standard Numeric Annotation Glyphs (NAGs: `$1`, `$2`, `$3`, `$4`), evaluation tags `[%eval ...]`, and coach notes.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or pnpm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/ElXprogramming/chess-game-review.git
cd chess-game-review

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
```

The optimized static build will be placed in `dist/`, ready for deployment to GitHub Pages, Netlify, Vercel, or any static hosting service.

---

## 🛠️ Tech Stack
- **Engine**: Stockfish 16 (WebAssembly / asm.js) via Web Worker
- **Rules & Parsing**: [chess.js](https://github.com/jhlywa/chess.js)
- **UI Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)
- **Audio**: Web Audio API procedural synthesis

---

## 📜 License
This project is open-source and licensed under the [MIT License](LICENSE).
The Stockfish chess engine is licensed under the [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.html).
