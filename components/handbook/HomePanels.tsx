'use client';

import Link from 'next/link';
import { NAV } from '@/lib/pages';
import { HANDBOOK } from '@/lib/routes';
import { readSetup, SETUP_STEPS, SETUP_WIDGET } from '@/lib/setup';
import { trackingProgress, useHandbookState, useSettings } from '@/lib/state';

const SECTIONS = NAV.flatMap(g => g.pages).filter(p => p.id !== 'cover');

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
