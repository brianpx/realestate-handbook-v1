'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PAGES, type PageId } from '@/lib/pages';
import { pageHref } from '@/lib/routes';
import { trackingProgress, useHandbookState, useSettings } from '@/lib/state';

const CHAPTERS = PAGES.map(p => p.id).filter((id): id is PageId => /^ch\d+$/.test(id));
const SECONDARY: PageId = 'ch7';
const chapterNumber = (id: string) => id.slice(2);

export function HeroActions({ locked }: { locked: readonly string[] }) {
  const { read } = useHandbookState();
  const tracking = trackingProgress(useSettings());
  const open = CHAPTERS.filter(id => !locked.includes(id));
  const isRead = (id: string) => tracking && Boolean(read[id]);
  const target = open.find(id => !isRead(id)) ?? open[0];
  if (!target) return null;
  const continuing = open.slice(0, open.indexOf(target)).some(isRead);
  const showSecondary = target !== SECONDARY && open.includes(SECONDARY);

  return (
    <div className="hb-home-actions">
      <Link className="hb-home-btn hb-home-btn-primary" href={pageHref(target)}>
        {continuing ? `Continue: Chapter ${chapterNumber(target)}` : `Read Chapter ${chapterNumber(target)}`}
        <ArrowRight aria-hidden="true" size={18} strokeWidth={2.25} />
      </Link>
      {showSecondary && (
        <Link className="hb-home-btn hb-home-btn-secondary" href={pageHref(SECONDARY)}>Read Chapter {chapterNumber(SECONDARY)}</Link>
      )}
    </div>
  );
}
