'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { LEAD_SOURCES } from '@/content/data/lead-sources';
import { AmountInput } from '@/components/widgets/AmountInput';
import { TimeBlockPlanner } from '@/components/widgets/TimeBlockPlanner';
import { CALC_DEFAULTS, fmtNum, roundPerDay, goalPlan, goalVerdict, type GoalInputs } from '@/lib/goal';
import { fmtClock, planBlocks, readTimeblockCfg, WEEKDAY_NAMES, type TimeblockCfg } from '@/lib/plan';
import { pageHref } from '@/lib/routes';
import { planText, readSetup, SETUP_STEPS, SETUP_WIDGET, SOURCE_NOTES, sourceName, stepProblem, summarize, allocate } from '@/lib/setup';
import { setCalc, updateWidget, useHandbookState, widgetOf } from '@/lib/state';

type CalcKey = keyof GoalInputs;
// Starting figures for a reader who does not know their average yet: roughly 2.5 to 3% of the price to one side of
// the sale, of which the agent keeps about 60% after the split. The middle one is the Chapter 1 example.
const COMMISSION_PRESETS: { price: string; amount: number }[] = [
  { price: '$250k', amount: 4000 },
  { price: '$400k', amount: 6500 },
  { price: '$600k', amount: 9500 },
];
const numberAt = (data: Record<string, unknown>, key: CalcKey): number | undefined => (typeof data[key] === 'number' ? (data[key] as number) : undefined);

