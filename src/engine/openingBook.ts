export interface OpeningEntry {
  eco: string;
  name: string;
  fen?: string;
  moves: string[]; // sequence of SAN or UCI moves
}

// Comprehensive ECO opening book with 100+ standard chess openings & variations
export const OPENING_BOOK: OpeningEntry[] = [
  // A00 - A99 (Flank openings, etc.)
  { eco: "A00", name: "Uncommon Opening", moves: ["a3"] },
  { eco: "A00", name: "Grob Opening", moves: ["g4"] },
  { eco: "A00", name: "Sokolsky Opening", moves: ["b4"] },
  { eco: "A01", name: "Nimzowitsch-Larsen Attack", moves: ["b3"] },
  { eco: "A02", name: "Bird's Opening", moves: ["f4"] },
  { eco: "A04", name: "Réti Opening", moves: ["Nf3"] },
  { eco: "A05", name: "Réti Opening: King's Indian Attack", moves: ["Nf3", "Nf6", "g3"] },
  { eco: "A06", name: "Réti Opening: Old Indian Attack", moves: ["Nf3", "d5", "b3"] },
  { eco: "A07", name: "King's Indian Attack", moves: ["Nf3", "d5", "g3", "Nf6", "Bg2", "c6", "O-O", "Bg4", "d3", "Nbd7", "Nbd2", "e5", "e4"] },
  { eco: "A10", name: "English Opening", moves: ["c4"] },
  { eco: "A15", name: "English Opening: Anglo-Indian Defense", moves: ["c4", "Nf6"] },
  { eco: "A20", name: "English Opening: King's English", moves: ["c4", "e5"] },
  { eco: "A21", name: "English Opening: Reversed Sicilian", moves: ["c4", "e5", "Nc3"] },
  { eco: "A30", name: "English Opening: Symmetrical Variation", moves: ["c4", "c5"] },
  { eco: "A40", name: "Queen's Pawn Opening", moves: ["d4"] },
  { eco: "A43", name: "Old Benoni Defense", moves: ["d4", "c5"] },
  { eco: "A45", name: "Trompowsky Attack", moves: ["d4", "Nf6", "Bg5"] },
  { eco: "A46", name: "Torre Attack", moves: ["d4", "Nf6", "Nf3", "e6", "Bg5"] },
  { eco: "A48", name: "East Indian Defense", moves: ["d4", "Nf6", "Nf3", "g6"] },
  { eco: "A51", name: "Budapest Gambit", moves: ["d4", "Nf6", "c4", "e5"] },
  { eco: "A56", name: "Benoni Defense", moves: ["d4", "Nf6", "c4", "c5", "d5"] },
  { eco: "A60", name: "Modern Benoni", moves: ["d4", "Nf6", "c4", "c5", "d5", "e6"] },
  { eco: "A80", name: "Dutch Defense", moves: ["d4", "f5"] },

  // B00 - B99 (Semi-Open games other than French)
  { eco: "B00", name: "King's Pawn Opening", moves: ["e4"] },
  { eco: "B00", name: "Nimzowitsch Defense", moves: ["e4", "Nc6"] },
  { eco: "B01", name: "Scandinavian Defense", moves: ["e4", "d5"] },
  { eco: "B01", name: "Scandinavian Defense: Modern Variation", moves: ["e4", "d5", "exd5", "Nf6"] },
  { eco: "B01", name: "Scandinavian Defense: Mieses-Kotroc", moves: ["e4", "d5", "exd5", "Qxd5", "Nc3", "Qa5"] },
  { eco: "B02", name: "Alekhine's Defense", moves: ["e4", "Nf6"] },
  { eco: "B03", name: "Alekhine's Defense: Four Pawns Attack", moves: ["e4", "Nf6", "e5", "Nd5", "d4", "d6", "c4", "Nb6", "f4"] },
  { eco: "B06", name: "Modern Defense", moves: ["e4", "g6"] },
  { eco: "B07", name: "Pirc Defense", moves: ["e4", "d6", "d4", "Nf6"] },
  { eco: "B08", name: "Pirc Defense: Classical Variation", moves: ["e4", "d6", "d4", "Nf6", "Nc3", "g6", "Nf3", "Bg7"] },
  { eco: "B10", name: "Caro-Kann Defense", moves: ["e4", "c6"] },
  { eco: "B12", name: "Caro-Kann Defense: Advance Variation", moves: ["e4", "c6", "d4", "d5", "e5"] },
  { eco: "B13", name: "Caro-Kann Defense: Exchange Variation", moves: ["e4", "c6", "d4", "d5", "exd5", "cxd5"] },
  { eco: "B15", name: "Caro-Kann Defense: Tartakower (Fantasy) Variation", moves: ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Nf6"] },
  { eco: "B18", name: "Caro-Kann Defense: Classical Variation", moves: ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bf5"] },
  { eco: "B20", name: "Sicilian Defense", moves: ["e4", "c5"] },
  { eco: "B21", name: "Sicilian Defense: Grand Prix Attack", moves: ["e4", "c5", "f4"] },
  { eco: "B21", name: "Sicilian Defense: Smith-Morra Gambit", moves: ["e4", "c5", "d4", "cxd4", "c3"] },
  { eco: "B22", name: "Sicilian Defense: Alapin Variation", moves: ["e4", "c5", "c3"] },
  { eco: "B23", name: "Sicilian Defense: Closed", moves: ["e4", "c5", "Nc3"] },
  { eco: "B27", name: "Sicilian Defense: Open", moves: ["e4", "c5", "Nf3"] },
  { eco: "B30", name: "Sicilian Defense: Old Sicilian", moves: ["e4", "c5", "Nf3", "Nc6"] },
  { eco: "B32", name: "Sicilian Defense: Open, Loewenthal Variation", moves: ["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "e5"] },
  { eco: "B33", name: "Sicilian Defense: Sveshnikov Variation", moves: ["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "e5"] },
  { eco: "B34", name: "Sicilian Defense: Accelerated Dragon", moves: ["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "g6"] },
  { eco: "B40", name: "Sicilian Defense: French Variation", moves: ["e4", "c5", "Nf3", "e6"] },
  { eco: "B41", name: "Sicilian Defense: Kan Variation", moves: ["e4", "c5", "Nf3", "e6", "d4", "cxd4", "Nxd4", "a6"] },
  { eco: "B44", name: "Sicilian Defense: Taimanov Variation", moves: ["e4", "c5", "Nf3", "e6", "d4", "cxd4", "Nxd4", "Nc6"] },
  { eco: "B50", name: "Sicilian Defense: Modern Variations", moves: ["e4", "c5", "Nf3", "d6"] },
  { eco: "B51", name: "Sicilian Defense: Moscow Variation", moves: ["e4", "c5", "Nf3", "d6", "Bb5+"] },
  { eco: "B53", name: "Sicilian Defense: Chekhover Variation", moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Qxd4"] },
  { eco: "B54", name: "Sicilian Defense: Classical Variation", moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "Nc6"] },
  { eco: "B70", name: "Sicilian Defense: Dragon Variation", moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "g6"] },
  { eco: "B75", name: "Sicilian Defense: Dragon, Yugoslav Attack", moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "g6", "Be3", "Bg7", "f3"] },
  { eco: "B80", name: "Sicilian Defense: Scheveningen Variation", moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "e6"] },
  { eco: "B90", name: "Sicilian Defense: Najdorf Variation", moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"] },
  { eco: "B92", name: "Sicilian Defense: Najdorf, Opocensky Variation", moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6", "Be2"] },
  { eco: "B95", name: "Sicilian Defense: Najdorf, 6...e6", moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6", "Bg5", "e6"] },

  // C00 - C99 (French Defense and Open Games 1.e4 e5)
  { eco: "C00", name: "French Defense", moves: ["e4", "e6"] },
  { eco: "C01", name: "French Defense: Exchange Variation", moves: ["e4", "e6", "d4", "d5", "exd5", "exd5"] },
  { eco: "C02", name: "French Defense: Advance Variation", moves: ["e4", "e6", "d4", "d5", "e5"] },
  { eco: "C03", name: "French Defense: Tarrasch Variation", moves: ["e4", "e6", "d4", "d5", "Nd2"] },
  { eco: "C10", name: "French Defense: Paulsen Variation", moves: ["e4", "e6", "d4", "d5", "Nc3"] },
  { eco: "C11", name: "French Defense: Steinitz Variation", moves: ["e4", "e6", "d4", "d5", "Nc3", "Nf6", "e5"] },
  { eco: "C15", name: "French Defense: Winawer Variation", moves: ["e4", "e6", "d4", "d5", "Nc3", "Bb4"] },
  { eco: "C20", name: "King's Pawn Game", moves: ["e4", "e5"] },
  { eco: "C21", name: "Center Game", moves: ["e4", "e5", "d4"] },
  { eco: "C23", name: "Bishop's Opening", moves: ["e4", "e5", "Bc4"] },
  { eco: "C25", name: "Vienna Game", moves: ["e4", "e5", "Nc3"] },
  { eco: "C30", name: "King's Gambit", moves: ["e4", "e5", "f4"] },
  { eco: "C33", name: "King's Gambit Accepted", moves: ["e4", "e5", "f4", "exf4"] },
  { eco: "C40", name: "King's Knight Opening", moves: ["e4", "e5", "Nf3"] },
  { eco: "C41", name: "Philidor Defense", moves: ["e4", "e5", "Nf3", "d6"] },
  { eco: "C42", name: "Petrov's Defense", moves: ["e4", "e5", "Nf3", "Nf6"] },
  { eco: "C44", name: "Scotch Game", moves: ["e4", "e5", "Nf3", "Nc6", "d4"] },
  { eco: "C45", name: "Scotch Game: Classical Variation", moves: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Nxd4", "Bc5"] },
  { eco: "C46", name: "Three Knights Opening", moves: ["e4", "e5", "Nf3", "Nc6", "Nc3"] },
  { eco: "C47", name: "Four Knights Game", moves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"] },
  { eco: "C50", name: "Italian Game", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4"] },
  { eco: "C50", name: "Italian Game: Hungarian Defense", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Be7"] },
  { eco: "C51", name: "Evans Gambit", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "b4"] },
  { eco: "C53", name: "Italian Game: Giuoco Pianissimo", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d3"] },
  { eco: "C54", name: "Italian Game: Giuoco Piano", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3"] },
  { eco: "C55", name: "Two Knights Defense", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6"] },
  { eco: "C57", name: "Two Knights Defense: Fried Liver Attack", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5", "d5", "exd5", "Nxd5", "Nxf7"] },
  { eco: "C60", name: "Ruy Lopez (Spanish Opening)", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"] },
  { eco: "C65", name: "Ruy Lopez: Berlin Defense", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6"] },
  { eco: "C68", name: "Ruy Lopez: Exchange Variation", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Bxc6"] },
  { eco: "C70", name: "Ruy Lopez: Morphy Defense", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4"] },
  { eco: "C78", name: "Ruy Lopez: Archangelsk Variation", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "b5", "Bb3", "Bb7"] },
  { eco: "C80", name: "Ruy Lopez: Open Variation", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Nxe4"] },
  { eco: "C84", name: "Ruy Lopez: Closed Variation", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7"] },
  { eco: "C88", name: "Ruy Lopez: Marshall Attack", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3", "O-O", "c3", "d5"] },

  // D00 - D99 (Closed games and Semi-Closed games)
  { eco: "D00", name: "Queen's Pawn: Mason Attack", moves: ["d4", "d5"] },
  { eco: "D02", name: "London System", moves: ["d4", "d5", "Nf3", "Nf6", "Bf4"] },
  { eco: "D04", name: "Colle System", moves: ["d4", "d5", "Nf3", "Nf6", "e3"] },
  { eco: "D06", name: "Queen's Gambit", moves: ["d4", "d5", "c4"] },
  { eco: "D08", name: "Albin Counter-Gambit", moves: ["d4", "d5", "c4", "e5"] },
  { eco: "D10", name: "Slav Defense", moves: ["d4", "d5", "c4", "c6"] },
  { eco: "D15", name: "Slav Defense: Three Knights Variation", moves: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3"] },
  { eco: "D20", name: "Queen's Gambit Accepted", moves: ["d4", "d5", "c4", "dxc4"] },
  { eco: "D30", name: "Queen's Gambit Declined", moves: ["d4", "d5", "c4", "e6"] },
  { eco: "D31", name: "Semi-Slav Defense", moves: ["d4", "d5", "c4", "e6", "Nc3", "c6"] },
  { eco: "D35", name: "Queen's Gambit Declined: Exchange Variation", moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "cxd5", "exd5"] },
  { eco: "D37", name: "Queen's Gambit Declined: 4.Nf3", moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Nf3"] },
  { eco: "D43", name: "Semi-Slav Defense: Main Line", moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Nf3", "c6"] },
  { eco: "D50", name: "Queen's Gambit Declined: 4.Bg5", moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5"] },
  { eco: "D53", name: "Queen's Gambit Declined: Tartakower Defense", moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "h6", "Bh4", "O-O", "Nf3", "b6"] },
  { eco: "D70", name: "Neo-Grünfeld Defense", moves: ["d4", "Nf6", "c4", "g6", "g3", "d5"] },
  { eco: "D80", name: "Grünfeld Defense", moves: ["d4", "Nf6", "c4", "g6", "Nc3", "d5"] },
  { eco: "D85", name: "Grünfeld Defense: Exchange Variation", moves: ["d4", "Nf6", "c4", "g6", "Nc3", "d5", "cxd5", "Nxd5", "e4", "Nxc3", "bxc3"] },

  // E00 - E99 (Indian Defenses)
  { eco: "E00", name: "Catalan Opening", moves: ["d4", "Nf6", "c4", "e6", "g3"] },
  { eco: "E06", name: "Catalan Opening: Closed", moves: ["d4", "Nf6", "c4", "e6", "g3", "d5", "Bg2", "Be7", "Nf3"] },
  { eco: "E11", name: "Bogo-Indian Defense", moves: ["d4", "Nf6", "c4", "e6", "Nf3", "Bb4+"] },
  { eco: "E12", name: "Queen's Indian Defense", moves: ["d4", "Nf6", "c4", "e6", "Nf3", "b6"] },
  { eco: "E20", name: "Nimzo-Indian Defense", moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4"] },
  { eco: "E32", name: "Nimzo-Indian Defense: Classical Variation", moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "Qc2"] },
  { eco: "E40", name: "Nimzo-Indian Defense: Rubinstein System", moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "e3"] },
  { eco: "E60", name: "King's Indian Defense", moves: ["d4", "Nf6", "c4", "g6"] },
  { eco: "E61", name: "King's Indian Defense: 3.Nc3", moves: ["d4", "Nf6", "c4", "g6", "Nc3"] },
  { eco: "E62", name: "King's Indian Defense: Fianchetto Variation", moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "Nf3", "d6", "g3"] },
  { eco: "E70", name: "King's Indian Defense: Classical Variation", moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6"] },
  { eco: "E90", name: "King's Indian Defense: Mar del Plata Variation", moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3", "O-O", "Be2", "e5", "O-O", "Nc6", "d5", "Ne7"] }
];

/**
 * Identify opening from a sequence of played SAN moves
 */
export function identifyOpening(playedSans: string[]): { eco: string; name: string } {
  let bestMatch: OpeningEntry = { eco: "A00", name: "Chess Game", moves: [] };
  let maxMatchLength = 0;

  for (const entry of OPENING_BOOK) {
    if (entry.moves.length <= playedSans.length) {
      let matches = true;
      for (let i = 0; i < entry.moves.length; i++) {
        if (playedSans[i] !== entry.moves[i]) {
          matches = false;
          break;
        }
      }
      if (matches && entry.moves.length > maxMatchLength) {
        maxMatchLength = entry.moves.length;
        bestMatch = entry;
      }
    }
  }

  return { eco: bestMatch.eco, name: bestMatch.name };
}

/**
 * Check if a move at a given ply is part of the opening book theory
 */
export function isMoveInBook(playedSans: string[], moveIndex: number): boolean {
  if (moveIndex >= 24) return false; // Book moves generally within first 12 moves (24 plies)

  const prefix = playedSans.slice(0, moveIndex + 1);
  for (const entry of OPENING_BOOK) {
    if (entry.moves.length >= prefix.length) {
      let matches = true;
      for (let i = 0; i < prefix.length; i++) {
        if (entry.moves[i] !== prefix[i]) {
          matches = false;
          break;
        }
      }
      if (matches) return true;
    }
  }
  return false;
}
