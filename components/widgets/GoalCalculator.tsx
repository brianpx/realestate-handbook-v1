'use client';

import { useRef, useState, type ReactNode } from 'react';
import { GOAL_CAPTION, GOAL_HEADINGS, GOAL_ROWS } from '@/content/data/goal';
import { CALC_DEFAULTS, CALC_SCENARIOS, fmtNum, fmtPerDay, goalPlan, goalVerdict, WORKDAYS_PER_WEEK, type GoalInputs } from '@/lib/goal';
import { setCalc, useHandbookState } from '@/lib/state';
import { AmountInput } from './AmountInput';
import { InteractiveHeader } from './InteractiveHeader';

type Key = keyof GoalInputs;

const numberAt = (data: Record<string, unknown>, key: Key): number | undefined => {
  const v = data[key];
  return typeof v === 'number' ? v : undefined;
};

export function GoalCalculator() {
  const { calc } = useHandbookState();
  const [factor, setFactor] = useState<number>(1);
  // Defaults fill apc, cpa and weeks until the reader clears one; the static site re-applied them on the next load.
  const [cleared, setCleared] = useState<ReadonlySet<Key>>(new Set());
  const dialogRef = useRef<HTMLDialogElement>(null);

  const read = (key: Key): number | undefined => {
    if (cleared.has(key)) return undefined;
    return numberAt(calc, key) ?? (key in CALC_DEFAULTS ? CALC_DEFAULTS[key as keyof typeof CALC_DEFAULTS] : undefined);
  };
  const inputs: GoalInputs = { goal: read('goal'), commission: read('commission'), apc: read('apc'), cpa: read('cpa'), weeks: read('weeks') };
  const asEntered = goalPlan(inputs, 1);
  const shown = goalPlan(inputs, factor);

  const field = (rowIdx: number, key: Key, o: { prefix?: string; placeholder: string; min: number; max?: number }): ReactNode => (
    <>
      <span className="calc-field">
        {o.prefix && <span className="calc-prefix">{o.prefix}</span>}
        <AmountInput
          label={GOAL_ROWS[rowIdx]!.step}
          value={read(key)}
          min={o.min}
          max={o.max}
          placeholder={o.placeholder}
          format={o.prefix ? fmtNum : undefined}
          onValue={n => {
            setCleared(prev => {
              const next = new Set(prev);
              if (n === undefined) next.add(key); else next.delete(key);
              return next;
            });
            setCalc(key, n);
          }}
        />
      </span>
    </>
  );
  const openNote = () => dialogRef.current?.showModal();

  return (
    <>
      <InteractiveHeader
        hint={'Type your own numbers in the "Your number" column. Your daily target appears below the table and saves on this device.'}
        widgetKey="goal-calculator"
        label="Income goal calculator"
      />
      <div className="table-wrapper">
        <table>
          <caption>{GOAL_CAPTION}</caption>
          <thead>
            <tr>{GOAL_HEADINGS.map(h => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {GOAL_ROWS.map((row, i) => (
              <tr key={row.step}>
                <th scope="row">{row.step}</th>
                <td>{row.example}</td>
                <td>
                  {i === 0 && field(0, 'goal', { prefix: '$', placeholder: '80,000', min: 1 })}
                  {i === 1 && field(1, 'commission', { prefix: '$', placeholder: '6,500', min: 1 })}
                  {i === 2 && (shown ? fmtNum(shown.closings) : '—')}
                  {i === 3 && field(3, 'apc', { placeholder: '3', min: 0.1 })}
                  {i === 3 && <div className="calc-sub">{shown ? `= ${fmtNum(shown.appts)} appointments` : ''}</div>}
                  {i === 4 && field(4, 'cpa', { placeholder: '20', min: 0.1 })}
                  {i === 4 && <div className="calc-sub">{shown ? `≈ ${fmtNum(shown.convs)} conversations` : ''}</div>}
                  {i === 5 && field(5, 'weeks', { placeholder: '48', min: 1, max: 52 })}
                  {i === 6 && (shown ? `≈ ${fmtNum(shown.perWeek)}` : '—')}
                  {i === 7 && (shown ? fmtPerDay(shown.perDay) : '—')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="footnote">
        <sup>
          <button type="button" className="footnote-ref" aria-haspopup="dialog" aria-label="Footnote: how these numbers were derived" onClick={openNote}>1</button>
        </sup>{' '}
        How these numbers were derived, and what they assume.{' '}
        <button type="button" className="link-btn" aria-haspopup="dialog" onClick={openNote}>Read the footnote</button>
      </p>
      <dialog
        ref={dialogRef}
        className="note-dialog"
        id="calc-footnote"
        aria-labelledby="calc-footnote-title"
        // a click on the backdrop targets the dialog itself
        onClick={e => { if (e.target === dialogRef.current || (e.target as Element).closest('[data-close-note]')) dialogRef.current?.close(); }}
      >
        <div className="note-dialog-head">
          <div>
            <span className="note-dialog-eyebrow">Footnote 1</span>
            <h3 id="calc-footnote-title">How the example numbers were derived</h3>
          </div>
          <button type="button" className="note-dialog-close" aria-label="Close footnote" data-close-note>×</button>
        </div>
        <div className="note-dialog-body">
        <p className="note-dialog-lede">Each row feeds the next. Using the example goal of $80,000:</p>
        <h5 className="note-dialog-section">Derivation</h5>
        <ol>
          <li><strong>Closings:</strong> $80,000 ÷ $6,500 = 12.3, rounded <em>up</em> to 13, because you cannot close part of a sale.</li>
          <li><strong>Appointments:</strong> 13 closings × 3 appointments per closing = 39.</li>
          <li><strong>Conversations:</strong> 39 appointments × 20 conversations per appointment = 780.</li>
          <li><strong>Per week:</strong> 780 ÷ 48 working weeks = 16.25, shown as about 16.</li>
          <li><strong>Per day:</strong> 16.25 ÷ {WORKDAYS_PER_WEEK} working days = 3.25, shown as 3 to 4.</li>
        </ol>
        <h5 className="note-dialog-section">Assumptions</h5>
        <ul>
          <li>The income goal and the $6,500 average are both what you keep from a closed side <em>after</em> your broker split. Business expenses and taxes are not subtracted, so set your goal with those in mind.</li>
          <li>Three appointments per closing and 20 conversations per appointment are rules of thumb for a new agent, blended across lead sources. They are not measured results. Your own ratios will differ and should replace these as soon as you have a few months of data.</li>
          <li>48 working weeks is 52 less about four for vacation, holidays and illness. A working week is {WORKDAYS_PER_WEEK} days.</li>
          <li>Every closing is assumed to come from the work counted here. Referrals and repeat clients would lower the conversations you need.</li>
          <li>Closings trail conversations by roughly 60 to 120 days, so income lags the work.</li>
        </ul>
        </div>
        <div className="note-dialog-foot">
          <p>Change any input in the table and the whole ladder recalculates with your numbers.</p>
          <button type="button" className="note-dialog-done" data-close-note>Got it</button>
        </div>
      </dialog>
      <aside className="box try-it calc-panel iw">
        <h3 className="box-title">● CALCULATOR · YOUR DAILY TARGET</h3>
        <div className="calc-stats" role="status">
          {shown ? (
            <>
              <Stat value={fmtNum(shown.closings)} label={shown.closings === 1 ? 'closing needed' : 'closings needed'} />
              <Stat value={fmtNum(shown.perWeek)} label="conversations a week" />
              <Stat value={fmtPerDay(shown.perDay)} label="conversations a day" />
            </>
          ) : (
            <p className="calc-empty">Enter your income goal and average commission in the table above to see your daily conversation target.</p>
          )}
        </div>
        <p className="calc-verdict">{shown && asEntered ? goalVerdict(shown, factor, asEntered) : ''}</p>
        <div className="calc-stress">
          <span className="calc-stress-label">Stress test: what if it takes more work than the example?</span>
          <div className="script-actions" role="group" aria-label="Stress test">
            {CALC_SCENARIOS.map(s => (
              <button key={s.label} type="button" className="btn-mini" aria-pressed={s.factor === factor} onClick={() => setFactor(s.factor)}>{s.label}</button>
            ))}
          </div>
        </div>
        <p className="calc-note">
          Conversations are real two-way talks. A working week is counted as {WORKDAYS_PER_WEEK} days. Closings lag conversations by roughly 60 to 120 days, so judge yourself on the conversations.
        </p>
      </aside>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="calc-stat">
      <div className="calc-stat-value">{value}</div>
      <div className="calc-stat-label">{label}</div>
    </div>
  );
}

