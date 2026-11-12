'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { announce } from '@/lib/announce';

// How the popover came to be open: a click pins it, a hover only shows it while the pointer is there.
type Open = { owner: HTMLElement; name: string; definition: string; by: 'click' | 'hover'; top: number; left: number };

// One popover for every glossary term in the page. The terms are plain buttons made at build time (lib/glossary.ts),
// so this listens on the document rather than on each button. Ported from openTermPop in legacy/js/widgets-plan.js.
export function TermPopover() {
  const [open, setOpen] = useState<Open | null>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const openRef = useRef<Open | null>(null);
  openRef.current = open;

  const close = useCallback(() => {
    clearTimeout(timer.current);
    setOpen(null);
  }, []);

  // WCAG 1.4.13: a hover popover stays open while the pointer moves onto it
  const scheduleClose = useCallback((owner: HTMLElement) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { if (openRef.current?.owner === owner && openRef.current.by === 'hover') close(); }, 250);
  }, [close]);

  useEffect(() => {
    const termOf = (e: Event) => (e.target as Element | null)?.closest<HTMLElement>('.term') ?? null;
    const show = (button: HTMLElement, by: Open['by']) => {
      clearTimeout(timer.current);
      const rect = button.getBoundingClientRect();
      setOpen({ owner: button, name: button.dataset.term ?? '', definition: button.dataset.definition ?? '', by, top: rect.top, left: rect.left });
    };
    const hoverCapable = () => window.matchMedia('(hover: hover)').matches;

    const onClick = (e: MouseEvent) => {
      const button = termOf(e);
      if (button) {
        // A click on the term whose popover is already pinned closes it. One that only showed on hover gets pinned
        // instead: the pointer arrives a moment before the click, so otherwise a click would undo its own hover.
        if (openRef.current?.owner === button && openRef.current.by === 'click') { close(); return; }
        show(button, 'click');
        // the tooltip is not in the reading flow, so say the definition when it is opened on purpose
        announce(`${button.dataset.term}: ${button.dataset.definition}`);
      } else if (openRef.current && !(e.target as Element).closest('.term-pop')) {
        close();
      }
    };
    const onOver = (e: MouseEvent) => { const b = termOf(e); if (b && hoverCapable() && openRef.current?.owner !== b) show(b, 'hover'); };
    const onOut = (e: MouseEvent) => { const b = termOf(e); if (b && hoverCapable() && openRef.current?.owner === b) scheduleClose(b); };
    const onKey = (e: KeyboardEvent) => {
      const pop = popRef.current;
      if (pop && openRef.current?.by === 'click' && document.activeElement === openRef.current.owner) {
        const movement = e.key === 'ArrowDown' ? 40 : e.key === 'ArrowUp' ? -40 : e.key === 'PageDown' ? pop.clientHeight : e.key === 'PageUp' ? -pop.clientHeight : undefined;
        if (movement !== undefined || e.key === 'Home' || e.key === 'End') {
          e.preventDefault();
          pop.scrollTop = e.key === 'Home' ? 0 : e.key === 'End' ? pop.scrollHeight : pop.scrollTop + (movement ?? 0);
        }
      }
      if (e.key === 'Escape' && openRef.current) { const owner = openRef.current.owner; close(); owner.focus(); }
    };
    // A queued focus-scroll event can arrive after opening. Only dismiss if the anchor actually moved;
    // scrolling a bounded definition must keep it open.
    const onScroll = () => {
      const current = openRef.current;
      if (!current) return;
      const rect = current.owner.getBoundingClientRect();
      if (rect.top !== current.top || rect.left !== current.left) close();
    };
    const main = document.getElementById('main-content');
    document.addEventListener('click', onClick);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    document.addEventListener('keydown', onKey);
    main?.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      document.removeEventListener('keydown', onKey);
      main?.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', close);
    };
  }, [close, scheduleClose]);

  // the buttons live in server-rendered HTML, so their state is set on the element itself
  useEffect(() => {
    if (!open) return;
    open.owner.setAttribute('aria-expanded', 'true');
    open.owner.setAttribute('aria-describedby', 'termPop');
    return () => {
      open.owner.setAttribute('aria-expanded', 'false');
      open.owner.removeAttribute('aria-describedby');
    };
  }, [open]);

  const pathname = usePathname();
  useEffect(() => { close(); }, [pathname, close]);

  useLayoutEffect(() => {
    const pop = popRef.current;
    if (!open || !pop) return;
    const position = () => {
      const viewport = window.visualViewport;
      const viewportLeft = viewport?.offsetLeft ?? 0;
      const viewportTop = viewport?.offsetTop ?? 0;
      const viewportWidth = viewport?.width ?? window.innerWidth;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const rect = open.owner.getBoundingClientRect();
      const width = Math.max(0, Math.min(320, viewportWidth - 24));
      pop.style.width = `${width}px`;
      pop.style.maxHeight = `${Math.max(0, viewportHeight - 16)}px`;
      pop.style.left = `${Math.min(Math.max(viewportLeft + 12, rect.left), viewportLeft + viewportWidth - width - 12)}px`;
      const bottom = viewportTop + viewportHeight - 8;
      const below = rect.bottom + 8;
      const preferred = below + pop.offsetHeight <= bottom ? below : rect.top - pop.offsetHeight - 8;
      pop.style.top = `${Math.max(viewportTop + 8, Math.min(preferred, bottom - pop.offsetHeight))}px`;
    };
    position();
    window.visualViewport?.addEventListener('resize', position);
    window.visualViewport?.addEventListener('scroll', position);
    return () => {
      window.visualViewport?.removeEventListener('resize', position);
      window.visualViewport?.removeEventListener('scroll', position);
    };
  }, [open]);

  return (
    <div
      ref={popRef}
      className="term-pop"
      id="termPop"
      role="tooltip"
      hidden={!open}
      onMouseEnter={() => clearTimeout(timer.current)}
      onMouseLeave={() => { if (open) scheduleClose(open.owner); }}
    >
      {open && (
        <>
          <strong>{open.name}</strong>
          <span>{open.definition}</span>
          <span className="term-more">Full list: Appendix D</span>
        </>
      )}
    </div>
  );
}