// The guided first session. Every value is stored where the chapter tools already keep it (calc.*, widgets.timeblock),
// so what is entered here shows up in Chapter 1 and Chapter 8 and the other way round. Only the step, the two chosen
// sources, the split and the finished date are new, in widgets.startSetup.
export function StartSetup() {
  const state = useHandbookState();
  const setup = readSetup(widgetOf(state, SETUP_WIDGET));
  const cfg = readTimeblockCfg(widgetOf(state, 'timeblock'));
  // Defaults fill the three ratios until the reader clears one, as in the Chapter 1 calculator.
  const [cleared, setCleared] = useState<ReadonlySet<CalcKey>>(new Set());
  const read = (key: CalcKey): number | undefined => {
    if (cleared.has(key)) return undefined;
    return numberAt(state.calc, key) ?? (key in CALC_DEFAULTS ? CALC_DEFAULTS[key as keyof typeof CALC_DEFAULTS] : undefined);
  };
  const setField = (key: CalcKey, n: number | undefined) => {
    setCleared(prev => {
      const nextSet = new Set(prev);
      if (n === undefined) nextSet.add(key); else nextSet.delete(key);
      return nextSet;
    });
    setCalc(key, n);
  };
  const inputs: GoalInputs = { goal: read('goal'), commission: read('commission'), apc: read('apc'), cpa: read('cpa'), weeks: read('weeks') };
  const plan = goalPlan(inputs);

  const problems = SETUP_STEPS.map(s => stepProblem(s.id, inputs, setup, cfg));
  // A step can be opened once every step before it is complete.
  const firstOpen = problems.findIndex(p => p !== '');
  const reach = firstOpen === -1 ? SETUP_STEPS.length - 1 : firstOpen;
  const step = Math.min(setup.step, reach);
  const current = SETUP_STEPS[step]!;

  const [attempted, setAttempted] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  useEffect(() => { if (moved.current) headingRef.current?.focus(); }, [step]);

  const goTo = (i: number) => {
    moved.current = true;
    setAttempted(false);
    updateWidget(SETUP_WIDGET, w => { w.step = i; });
  };
  const next = () => {
    if (problems[step]) { setAttempted(true); return; }
    goTo(Math.min(step + 1, SETUP_STEPS.length - 1));
  };

  const calcField = (key: CalcKey, o: { label: string; hint?: string; prefix?: string; placeholder: string; min: number; max?: number; after?: ReactNode }): ReactNode => {
    const id = `setup-${key}`;
    return (
      <div className="setup-field">
        <label htmlFor={id}>{o.label}</label>
        <span className="calc-field">
          {o.prefix && <span className="calc-prefix" aria-hidden="true">{o.prefix}</span>}
          <AmountInput
            id={id}
            value={read(key)}
            min={o.min}
            max={o.max}
            placeholder={o.placeholder}
            format={o.prefix ? fmtNum : undefined}
            onValue={n => setField(key, n)}
          />
        </span>
        {o.after}
        {o.hint && <p className="setup-hint">{o.hint}</p>}
      </div>
    );
  };

  const error = attempted && problems[step] ? problems[step] : '';

  return (
    <div className="setup">
      <nav className="setup-steps setup-no-print" aria-label="Setup steps">
        <ol>
          {SETUP_STEPS.map((s, i) => {
            const locked = i > reach;
            const done = i < reach || (i === reach && problems[i] === '' && i < SETUP_STEPS.length - 1);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  className={`setup-step${i === step ? ' current' : ''}${done ? ' done' : ''}`}
                  aria-current={i === step ? 'step' : undefined}
                  aria-disabled={locked}
                  onClick={() => { if (!locked) goTo(i); }}
                >
                  <span className="setup-step-num" aria-hidden="true">{done && i !== step ? '✓' : i + 1}</span>
                  <span>{s.label}<span className="visually-hidden">{done ? ', complete' : locked ? ', not available yet' : ''}</span></span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <section className="setup-panel" aria-labelledby="setupHeading">
        <p className="setup-count setup-no-print">Step {step + 1} of {SETUP_STEPS.length}</p>

        {current.id === 'goal' && (
          <>
            <h2 id="setupHeading" ref={headingRef} tabIndex={-1}>Your income goal</h2>
            <p>Start with a yearly goal and what you keep from an average closing. Both are what reaches you <em>after</em> your broker split. Taxes and business costs are not subtracted, so set the goal with those in mind.</p>
            {calcField('goal', { label: 'Yearly income goal', prefix: '$', placeholder: 'for example 80,000', min: 1 })}
            {calcField('commission', {
              label: 'Average commission per closed side, after your split',
              hint: 'A side is one end of a transaction, buyer or seller. The typical figures assume 2.5 to 3% of the price to your side and a 60% split. Ask your broker for a better number when you can.',
              prefix: '$',
              placeholder: 'for example 6,500',
              min: 1,
              after: (
                <div className="setup-presets" role="group" aria-label="Typical commission by home price">
                  <span className="setup-presets-lead">Not sure? Start from a typical home price in your market:</span>
                  {COMMISSION_PRESETS.map(c => (
                    <button key={c.amount} type="button" className="btn-mini" aria-pressed={read('commission') === c.amount} onClick={() => setField('commission', c.amount)}>
                      {c.price} home: ${fmtNum(c.amount)}
                    </button>
                  ))}
                </div>
              ),
            })}
            <p className="setup-hint">The Chapter 1 handbook example is an $80,000 goal and a $6,500 average. It is an example only, not a figure to expect.</p>
          </>
        )}

        {current.id === 'target' && (
          <>
            <h2 id="setupHeading" ref={headingRef} tabIndex={-1}>Your daily conversation target</h2>
            <p>These three ratios turn closings into conversations. They are <strong>planning assumptions</strong>: rules of thumb for a new agent, blended across sources, not measured results. Change any of them, and replace them with your own numbers once you have a few months of data.</p>
            <div className="setup-row">
              {calcField('apc', { label: 'Appointments per closing', placeholder: '3', min: 0.1 })}
              {calcField('cpa', { label: 'Conversations per appointment', placeholder: '20', min: 0.1 })}
              {calcField('weeks', { label: 'Working weeks a year', placeholder: '48', min: 1, max: 52 })}
            </div>
            <div className="calc-stats setup-stats" role="status" aria-live="polite">
              {plan ? (
                <>
                  <div className="calc-stat"><div className="calc-stat-value">{fmtNum(plan.closings)}</div><div className="calc-stat-label">{plan.closings === 1 ? 'closing needed' : 'closings needed'}</div></div>
                  <div className="calc-stat"><div className="calc-stat-value">{fmtNum(plan.perWeek)}</div><div className="calc-stat-label">conversations a week</div></div>
                  <div className="calc-stat"><div className="calc-stat-value">{roundPerDay(plan.perDay)}</div><div className="calc-stat-label">conversations a day</div></div>
                </>
              ) : <p className="calc-empty">Fill in step 1 and keep each assumption above zero to see your target.</p>}
            </div>
            {plan && <p className="calc-verdict">{goalVerdict(plan, 1, plan)}</p>}
            <p className="setup-hint">A conversation is a real two-way exchange about real estate with someone who could buy, sell or refer. A voicemail does not count. A working week is counted as five days, and closings usually trail conversations by 60 to 120 days.</p>
          </>
        )}

        {current.id === 'sources' && (
          <>
            <h2 id="setupHeading" ref={headingRef} tabIndex={-1}>Choose two lead sources</h2>
            <p>Pick the two you can follow up on well this month. Chapter 2 suggests choosing on what each costs in time and money and on what you can follow up on today.</p>
            <fieldset className="setup-sources" aria-describedby="sourcesHint">
              <legend className="visually-hidden">Lead sources, choose two</legend>
              {LEAD_SOURCES.map(src => {
                const checked = setup.sources.includes(src.key);
                const blocked = !checked && setup.sources.length >= 2;
                return (
                  <label key={src.key} className={`setup-source${checked ? ' on' : ''}${blocked ? ' off' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={blocked}
                      onChange={e => updateWidget(SETUP_WIDGET, w => {
                        const list = readSetup(w).sources.filter(k => k !== src.key);
                        w.sources = e.target.checked ? [...list, src.key].slice(0, 2) : list;
                      })}
                    />
                    <span><strong>{src.name}</strong><span className="setup-hint">{SOURCE_NOTES[src.key]}</span></span>
                  </label>
                );
              })}
            </fieldset>
            <p className="setup-hint" id="sourcesHint" role="status">{setup.sources.length === 2 ? 'Two chosen. Uncheck one to swap it.' : `${setup.sources.length} of 2 chosen.`}</p>
          </>
        )}

        {current.id === 'split' && plan && setup.sources.length === 2 && (() => {
          const [a, b] = allocate(plan, [setup.sources[0]!, setup.sources[1]!], setup.share);
          return (
            <>
              <h2 id="setupHeading" ref={headingRef} tabIndex={-1}>Split the target between them</h2>
              <p>Your daily target is {roundPerDay(plan.perDay)} conversations, about {fmtNum(plan.perWeek)} a week. Decide how much goes to each source. A starting split is only a guess; revisit it after a few weeks of results.</p>
              <div className="setup-field">
                <label htmlFor="setupShare">Share of the target for {sourceName(a.source)}: {a.percent}%</label>
                <input id="setupShare" type="range" min={0} max={100} step={5} value={setup.share} onChange={e => updateWidget(SETUP_WIDGET, w => { w.share = Number(e.target.value); })} />
              </div>
              <table className="setup-split">
                <caption className="visually-hidden">Weekly and daily conversations for each source</caption>
                <thead><tr><th scope="col">Source</th><th scope="col">Share</th><th scope="col">A week</th><th scope="col">A day</th></tr></thead>
                <tbody>
                  {[a, b].map(x => <tr key={x.source}><th scope="row">{sourceName(x.source)}</th><td>{x.percent}%</td><td>{x.perWeek}</td><td>{roundPerDay(x.perDay)}</td></tr>)}
                </tbody>
              </table>
            </>
          );
        })()}
        {current.id === 'split' && !(plan && setup.sources.length === 2) && <MissingEarlier heading={headingRef} />}

        {current.id === 'week' && (
          <>
            <h2 id="setupHeading" ref={headingRef} tabIndex={-1}>Schedule your first week</h2>
            <p>Protect the same block every working day so lead generation never depends on how you feel. This is the Chapter 8 planner; what you set here is what Chapter 8 shows.</p>
            <TimeBlockPlanner />
          </>
        )}

        {current.id === 'review' && <Review headingRef={headingRef} />}

        {error && <p className="setup-error" role="alert">{error}</p>}

        <div className="setup-nav setup-no-print">
          <button type="button" className="btn-mini" onClick={() => goTo(step - 1)} disabled={step === 0}>Back</button>
          {step < SETUP_STEPS.length - 1 && <button type="button" className="btn-nav" onClick={next}>Continue</button>}
        </div>
      </section>
    </div>
  );
}

function MissingEarlier({ heading }: { heading: RefObject<HTMLHeadingElement | null> }) {
  return <h2 id="setupHeading" ref={heading} tabIndex={-1}>Finish the earlier steps first</h2>;
}

function Review({ headingRef }: { headingRef: RefObject<HTMLHeadingElement | null> }) {
  const state = useHandbookState();
  const setup = readSetup(widgetOf(state, SETUP_WIDGET));
  const cfg = readTimeblockCfg(widgetOf(state, 'timeblock'));
  const inputs: GoalInputs = {
    goal: numberAt(state.calc, 'goal'),
    commission: numberAt(state.calc, 'commission'),
    apc: numberAt(state.calc, 'apc') ?? CALC_DEFAULTS.apc,
    cpa: numberAt(state.calc, 'cpa') ?? CALC_DEFAULTS.cpa,
    weeks: numberAt(state.calc, 'weeks') ?? CALC_DEFAULTS.weeks,
  };
  const s = summarize(inputs, setup, cfg);
  const [note, setNote] = useState('');
  if (!s) return <MissingEarlier heading={headingRef} />;

  const download = () => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([planText(s, new Date())], { type: 'text/plain' }));
    link.download = `my-first-week-plan-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    setNote('Plan downloaded.');
  };
  const finish = () => {
    updateWidget(SETUP_WIDGET, w => { w.completedAt = new Date().toISOString(); });
    setNote('Marked as finished. You can come back and change any step.');
  };

  return (
    <>
      <h2 id="setupHeading" ref={headingRef} tabIndex={-1}>Your first-week plan</h2>
      <p className="setup-no-print">This is saved on this device as you go. Print it, download it as text, or add the week to your calendar from step 5.</p>
      <div className="setup-plan" id="setupPlan">
        <dl>
          <dt>Daily conversation target</dt>
          <dd><strong>{roundPerDay(s.plan.perDay)} a day</strong>, about {fmtNum(s.plan.perWeek)} a week<small>From a ${fmtNum(s.goal)} goal at ${fmtNum(s.commission)} per closing: {fmtNum(s.plan.closings)} closings.</small></dd>
          <dt>Planning assumptions</dt>
          <dd>{s.assumptions.apc} appointments per closing, {s.assumptions.cpa} conversations per appointment, {s.assumptions.weeks} working weeks<small>Rules of thumb, not measured results. Replace them with your own after a few months.</small></dd>
          <dt>Lead sources</dt>
          <dd>{s.allocation.map(a => <span key={a.source} className="setup-line">{sourceName(a.source)}: {a.percent}%, about {a.perWeek} a week ({roundPerDay(a.perDay)} a day)</span>)}</dd>
          <dt>First week</dt>
          <dd><WeekLines cfg={cfg} /></dd>
          <dt>Next action</dt>
          <dd><strong>{s.action}</strong></dd>
        </dl>
      </div>
      <div className="setup-actions setup-no-print">
        <button type="button" className="btn-nav" onClick={() => window.print()}>Print this plan</button>
        <button type="button" className="btn-mini" onClick={download}>Download as text</button>
        <button type="button" className="btn-mini" onClick={finish}>Mark setup as finished</button>
      </div>
      <p className="setup-note setup-no-print" role="status">{note || (setup.completedAt ? 'Marked as finished. You can come back and change any step.' : '')}</p>
      <div className="setup-next setup-no-print">
        <h3>What to read next</h3>
        <p>The handbook’s first week is Chapters 1, 4 and 12: your goal, your CRM, and the 90-day plan.</p>
        <ul>
          <li><Link href={pageHref('ch4')}>Chapter 4: your CRM and daily operating system</Link></li>
          <li><Link href={pageHref('ch1')}>Chapter 1: mindset and business foundations</Link></li>
          <li><Link href={pageHref('ch12')}>Chapter 12: your first 90 days</Link></li>
        </ul>
        <p className="setup-hint">Want a copy of everything you have saved? <Link href="/account">Download your progress file</Link>.</p>
      </div>
    </>
  );
}

function WeekLines({ cfg }: { cfg: TimeblockCfg }) {
  const { blocks } = planBlocks(cfg);
  return (
    <>
      <span className="setup-line">{cfg.days.map(d => WEEKDAY_NAMES[d]).join(', ')}</span>
      {blocks.filter(b => b.mins && b.cls !== 3).map(b => <span key={b.cls} className="setup-line">{fmtClock(b.from)}: {b.name} ({b.mins} min)</span>)}
    </>
  );
}
