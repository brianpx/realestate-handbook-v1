import { describe, expect, it } from 'vitest';
import { goalPlan } from './goal';
import { TIMEBLOCK_DEFAULTS } from './plan';
import { allocate, nextAction, planText, readSetup, SETUP_DEFAULTS, stepProblem, summarize } from './setup';

const goal = { goal: 80000, commission: 6500, apc: 3, cpa: 20, weeks: 48 };

describe('guided setup', () => {
  it('reuses the Chapter 1 arithmetic for the daily target', () => {
    const plan = goalPlan(goal)!;
    expect(plan.closings).toBe(13);
    expect(Math.round(plan.perWeek)).toBe(16);
    expect(plan.perDay).toBeCloseTo(3.25);
  });

  it('splits the weekly target so the two sources always add up', () => {
    const plan = goalPlan(goal)!;
    for (const share of [0, 33, 50, 60, 100]) {
      const [a, b] = allocate(plan, ['sphere', 'open'], share);
      expect(a.perWeek + b.perWeek).toBe(16);
      expect(a.percent + b.percent).toBe(100);
      expect(a.perDay + b.perDay).toBeCloseTo(plan.perDay);
    }
  });

  it('clamps a share outside 0 to 100', () => {
    const plan = goalPlan(goal)!;
    expect(allocate(plan, ['sphere', 'open'], 140)[0].percent).toBe(100);
    expect(allocate(plan, ['sphere', 'open'], -5)[0].percent).toBe(0);
  });

  it('reads a saved slice defensively', () => {
    expect(readSetup({})).toEqual(SETUP_DEFAULTS);
    const s = readSetup({ step: 99, sources: ['sphere', 'sphere', 'nope', 'open', 'idx'], share: 'x' });
    expect(s.step).toBe(5);
    expect(s.sources).toEqual(['sphere', 'open']);
    expect(s.share).toBe(50);
    expect(readSetup({ step: 2.5 }).step).toBe(0);
  });

  it('names what is missing at each step', () => {
    const cfg = TIMEBLOCK_DEFAULTS;
    const none = readSetup({});
    expect(stepProblem('goal', {}, none, cfg)).toMatch(/income goal/);
    expect(stepProblem('goal', { goal: 1 }, none, cfg)).toMatch(/commission/);
    expect(stepProblem('goal', goal, none, cfg)).toBe('');
    expect(stepProblem('target', { goal: 1 }, none, cfg)).not.toBe('');
    expect(stepProblem('sources', goal, readSetup({ sources: ['sphere'] }), cfg)).toMatch(/Choose two/);
    expect(stepProblem('sources', goal, readSetup({ sources: ['sphere', 'open'] }), cfg)).toBe('');
    expect(stepProblem('week', goal, none, { ...cfg, days: [] })).toMatch(/at least one day/);
    expect(stepProblem('week', goal, none, { ...cfg, endOfDay: '09:00' })).toMatch(/Move it later/);
  });

  it('only produces a summary when every input is there', () => {
    expect(summarize({}, readSetup({}), TIMEBLOCK_DEFAULTS)).toBeNull();
    expect(summarize(goal, readSetup({ sources: ['sphere'] }), TIMEBLOCK_DEFAULTS)).toBeNull();
    const s = summarize(goal, readSetup({ sources: ['sphere', 'open'], share: 60 }), TIMEBLOCK_DEFAULTS)!;
    expect(s.allocation.map(a => a.perWeek)).toEqual([10, 6]);
  });

  it('writes a next action and a text plan from the reader’s numbers', () => {
    const s = summarize(goal, readSetup({ sources: ['sphere', 'open'] }), TIMEBLOCK_DEFAULTS)!;
    expect(nextAction(s.plan, s.allocation[0], TIMEBLOCK_DEFAULTS)).toContain('Sphere of influence and referrals');
    const text = planText(s, new Date('2026-10-20T12:00:00Z'));
    expect(text).toContain('3 a day');
    expect(text).toContain('rules of thumb, not measured results');
    expect(text).toContain('Prospecting (90 min)');
    expect(text).toContain('2026-10-20');
  });
});
