'use client';

import Link from 'next/link';
import { pageHref } from '@/lib/routes';
import { trackingProgress, useHandbookState, useSettings } from '@/lib/state';
import { BANDS } from './chapter-bands';
import { FreePill, MembersOnlyText } from './access-marks';

// `locked` lists the pages the reader's plan does not open; they still link, to the upsell card.
export function ChapterBands({ locked, free }: { locked: readonly string[]; free: boolean }) {
  const { read } = useHandbookState();
  const tracking = trackingProgress(useSettings());
  return (
    <section className="hb-home-section" aria-labelledby="homeChaptersTitle">
      <div className="hb-home-head">
        <h2 id="homeChaptersTitle" className="hb-h2 hb-home-h2">Chapters</h2>
        {free && <p className="hb-home-legend"><FreePill /> chapters are open to everyone. The rest come with the paid handbook.</p>}
      </div>
      <div className="hb-home-groups">
        {BANDS.map(band => (
          <div key={band.key} className="hb-home-group">
            <div className="hb-home-group-label">
              <p className="hb-home-eyebrow">{band.eyebrow}</p>
              <h3>{band.name}</h3>
            </div>
            <ul className="hb-home-rows" role="list">
              {band.rows.map(row => {
                const isLocked = free && locked.includes(row.id);
                const isOpen = !locked.includes(row.id);
                return (
                  <li key={row.id} className="hb-home-row">
                    <Link className={isLocked ? 'hb-home-row-link hb-home-locked' : 'hb-home-row-link'} href={pageHref(row.id)}>
                      <span className="hb-home-row-num">{row.num}</span>
                      <span className="hb-home-row-title">{row.title}</span>
                      {isLocked && <MembersOnlyText />}
                      {isOpen && tracking && read[row.id]
                        ? <span className="hb-home-read"><span aria-hidden="true">✓</span><span className="visually-hidden"> read</span></span>
                        : free && isOpen && <FreePill />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
