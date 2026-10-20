'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { announce } from '@/lib/announce';
import { NAV } from '@/lib/pages';
import { essentialOnly, settingsStore, useSettings } from '@/lib/state';
import { ESSENTIAL_WIDGETS } from '@/lib/tools';

const labelOf = (page: string) => NAV.flatMap(g => g.pages).find(p => p.id === page)?.label ?? page;

// Links marked data-goto (the Appendix E tool index, "Go to Chapter N") move within the app instead of reloading,
// and a data-widget value then lands on that tool. Ported from goToWidget in legacy/js/widgets.js.
export function DeepLinks() {
  const router = useRouter();
  const pathname = usePathname();
  const pending = useRef<{ page: string; key: string } | null>(null);

  const land = (page: string, key: string) => {
    const target = document.querySelector<HTMLElement>(`#content-container [data-widget="${key}"]`);
    if (!target) {
      announce(essentialOnly(settingsStore.get())
        ? 'That tool is off while Essential tools only is on. Turn it off in Settings to open this one.'
        : `Could not find that tool in ${labelOf(page)}.`);
      return;
    }
    target.scrollIntoView({ block: 'start' });
    target.focus({ preventScroll: true });
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[data-goto]');
      if (!link || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      const page = link.dataset.goto!;
      const key = link.dataset.widget;
      if (key) pending.current = { page, key };
      if (pathname === `/${page}` || (page === 'cover' && pathname === '/')) {
        if (key) setTimeout(() => land(page, key), 0);
        pending.current = null;
      } else {
        router.push(page === 'cover' ? '/' : `/${page}`);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [pathname, router]);

  // after the new page has rendered and the shell has moved focus to its heading
  useEffect(() => {
    const want = pending.current;
    if (!want) return;
    pending.current = null;
    const timer = setTimeout(() => land(want.page, want.key), 120);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Appendix E lists every tool; with Essential tools only on, drop the rows for tools that are not built.
  const settings = useSettings();
  useEffect(() => {
    if (pathname !== '/app-e') return;
    const off = essentialOnly(settings);
    document.querySelectorAll<HTMLElement>('#content-container tr').forEach(row => {
      const key = row.querySelector<HTMLElement>('[data-widget]')?.dataset.widget;
      if (key) row.hidden = off && !ESSENTIAL_WIDGETS.includes(key);
    });
  }, [pathname, settings]);

  return null;
}
