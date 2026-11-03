import { GameReview, MoveClassification } from '../types/chess';

const NAG_MAP: Record<MoveClassification, string> = {
  brilliant: '$3', // !!
  great: '$1', // !
  best: '$10', // *
  excellent: '',
  good: '',
  book: '',
  inaccuracy: '$6', // ?!
  mistake: '$2', // ?
  miss: '$2',
  blunder: '$4', // ??
  forced: '$7',
};

/**
 * Generate fully annotated PGN string with coach comments, NAGs, and review summary
 */
export function exportAnnotatedPgn(review: GameReview): string {
  const headers = [
    `[Event "${review.meta.event || 'Chess Game Review'}"]`,
    `[Site "${review.meta.site || 'Grandmaster Review'}"]`,
    `[Date "${review.meta.date || new Date().toISOString().split('T')[0]}"]`,
    `[White "${review.meta.white || 'White'}"]`,
    `[Black "${review.meta.black || 'Black'}"]`,
    `[Result "${review.meta.result || '*'}"]`,
    `[ECO "${review.opening.eco}"]`,
    `[Opening "${review.opening.name}"]`,
    review.meta.whiteElo ? `[WhiteElo "${review.meta.whiteElo}"]` : null,
    review.meta.blackElo ? `[BlackElo "${review.meta.blackElo}"]` : null,
    `[WhiteAccuracy "${review.whiteAccuracy}%"]`,
    `[BlackAccuracy "${review.blackAccuracy}%"]`,
    `[WhiteEstElo "${review.whiteEloEstimate}"]`,
    `[BlackEstElo "${review.blackEloEstimate}"]`,
  ]
    .filter(Boolean)
    .join('\n');

  let body = '';
  for (let i = 0; i < review.moves.length; i++) {
    const m = review.moves[i];
    if (m.turn === 'w') {
      body += `${m.moveNumber}. `;
    }

    body += m.san;

    const nag = NAG_MAP[m.classification];
    if (nag) {
      body += ` ${nag}`;
    }

    // Add comment for critical moves (brilliant, great, mistake, miss, blunder)
    if (['brilliant', 'great', 'mistake', 'miss', 'blunder'].includes(m.classification)) {
      const cleanComment = m.coachCommentary.replace(/[{}]/g, '');
      const evalStr =
        m.evalAfter.type === 'mate'
          ? `M${m.evalAfter.value}`
          : `${m.evalAfter.value >= 0 ? '+' : ''}${(m.evalAfter.value / 100).toFixed(2)}`;
      body += ` {[%eval ${evalStr}] ${cleanComment}}`;
    }

    body += ' ';
  }

  body += review.meta.result;
  return `${headers}\n\n${body.trim()}\n`;
}

/**
 * Trigger browser file download
 */
export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
