'use client';

import { useState } from 'react';
import { fmtMoney, fmtNum } from '@/lib/format';
import { callFlag, PIPELINE_TYPES, pipelineStats, QUIET_DAYS, type PipelineRow } from '@/lib/pipeline';
import { updatePipelineRows, useHandbookState, widgetOf } from '@/lib/state';
import { AmountInput } from './AmountInput';
import { InteractiveHeader } from './InteractiveHeader';

const num = (v: unknown): number | undefined => (typeof v === 'number' ? v : undefined);

export function PipelineCalculator() {
  const saved = widgetOf(useHandbookState(), 'pipeline');
  const raw = (Array.isArray(saved.rows) && saved.rows.length ? saved.rows : [{}]) as Record<string, unknown>[];
  const rows: PipelineRow[] = raw.map(r => ({
    name: typeof r.name === 'string' ? r.name : undefined,
    type: typeof r.type === 'string' ? r.type : undefined,
    commission: num(r.commission),
    days: num(r.days),
    next: r.next === true,
  }));
  // removing a contact shifts the rows after it, so the row inputs remount to drop any text typed into them
  const [generation, setGeneration] = useState(0);
  const { value, active, calls } = pipelineStats(rows);

  const patch = (i: number, p: Record<string, unknown>) => updatePipelineRows(list => {
    const row = (list[i] ??= {});
    for (const [k, v] of Object.entries(p)) { if (v === undefined) delete row[k]; else row[k] = v; }
  });

  return (
    <aside className="box try-it iw">
      <h3 className="box-title">● CALCULATOR · YOUR PIPELINE VALUE</h3>
      <InteractiveHeader
        hint="List your contacts to total your pipeline value and see who needs a Monday call. Use initials if you prefer. Saved on this device only."
        widgetKey="pipeline-calculator"
        label="Pipeline value calculator"
      />
      <div className="calc-stats" role="status">
        <Stat value={fmtMoney(value)} label="pipeline value" />
        <Stat value={String(active)} label={`active ${active === 1 ? 'opportunity' : 'opportunities'} (aim for 5+ by day 90)`} />
        <Stat value={String(calls)} label={`${calls === 1 ? 'contact needs' : 'contacts need'} a Monday call`} />
      </div>
      <div className="pipe-rows">
        {rows.map((row, i) => (
          <fieldset key={`${generation}-${i}`} className="pipe-row">
            <legend>Contact {i + 1}</legend>
            <label className="cost-field">
              Contact (initials ok)
              <input type="text" className="calc-input pipe-name" maxLength={40} value={row.name ?? ''} onChange={e => patch(i, { name: e.target.value })} />
            </label>
            <label className="cost-field">
              Type
              <select className="calc-input" value={row.type ?? PIPELINE_TYPES[0]} onChange={e => patch(i, { type: e.target.value })}>
                {PIPELINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="cost-field">
              Likely commission ($)
              <AmountInput value={row.commission} format={fmtNum} onValue={n => patch(i, { commission: n })} />
            </label>
            <label className="cost-field">
              Days since a real conversation
              <AmountInput value={row.days} onValue={n => patch(i, { days: n })} />
            </label>
            <label className="opt-item">
              <input type="checkbox" checked={row.next === true} onChange={e => patch(i, { next: e.target.checked })} />
              <span>Next step scheduled</span>
            </label>
            <div className={`pipe-flag${callFlag(row) ? ' is-flag' : ''}`}>{callFlag(row)}</div>
            <button
              type="button"
              className="btn-mini"
              aria-label={`Remove contact ${i + 1}`}
              onClick={() => { updatePipelineRows(list => { list.splice(i, 1); }); setGeneration(g => g + 1); }}
            >
              Remove
            </button>
          </fieldset>
        ))}
      </div>
      <div className="script-actions">
        <button type="button" className="btn-mini" onClick={() => updatePipelineRows(list => { list.push({}); })}>+ Add a contact</button>
      </div>
      <p className="calc-note">
        Pipeline value is the sum of likely commission across active opportunities. A contact with no real two-way conversation in {QUIET_DAYS} days and no scheduled next step gets a call on Monday (Chapter 5).
      </p>
    </aside>
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
