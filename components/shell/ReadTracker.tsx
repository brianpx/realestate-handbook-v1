'use client';

import { useEffect, useRef } from 'react';
import { markRead, settingsStore } from '@/lib/state';
import type { PageId } from '@/lib/pages';

// A sentinel at the end of the chapter. Reaching it counts the chapter as read, as before.
// Re-arms when tracking is switched back on, so a section already on screen counts again.
export function ReadTracker({ id }: { id: PageId }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || id === 'cover') return;
    let observer: IntersectionObserver | null = null;
    const arm = () => {
      observer?.disconnect();
      observer = new IntersectionObserver(entries => {
        if (!entries.some(e => e.isIntersecting)) return;
        markRead(id);
        observer?.disconnect();
      });
      observer.observe(node);
    };
    arm();
    let tracking = settingsStore.get().trackProgress !== false;
    const unsubscribe = settingsStore.subscribe(() => {
      const now = settingsStore.get().trackProgress !== false;
      if (now && !tracking) arm();
      tracking = now;
    });
    return () => { observer?.disconnect(); unsubscribe(); };
  }, [id]);
  return <div className="read-sentinel" ref={ref} />;
}
