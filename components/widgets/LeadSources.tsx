'use client';

import { LEAD_SOURCES } from '@/content/data/lead-sources';
import { fmtNum } from '@/lib/format';
import { setSourceField, setSourceRate, useHandbookState, widgetOf } from '@/lib/state';
import { sourceResults, sourceSummary, type SourceRow } from '@/lib/sources';
import { AmountInput } from './AmountInput';
import { InteractiveHeader } from './InteractiveHeader';

const SCALE = 30;
const num = (v: unknown): number | undefined => (typeof v === 'number' ? v : undefined);

export function LeadSources() {
  const saved = widgetOf(useHandbookState(), 'sourceCost');
  const rate = num(saved.rate);
  const rowsData = (saved.rows && typeof saved.rows === 'object' ? saved.rows : {}) as Record<string, Record<string, unknown>>;
  const rows: Record<string, SourceRow> = Object.fromEntries(
    LEAD_SOURCES.map(s => [s.key, { spend: num(rowsData[s.key]?.spend), hours: num(rowsData[s.key]?.hours), closings: num(rowsData[s.key]?.closings) }]),
  );
  const results = sourceResults(rows, rate ?? 0);

  return (
    <div className="box try-it iw">
      <div className="box-title">● EXPLORE · COMPARE YOUR LEAD SOURCES</div>
      <InteractiveHeader
        hint="See the typical conversion ranges side by side, then enter your own spend, time and closings to find your cost per closed deal."
        widgetKey="lead-sources"
        label="Lead source comparison"
      />
      <div className="range-chart">
        <h4 className="lab-title">Illustrative ranges (Figure 2). Not comparable across sources.</h4>
        {LEAD_SOURCES.map(s => (
          <div key={s.key} className="range-row">
            <span className="range-name">{s.name}</span>
            <span className="range-track">
              <span className={`range-fill${s.open ? ' is-open' : ''}`} style={{ left: `${(s.lo / SCALE) * 100}%`, width: `${((s.hi - s.lo) / SCALE) * 100}%` }} />
            </span>
            <span className="range-label">{s.label}</span>
          </div>
        ))}
        <div className="range-axis">{['0%', '10%', '20%', '30%+'].map(t => <span key={t}>{t}</span>)}</div>
        <p className="calc-note">Illustrative only. These ranges are not the same unit and are not a measured conversion rate. Use your cost per closed deal, below, for a number you can compare.</p>
      </div>
      <div className="cost-calc">
        <h4 className="lab-title">Your cost per closed deal</h4>
        <p>Pick a period (a month or a quarter) and use the same one for every source. Time counts: it is priced at a rate you choose.</p>
        <label className="cost-rate">
          Value of your time, $ per hour{' '}
          <AmountInput value={rate} format={fmtNum} placeholder="25" onValue={setSourceRate} />
        </label>
        <div className="cost-rows">
          {LEAD_SOURCES.map((s, i) => (
            <fieldset key={s.key} className="cost-row">
              <legend>{s.name}</legend>
              {([['spend', 'Money spent ($)', fmtNum], ['hours', 'Hours spent', undefined], ['closings', 'Closings', undefined]] as const).map(([field, text, format]) => (
                <label key={field} className="cost-field">
                  {text}
                  <AmountInput value={rows[s.key]![field]} format={format} onValue={n => setSourceField(s.key, field, n)} />
                </label>
              ))}
              <div className="cost-out" aria-live="polite">{results[i]!.text}</div>
            </fieldset>
          ))}
        </div>
        <p className="cost-summary" aria-live="polite">{sourceSummary(results, rate ?? 0)}</p>
      </div>
    </div>
  );
}

