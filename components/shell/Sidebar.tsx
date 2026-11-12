'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { COACH_ENABLED } from '@/lib/coach/enabled';
import { BOOK_TITLE, NAV } from '@/lib/pages';
import { HANDBOOK, pageHref, pageIdFromPath } from '@/lib/routes';
import { trackingProgress, useHandbookState, useSettings } from '@/lib/state';
import { ProgressItem } from './ProgressItem';
import { Settings } from './Settings';
import { SidebarSearch, type SearchApi } from './SidebarSearch';

// Ported from the static site's app-with-cover.js (header collapse, menu toggle, phone scroll lock).
// The CSS keys off the same ids and classes, so those names stay.
const PHONE_QUERY = '(max-width: 900px)';

// While the page is locked, swipes are blocked everywhere except inside the open list, and there only while it can
// still move. The listeners exist only for that time: a non-passive touchmove on the document makes the browser wait
// for script on every touch scroll, on every page.
function guardSwipes(): () => void {
  let startY = 0;
  const onStart = (e: TouchEvent) => { startY = e.touches[0]?.clientY ?? 0; };
  const onMove = (e: TouchEvent) => {
    const list = (e.target as Element | null)?.closest<HTMLElement>('.sidebar-body, .search-results');
    if (!list) { e.preventDefault(); return; }
    const down = (e.touches[0]?.clientY ?? 0) > startY;
    const atTop = list.scrollTop <= 0;
    const atBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 1;
    if (list.scrollHeight <= list.clientHeight || (down && atTop) || (!down && atBottom)) e.preventDefault();
  };
  document.addEventListener('touchstart', onStart, { passive: true });
  document.addEventListener('touchmove', onMove, { passive: false });
  return () => {
    document.removeEventListener('touchstart', onStart);
    document.removeEventListener('touchmove', onMove);
  };
}

