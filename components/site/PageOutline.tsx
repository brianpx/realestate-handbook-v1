'use client';

import type { ReactNode } from 'react';
import { useOutlineSpy, type OutlineItem } from '@/components/shell/useOutlineSpy';

// The public header is sticky, so a heading counts as reached once it clears the header's bottom edge.
function headerBottom() {
  return document.querySelector('.pub-header')?.getBoundingClientRect().bottom ?? 0;
}

// An "On this page" outline for a long public page. One scroll spy, two copies of the list: CSS shows the sticky rail
// beside the text on wide screens and the stacked list above it everywhere else.
export function PageOutline({ items, children }: { items: OutlineItem[]; children: ReactNode }) {
  const { current, onJump } = useOutlineSpy(items, headerBottom);

  const list = (className: string) => (
    <nav className={className} aria-label="On this page">
      <p className="pub-outline-label">On this page</p>
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
    <div className="pub-wrap pub-outline-frame">
      <div className="pub-prose pub-outline-body">
        {list('pub-outline pub-outline-stacked')}
        {children}
      </div>
      {list('pub-outline pub-outline-rail')}
    </div>
  );
}
