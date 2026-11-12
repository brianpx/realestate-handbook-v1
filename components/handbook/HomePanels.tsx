'use client';

import { ArrowRightIcon, CircleCheckIcon, LockIcon } from 'lucide-react';
import Link from 'next/link';
import { CHECKPOINT_TOTAL } from '@/content/data/checkpoints';
import { PageLabel } from '@/components/shell/PageLabel';
import { checkpointConfident } from '@/lib/checkpoints';
import { labelParts, NAV, partParts, type PageEntry } from '@/lib/pages';
import { HANDBOOK, pageHref } from '@/lib/routes';
import { readSetup, SETUP_STEPS, SETUP_WIDGET } from '@/lib/setup';
import { trackingProgress, useHandbookState, useSettings } from '@/lib/state';

const SECTIONS = NAV.flatMap(g => g.pages).filter(p => p.id !== 'cover');
// The reading order the hero button follows: the chapters and appendices. The overview has its own button beside it.
const CHAPTERS = SECTIONS.filter(p => labelParts(p.label));

/** "Chapter 7" or "Appendix B", for a button too short for the whole title. */
const shortName = (page: PageEntry): string => {
  const parts = labelParts(page.label);
  if (!parts) return page.label;
  return `${parts.before ? 'Appendix' : 'Chapter'} ${parts.mark}`;
};

// The two buttons under the title: the next chapter this reader can open and has not read, and the overview.
// `locked` lists the pages the reader's plan does not open.
export function HeroActions({ locked = [] }: { locked?: readonly string[] }) {
  const { read } = useHandbookState();
  const tracking = trackingProgress(useSettings());
  const open = CHAPTERS.filter(p => !locked.includes(p.id));
  const started = tracking && SECTIONS.some(p => read[p.id]);
  const next = tracking ? open.find(p => !read[p.id]) : open[0];
  return (
    <div className="hb-btns">
      {next && (
        <Link className="hb-btn hb-btn-primary" href={pageHref(next.id)}>
          {started ? 'Continue: ' : 'Read '}{shortName(next)}<ArrowRightIcon aria-hidden="true" />
        </Link>
      )}
      <Link className="hb-btn hb-btn-ghost" href={pageHref('pref')}>Handbook overview &amp; plan</Link>
    </div>
  );
}

// What this browser has saved, beside the title. Until it has loaded (and for a first-time reader) both meters are empty.
export function ProgressCard() {
  const { read, widgets } = useHandbookState();
  const tracking = trackingProgress(useSettings());
  const done = SECTIONS.filter(p => read[p.id]).length;
  const confident = checkpointConfident(widgets.checkpoints);
  return (
    <aside className="hb-progress" aria-label="Your progress">
      <p className="hb-kicker">Your progress</p>
      {tracking ? (
        <>
          <Meter label="Sections read" value={done} total={SECTIONS.length} />
          <Meter label="Checkpoints confident" value={confident} total={CHECKPOINT_TOTAL} />
          <p className="hb-fine">Saved in this browser on this device. <Link href="/account">Back it up or move it</Link></p>
        </>
      ) : (
        <p className="hb-fine">Progress tracking is off in Settings, so reading progress is not being recorded.</p>
      )}
    </aside>
  );
}

function Meter({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <div className="hb-meter">
      <div className="hb-meter-head"><span>{label}</span><b>{value} / {total}</b></div>
      <div className="hb-bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={value}>
        <span style={{ width: `${total ? Math.round((value / total) * 100) : 0}%` }} />
      </div>
    </div>
  );
}

// Where a member stands with the guided setup. Everything here comes from what this browser has saved; until it
// has loaded (and for a first-time reader) the panel shows the plain first step.
export function ContinuePanel() {
  const { read, widgets } = useHandbookState();
  const settings = useSettings();
  const setup = readSetup(widgets[SETUP_WIDGET] ?? {});
  const done = trackingProgress(settings) ? SECTIONS.filter(p => read[p.id]).length : 0;
  const started = Boolean(widgets[SETUP_WIDGET]);

  return (
    <section className="hb-continue" aria-labelledby="continueTitle">
      <div className="hb-continue-text">
        <h2 id="continueTitle">{started || done > 0 ? 'Pick up where you left off' : 'New here? Start with your first session'}</h2>
        {!started && <p>{done > 0 ? 'You have not done the guided setup yet. It' : 'The guided setup'} takes you from an income goal to a daily conversation target, two lead sources and a scheduled first week.</p>}
        {started && !setup.completedAt && <p>Your setup is at step {setup.step + 1} of {SETUP_STEPS.length}: {SETUP_STEPS[setup.step]!.label.toLowerCase()}.</p>}
        {started && setup.completedAt && <p>Your first-week plan is saved. You can reopen it and revise any step.</p>}
      </div>
      <Link className="hb-btn hb-btn-ghost" href={`${HANDBOOK}/start`}>{started && !setup.completedAt ? 'Continue your setup' : started ? 'Review your setup' : 'Start here'}</Link>
    </section>
  );
}

const FRONT_MATTER = { eyebrow: 'Start here', name: 'Front matter' };

// Every page by part. `locked` lists the pages the reader's plan does not open; they still link, to the upsell card.
// A reader with locked pages also sees which ones are free.
export function ChapterList({ locked = [] }: { locked?: readonly string[] }) {
  const { read } = useHandbookState();
  const tracking = trackingProgress(useSettings());
  const partial = locked.length > 0;
  return (
    <section className="hb-chapters" aria-labelledby="chaptersTitle">
      <div className="hb-block-head">
        <h2 id="chaptersTitle">Chapters</h2>
        {partial && (
          <p className="hb-legend">
            <span><span className="hb-free">Free</span>Open to everyone</span>
            <span><LockIcon aria-hidden="true" />Members only</span>
          </p>
        )}
      </div>
      {NAV.map(group => {
        const { eyebrow, name } = group.part ? partParts(group.part) : FRONT_MATTER;
        return (
          <div key={group.part ?? 'top'} className="hb-part">
            <div className="hb-part-label">
              <p className="hb-kicker">{eyebrow}</p>
              <h3>{name}</h3>
            </div>
            <ul role="list">
              {group.pages.map(p => {
                const isLocked = locked.includes(p.id);
                const isRead = tracking && Boolean(read[p.id]) && !isLocked;
                return (
                  <li key={p.id}>
                    <Link className="hb-ch" href={pageHref(p.id)}>
                      <PageLabel label={p.label} />
                      {isLocked && <span className="hb-lock"><LockIcon aria-hidden="true" /><span className="visually-hidden"> (members only)</span></span>}
                      {isRead && <span className="hb-read"><CircleCheckIcon aria-hidden="true" /><span className="visually-hidden"> (read)</span></span>}
                      {partial && !isLocked && !isRead && <span className="hb-free">Free</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
