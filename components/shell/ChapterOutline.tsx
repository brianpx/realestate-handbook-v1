'use client';

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';

export type OutlineItem = { id: string; text: string };

const PHONE_QUERY = '(max-width: 900px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
// A smooth scroll is a stream of scroll events; this much quiet after the last one means it has landed.
const SETTLE_MS = 150;

// One scroll spy, two copies of the list. CSS shows the copy that fits: beside the card, or under the opening.
export function ChapterOutline({ pageId, items, intro, rest }: {
  pageId: string;
  intro: ReactNode;
  rest: ReactNode;
  items: OutlineItem[];
}) {
  const [current, setCurrent] = useState(items[0]?.id ?? null);
  // While a click's scroll animates, the spy stays quiet so the highlight doesn't race through every heading on the way.
  const settling = useRef<number | null>(null);

  useEffect(() => {
    const main = document.getElementById('main-content');
    const update = () => {
      if (settling.current !== null) return;
      const phone = window.matchMedia(PHONE_QUERY).matches;
      const top = phone
        ? (document.getElementById('sidebar')?.getBoundingClientRect().bottom ?? 0)
        : (main?.getBoundingClientRect().top ?? 0);
      let next = items[0]?.id ?? null;
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= top + 24) next = item.id;
      }
      setCurrent(next);
    };
    const onScroll = () => {
      if (settling.current === null) return update();
      window.clearTimeout(settling.current);
      settling.current = window.setTimeout(() => { settling.current = null; update(); }, SETTLE_MS);
    };
    update();
    main?.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      main?.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
      if (settling.current !== null) window.clearTimeout(settling.current);
      settling.current = null;
    };
  }, [items]);

  const onJump = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const id = decodeURIComponent(event.currentTarget.hash.slice(1));
    const el = document.getElementById(id);
    if (!el) return;
    event.preventDefault();
    // pushState keeps the hash in the URL and in history without the browser's own instant jump.
    history.pushState(null, '', `#${id}`);
    setCurrent(id);
    if (settling.current !== null) window.clearTimeout(settling.current);
    // If the target is already in place no scroll event fires, so the same timer also ends the quiet period.
    settling.current = window.setTimeout(() => { settling.current = null; }, SETTLE_MS);
    const reduced = window.matchMedia(REDUCED_MOTION_QUERY).matches;
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    el.tabIndex = -1;
    el.focus({ preventScroll: true });
  };

  const list = (className: string) => (
    <nav className={className} aria-label="On this page">
      <p className="outline-label">On this page</p>
      <ul>
        {items.map(item => (
          <li key={item.id}>
            <a href={`#${item.id}`} aria-current={current === item.id ? 'location' : undefined} onClick={onJump}>{item.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <div className="chapter-slot">
      <div className="chapter-frame">
        <div className="content-container" id="content-container">
          <article className="chapter-section" id={pageId} data-page={pageId}>
            {intro}
            {list('chapter-outline outline-stacked')}
            {rest}
          </article>
        </div>
        {list('chapter-outline outline-rail')}
      </div>
    </div>
  );
}
