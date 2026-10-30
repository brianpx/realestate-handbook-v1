'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode, type Ref } from 'react';
import { NAV, type PageId } from '@/lib/pages';
import { pageHref } from '@/lib/routes';
import { searchEntries, type SearchEntry } from '@/lib/search-query';
import { findSearchTarget, revealSearchTarget } from '@/lib/search-jump';

const labelOf = (page: string) => NAV.flatMap(g => g.pages).find(p => p.id === page)?.label ?? page;

// The index is fetched once, the first time the box gets focus, and shared by every later search.
let indexPromise: Promise<SearchEntry[]> | null = null;
const loadIndex = (): Promise<SearchEntry[]> => {
  indexPromise ??= fetch('/search-index.json').then(r => {
    if (!r.ok) throw new Error(`search index ${r.status}`);
    return r.json() as Promise<SearchEntry[]>;
  }).catch(err => { indexPromise = null; throw err; });
  return indexPromise;
};

export type SearchApi = { clear: () => void };

// Ported from legacy/js/search.js. `children` is the menu button, which sits beside the box on phones and, while
// results are open, turns into the cross that closes them.
export function SidebarSearch({ onSearching, onNavigate, apiRef, children }: {
  onSearching: (searching: boolean) => void;
  onNavigate: () => void;
  apiRef: Ref<SearchApi>;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const pendingJump = useRef<SearchEntry | null>(null);

  const trimmed = query.trim();
  const searching = trimmed !== '';
  useEffect(() => { onSearching(searching); }, [searching, onSearching]);

  const load = () => {
    setFailed(false);
    loadIndex().then(setIndex, () => setFailed(true));
  };
  useEffect(() => { if (searching && !index && !failed) load(); }, [searching, index, failed]);

  const results = useMemo(() => (index && searching ? searchEntries(index, trimmed) : []), [index, searching, trimmed]);

  useImperativeHandle(apiRef, () => ({ clear: () => setQuery('') }), []);

  // Cmd+K (Mac) or Ctrl+K (elsewhere) jumps to the search box from anywhere on the page
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'k' || !(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
      const input = inputRef.current;
      if (!input || input.closest('[inert]')) return;
      e.preventDefault();
      input.focus();
      input.select();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const land = (entry: SearchEntry) => {
    const target = findSearchTarget(document.getElementById('content-container') ?? document, entry);
    if (target) revealSearchTarget(target);
  };
  // after the new page has rendered and the shell has moved focus to its heading
  useEffect(() => {
    const entry = pendingJump.current;
    if (!entry) return;
    pendingJump.current = null;
    const timer = setTimeout(() => land(entry), 120);
    return () => clearTimeout(timer);
  }, [pathname]);

  const choose = (entry: SearchEntry) => {
    setQuery('');
    onNavigate();
    const path = pageHref(entry.pageId as PageId);
    if (path === pathname) setTimeout(() => land(entry), 0);
    else { pendingJump.current = entry; router.push(path); }
  };

  const links = () => [...(listRef.current?.querySelectorAll<HTMLAnchorElement>('a') ?? [])];
  let status = '';
  if (searching && index) status = results.length ? `${results.length} result${results.length === 1 ? '' : 's'}` : 'No matches';

  return (
    <search className="nav-search">
      <label className="visually-hidden" htmlFor="navSearch">Search the handbook</label>
      <input
        ref={inputRef}
        type="search"
        id="navSearch"
        className="nav-search-input"
        placeholder="Search the handbook"
        aria-keyshortcuts="Control+K Meta+K"
        aria-controls="searchResults"
        aria-expanded={searching}
        autoComplete="off"
        spellCheck={false}
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => { if (!index) load(); }}
        onKeyDown={e => {
          if (e.key === 'ArrowDown') { links()[0]?.focus(); e.preventDefault(); }
          else if (e.key === 'Escape' && query) { setQuery(''); e.stopPropagation(); } // keeps the mobile menu's own Escape handler from also firing
        }}
      />
      <ul
        ref={listRef}
        className="search-results"
        id="searchResults"
        aria-label="Search results"
        hidden={!searching}
        onKeyDown={e => {
          const all = links();
          const i = all.indexOf(document.activeElement as HTMLAnchorElement);
          if (e.key === 'ArrowDown') all[Math.min(i + 1, all.length - 1)]?.focus();
          else if (e.key === 'ArrowUp') (i > 0 ? all[i - 1] : inputRef.current)?.focus();
          else if (e.key === 'Escape') { inputRef.current?.focus(); return; }
          else return;
          e.preventDefault();
        }}
      >
        {searching && failed && <li className="search-empty">Search could not load. Try again.</li>}
        {searching && !failed && !index && <li className="search-empty">Loading…</li>}
        {searching && index && results.length === 0 && <li className="search-empty">No matches.</li>}
        {results.map((entry, n) => (
          <li key={`${entry.pageId}-${entry.text}-${entry.occurrence}-${n}`}>
            <a className="search-result" href={pageHref(entry.pageId as PageId)} onClick={e => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              choose(entry);
            }}>
              <span className="search-result-title">{entry.text}</span>
              <span className="search-result-where">{entry.isTerm ? 'Glossary term · ' : ''}{labelOf(entry.pageId)}</span>
            </a>
          </li>
        ))}
      </ul>
      <div className="visually-hidden" id="searchStatus" role="status" aria-live="polite">{status}</div>
      {children}
    </search>
  );
}
