import type { PageId } from './pages';

// Searching the index. Pure, so it runs in the browser; the index itself is built on the server (search-index.ts).
export type SearchEntry = { pageId: PageId; text: string; occurrence: number; isTerm: boolean; isHeading: boolean };

export const SEARCH_MAX_RESULTS = 12;

export type SearchOutcome = { entries: SearchEntry[]; total: number };

/** The best SEARCH_MAX_RESULTS matches, and how many entries matched in all. */
export function searchIndex(index: readonly SearchEntry[], query: string): SearchOutcome {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return { entries: [], total: 0 };
  const ranked = index
    .filter(e => { const lower = e.text.toLowerCase(); return words.every(w => lower.includes(w)); })
    .map(entry => ({ entry, rank: (entry.isHeading ? 0 : 2) + (entry.text.toLowerCase().startsWith(words[0]!) ? 0 : 1) }))
    .sort((a, b) => a.rank - b.rank);
  return { entries: ranked.slice(0, SEARCH_MAX_RESULTS).map(r => r.entry), total: ranked.length };
}

export const searchEntries = (index: readonly SearchEntry[], query: string): SearchEntry[] => searchIndex(index, query).entries;
