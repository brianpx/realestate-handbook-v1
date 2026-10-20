'use client';

import { useState } from 'react';
import { CYCLE_NODES, CYCLE_TOOLS } from '@/content/data/pitfall';
import { PITFALL_STATIC_HTML } from '@/content/data/pitfall-static';
import { cycleStatus, interruptions } from '@/lib/drills';
import { InteractiveHeader } from './InteractiveHeader';
import { StaticFallback } from './StaticFallback';

export function PitfallCycle() {
  const [active, setActive] = useState<ReadonlySet<number>>(new Set());
  const broken = interruptions(active);
  const toggle = (i: number) => setActive(prev => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });
  return (
    <>
      <StaticFallback html={PITFALL_STATIC_HTML} />
      <InteractiveHeader hint="Switch the four parts of the one correction on and off to see which links of the loop each one interrupts." widgetKey="pitfall-cycle" label="Pitfall cycle explorer" />
      <div className="cycle-widget iw">
        <div className="cycle-tools" role="group" aria-label="Parts of the one correction">
          {CYCLE_TOOLS.map((tool, i) => (
            <button key={tool.name} type="button" className="btn-mini" aria-pressed={active.has(i)} onClick={() => toggle(i)}>{tool.name}</button>
          ))}
        </div>
        <ol className="cycle-list">
          {CYCLE_NODES.map((node, n) => (
            <li key={node.name} className={`cycle-node${broken[n]!.length ? ' is-broken' : ''}`}>
              <strong>{node.name}</strong>
              <span className="cycle-text">{node.text}</span>
              <span className="cycle-badge">{broken[n]!.length ? `Interrupted by ${broken[n]!.join(' and ')}` : ''}</span>
            </li>
          ))}
        </ol>
        <p className="cycle-loop">↺ …and back to Slow follow-up</p>
        <p className="cycle-status" aria-live="polite">{cycleStatus(active)}</p>
      </div>
    </>
  );
}
