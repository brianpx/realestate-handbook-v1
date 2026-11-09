'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AmountInput } from '@/components/widgets/AmountInput';
import { CALC_DEFAULTS, fmtNum, roundPerDay, goalPlan } from '@/lib/goal';
import { SignupForm } from './SignupForm';
import { useSignedIn } from './useSignedIn';

// The hero's live preview: the same arithmetic as the handbook's income goal calculator (lib/goal.ts), with the
// handbook's own example numbers. It keeps its state in the page only, so nothing is saved from the sales page.
// Once a visitor has typed a number of their own, the card offers the next step: the sign-in form for a visitor
// (the strongest moment on the page to ask), Chapter 1 for a reader who is already signed in.
export function HeroPlan() {
  const signedIn = useSignedIn();
  const [goal, setGoal] = useState<number | undefined>(80000);
  const [commission, setCommission] = useState<number | undefined>(6500);
  const [touched, setTouched] = useState(false);
  const plan = goalPlan({ goal, commission, ...CALC_DEFAULTS });
  const edit = (set: (v: number | undefined) => void) => (v: number | undefined) => { set(v); setTouched(true); };
  return (
    <section className="pub-card pub-device" aria-labelledby="heroPlanTitle">
      <span className="pub-device-tag">Live preview</span>
      <h2 id="heroPlanTitle">Your daily conversation target</h2>
      <p className="pub-device-sub">Type your own numbers. This is the calculator from Chapter 1.</p>
      <div className="pub-fields">
        <div className="pub-field">
          <label htmlFor="heroGoal">Yearly income goal</label>
          <span className="calc-field"><span className="calc-prefix" aria-hidden="true">$</span><AmountInput value={goal} min={1} format={fmtNum} placeholder="80,000" onValue={edit(setGoal)} className="calc-input" id="heroGoal" /></span>
        </div>
        <div className="pub-field">
          <label htmlFor="heroCommission">Average commission, after your split</label>
          <span className="calc-field"><span className="calc-prefix" aria-hidden="true">$</span><AmountInput value={commission} min={1} format={fmtNum} placeholder="6,500" onValue={edit(setCommission)} className="calc-input" id="heroCommission" /></span>
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
      {touched && (signedIn ? (
        <p className="pub-device-prompt">Keep going: <Link href="/handbook/ch1">Chapter 1</Link> has this calculator with its footnotes and the exercise that follows it.</p>
      ) : (
        <div className="pub-device-prompt" data-calculator-prompt>
          <p>Keep this number. Chapter 1 is free once you are signed in, with this calculator, its footnotes and the exercise that follows it.</p>
          <SignupForm variant="inline" source="calculator" buttonLabel="Open Chapter 1" />
        </div>
      ))}
    </section>
  );
}
