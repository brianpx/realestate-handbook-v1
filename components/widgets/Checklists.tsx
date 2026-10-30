'use client';

import { Fragment, useEffect, useState } from 'react';
import { CHECKLISTS } from '@/content/data/checklists';
import { essentialOnly, setCheck, useHandbookState, useSettings, widgetOf } from '@/lib/state';
import { parseIso } from '@/lib/dates';
import { phaseSummary, ROADMAP_PHASES } from '@/lib/plan';
import { InteractiveHeader } from './InteractiveHeader';
import { RoadmapPanel } from './RoadmapPanel';

// Check keys are `${list id}:${index}`, the same as the static site wrote, so saved ticks carry over.
// With "Essential tools only" on this tool is not built (as before): the lists show as plain, unsaved checkboxes.
export function Checklists({ page }: { page: string }) {
  const config = CHECKLISTS[page];
  const state = useHandbookState();
  const { checks } = state;
  const plain = essentialOnly(useSettings());
  // The reader's calendar day is not the server's, so phase dates wait until after mount and the first client render matches the HTML.
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => { setToday(new Date()); }, []);
  if (!config) return null;
  // Chapter 12's three lists are the Figure 7 roadmap: they carry the Day 1 picker and a dated summary on each title.
  const roadmap = page === 'ch12' && !plain && config.groups.length === ROADMAP_PHASES.length;
  const roadmapStart = parseIso(typeof widgetOf(state, 'roadmap').start === 'string' ? (widgetOf(state, 'roadmap').start as string) : undefined);
  const Title = config.titleTag;
  const titleClass = config.titleTag === 'h3' ? 'checklist-title' : undefined;

  const counts = config.groups.map(g => g.items.filter((_, i) => checks[`${g.id}:${i}`] === true).length);
  const done = counts.reduce((a, b) => a + b, 0);
  const total = config.groups.reduce((a, g) => a + g.items.length, 0);

  return (
    <>
      {roadmap && <RoadmapPanel items={config.groups.map(g => g.items)} />}
      {!plain && config.header && (
        <InteractiveHeader hint="Tap items to check them off. Your progress saves on this device." widgetKey="crm-checklists" label="CRM setup checklists" />
      )}
      {!plain && config.groups.length > 1 && (
        <p className="checklist-total" role="status">Overall: {done} of {total} complete ({Math.round((done / total) * 100)}%)</p>
      )}
      {config.groups.map((g, gi) => (
        <Fragment key={g.id}>
          <Title id={g.id} className={titleClass}>
            {g.title}
            {roadmap && roadmapStart && today && <span className="phase-dates">{phaseSummary(ROADMAP_PHASES[gi]!, roadmapStart, today, counts[gi]!, g.items.length)}</span>}
          </Title>
          <div className="checklist" data-checklist={g.id}>
            {g.items.map((item, i) => (
              <label key={i} className="check-item">
                {plain ? (
                  <input key="plain" type="checkbox" />
                ) : (
                  <input key="saved" type="checkbox" checked={checks[`${g.id}:${i}`] === true} onChange={e => setCheck(`${g.id}:${i}`, e.target.checked)} />
                )}
                <span>{item}</span>
              </label>
            ))}
            {!plain && (
              <div className="checklist-meter">
                <div className="meter-bar"><span className="checklist-fill" style={{ width: `${(counts[gi]! / g.items.length) * 100}%` }} /></div>
                <span className="checklist-count" role="status">{counts[gi]} of {g.items.length} complete</span>
              </div>
            )}
          </div>
        </Fragment>
      ))}
    </>
  );
}
