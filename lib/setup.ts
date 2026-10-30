// Logic for the guided first session (/handbook/start). The arithmetic is lib/goal.ts and the schedule is
// lib/plan.ts, so the setup, the Chapter 1 calculator and the Chapter 8 planner always agree. This file adds only
// the pieces that are new: choosing two lead sources, splitting the target between them, and writing the result down.
import { LEAD_SOURCES } from '@/content/data/lead-sources';
import { CALC_DEFAULTS, fmtNum, roundPerDay, goalPlan, WORKDAYS_PER_WEEK, type GoalInputs, type GoalPlan } from './goal';
import { fmtClock, planBlocks, TIMEBLOCK_DEFAULTS, WEEKDAY_NAMES, type TimeblockCfg } from './plan';

export const SETUP_WIDGET = 'startSetup';
export const SETUP_STEPS = [
  { id: 'goal', label: 'Income goal' },
  { id: 'target', label: 'Daily target' },
  { id: 'sources', label: 'Lead sources' },
  { id: 'split', label: 'Split the target' },
  { id: 'week', label: 'First week' },
  { id: 'review', label: 'Review and save' },
] as const;
export type SetupStepId = (typeof SETUP_STEPS)[number]['id'];

/** What each lead source asks of you, from Chapter 2. No source is ranked above another here. */
export const SOURCE_NOTES: Record<string, string> = {
  sphere: 'Costs your time, not money. Chapter 2 calls it the highest-return source for most agents. Start by listing 150 to 300 people you know.',
  zillow: 'Paid, and the people have no relationship with you yet. Chapter 2 says to pass the Chapter 3 “9 p.m. test” (fast reply, next-morning call, 90-day plan) before buying leads.',
  idx: 'Your own website and ads. Speed and a long follow-up plan decide whether it pays off.',
  open: 'A listing as the reason to meet people. Plan a follow-up with every visitor within 24 hours.',
  expired: 'Respectful, persistent calling. Ask your broker about Do Not Call and consent rules first.',
};

export const sourceName = (key: string): string => LEAD_SOURCES.find(s => s.key === key)?.name ?? key;
export const isSourceKey = (key: unknown): key is string => typeof key === 'string' && LEAD_SOURCES.some(s => s.key === key);

export type Setup = {
  step: number;
  /** Exactly two source keys, or fewer while the reader is still choosing. */
  sources: string[];
  /** Percent of the weekly target given to the first source; the second gets the rest. */
  share: number;
  completedAt?: string;
};

export const SETUP_DEFAULTS: Setup = { step: 0, sources: [], share: 50 };

/** Reads the saved slice defensively: anything missing or malformed falls back to the default. */
export function readSetup(saved: Record<string, unknown>): Setup {
  const step = typeof saved.step === 'number' && Number.isInteger(saved.step) ? Math.min(Math.max(saved.step, 0), SETUP_STEPS.length - 1) : 0;
  const sources = Array.isArray(saved.sources) ? [...new Set(saved.sources.filter(isSourceKey))].slice(0, 2) : [];
  const share = typeof saved.share === 'number' && Number.isFinite(saved.share) ? Math.min(Math.max(Math.round(saved.share), 0), 100) : SETUP_DEFAULTS.share;
  return { step, sources, share, completedAt: typeof saved.completedAt === 'string' ? saved.completedAt : undefined };
}

/** What the reader still has to fill in before a step's result makes sense. Empty means ready. */
export function stepProblem(step: SetupStepId, goal: GoalInputs, setup: Setup, cfg: TimeblockCfg): string {
  switch (step) {
    case 'goal':
      if (!goal.goal) return 'Enter your yearly income goal.';
      if (!goal.commission) return 'Enter your average commission per closing, after your broker split, or pick a typical figure.';
      return '';
    case 'target':
      if (!goalPlan(goal)) return 'Enter your income goal and average commission first (step 1), and keep each assumption above zero.';
      return '';
    case 'sources':
      return setup.sources.length === 2 ? '' : `Choose two lead sources (you have chosen ${setup.sources.length}).`;
    case 'split':
      return setup.sources.length === 2 ? '' : 'Choose your two lead sources first (step 3).';
    case 'week': {
      const { valid } = planBlocks(cfg);
      if (cfg.days.length === 0) return 'Pick at least one day to block.';
      return valid ? '' : 'Your end-of-day update comes before prospecting ends. Move it later.';
    }
    case 'review':
      return '';
  }
}

