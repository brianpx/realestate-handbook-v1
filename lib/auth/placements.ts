import type { Source } from './config';
import type { PlacementStat } from './store';

/**
 * Which placement earns its space: every link request stores its `source` on the token, and a consumed token is a
 * completed sign-in. The memory and file stores count here; the Neon store asks the database for the same shape.
 * Most requested first, ties by name; a token with no source (an old row) is its own line.
 */
export function placementStatsFrom(tokens: readonly { source: Source | null; consumedAt: Date | string | null }[]): PlacementStat[] {
  const stats = new Map<Source | null, PlacementStat>();
  for (const token of tokens) {
    const stat = stats.get(token.source) ?? { source: token.source, requested: 0, signedIn: 0 };
    stat.requested += 1;
    if (token.consumedAt !== null) stat.signedIn += 1;
    stats.set(token.source, stat);
  }
  return [...stats.values()].sort((a, b) => b.requested - a.requested || (a.source ?? '').localeCompare(b.source ?? ''));
}
