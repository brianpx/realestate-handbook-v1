// Arithmetic behind the Chapter 1 goal ladder. Ported from setupGoalCalculator in legacy/js/widgets.js.
import { fmtNum } from './format';
export { fmtNum };

export const CALC_DEFAULTS = { apc: 3, cpa: 20, weeks: 48 } as const;
export const WORKDAYS_PER_WEEK = 5;
// Table 8.2: conversations per week for a full-time new agent
export const TARGET_CONVERSATIONS = { low: 15, high: 25 } as const;
export const CALC_SCENARIOS = [
  { label: 'Ratios as entered', factor: 1 },
  { label: '25% more conversations', factor: 1.25 },
  { label: '50% more conversations', factor: 1.5 },
] as const;


export const fmtPerDay = (n: number): string => {
  if (n < 1) return n.toFixed(1);
  const lo = Math.floor(n);
  const hi = Math.ceil(n);
  return lo === hi ? String(lo) : `${lo} to ${hi}`;
};

export type GoalInputs = { goal?: number; commission?: number; apc?: number; cpa?: number; weeks?: number };
export type GoalPlan = { closings: number; appts: number; convs: number; perWeek: number; perDay: number };

const positive = (n: number | undefined): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0;

/** Null until all five inputs are positive numbers. `scale` stresses the conversation ratio (1 = as entered). */
export function goalPlan(i: GoalInputs, scale = 1): GoalPlan | null {
  if (!positive(i.goal) || !positive(i.commission) || !positive(i.apc) || !positive(i.cpa) || !positive(i.weeks)) return null;
  const closings = Math.ceil(i.goal / i.commission);
  const appts = closings * i.apc;
  const convs = appts * i.cpa * scale;
  const perWeek = convs / i.weeks;
  return { closings, appts, convs, perWeek, perDay: perWeek / WORKDAYS_PER_WEEK };
}

export function goalVerdict(shown: GoalPlan, factor: number, asEntered: GoalPlan): string {
  const { low, high } = TARGET_CONVERSATIONS;
  const week = Math.round(shown.perWeek);
  let text: string;
  if (week < low) {
    text = `Table 8.2 asks a new agent for ${low} to ${high} conversations a week. Your goal needs fewer, so that range leaves you a cushion if your ratios start out weak.`;
  } else if (week <= high) {
    text = `That sits inside the ${low} to ${high} conversations a week that Table 8.2 sets for a new agent.`;
  } else {
    text = `That is above the top of Table 8.2's range (${low} to ${high} a week). Check whether the goal, commission and ratios are realistic for year one, or plan to ramp up over several months.`;
  }
  if (factor !== 1) {
    text = `At ${Math.round((factor - 1) * 100)}% more conversations than planned you would need ${fmtNum(shown.perWeek)} a week, up from ${fmtNum(asEntered.perWeek)}. ${text}`;
  }
  return text;
}
