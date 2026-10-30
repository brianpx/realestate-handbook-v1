'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
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

export function Sidebar() {
  const pathname = usePathname();
  // Which sidebar row is active: a page id, or one of 'home', 'start', 'plan', 'review', 'account', 'support'.
  const current = pathname === HANDBOOK ? 'home' : (pageIdFromPath(pathname) ?? pathname.slice(1));

  const sidebarRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const lockedScrollY = useRef(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  // true while search results are open; they pin the page like the menu does and the menu button closes them
  const [searching, setSearching] = useState(false);
  const searchApi = useRef<SearchApi>(null);
  const open = menuOpen || searching;

  // Header slides out of the sidebar as the main panel scrolls; two thresholds avoid flicker.
  useEffect(() => {
    const sidebar = sidebarRef.current;
    const header = headerRef.current;
    const main = document.getElementById('main-content');
    if (!sidebar || !header || !main) return;
    const phone = window.matchMedia(PHONE_QUERY);
    const measure = () => sidebar.style.setProperty('--header-h', `${header.offsetHeight}px`);
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    void document.fonts?.ready.then(measure);
    const onScroll = () => {
      if (phone.matches) return; // on phones the sticky header scrolls away with the page
      if (main.scrollTop > 60) setHeaderCollapsed(true);
      else if (main.scrollTop < 8) setHeaderCollapsed(false);
    };
    main.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('load', measure);
      main.removeEventListener('scroll', onScroll);
    };
  }, []);

  // On phones an open menu pins the page behind it: body fixed at the current offset (the method iOS Safari honours).
  const syncScrollLock = useCallback((open: boolean) => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;
    const root = document.documentElement;
    const locked = root.classList.contains('scroll-locked');
    const lock = open && window.matchMedia(PHONE_QUERY).matches;
    if (lock && !locked) {
      lockedScrollY.current = window.scrollY;
      const rect = sidebar.getBoundingClientRect();
      sidebar.style.top = `${rect.top}px`;
      document.body.style.paddingTop = `${rect.height}px`; // fractional on purpose: rounding shifts the page 1px
      document.body.style.top = `-${lockedScrollY.current}px`;
      root.classList.add('scroll-locked');
    } else if (!lock && locked) {
      root.classList.remove('scroll-locked');
      sidebar.style.top = '';
      document.body.style.paddingTop = '';
      document.body.style.top = '';
      window.scrollTo(0, lockedScrollY.current);
    }
  }, []);

  useEffect(() => syncScrollLock(open), [open, syncScrollLock]);

  useEffect(() => {
    const phone = window.matchMedia(PHONE_QUERY);
    const onChange = () => syncScrollLock(open);
    phone.addEventListener('change', onChange);
    return () => phone.removeEventListener('change', onChange);
  }, [open, syncScrollLock]);

  // Swipes are blocked everywhere except inside the open list, and there only while it can still move.
  useEffect(() => {
    let startY = 0;
    const onStart = (e: TouchEvent) => { startY = e.touches[0]?.clientY ?? 0; };
    const onMove = (e: TouchEvent) => {
      if (!document.documentElement.classList.contains('scroll-locked')) return;
      const list = (e.target as Element | null)?.closest<HTMLElement>('.nav-list, .search-results');
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
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!sidebarRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !menuOpen) return;
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

  // Navigating closes the menu, resets the scroll position and tells screen readers where they are.
  const lastPath = useRef<string | null>(null);
  useEffect(() => {
    setMenuOpen(false);
    // A link with #heading-id (the review deck's "Read the passage") lands on that heading, not the top of the page.
    let hash = window.location.hash.slice(1);
    try { hash = decodeURIComponent(hash); } catch { /* malformed escape: use it as typed */ }
    const target = hash ? document.getElementById(hash) : null;
    if (target) {
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
    }
    const region = document.getElementById('pageStatus');
    const label = document.querySelector('.nav-item.active')?.textContent?.trim() ?? '';
    if (region && label) {
      region.textContent = '';
      setTimeout(() => { region.textContent = label; }, 50);
    }
  }, [pathname]);

  const settings = useSettings();
  const { read } = useHandbookState();
  const classes = [menuOpen && 'menu-open', searching && 'searching', headerCollapsed && 'header-collapsed', !trackingProgress(settings) && 'progress-off'].filter(Boolean).join(' ');

  return (
    <>
      <nav id="sidebar" ref={sidebarRef} className={classes} aria-label="Table of contents">
        <div className="sidebar-header" ref={headerRef}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="sidebar-logo logo-light" src="/images/logo3-sidebar-transparent.png" width={320} height={320} alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="sidebar-logo logo-dark" src="/images/logo3-sidebar-dark.png" width={320} height={320} alt="" />
          <p className="sidebar-title"><Link href={HANDBOOK}>{BOOK_TITLE}</Link></p>
          <p>A practical guide for new agents</p>
        </div>
        <SidebarSearch onSearching={setSearching} onNavigate={() => setMenuOpen(false)} apiRef={searchApi}>
          <button
            ref={toggleRef}
            type="button"
            className="menu-toggle"
            id="menuToggle"
            aria-label={searching ? 'Close search results' : 'Table of contents'}
            aria-expanded={menuOpen}
            aria-controls="navList"
            onClick={() => (searching ? searchApi.current?.clear() : setMenuOpen(o => !o))}
          >
            {open ? '✕' : '☰'}
          </button>
        </SidebarSearch>
        <ul className="nav-list" id="navList">
          <ProgressItem />
          <ProductLinks current={current} />
          {COACH_ENABLED && trackingProgress(settings) && <StudyLinks current={current} />}
          {NAV.map(group => (
            <SectionGroup key={group.part ?? 'top'} group={group} current={current} read={read} />
          ))}
          <HelpLinks current={current} />
          <Settings />
          <li className="menu-close">
            <button type="button" onClick={() => { setMenuOpen(false); toggleRef.current?.focus(); }}>Close menu</button>
          </li>
        </ul>
      </nav>
      <div
        className="menu-backdrop"
        onClick={e => { e.preventDefault(); setMenuOpen(false); }}
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
  { id: 'tools', label: 'Interactive tools', href: pageHref('app-e') }, // the same page as Appendix E, so never marked current here
];

function ProductLinks({ current }: { current: string }) {
  return (
    <>
      <li className="nav-section-title" role="presentation">GET STARTED</li>
      {PRODUCT_LINKS.map(link => {
        const active = link.id === current;
        return (
          <li key={link.id}>
            <Link href={link.href} className={`nav-item${active ? ' active' : ''}`} data-page={link.id} aria-current={active ? 'page' : undefined}>{link.label}</Link>
          </li>
        );
      })}
    </>
  );
}

// Progress and help live outside the book, on the public and account routes.
function HelpLinks({ current }: { current: string }) {
  return (
    <>
      <li className="nav-section-title" role="presentation">PROGRESS AND HELP</li>
      <li><Link href="/account" className={`nav-item${current === 'account' ? ' active' : ''}`} data-page="account" aria-current={current === 'account' ? 'page' : undefined}>Account and saved progress</Link></li>
      <li><Link href="/support" className="nav-item" data-page="support">Support</Link></li>
      <li><Link href="/" className="nav-item" data-page="site">Back to the website</Link></li>
    </>
  );
}

function StudyLinks({ current }: { current: string }) {
  return (
    <>
      <li className="nav-section-title" role="presentation">MY STUDY</li>
      {STUDY_LINKS.map(link => {
        const active = link.id === current;
        return (
          <li key={link.id}>
            <Link href={`${HANDBOOK}/${link.id}`} className={`nav-item${active ? ' active' : ''}`} data-page={link.id} aria-current={active ? 'page' : undefined}>
              {link.label}
            </Link>
          </li>
        );
      })}
    </>
  );
}

function SectionGroup({ group, current, read }: { group: (typeof NAV)[number]; current: string; read: Record<string, boolean> }) {
  return (
    <>
      {group.part && <li className="nav-section-title" role="presentation">{group.part}</li>}
      {group.pages.map(page => {
        const active = page.id === current;
        return (
          <li key={page.id}>
            <Link
              href={pageHref(page.id)}
              className={`nav-item${active ? ' active' : ''}${read[page.id] ? ' read' : ''}`}
              data-page={page.id}
              aria-current={active ? 'page' : undefined}
            >
              {page.label}
            </Link>
          </li>
        );
      })}
    </>
  );
}
