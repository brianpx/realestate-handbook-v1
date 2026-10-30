'use client';

import { useState } from 'react';
import { CONSULT_CASES, CONSULT_DEFAULT, CONSULT_STEPS } from '@/content/data/consult';
import { allocSummary } from '@/lib/drills';
import { ChoiceDrill } from './ChoiceDrill';
import { InteractiveHeader } from './InteractiveHeader';

export function ConsultationLab() {
  const [minutes, setMinutes] = useState<number[]>([...CONSULT_DEFAULT]);
  const { total, share, ok, text } = allocSummary(minutes);
  return (
    <aside className="box try-it iw">
      <h3 className="box-title">● LAB · THE FIVE-STEP CONSULTATION</h3>
      <InteractiveHeader hint="Rebalance a meeting, then spot where four sample consultations went wrong." widgetKey="consultation-lab" label="Consultation lab" />
      <div className="alloc">
        <h4 className="lab-title">1. Spend the meeting well</h4>
        <p>Table 9.1 says asking and listening should take at least half the meeting. Drag the sliders until they do.</p>
        <div className="alloc-bar" role="img" aria-label={`Meeting of ${total} minutes. Asking and listening take ${share} percent.`}>
          {minutes.map((m, i) => (
            <span key={CONSULT_STEPS[i]} className={`alloc-seg seg-${i}`} style={{ flexGrow: m }}>{m / (total || 1) > 0.12 ? CONSULT_STEPS[i] : ''}</span>
          ))}
        </div>
        <div className="alloc-sliders">
          {CONSULT_STEPS.map((name, i) => (
            <div key={name} className="alloc-row">
              <label htmlFor={`alloc-${i}`}>{name}</label>
              <input
                type="range"
                id={`alloc-${i}`}
                min={0}
                max={60}
                step={1}
                value={minutes[i]}
                onChange={e => setMinutes(prev => prev.map((v, j) => (j === i ? Number(e.target.value) : v)))}
              />
              <output className="alloc-out" htmlFor={`alloc-${i}`}>{minutes[i]} min</output>
            </div>
          ))}
        </div>
        <p className={`alloc-verdict ${ok ? 'ok' : 'no'}`} aria-live="polite">{text}</p>
      </div>
      <div className="spot">
        <h4 className="lab-title">2. Spot the misstep</h4>
        <ChoiceDrill stateKey="consultMisstep" noun="Case" items={CONSULT_CASES} />
      </div>
    </aside>
  );
}