// `locked` names the rows the reader's plan does not open (a page id, 'plan' or 'review') and the badge to show
// on them; the pages themselves show the upsell card. The layout works it out from the viewer.
export function Sidebar({ locked = {} }: { locked?: Readonly<Record<string, string>> }) {
  const pathname = usePathname();
  // Which sidebar row is active: a page id, or one of 'home', 'start', 'plan', 'review', 'account', 'support'.
  const current = pathname === HANDBOOK ? 'home' : (pageIdFromPath(pathname) ?? pathname.slice(1));

  const sidebarRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const lockedScrollY = useRef(0);
  const releaseSwipes = useRef<(() => void) | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // Parts of the book start folded except the one holding the current page, which cannot be folded while it is current.
  const currentPart = NAV.find(group => group.pages.some(page => page.id === current))?.part ?? null;
  const [unfolded, setUnfolded] = useState<Readonly<Record<string, boolean>>>({});
  // true while search results are open; they pin the page like the menu does and the menu button closes them
  const [searching, setSearching] = useState(false);
  const searchApi = useRef<SearchApi>(null);
  const open = menuOpen || searching;

  // The phone layout sticks the sidebar so that its header sits just above the screen; --header-h is that offset.
  useEffect(() => {
    const sidebar = sidebarRef.current;
    const header = headerRef.current;
    if (!sidebar || !header) return;
    const measure = () => sidebar.style.setProperty('--header-h', `${header.offsetHeight}px`);
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    void document.fonts?.ready.then(measure);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('load', measure);
    };
  }, []);

  // On phones an open menu (or open search results) pins the page behind it: body fixed at the current offset (the
  // method iOS Safari honours), and the page is inert so Tab cannot reach what the backdrop covers (as a modal dialog would).
  const syncScrollLock = useCallback((open: boolean) => {
    const sidebar = sidebarRef.current;
    const root = document.documentElement;
    const locked = root.classList.contains('scroll-locked');
    const lock = open && window.matchMedia(PHONE_QUERY).matches;
    const behind = document.querySelectorAll<HTMLElement>('.skip-link, .shell-topbar, #main-content');
    if (lock && !locked) {
      if (!sidebar) return;
      lockedScrollY.current = window.scrollY;
      const rect = sidebar.getBoundingClientRect();
      sidebar.style.top = `${rect.top}px`;
      document.body.style.paddingTop = `${rect.height}px`; // fractional on purpose: rounding shifts the page 1px
      document.body.style.top = `-${lockedScrollY.current}px`;
      root.classList.add('scroll-locked');
      behind.forEach(node => { node.inert = true; });
      releaseSwipes.current = guardSwipes();
    } else if (!lock && locked) {
      root.classList.remove('scroll-locked');
      releaseSwipes.current?.();
      releaseSwipes.current = null;
      if (sidebar) sidebar.style.top = ''; // null on unmount: a link out of the open menu to the public site
      document.body.style.paddingTop = '';
      document.body.style.top = '';
      behind.forEach(node => { node.inert = false; });
      window.scrollTo(0, lockedScrollY.current);
    }
  }, []);

  // The cleanup unlocks when the shell unmounts with the menu open (a link to the public site), or the page
  // underneath keeps the fixed body and inert.
  useEffect(() => {
    syncScrollLock(open);
    return () => syncScrollLock(false);
  }, [open, syncScrollLock]);

  useEffect(() => {
    const phone = window.matchMedia(PHONE_QUERY);
    const onChange = () => syncScrollLock(open);
    phone.addEventListener('change', onChange);
    return () => phone.removeEventListener('change', onChange);
  }, [open, syncScrollLock]);

  // The dropdown is absolutely positioned, so its own height does not affect this measurement.
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!open || !sidebar) return;
    const measure = () => {
      sidebar.style.setProperty('--overlay-top', `${sidebar.getBoundingClientRect().bottom}px`);
      sidebar.style.setProperty('--overlay-height', `${window.visualViewport?.height ?? window.innerHeight}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(sidebar);
    window.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('resize', measure);
    };
  }, [open]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!sidebarRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !menuOpen || e.defaultPrevented) return;
      setMenuOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  // The browser restores window scroll; retain the independently scrolling desktop reading panel too.
  const readingPositions = useRef(new Map<string, number>());
  const historyNavigation = useRef(false);
  useEffect(() => {
    const onPopState = () => { historyNavigation.current = true; };
    // A deliberate link activation after a same-page history event starts a new navigation.
    const onLink = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest('a[href]');
      if (link) {
        const main = document.getElementById('main-content');
        if (main) readingPositions.current.set(window.location.pathname, main.scrollTop);
        historyNavigation.current = false;
      }
    };
    window.addEventListener('popstate', onPopState);
    document.addEventListener('click', onLink, true);
    return () => {
      window.removeEventListener('popstate', onPopState);
      document.removeEventListener('click', onLink, true);
    };
  }, []);
  useEffect(() => {
    const main = document.getElementById('main-content');
    if (!main) return;
    const remember = () => {
      // Next can scroll the newly committed route before React cleans up the previous route's listener.
      // That automatic scroll must never overwrite the reading position of the page we just left.
      if (window.location.pathname === pathname) readingPositions.current.set(pathname, main.scrollTop);
    };
    main.addEventListener('scroll', remember, { passive: true });
    return () => main.removeEventListener('scroll', remember);
  }, [pathname]);

  // Navigating closes the menu, resets the scroll position and tells screen readers where they are.
  const lastPath = useRef<string | null>(null);
  useEffect(() => {
    // A quick Back can update the URL before a pending route effect runs. Do not consume that history
    // event or reset scroll for an intermediate route that is no longer the browser's destination.
    if (window.location.pathname !== pathname) return;
    setMenuOpen(false);
    // Unlock now, not on the next render: focusing the heading below is a no-op while the page is still inert.
    syncScrollLock(false);
    // A link with #heading-id (the review deck's "Read the passage") lands on that heading, not the top of the page.
    let hash = window.location.hash.slice(1);
    try { hash = decodeURIComponent(hash); } catch { /* malformed escape: use it as typed */ }
    const target = hash ? document.getElementById(hash) : null;
    const traversingHistory = historyNavigation.current;
    historyNavigation.current = false;
    if (traversingHistory) {
      const main = document.getElementById('main-content');
      if (main) main.scrollTop = readingPositions.current.get(pathname) ?? 0;
    } else if (target) {
      target.scrollIntoView();
    } else {
      const main = document.getElementById('main-content');
      if (main) main.scrollTop = 0;
      window.scrollTo(0, 0);
    }
    const changed = lastPath.current !== null && lastPath.current !== pathname;
    lastPath.current = pathname;
    if (!changed) return; // first load (and dev double-run) keeps focus where it is
    const heading = document.querySelector<HTMLElement>('#content-container h1, #content-container h2');
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      return; // a focused heading is announced as it is; the status line would say the page name twice
    }
    const region = document.getElementById('pageStatus');
    const current = document.querySelector('.nav-item.active:not([data-page="tools"])')?.cloneNode(true) as HTMLElement | undefined;
    current?.querySelector('.nav-read')?.remove(); // the read tick is not part of the page's name
    const label = current?.textContent?.trim() ?? '';
    if (region && label) {
      region.textContent = '';
      setTimeout(() => { region.textContent = label; }, 50);
    }
  }, [pathname, syncScrollLock]);

  // The list is long, so bring the current row into view whenever it is showing (desktop at any route change, phones
  // when the menu opens). Only the scrolling region moves: scrollIntoView would move the page too. That region is the
  // list itself on desktop and the whole dropdown on phones.
  useEffect(() => {
    const list = document.getElementById('navList');
    const rows = list?.querySelectorAll<HTMLElement>('.nav-item.active');
    const row = rows?.item(rows.length - 1); // Appendix E also marks the tools row above it; the book row is the later one
    const scroller = list && (getComputedStyle(list).overflowY === 'auto' ? list : list.closest<HTMLElement>('.sidebar-body'));
    if (!scroller || !row || scroller.clientHeight === 0) return; // hidden: a closed phone menu or open search results
    const edge = 8;
    const closeBar = scroller.querySelector<HTMLElement>('.menu-close')?.offsetHeight ?? 0; // sticky over the bottom on phones
    const l = scroller.getBoundingClientRect();
    const r = row.getBoundingClientRect();
    if (r.top < l.top + edge) scroller.scrollTop += r.top - l.top - edge;
    else if (r.bottom > l.bottom - edge - closeBar) scroller.scrollTop += r.bottom - l.bottom + edge + closeBar;
  }, [pathname, menuOpen, searching]); // searching: the list is hidden meanwhile and comes back unscrolled

  const settings = useSettings();
  const { read } = useHandbookState();
  const classes = [menuOpen && 'menu-open', searching && 'searching', !trackingProgress(settings) && 'progress-off'].filter(Boolean).join(' ');

  return (
    <>
      <div id="sidebar" ref={sidebarRef} className={classes}>
        <div className="sidebar-header" ref={headerRef}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="sidebar-logo logo-light" src="/images/logo3-sidebar-transparent.png" width={320} height={320} alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="sidebar-logo logo-dark" src="/images/logo3-sidebar-dark.png" width={320} height={320} alt="" />
          <p className="sidebar-title"><Link href={HANDBOOK}>{BOOK_TITLE}</Link></p>
          <p>A practical guide for new real estate agents</p>
        </div>
        <SidebarSearch onSearching={setSearching} onNavigate={() => setMenuOpen(false)} apiRef={searchApi}>
          <button
            ref={toggleRef}
            type="button"
            className="menu-toggle"
            id="menuToggle"
            aria-label={searching ? 'Close search results' : 'Handbook menu'}
            aria-expanded={searching ? true : menuOpen}
            aria-controls={searching ? 'searchResults' : 'sidebarBody'}
            onClick={() => (searching ? searchApi.current?.clear() : setMenuOpen(o => !o))}
          >
            {open ? '✕' : '☰'}
          </button>
        </SidebarSearch>
        <div className="sidebar-body" id="sidebarBody">
          <nav className="sidebar-nav" aria-label="Handbook">
            <ul className="nav-list" id="navList" role="list">
              <ProgressItem />
              <ProductLinks current={current} locked={locked} />
              {COACH_ENABLED && trackingProgress(settings) && <StudyLinks current={current} locked={locked} />}
              {NAV.map((group, index) => (
                <SectionGroup
                  key={group.part ?? 'top'}
                  group={group}
                  index={index}
                  current={current}
                  read={read}
                  locked={locked}
                  here={group.part === currentPart}
                  open={group.part === null || group.part === currentPart || unfolded[group.part] === true}
                  onToggle={() => { if (group.part && group.part !== currentPart) setUnfolded(u => ({ ...u, [group.part!]: !u[group.part!] })); }}
                />
              ))}
              <HelpLinks current={current} />
            </ul>
          </nav>
          <div className="sidebar-footer">
            <Settings />
          </div>
          <div className="menu-close">
            <button type="button" onClick={() => { setMenuOpen(false); toggleRef.current?.focus(); }}>Close menu</button>
          </div>
        </div>
      </div>
      <div
        className="menu-backdrop"
        onClick={e => { e.preventDefault(); setMenuOpen(false); searchApi.current?.clear(); }}
      />
    </>
  );
}

// The reading plan and spaced-review pages. They save to this device, so they go away with progress tracking, and
// they stay out of the menu while the coach is off (the pages 404 then).
const STUDY_LINKS = [
  { id: 'plan', label: 'My plan' },
  { id: 'review', label: 'Review' },
];

// Orientation and the guided first session sit above the chapters so a new reader and a returning one both see them first.
const PRODUCT_LINKS = [
  { id: 'home', label: 'Handbook home', href: HANDBOOK },
  { id: 'start', label: 'Start here: guided setup', href: `${HANDBOOK}/start` },
  { id: 'tools', label: 'Interactive tools', href: pageHref('app-e') }, // the same page as Appendix E, which is marked current too
];

type Locked = Readonly<Record<string, string>>;

/** The badge on a row the reader's plan does not open; the row still links, to the upsell card. */
function LockBadge({ label }: { label: string | undefined }) {
  if (!label) return null;
  return <span className="nav-lock"><span aria-hidden="true">{label}</span><span className="visually-hidden"> ({label} only)</span></span>;
}

/** A titled group of rows: a heading and a nested list, so assistive technology hears the sections and their sizes. */
function NavGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="nav-group">
      <h2 className="nav-section-title">{title}</h2>
      <ul className="nav-group-list" role="list">{children}</ul>
    </li>
  );
}

function ProductLinks({ current, locked }: { current: string; locked: Locked }) {
  return (
    <NavGroup title="GET STARTED">
      {PRODUCT_LINKS.map(link => {
        const active = link.id === current || (link.id === 'tools' && current === 'app-e');
        // the setup is part of the paid handbook; the tools row is Appendix E
        const lock = locked[link.id === 'start' ? 'start' : link.id === 'tools' ? 'app-e' : ''];
        return (
          <li key={link.id}>
            <Link href={link.href} className={`nav-item${active ? ' active' : ''}${lock ? ' locked' : ''}`} data-page={link.id} aria-current={active ? 'page' : undefined}>{link.label}<LockBadge label={lock} /></Link>
          </li>
        );
      })}
    </NavGroup>
  );
}

// Progress and help live outside the book, on the public and account routes.
function HelpLinks({ current }: { current: string }) {
  return (
    <NavGroup title="PROGRESS AND HELP">
      <li><Link href="/account" className={`nav-item${current === 'account' ? ' active' : ''}`} data-page="account" aria-current={current === 'account' ? 'page' : undefined}>Account and saved progress</Link></li>
      <li><Link href="/support" className="nav-item" data-page="support">Support</Link></li>
      <li><Link href="/" className="nav-item" data-page="site">Back to the website</Link></li>
    </NavGroup>
  );
}

function StudyLinks({ current, locked }: { current: string; locked: Locked }) {
  return (
    <NavGroup title="MY STUDY">
      {STUDY_LINKS.map(link => {
        const active = link.id === current;
        return (
          <li key={link.id}>
            <Link href={`${HANDBOOK}/${link.id}`} className={`nav-item${active ? ' active' : ''}${locked[link.id] ? ' locked' : ''}`} data-page={link.id} aria-current={active ? 'page' : undefined}>
              {link.label}<LockBadge label={locked[link.id]} />
            </Link>
          </li>
        );
      })}
    </NavGroup>
  );
}

/**
 * One part of the book. The first group has no part name and is always shown. A named part is a heading holding a
 * disclosure button; folded, its list is `hidden`, so its links leave the tab order and the accessibility tree.
 * The part that holds the current page stays open (`here`), so the reader never loses sight of where they are.
 */
function SectionGroup({ group, index, current, read, locked, here, open, onToggle }: {
  group: (typeof NAV)[number];
  index: number;
  current: string;
  read: Record<string, boolean>;
  locked: Locked;
  here: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const listId = `navGroup${index}`;
  return (
    <li className="nav-group">
      {group.part && (
        <h2 className="nav-section-title nav-part-title">
          <button type="button" className="nav-section-toggle" aria-expanded={open} aria-controls={listId} aria-disabled={here || undefined} onClick={onToggle}>
            {group.part}
          </button>
        </h2>
      )}
      <ul className="nav-group-list" role="list" id={listId} hidden={!open}>
        {group.pages.map(page => {
          const active = page.id === current;
          const lock = locked[page.id];
          return (
            <li key={page.id}>
              <Link
                href={pageHref(page.id)}
                className={`nav-item${active ? ' active' : ''}${read[page.id] && !lock ? ' read' : ''}${lock ? ' locked' : ''}`}
                data-page={page.id}
                aria-current={active ? 'page' : undefined}
              >
                {page.label}
                {read[page.id] && !lock && <span className="nav-read"><span aria-hidden="true">✓</span><span className="visually-hidden"> (read)</span></span>}
                <LockBadge label={lock} />
              </Link>
            </li>
          );
        })}
      </ul>
    </li>
  );
}
