'use client';

import type { ReactNode } from 'react';
import { useOutlineSpy, type OutlineItem } from './useOutlineSpy';

export type { OutlineItem };

const PHONE_QUERY = '(max-width: 900px)';

// On a phone the sidebar becomes a bar across the top of the page; elsewhere the main column is its own scroller.
function chapterTop() {
  return window.matchMedia(PHONE_QUERY).matches
    ? (document.getElementById('sidebar')?.getBoundingClientRect().bottom ?? 0)
    : (document.getElementById('main-content')?.getBoundingClientRect().top ?? 0);
}

// One scroll spy, two copies of the list. CSS shows the copy that fits: beside the card, or under the opening.
export function ChapterOutline({ pageId, items, before, intro, rest }: {
  pageId: string;
  /** Sits above the chapter inside the card: the breadcrumb trail. */
  before?: ReactNode;
  intro: ReactNode;
  rest: ReactNode;
  items: OutlineItem[];
}) {
  const { current, onJump } = useOutlineSpy(items, chapterTop);

  const list = (className: string) => (
    <nav className={className} aria-label="On this page">
      <p className="outline-label">On this page</p>
      <ul role="list">
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
          {before}
          <article className="chapter-section chapter-body" id={pageId} data-page={pageId}>
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
