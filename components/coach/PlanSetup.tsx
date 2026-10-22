'use client';

import { useMemo, useState } from 'react';
import { applyPlan, useCoachState } from '@/lib/coach';
import { PACES, buildPlan, reflow, type Pace, type PlanInput } from '@/lib/coach/plan';
import { formatDay, warningText } from '@/lib/coach/today';

const PACE_OPTIONS: { value: Pace; label: string }[] = [
  { value: 'sprint', label: '2-week sprint (nearly every day)' },
  { value: 'default', label: '4-week plan (recommended)' },
  { value: 'relaxed', label: '8-week, relaxed (a couple of days a week)' },
];
// Monday first; the numbers are JavaScript weekdays (0 = Sunday).
const DAYS: { value: number; label: string }[] = [
  { value: 1, label: 'Mon' }, { value: 2, label: 'Tue' }, { value: 3, label: 'Wed' }, { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' }, { value: 6, label: 'Sat' }, { value: 0, label: 'Sun' },
];

// Start the plan, or change the pace and study days of the one in progress. Shows the dates it would produce, and any
// warning, before anything is saved.
export function PlanSetup({ today, tz, onDone }: { today: string; tz: string; onDone: () => void }) {
  const { plan: existing, completions } = useCoachState();
  const editing = existing !== undefined && existing.sessions.length > 0;
  const [startDate, setStartDate] = useState(existing?.startDate ?? today);
  const [pace, setPace] = useState<Pace>(existing?.pace ?? 'default');
  const [studyDays, setStudyDays] = useState<number[]>(existing?.studyDays ?? [1, 2, 3, 4, 5]);

  const input: PlanInput = { startDate, pace, studyDays };
  const preview = useMemo(() => {
    if (studyDays.length === 0 || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return null;
    return editing ? reflow(input, existing.sessions, completions, today) : buildPlan(input);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, pace, studyDays, editing, existing?.sessions, completions, today]);

  const toggleDay = (day: number) => setStudyDays(d => (d.includes(day) ? d.filter(x => x !== day) : [...d, day]));

  return (
    <form
      className="box"
      onSubmit={e => {
        e.preventDefault();
        if (!preview) return;
        applyPlan({ ...input, tz }, today);
        onDone();
      }}
    >
      <h3 className="box-title">● {editing ? 'CHANGE YOUR PLAN' : 'START YOUR READING PLAN'}</h3>
      <p>One chapter per session: read it, do its exercise, then answer its questions. {editing ? 'Sessions you have finished stay where they are.' : ''}</p>

      {!editing && (
        <p>
          <label>
            Start date{' '}
            <input type="date" className="calc-input" value={startDate} min={today} onChange={e => setStartDate(e.target.value)} required />
          </label>
        </p>
      )}

      <fieldset className="quiz-item">
        <legend className="cp-q">How fast?</legend>
        {PACE_OPTIONS.map(o => (
          <label key={o.value} className="opt-item">
            <input type="radio" name="pace" checked={pace === o.value} onChange={() => setPace(o.value)} />
            <span>{o.label}</span>
          </label>
        ))}
        <p className="quiz-sentence">This pace needs up to {PACES[pace].perWeek} study days a week.</p>
      </fieldset>

      <fieldset className="quiz-item">
        <legend className="cp-q">Which days can you study?</legend>
        <div className="script-actions">
          {DAYS.map(d => (
            <label key={d.value} className="opt-item">
              <input type="checkbox" checked={studyDays.includes(d.value)} onChange={() => toggleDay(d.value)} />
              <span>{d.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="quiz-item" aria-live="polite">
        <div className="cp-q">Your schedule</div>
        {!preview && <p>Choose at least one study day to see your schedule.</p>}
        {preview && (
          <>
            <p>
              {preview.sessions.length} sessions, {formatDay(preview.sessions[0]!.date)} to <strong>{formatDay(preview.endDate)}</strong>.
            </p>
            {preview.warnings.map(w => <p key={w.code}><strong>Heads up:</strong> {warningText(w)}</p>)}
          </>
        )}
      </div>

      <div className="script-actions">
        <button type="submit" className="btn-mini" disabled={!preview}>{editing ? 'Save changes' : 'Start my plan'}</button>
        {editing && <button type="button" className="btn-mini" onClick={onDone}>Cancel</button>}
      </div>
    </form>
  );
}
