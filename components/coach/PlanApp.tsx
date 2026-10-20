'use client';

import { useEffect, useState } from 'react';
import { useCoachState } from '@/lib/coach';
import { browserTimeZone, deriveConceptStates } from '@/lib/coach/actions';
import { localDate } from '@/lib/coach/dates';
import { buildDeck } from '@/lib/coach/review';
import { trackingProgress, useSettings } from '@/lib/state';
import { PlanSetup } from './PlanSetup';
import { TodayCard } from './TodayCard';

export function PlanApp() {
  const tracking = trackingProgress(useSettings());
  const state = useCoachState();
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);
  useEffect(() => setMounted(true), []); // today and the time zone are browser-only, so wait for the client

  if (!tracking) {
    return <div className="box"><p>Your plan needs progress tracking, which is off in Settings. Turn it on and the plan, and what you finish, will be saved on this device.</p></div>;
  }
  if (!mounted) return <p aria-live="polite">Loading your plan…</p>;

  const tz = state.plan?.tz ?? browserTimeZone();
  const today = localDate(new Date(), tz);

  if (!state.plan || state.plan.sessions.length === 0 || editing) {
    return <PlanSetup today={today} tz={tz} onDone={() => setEditing(false)} />;
  }
  const deck = buildDeck(deriveConceptStates(state, tz), state.attempts, today);
  return (
    <TodayCard
      plan={state.plan}
      completions={state.completions}
      today={today}
      dueForReview={deck.items.length + deck.deferred}
      onEdit={() => setEditing(true)}
    />
  );
}
