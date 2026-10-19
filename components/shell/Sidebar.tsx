'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BOOK_TITLE, NAV } from '@/lib/pages';

// Ported from the static site's app-with-cover.js (header collapse, menu toggle, phone scroll lock).
// The CSS keys off the same ids and classes, so those names stay.
const PHONE_QUERY = '(max-width: 900px)';

export function Sidebar() {
  const pathname = usePathname();
  const current = pathname === '/' ? 'cover' : pathname.slice(1);

  const sidebarRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const lockedScrollY = useRef(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

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

  useEffect(() => syncScrollLock(menuOpen), [menuOpen, syncScrollLock]);

  useEffect(() => {
    const phone = window.matchMedia(PHONE_QUERY);
    const onChange = () => syncScrollLock(menuOpen);
    phone.addEventListener('change', onChange);
    return () => phone.removeEventListener('change', onChange);
  }, [menuOpen, syncScrollLock]);

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
    const main = document.getElementById('main-content');
    if (main) main.scrollTop = 0;
    window.scrollTo(0, 0);
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

  const classes = [menuOpen && 'menu-open', headerCollapsed && 'header-collapsed'].filter(Boolean).join(' ');

  return (
    <>
      <nav id="sidebar" ref={sidebarRef} className={classes} aria-label="Table of contents">
        <div className="sidebar-header" ref={headerRef}>
          <button
            ref={toggleRef}
            type="button"
            className="menu-toggle"
            id="menuToggle"
            aria-label="Table of contents"
            aria-expanded={menuOpen}
            aria-controls="navList"
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="sidebar-logo logo-light" src="/images/logo3-sidebar-transparent.png" width={320} height={320} alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="sidebar-logo logo-dark" src="/images/logo3-sidebar-dark.png" width={320} height={320} alt="" />
          <h1>{BOOK_TITLE}</h1>
          <p>A practical guide for new agents</p>
        </div>
        <ul className="nav-list" id="navList">
          {NAV.map(group => (
            <SectionGroup key={group.part ?? 'top'} group={group} current={current} />
          ))}
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

function SectionGroup({ group, current }: { group: (typeof NAV)[number]; current: string }) {
  return (
    <>
      {group.part && <li className="nav-section-title" role="presentation">{group.part}</li>}
      {group.pages.map(page => {
        const active = page.id === current;
        return (
          <li key={page.id}>
            <Link
              href={page.id === 'cover' ? '/' : `/${page.id}`}
              className={`nav-item${active ? ' active' : ''}`}
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
