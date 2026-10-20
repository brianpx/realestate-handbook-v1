'use client';

import { useId, useState } from 'react';
import { SPEED_STATIC_HTML } from '@/content/data/speed';
import { SPEED_BANDS, SPEED_STOPS, speedBand } from '@/lib/speed';
import { InteractiveHeader } from './InteractiveHeader';
import { StaticFallback } from './StaticFallback';

const W = 360;
const H = 170;
const left = 24;
const right = W - 16;
const top = 28;
const bottom = 128;
const xAt = (i: number) => left + (i / (SPEED_STOPS.length - 1)) * (right - left);
const yAt = (v: number) => bottom - (v / 100) * (bottom - top);

// smooth curve through the stops: quadratic segments to each midpoint
const points = SPEED_STOPS.map((s, i) => [xAt(i), yAt(s.y)] as const);
const curve = (() => {
  let d = `M${points[0]![0]},${points[0]![1]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    d += ` Q${a[0]},${a[1]} ${(a[0] + b[0]) / 2},${(a[1] + b[1]) / 2}`;
  }
  const last = points[points.length - 1]!;
  return `${d} L${last[0]},${last[1]}`;
})();
// band edges sit halfway between the stops either side of 5 and 30 minutes
const edge1 = (xAt(1) + xAt(2)) / 2;
const edge2 = (xAt(4) + xAt(5)) / 2;

export function SpeedToLead() {
  const [i, setI] = useState(2);
  const sliderId = useId();
  const stop = SPEED_STOPS[i]!;
  const key = speedBand(stop.minutes);
  return (
    <>
      {/* The explorer replaces the three-band list; without JavaScript the list is all there is. */}
      <StaticFallback html={SPEED_STATIC_HTML} />
      <InteractiveHeader hint="Drag the slider to see where your response time lands." widgetKey="speed-to-lead" label="Speed-to-lead explorer" />
      <div className="speed-widget iw">
        <label className="speed-label" htmlFor={sliderId}>Drag to set how long you take to respond to a new online lead</label>
        <input
          type="range"
          id={sliderId}
          className="speed-slider"
          min={0}
          max={SPEED_STOPS.length - 1}
          step={1}
          value={i}
          aria-valuetext={`${stop.label}: ${SPEED_BANDS[key].name}`}
          onChange={e => setI(Number(e.target.value))}
        />
        <svg viewBox={`0 0 ${W} ${H}`} className="speed-svg" role="img" aria-label="Illustrative curve: the chance of winning the conversation falls as response time grows">
          <rect x={left} y={top - 14} width={edge1 - left} height={bottom - top + 14} className="speed-zone zone-top" />
          <rect x={edge1} y={top - 14} width={edge2 - edge1} height={bottom - top + 14} className="speed-zone zone-strong" />
          <rect x={edge2} y={top - 14} width={right - edge2} height={bottom - top + 14} className="speed-zone zone-drop" />
          <text x={(left + edge1) / 2} y={top - 3} textAnchor="middle" className="speed-zone-label">Under 5 min</text>
          <text x={(edge1 + edge2) / 2} y={top - 3} textAnchor="middle" className="speed-zone-label">5 to 30 min</text>
          <text x={(edge2 + right) / 2} y={top - 3} textAnchor="middle" className="speed-zone-label">After 30 min</text>
          <line x1={left} y1={bottom} x2={right} y2={bottom} className="speed-axis" />
          <path d={curve} className="speed-curve" />
          <line className="speed-guide" y1={top} y2={bottom} x1={xAt(i)} x2={xAt(i)} />
          <circle className="speed-dot" r={7} cx={xAt(i)} cy={yAt(stop.y)} data-band={key} />
          {SPEED_STOPS.map((s, n) => (
            <text key={s.label} x={xAt(n)} y={bottom + 16} textAnchor="middle" className={`speed-tick${n === i ? ' active' : ''}`} data-i={n}>{s.label}</text>
          ))}
        </svg>
        <div className="speed-readout" aria-live="polite">
          <div className="speed-when">If you respond in {stop.label}</div>
          <div className="speed-band" data-band={key}>{SPEED_BANDS[key].name}</div>
          <p className="speed-detail">{SPEED_BANDS[key].detail}</p>
        </div>
        <p className="speed-caption">Illustrative shape only. The handbook defines three bands, not exact percentages.</p>
      </div>
    </>
  );
}
