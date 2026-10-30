import type { PageId } from './pages';

// Where the paid product lives. Chapters keep their page ids as slugs (/handbook/ch5), so every old
// /ch5 link maps one to one and saved progress, which is keyed by page id, is untouched.
export const HANDBOOK = '/handbook';

export const pageHref = (id: PageId): string => `${HANDBOOK}/${id}`;

/** The page id a handbook path shows, or null for the handbook home, the setup, the coach pages and everything else. */
export function pageIdFromPath(pathname: string): string | null {
  const m = /^\/handbook\/([^/]+)\/?$/.exec(pathname);
  return m ? m[1]! : null;
}

// Old address -> new address. next.config.ts turns this into permanent redirects; e2e/routes.spec.ts walks it.
// '/' used to be the title page, so only its #hash links (handled in app/layout.tsx) still point at the handbook.
export const LEGACY_PAGE_SLUGS = [
  'pref',
  ...Array.from({ length: 13 }, (_, i) => `ch${i + 1}`),
  ...['a', 'b', 'c', 'd', 'e', 'f'].map(x => `app-${x}`),
  'plan',
  'review',
] as const;