export type Allocation = { source: string; perWeek: number; perDay: number; percent: number };

/** Splits the weekly target between two sources. The two weekly counts always add up to the rounded weekly target. */
export function allocate(plan: GoalPlan, sources: readonly [string, string], share: number): [Allocation, Allocation] {
  const pct = Math.min(Math.max(Math.round(share), 0), 100);
  const week = Math.round(plan.perWeek);
  const first = Math.round((week * pct) / 100);
  return [
    { source: sources[0], perWeek: first, perDay: (plan.perDay * pct) / 100, percent: pct },
    { source: sources[1], perWeek: week - first, perDay: (plan.perDay * (100 - pct)) / 100, percent: 100 - pct },
  ];
}

/** The first thing to do on the next working day, in the reader's own numbers. */
export function nextAction(plan: GoalPlan, first: Allocation, cfg: TimeblockCfg): string {
  const prospecting = planBlocks(cfg).blocks.find(b => b.cls === 2)!;
  return `On your next working day, start your prospecting block at ${fmtClock(prospecting.from)} and aim for ${roundPerDay(plan.perDay)} real conversations, beginning with ${sourceName(first.source)}.`;
}

export type PlanSummary = {
  goal: number;
  commission: number;
  assumptions: { apc: number; cpa: number; weeks: number };
  plan: GoalPlan;
  allocation: [Allocation, Allocation];
  cfg: TimeblockCfg;
  action: string;
};

/** The finished plan, or null while any input is missing. */
export function summarize(goal: GoalInputs, setup: Setup, cfg: TimeblockCfg): PlanSummary | null {
  const plan = goalPlan(goal);
  if (!plan || !goal.goal || !goal.commission || setup.sources.length !== 2) return null;
  const allocation = allocate(plan, [setup.sources[0]!, setup.sources[1]!], setup.share);
  return {
    goal: goal.goal,
    commission: goal.commission,
    assumptions: { apc: goal.apc ?? CALC_DEFAULTS.apc, cpa: goal.cpa ?? CALC_DEFAULTS.cpa, weeks: goal.weeks ?? CALC_DEFAULTS.weeks },
    plan,
    allocation,
    cfg,
    action: nextAction(plan, allocation[0], cfg),
  };
}

/** Plain text for printing, saving or pasting into notes. */
export function planText(s: PlanSummary, date: Date): string {
  const { blocks } = planBlocks(s.cfg);
  const days = s.cfg.days.map(d => WEEKDAY_NAMES[d]).join(', ');
  const lines = [
    'My first-week plan',
    `From the 90-day handbook, ${date.toISOString().slice(0, 10)}`,
    '',
    'Daily conversation target',
    `  ${roundPerDay(s.plan.perDay)} a day, about ${fmtNum(s.plan.perWeek)} a week`,
    `  Goal $${fmtNum(s.goal)} a year at $${fmtNum(s.commission)} average commission = ${fmtNum(s.plan.closings)} closings`,
    `  Planning assumptions (rules of thumb, not measured results): ${s.assumptions.apc} appointments per closing, ${s.assumptions.cpa} conversations per appointment, ${s.assumptions.weeks} working weeks, ${WORKDAYS_PER_WEEK} days a week`,
    '',
    'Lead sources',
    ...s.allocation.map(a => `  ${sourceName(a.source)}: ${a.percent}% (about ${a.perWeek} a week, ${roundPerDay(a.perDay)} a day)`),
    '',
    `First week (${days})`,
    ...blocks.filter(b => b.mins).map(b => `  ${fmtClock(b.from)}  ${b.name} (${b.mins} min)`),
    '',
    'Next action',
    `  ${s.action}`,
    '',
    'Review these numbers after a few weeks and replace the assumptions with your own results.',
  ];
  return lines.join('\n');
}

export const DEFAULT_TIMEBLOCK = TIMEBLOCK_DEFAULTS;
