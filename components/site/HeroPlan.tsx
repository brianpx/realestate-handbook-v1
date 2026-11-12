'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { AmountInput } from '@/components/widgets/AmountInput';
import { CALC_DEFAULTS, fmtNum, fmtPerDay, goalPlan, WORKDAYS_PER_WEEK } from '@/lib/goal';
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
  const [showCalculation, setShowCalculation] = useState(false);
  const calculationToggle = useRef<HTMLButtonElement>(null);
  const plan = goalPlan({ goal, commission, ...CALC_DEFAULTS });
  const calculationOpen = showCalculation && Boolean(plan);
  const decimal = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  const edit = (set: (v: number | undefined) => void) => (v: number | undefined) => { set(v); setTouched(true); };
  return (
    <section className="pub-card pub-device" aria-labelledby="heroPlanTitle">
      <span className="pub-device-tag">Live preview</span>
      <h2 id="heroPlanTitle">Your daily conversation target</h2>
      <div className="pub-device-content" onKeyDown={event => {
        if (event.key === 'Escape' && calculationOpen) {
          event.preventDefault();
          setShowCalculation(false);
          calculationToggle.current?.focus();
        }
      }}>
        <div className="pub-device-calculator" inert={calculationOpen} aria-hidden={calculationOpen || undefined}>
          <p className="pub-device-sub">Chapter 1’s example numbers are filled in. Type your own to see your target.</p>
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
          <p className="pub-device-income-note">Income is after your brokerage split, before business expenses and taxes.</p>
          <div className="pub-stats" role="status" aria-live="polite">
            {plan ? (
              <>
                <div className="pub-stat"><b>{fmtNum(plan.closings)}</b><span>closings needed</span></div>
                <div className="pub-stat"><b>{fmtNum(plan.perWeek)}</b><span>conversations a week</span></div>
                <div className="pub-stat pub-stat-daily"><b>{fmtPerDay(plan.perDay).replace(' to ', '–')}</b><span>conversations a day</span></div>
              </>
            ) : (
              <p className="pub-small col-span-full m-0">Enter both numbers to see your daily target.</p>
            )}
          </div>
          <p className="pub-device-note">
            Assumes {CALC_DEFAULTS.apc} appointments per closing, {CALC_DEFAULTS.cpa} conversations per appointment and {CALC_DEFAULTS.weeks} working weeks of {WORKDAYS_PER_WEEK} days each.
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
        </div>
        {plan && goal !== undefined && commission !== undefined && (
          <>
            <button ref={calculationToggle} type="button" className="pub-calc-toggle" id="heroCalculationToggle" aria-expanded={calculationOpen} aria-controls="heroCalculationDetails" onClick={() => setShowCalculation(open => !open)}>
              How it’s calculated
              {calculationOpen ? <ChevronDownIcon aria-hidden="true" /> : <ChevronUpIcon aria-hidden="true" />}
            </button>
            <div className="pub-calc-viewport">
              <div className="pub-calc-details" id="heroCalculationDetails" role="region" aria-labelledby="heroCalculationToggle" hidden={!calculationOpen} inert={!calculationOpen}>
                <table>
                  <caption className="sr-only">Your income goal worked backward to a daily conversation target</caption>
                  <thead><tr><th scope="col">Step</th><th scope="col">Calculation</th><th scope="col">Result</th></tr></thead>
                  <tbody>
                    <tr><th scope="row">Closings needed</th><td>${decimal(goal)} ÷ ${decimal(commission)}, rounded up</td><td>{fmtNum(plan.closings)}</td></tr>
                    <tr><th scope="row">Appointments needed</th><td>{fmtNum(plan.closings)} × {CALC_DEFAULTS.apc}</td><td>{fmtNum(plan.appts)}</td></tr>
                    <tr><th scope="row">Conversations annually</th><td>{fmtNum(plan.appts)} × {CALC_DEFAULTS.cpa}</td><td>{fmtNum(plan.convs)}</td></tr>
                    <tr><th scope="row">Conversations per week</th><td>{fmtNum(plan.convs)} ÷ {CALC_DEFAULTS.weeks}</td><td>{decimal(plan.perWeek)}</td></tr>
                    <tr><th scope="row">Conversations per day</th><td>{decimal(plan.perWeek)} ÷ {WORKDAYS_PER_WEEK}</td><td>{decimal(plan.perDay)}</td></tr>
                  </tbody>
                </table>
                <p>Weekly and daily averages are rounded to at most two decimal places. Daily targets of one or more use a range when they fall between whole numbers.</p>
                <p>Count real two-way conversations about real estate with someone who could buy, sell or refer. Dials and voicemails do not count.</p>
                <p><Link href="/handbook/ch1#working-backward-from-an-income-goal">Learn the method in Chapter 1</Link>, then use the full calculator to replace these assumptions with your own ratios.</p>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
