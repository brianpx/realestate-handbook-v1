'use client';

import { CircleCheckIcon, LockIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { COACH_ENABLED } from '@/lib/coach/enabled';
import { BOOK_TITLE, NAV } from '@/lib/pages';
import { HANDBOOK, pageHref, pageIdFromPath } from '@/lib/routes';
import { trackingProgress, useHandbookState, useSettings } from '@/lib/state';
import { PageLabel } from './PageLabel';
import { ProgressItem } from './ProgressItem';
import { Settings } from './Settings';
import { SidebarSearch, type SearchApi } from './SidebarSearch';

// Ported from the static site's app-with-cover.js (menu toggle, phone scroll lock).
// The CSS keys off the same ids and classes, so those names stay.
const PHONE_QUERY = '(max-width: 900px)';

// `locked` names the rows the reader's plan does not open (a page id, 'plan' or 'review') and the badge to show
// on them; the pages themselves show the upsell card. The layout works it out from the viewer.
export function Sidebar({ locked = {} }: { locked?: Readonly<Record<string, string>> }) {
  const pathname = usePathname();
  // Which sidebar row is active: a page id, or one of 'home', 'start', 'plan', 'review', 'account', 'support'.
  const current = pathname === HANDBOOK ? 'home' : (pageIdFromPath(pathname) ?? pathname.slice(1));

  const sidebarRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const lockedScrollY = useRef(0);
  const [menuOpen, setMenuOpen] = useState(false);
  // the chapter list has moved under the pinned logo and search, which then cast a shadow over it
  const [listScrolled, setListScrolled] = useState(false);
  // true while search results are open; they pin the page like the menu does and the menu button closes them
  const [searching, setSearching] = useState(false);
  const searchApi = useRef<SearchApi>(null);
  const open = menuOpen || searching;

  // On phones an open menu (or open search results) pins the page behind it: body fixed at the current offset (the
  // method iOS Safari honours), and the page is inert so Tab cannot reach what the backdrop covers (as a modal dialog would).
  const syncScrollLock = useCallback((open: boolean) => {
    const sidebar = sidebarRef.current;
    const root = document.documentElement;
    const locked = root.classList.contains('scroll-locked');
    const lock = open && window.matchMedia(PHONE_QUERY).matches;
    const behind = document.querySelectorAll<HTMLElement>('.skip-link, #main-content');
    if (lock && !locked) {
      if (!sidebar) return;
      lockedScrollY.current = window.scrollY;
      const rect = sidebar.getBoundingClientRect();
      sidebar.style.top = `${rect.top}px`;
      document.body.style.paddingTop = `${rect.height}px`; // fractional on purpose: rounding shifts the page 1px
      document.body.style.top = `-${lockedScrollY.current}px`;
      root.classList.add('scroll-locked');
      behind.forEach(node => { node.inert = true; });
    } else if (!lock && locked) {
      root.classList.remove('scroll-locked');
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
    // Unlock now, not on the next render: focusing the heading below is a no-op while the page is still inert.
    syncScrollLock(false);
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
    // the row's own label, without the padlock's or the tick's hidden words
    const label = [...document.querySelectorAll('.nav-item.active :is(.page-mark, .page-title)')].map(node => node.textContent).join('').trim();
    if (region && label) {
      region.textContent = '';
      setTimeout(() => { region.textContent = label; }, 50);
    }
  }, [pathname, syncScrollLock]);

  const settings = useSettings();
  const { read } = useHandbookState();
  const classes = [menuOpen && 'menu-open', searching && 'searching', listScrolled && 'list-scrolled', !trackingProgress(settings) && 'progress-off'].filter(Boolean).join(' ');

  return (
    <>
      <nav id="sidebar" ref={sidebarRef} className={classes} aria-label="Handbook">
        {/* First in the bar on a phone (menu, logo, search); hidden on a desktop, where the list is always open. */}
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
        <div className="sidebar-header">
          <Link className="sidebar-brand" href={HANDBOOK}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="sidebar-logo logo-light" src="/images/logo3-sidebar-transparent.png" width={320} height={320} alt="" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="sidebar-logo logo-dark" src="/images/logo3-sidebar-dark.png" width={320} height={320} alt="" />
            <div className="sidebar-brand-text">
              <p className="sidebar-title">{BOOK_TITLE}</p>
              <p>A practical guide for new real estate agents</p>
            </div>
          </Link>
        </div>
        <SidebarSearch onSearching={setSearching} onNavigate={() => setMenuOpen(false)} apiRef={searchApi} />
        <ul className="nav-list" id="navList" role="list" onScroll={e => setListScrolled(e.currentTarget.scrollTop > 4)}>
          <ProductLinks current={current} locked={locked} />
          {/* the title page and the overview have no part of their own: they close the Get started group */}
          {NAV.filter(group => !group.part).map(group => (
            <SectionGroup key="top" group={group} current={current} read={read} locked={locked} />
          ))}
          {COACH_ENABLED && trackingProgress(settings) && <StudyLinks current={current} locked={locked} />}
          {NAV.filter(group => group.part).map(group => (
            <SectionGroup key={group.part} group={group} current={current} read={read} locked={locked} />
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

type Locked = Readonly<Record<string, string>>;

/**
 * The padlock on a row the reader's plan does not open; the row still links, to the upsell card. A row that needs
 * more than membership names the plan beside the padlock, so a Basic member can see why it is closed.
 */
function LockBadge({ label }: { label: string | undefined }) {
  if (!label) return null;
  return (
    <span className="nav-lock" title={`${label} only`}>
      {label !== 'Members' && <span className="nav-lock-plan" aria-hidden="true">{label}</span>}
      <LockIcon aria-hidden="true" />
      <span className="visually-hidden"> ({label} only)</span>
    </span>
  );
}

function ProductLinks({ current, locked }: { current: string; locked: Locked }) {
  return (
    <>
      <li className="nav-section-title" role="presentation">GET STARTED</li>
      {PRODUCT_LINKS.map(link => {
        const active = link.id === current;
        // the setup is part of the paid handbook; the tools row is Appendix E
        const lock = locked[link.id === 'start' ? 'start' : link.id === 'tools' ? 'app-e' : ''];
        return (
          <li key={link.id}>
            <Link href={link.href} className={`nav-item${active ? ' active' : ''}`} data-page={link.id} aria-current={active ? 'page' : undefined}><span className="page-title">{link.label}</span><LockBadge label={lock} /></Link>
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
      <ProgressItem />
      <li><Link href="/account" className={`nav-item${current === 'account' ? ' active' : ''}`} data-page="account" aria-current={current === 'account' ? 'page' : undefined}><span className="page-title">Account and saved progress</span></Link></li>
      <li><Link href="/pricing" className="nav-item" data-page="pricing"><span className="page-title">Pricing and availability</span></Link></li>
      <li><Link href="/support" className="nav-item" data-page="support"><span className="page-title">Support</span></Link></li>
      <li><Link href="/" className="nav-item" data-page="site"><span className="page-title">Back to the website</span></Link></li>
    </>
  );
}

function StudyLinks({ current, locked }: { current: string; locked: Locked }) {
  return (
    <>
      <li className="nav-section-title" role="presentation">MY STUDY</li>
      {STUDY_LINKS.map(link => {
        const active = link.id === current;
        return (
          <li key={link.id}>
            <Link href={`${HANDBOOK}/${link.id}`} className={`nav-item${active ? ' active' : ''}`} data-page={link.id} aria-current={active ? 'page' : undefined}>
              <span className="page-title">{link.label}</span><LockBadge label={locked[link.id]} />
            </Link>
          </li>
        );
      })}
    </>
  );
}

function SectionGroup({ group, current, read, locked }: { group: (typeof NAV)[number]; current: string; read: Record<string, boolean>; locked: Locked }) {
  return (
    <>
      {group.part && <li className="nav-section-title" role="presentation">{group.part.replace(': ', ' · ')}</li>}
      {group.pages.map(page => {
        const active = page.id === current;
        const lock = locked[page.id];
        const isRead = Boolean(read[page.id]) && !lock;
        return (
          <li key={page.id}>
            <Link
              href={pageHref(page.id)}
              className={`nav-item${active ? ' active' : ''}${isRead ? ' read' : ''}`}
              data-page={page.id}
              aria-current={active ? 'page' : undefined}
            >
              <PageLabel label={page.label} /><LockBadge label={lock} />
              {isRead && <span className="nav-read"><CircleCheckIcon aria-hidden="true" /><span className="visually-hidden"> (read)</span></span>}
            </Link>
          </li>
        );
      })}
    </>
  );
}
