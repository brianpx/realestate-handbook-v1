'use client';

import { useEffect, useState } from 'react';
import { isoDate, nextMonday, parseIso } from '@/lib/dates';
import { downloadIcs } from '@/lib/ics';
import { fmtClock, planBlocks, plannerVerdict, TIMEBLOCK_DEFAULTS, timeblockEvents, WEEKDAY_NAMES, type TimeblockCfg } from '@/lib/plan';
import { setTimeblock, useHandbookState, widgetOf } from '@/lib/state';
import { InteractiveHeader } from './InteractiveHeader';

function readCfg(saved: Record<string, unknown>): TimeblockCfg {
  const d = TIMEBLOCK_DEFAULTS;
  return {
    start: typeof saved.start === 'string' && saved.start ? saved.start : d.start,
    endOfDay: typeof saved.endOfDay === 'string' && saved.endOfDay ? saved.endOfDay : d.endOfDay,
    followUps: typeof saved.followUps === 'number' ? saved.followUps : d.followUps,
    prospecting: typeof saved.prospecting === 'number' ? saved.prospecting : d.prospecting,
    days: Array.isArray(saved.days) ? saved.days.filter((x): x is number => typeof x === 'number') : [...d.days],
    friday: typeof saved.friday === 'boolean' ? saved.friday : d.friday,
  };
}

export function TimeBlockPlanner() {
  const cfg = readCfg(widgetOf(useHandbookState(), 'timeblock'));
  // "next Monday" depends on today's date, so it is set after mount to keep the server HTML the same for everyone
  const [week, setWeek] = useState('');
  useEffect(() => { setWeek(isoDate(nextMonday())); }, []);

  const { blocks, start, eod, valid } = planBlocks(cfg);
  const verdict = plannerVerdict(cfg);
  const set = (patch: Partial<TimeblockCfg>) => setTimeblock({ ...cfg, ...patch });

  return (
    <aside className="box try-it iw">
      <h3 className="box-title">● PLANNER · YOUR WEEKLY TIME BLOCKS</h3>
      <InteractiveHeader
        hint="Set your own start time and block lengths, check that lead generation lands before noon, then add the blocks to your calendar."
        widgetKey="timeblock-planner"
        label="Weekly time-block planner"
      />
      <div className="planner-controls">
        <label className="cost-field">
          Day starts
          <input type="time" className="calc-input" value={cfg.start} onChange={e => { if (e.target.value) set({ start: e.target.value }); }} />
        </label>
        <label className="cost-field">
          End-of-day CRM update
          <input type="time" className="calc-input" value={cfg.endOfDay} onChange={e => { if (e.target.value) set({ endOfDay: e.target.value }); }} />
        </label>
        <label className="cost-field">
          Follow-up tasks (45 to 60 min)
          <input type="range" min={45} max={60} step={5} value={cfg.followUps} onChange={e => set({ followUps: Number(e.target.value) })} />
        </label>
        <output className="alloc-out">{cfg.followUps} min</output>
        <label className="cost-field">
          Prospecting (60 to 90 min)
          <input type="range" min={60} max={90} step={5} value={cfg.prospecting} onChange={e => set({ prospecting: Number(e.target.value) })} />
        </label>
        <output className="alloc-out">{cfg.prospecting} min</output>
      </div>
      <fieldset className="planner-days">
        <legend>Days to block</legend>
        {[1, 2, 3, 4, 5].map(day => (
          <label key={day} className="opt-item">
            <input
              type="checkbox"
              checked={cfg.days.includes(day)}
              onChange={e => set({ days: [1, 2, 3, 4, 5].filter(x => (x === day ? e.target.checked : cfg.days.includes(x))) })}
            />
            <span>{WEEKDAY_NAMES[day]}</span>
          </label>
        ))}
      </fieldset>
      <label className="opt-item">
        <input type="checkbox" checked={cfg.friday} onChange={e => set({ friday: e.target.checked })} />
        <span>Add a 30-minute pipeline review after Friday prospecting</span>
      </label>
      <div className="alloc-bar planner-bar" role="img" aria-label={`Day from ${fmtClock(start)} to ${fmtClock(eod + 15)}`}>
        {blocks.filter(b => b.mins).map(b => <span key={b.cls} className={`alloc-seg pseg-${b.cls}`} style={{ flexGrow: b.mins }} />)}
      </div>
      <ul className="planner-legend">
        {blocks.filter(b => b.mins).map(b => <li key={b.cls} className={`pleg-${b.cls}`}>{fmtClock(b.from)}: {b.name} ({b.mins} min)</li>)}
      </ul>
      <p className={`alloc-verdict ${verdict.ok ? 'ok' : 'no'}`} aria-live="polite">{verdict.text}</p>
      <label className="cost-field">
        Start the week of
        <input type="date" className="calc-input" value={week} onChange={e => setWeek(e.target.value)} />
      </label>
      <div className="script-actions">
        <button
          type="button"
          className="btn-mini"
          disabled={!valid || cfg.days.length === 0}
          onClick={() => downloadIcs('handbook-weekly-time-blocks.ics', timeblockEvents(cfg, parseIso(week) ?? nextMonday()))}
        >
          Add these blocks to my calendar (.ics, 12 weeks)
        </button>
      </div>
    </aside>
  );
}
