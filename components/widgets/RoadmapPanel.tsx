'use client';

import { useEffect, useState } from 'react';
import { parseIso } from '@/lib/dates';
import { downloadIcs } from '@/lib/ics';
import { roadmapEvents, roadmapStatus } from '@/lib/plan';
import { setRoadmapStart, useHandbookState, widgetOf } from '@/lib/state';
import { InteractiveHeader } from './InteractiveHeader';

// `roadmapStatus` ignores its date when no start is saved, so this sentence is the same on the server and the client.
const UNDATED_STATUS = roadmapStatus(null, new Date(0));

// Day 1 picker and calendar export above the Figure 7 checklists. The phase dates beside each checklist title
// are drawn by Checklists, which owns the ticks.
export function RoadmapPanel({ items }: { items: readonly (readonly string[])[] }) {
  const saved = widgetOf(useHandbookState(), 'roadmap');
  const iso = typeof saved.start === 'string' ? saved.start : '';
  const start = parseIso(iso);
  // The day count uses the reader's calendar day, so it is read after mount and stays out of the server HTML.
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => { setToday(new Date()); }, []);
  return (
    <>
      <InteractiveHeader hint="Set your Day 1 to put dates on each phase, tick milestones as you finish them, and add the reviews to your calendar." widgetKey="roadmap" label="90-day roadmap" />
      <div className="roadmap-panel iw">
        <label className="cost-field">
          Day 1 (your start date)
          <input type="date" className="calc-input" value={iso} onChange={e => setRoadmapStart(e.target.value)} />
        </label>
        <p className="roadmap-status" aria-live="polite">{start ? (today ? roadmapStatus(start, today) : null) : UNDATED_STATUS}</p>
        <div className="script-actions">
          <button type="button" className="btn-mini" disabled={!start} onClick={() => { if (start) downloadIcs('handbook-90-day-plan.ics', roadmapEvents(start, items)); }}>
            Add reviews and milestones to my calendar (.ics)
          </button>
        </div>
        <p className="calc-note">Monthly reviews land on the first weekday of each month. Move one if it falls on a holiday.</p>
      </div>
    </>
  );
}
