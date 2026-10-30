'use client';

import { useState } from 'react';
import { NURTURE_TOUCHES } from '@/content/data/nurture';
import { NURTURE_STATIC_HTML } from '@/content/data/nurture-static';
import { inZone, NURTURE_FILTERS, touchLabel, touchNote } from '@/lib/nurture';
import { InteractiveHeader } from './InteractiveHeader';
import { StaticFallback } from './StaticFallback';

const lastDay = NURTURE_TOUCHES[NURTURE_TOUCHES.length - 1]!.day;
const frontLoaded = NURTURE_TOUCHES.filter(t => t.day <= 14).length;
const W = 600;
const padX = 20;
const xDay = (d: number) => padX + (d / lastDay) * (W - padX * 2);
// touches on the same day stack upward so none hides another
const slots: Record<number, number> = {};
const dotSlot = NURTURE_TOUCHES.map(t => (slots[t.day] = (slots[t.day] ?? -1) + 1));

export function NurtureTimeline() {
  const [selected, setSelected] = useState(5);
  const [filter, setFilter] = useState(NURTURE_FILTERS[0]!);
  const t = NURTURE_TOUCHES[selected - 1]!;
  return (
    <>
      <StaticFallback html={NURTURE_STATIC_HTML} />
      <InteractiveHeader hint="Tap any touch to see what to send. Use the filters to highlight a channel." widgetKey="nurture-timeline" label="Nurture timeline explorer" />
      <div className="nurture-widget iw">
        <div className="nurture-filters" role="group" aria-label="Highlight touches">
          {NURTURE_FILTERS.map(f => (
            <button key={f.key} type="button" className="btn-mini" aria-pressed={f === filter} onClick={() => setFilter(f)}>{f.label}</button>
          ))}
        </div>
        <svg viewBox={`0 0 ${W} 90`} className="nurture-ruler" role="img" aria-label={`${frontLoaded} of ${NURTURE_TOUCHES.length} touches fall in the first 14 days of the 90-day plan`}>
          <rect x={xDay(0) - 8} y={14} width={xDay(14) - xDay(0) + 16} height={54} rx={6} className="nurture-front" />
          <text x={xDay(0) - 2} y={10} className="nurture-front-label">{frontLoaded} of {NURTURE_TOUCHES.length} touches in the first 14 days</text>
          <line x1={xDay(0)} y1={62} x2={xDay(lastDay)} y2={62} className="nurture-axis" />
          {NURTURE_TOUCHES.map((touch, i) => (
            <circle
              key={touch.n}
              className={`nurture-dot${touch.value ? ' value' : ''}${touch.n === selected ? ' selected' : ''}${filter.test(touch) ? '' : ' dim'}`}
              data-n={touch.n}
              cx={xDay(touch.day)}
              cy={34 + dotSlot[i]! * 14}
              r={touch.value ? 6.5 : 5}
            />
          ))}
          {[0, 14, 30, 60, 90].map(d => <text key={d} x={xDay(d)} y={82} textAnchor="middle" className="nurture-tick">Day {d}</text>)}
        </svg>
        <div className="nurture-touches" role="group" aria-label="Touches in the 90-day plan">
          {NURTURE_TOUCHES.map(touch => (
            <button
              key={touch.n}
              type="button"
              data-n={touch.n}
              className={`touch-btn${inZone(touch) ? ' in-zone' : ''}${touch.value ? ' value' : ''}${filter.test(touch) ? '' : ' dim'}`}
              aria-label={touchLabel(touch)}
              aria-pressed={touch.n === selected}
              onClick={() => setSelected(touch.n)}
            >
              <span className="touch-num">{touch.n}</span>
              <span className="touch-ch">{touch.label}</span>
              <span className="touch-day">Day {touch.day}</span>
            </button>
          ))}
        </div>
        <p className="nurture-legend">
          Shaded, heavy-bordered touches (5 to 12) are where the handbook says most conversions happen. Touch 2 is where most new agents stop. Touches marked <strong>Value</strong> (amber underline, larger dot) give before they ask.
        </p>
        <div className="nurture-detail" aria-live="polite">
          <div className="nurture-head">
            <strong>Touch {t.n} of {NURTURE_TOUCHES.length} · Day {t.day}</strong>
            <span className="nurture-tags">
              {[t.label, t.role, t.value ? 'Value touch' : null].filter(Boolean).map(x => <span key={x} className="nurture-tag">{x}</span>)}
            </span>
          </div>
          <p><strong>In the plan (Appendix B.1): </strong>{t.plan}</p>
          <p className="nurture-sample"><strong>Sample wording: </strong>&quot;{t.sample}&quot;</p>
          <p className="nurture-note">{touchNote(t)}</p>
          <div className="script-actions">
            <button type="button" className="btn-mini" disabled={selected === 1} onClick={() => setSelected(selected - 1)}>← Previous touch</button>
            <button type="button" className="btn-mini" disabled={selected === NURTURE_TOUCHES.length} onClick={() => setSelected(selected + 1)}>Next touch →</button>
          </div>
        </div>
      </div>
    </>
  );
}
