'use client';

import { useState } from 'react';
import { AmountInput } from '@/components/widgets/AmountInput';
import { CALC_DEFAULTS, fmtNum, roundPerDay, goalPlan } from '@/lib/goal';

// The hero's live preview: the same arithmetic as the handbook's income goal calculator (lib/goal.ts), with the
// handbook's own example numbers. It keeps its state in the page only, so nothing is saved from the sales page.
export function HeroPlan() {
  const [goal, setGoal] = useState<number | undefined>(80000);
  const [commission, setCommission] = useState<number | undefined>(6500);
  const plan = goalPlan({ goal, commission, ...CALC_DEFAULTS });
  return (
    <section className="pub-card pub-device" aria-labelledby="heroPlanTitle">
      <span className="pub-device-tag">Live preview</span>
      <h2 id="heroPlanTitle">Your daily conversation target</h2>
      <p className="pub-device-sub">Type your own numbers. This is the calculator from Chapter 1.</p>
      <div className="pub-fields">
        <div className="pub-field">
          <label htmlFor="heroGoal">Yearly income goal</label>
          <span className="calc-field"><span className="calc-prefix" aria-hidden="true">$</span><AmountInput value={goal} min={1} format={fmtNum} placeholder="80,000" onValue={setGoal} className="calc-input" id="heroGoal" /></span>
        </div>
        <div className="pub-field">
          <label htmlFor="heroCommission">Average commission, after your split</label>
          <span className="calc-field"><span className="calc-prefix" aria-hidden="true">$</span><AmountInput value={commission} min={1} format={fmtNum} placeholder="6,500" onValue={setCommission} className="calc-input" id="heroCommission" /></span>
        </div>
      </div>
      <div className="pub-stats" role="status" aria-live="polite">
        {plan ? (
          <>
            <div className="pub-stat"><b>{fmtNum(plan.closings)}</b><span>closings needed</span></div>
            <div className="pub-stat"><b>{fmtNum(plan.perWeek)}</b><span>conversations a week</span></div>
            <div className="pub-stat"><b>{roundPerDay(plan.perDay)}</b><span>conversations a day</span></div>
          </>
        ) : (
          <p className="pub-small col-span-full m-0">Enter both numbers to see your daily target.</p>
        )}
      </div>
      <p className="pub-device-note">
        Assumes {CALC_DEFAULTS.apc} appointments per closing, {CALC_DEFAULTS.cpa} conversations per appointment and {CALC_DEFAULTS.weeks} working weeks.
        These are rules of thumb, not measured results; the handbook shows you how to replace them with your own.
      </p>
    </section>
  );
}
