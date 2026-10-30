'use client';

import Link from 'next/link';
import { checkpointConfident, rollupText } from '@/lib/checkpoints';
import { NAV } from '@/lib/pages';
import { HANDBOOK, pageHref } from '@/lib/routes';
import { readSetup, SETUP_STEPS, SETUP_WIDGET } from '@/lib/setup';
import { trackingProgress, useHandbookState, useSettings } from '@/lib/state';

const SECTIONS = NAV.flatMap(g => g.pages).filter(p => p.id !== 'cover');

// Where a returning reader picks up. Everything here comes from what this browser has saved; until it has loaded
// (and for a first-time reader) the panel shows the plain first step.
export function ContinuePanel() {
  const { read, widgets } = useHandbookState();
  const settings = useSettings();
  const setup = readSetup(widgets[SETUP_WIDGET] ?? {});
  const tracking = trackingProgress(settings);
  const done = SECTIONS.filter(p => read[p.id]).length;
  const nextUnread = SECTIONS.find(p => !read[p.id]);
  const started = Boolean(widgets[SETUP_WIDGET]);

  return (
    <section className="hb-continue" aria-labelledby="continueTitle">
      <h2 id="continueTitle">{started || done > 0 ? 'Pick up where you left off' : 'New here? Start with your first session'}</h2>
      {!started && done === 0 && (
        <p>The guided setup takes you from an income goal to a daily conversation target, two lead sources and a scheduled first week.</p>
      )}
      {started && !setup.completedAt && <p>Your setup is at step {setup.step + 1} of {SETUP_STEPS.length}: {SETUP_STEPS[setup.step]!.label.toLowerCase()}.</p>}
      {started && setup.completedAt && <p>Your first-week plan is saved. You can reopen it and revise any step.</p>}
      {tracking && done > 0 && <p>{done} of {SECTIONS.length} sections read. {rollupText(checkpointConfident(widgets.checkpoints))}</p>}
      {!tracking && <p>Progress tracking is off in Settings, so reading progress is not being recorded.</p>}
      <div className="hb-actions">
        <Link className="btn-nav hb-primary" href={`${HANDBOOK}/start`}>{started && !setup.completedAt ? 'Continue your setup' : started ? 'Review your setup' : 'Start here'}</Link>
        {tracking && nextUnread && done > 0 && <Link className="btn-mini" href={pageHref(nextUnread.id)}>Continue reading: {nextUnread.label}</Link>}
      </div>
    </section>
  );
}

export function ChapterList() {
  const { read } = useHandbookState();
  const tracking = trackingProgress(useSettings());
  return (
    <div className="hb-chapters">
      {NAV.filter(g => g.pages.some(p => p.id !== 'cover')).map(g => (
        <div key={g.part ?? 'top'} className="hb-part">
          {g.part && <h3>{g.part}</h3>}
          <ul>
            {g.pages.filter(p => p.id !== 'cover').map(p => (
              <li key={p.id}>
                <Link href={pageHref(p.id)}>{p.label}</Link>
                {tracking && read[p.id] && <span className="hb-read"> <span aria-hidden="true">✓</span><span className="visually-hidden">read</span></span>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
