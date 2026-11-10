'use client';

import { CheckIcon, CornerDownLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { Progress } from '@/components/ui/progress';
import { LEAD_SOURCES } from '@/content/data/lead-sources';
import { AmountInput } from '@/components/widgets/AmountInput';
import { TimeBlockPlanner } from '@/components/widgets/TimeBlockPlanner';
import { CALC_DEFAULTS, fmtNum, roundPerDay, goalPlan, goalVerdict, type GoalInputs } from '@/lib/goal';
import { BOOK_TITLE } from '@/lib/pages';
import { fmtClock, planBlocks, readTimeblockCfg, WEEKDAY_NAMES, type TimeblockCfg } from '@/lib/plan';
import { HANDBOOK, pageHref } from '@/lib/routes';
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

// Keys typed into these keep their own meaning (a button's Enter presses it, a textarea's Enter adds a line).
const KEEPS_KEYS = 'button, a, select, textarea, summary, [role="button"]';

// The guided first session, laid out as an onboarding wizard (after shadcnuikit's onboarding-screen3): brand header
// with the step count and a way out, a thin progress bar, one question at a time, Enter to continue and number keys
// for the choices. Every value is stored where the chapter tools already keep it (calc.*, widgets.timeblock), so what
// is entered here shows up in Chapter 1 and Chapter 8 and the other way round. Only the step, the two chosen sources,
// the split and the finished date are new, in widgets.startSetup.
export function StartSetup({ intro }: { intro?: ReactNode }) {
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
  const last = step === SETUP_STEPS.length - 1;

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

  const toggleSource = (key: string) => updateWidget(SETUP_WIDGET, w => {
    const chosen = readSetup(w).sources;
    if (chosen.includes(key)) w.sources = chosen.filter(k => k !== key);
    else if (chosen.length < 2) w.sources = [...chosen, key];
  });

  // Enter moves on from any field; on the sources step the digits 1 to 5 tick a source, as the wizard's hint row says.
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const target = e.target as HTMLElement;
    if (e.key === 'Enter' && !last && !target.closest(KEEPS_KEYS)) {
      e.preventDefault();
      next();
      return;
    }
    if (current.id === 'sources' && /^[1-9]$/.test(e.key) && !target.closest('input, textarea, select')) {
      const src = LEAD_SOURCES[Number(e.key) - 1];
      if (src) { e.preventDefault(); toggleSource(src.key); }
    }
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
  const finished = setup.completedAt !== undefined;

  return (
    <div className="setup onboarding" onKeyDown={onKeyDown}>
      <header className="onboarding-header setup-no-print">
        <div className="onboarding-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo3-sidebar-transparent.png" width={32} height={32} alt="" />
          <span>{BOOK_TITLE}</span>
        </div>
        <div className="onboarding-header-right">
          <span className="setup-count">Step {step + 1} of {SETUP_STEPS.length}</span>
          <Button variant="ghost" size="sm" render={<Link href={HANDBOOK} />} nativeButton={false}>
            {finished ? 'Back to the handbook' : 'Skip setup'}
          </Button>
        </div>
      </header>
      <Progress value={((step + 1) / SETUP_STEPS.length) * 100} aria-label="Setup progress" className="setup-no-print h-1 rounded-none" />

      <div className="onboarding-body">
        {intro}
        <nav className="setup-steps setup-no-print" aria-label="Setup steps">
          <ol role="list">
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
                    <span className="setup-step-num" aria-hidden="true">{done && i !== step ? <CheckIcon size={14} /> : i + 1}</span>
                    <span>{s.label}<span className="visually-hidden">{done ? ', complete' : locked ? ', not available yet' : ''}</span></span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <section className="setup-panel" aria-labelledby="setupHeading">
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
                      <Button key={c.amount} type="button" variant="outline" size="sm" aria-pressed={read('commission') === c.amount} onClick={() => setField('commission', c.amount)}>
                        {c.price} home: ${fmtNum(c.amount)}
                      </Button>
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
                {LEAD_SOURCES.map((src, i) => {
                  const checked = setup.sources.includes(src.key);
                  const blocked = !checked && setup.sources.length >= 2;
                  return (
                    <label key={src.key} className={`setup-source${checked ? ' on' : ''}${blocked ? ' off' : ''}`}>
                      <input type="checkbox" checked={checked} disabled={blocked} onChange={() => toggleSource(src.key)} />
                      <span className="setup-source-text"><strong>{src.name}</strong><span className="setup-hint">{SOURCE_NOTES[src.key]}</span></span>
                      <Kbd aria-hidden="true" className="setup-source-key">{i + 1}</Kbd>
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
            <Button type="button" variant="outline" onClick={() => goTo(step - 1)} disabled={step === 0}>Back</Button>
            {!last && <Button type="button" onClick={next}>Continue</Button>}
          </div>
          {!last && (
            <p className="onboarding-keys setup-no-print" aria-hidden="true">
              <span><Kbd><CornerDownLeftIcon /></Kbd> to continue</span>
              {current.id === 'sources' && <span><Kbd>1</Kbd> to <Kbd>{LEAD_SOURCES.length}</Kbd> to pick a source</span>}
            </p>
          )}
        </section>
      </div>
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
        <Button type="button" onClick={() => window.print()}>Print this plan</Button>
        <Button type="button" variant="outline" onClick={download}>Download as text</Button>
        <Button type="button" variant="outline" onClick={finish}>Mark setup as finished</Button>
      </div>
      <p className="setup-note setup-no-print" role="status">{note || (setup.completedAt ? 'Marked as finished. You can come back and change any step.' : '')}</p>
      <div className="setup-next setup-no-print">
        <h3>What to read next</h3>
        <p>The handbook’s first week is Chapters 1, 2 and 3: your daily number, your sphere list, and your home base.</p>
        <ul>
          <li><Link href={pageHref('ch1')}>Chapter 1: mindset and business foundations</Link></li>
          <li><Link href={pageHref('ch2')}>Chapter 2: finding clients</Link></li>
          <li><Link href={pageHref('ch3')}>Chapter 3: marketing and brand presence</Link></li>
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
