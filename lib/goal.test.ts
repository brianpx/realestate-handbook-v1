import { describe, expect, it } from 'vitest';
import { fmtNum, fmtPerDay, goalPlan, goalVerdict } from './goal';

const example = { goal: 80000, commission: 6500, apc: 3, cpa: 20, weeks: 48 };

describe('goalPlan', () => {
  it('reproduces the worked example in the chapter', () => {
    const plan = goalPlan(example)!;
    expect(plan.closings).toBe(13); // 12.3 rounded up
    expect(plan.appts).toBe(39);
    expect(plan.convs).toBe(780);
    expect(plan.perWeek).toBeCloseTo(16.25);
    expect(plan.perDay).toBeCloseTo(3.25);
    expect(fmtPerDay(plan.perDay)).toBe('3 to 4');
    expect(fmtNum(plan.perWeek)).toBe('16');
  });

  it('is null until every input is a positive number', () => {
    expect(goalPlan({ ...example, goal: undefined })).toBeNull();
    expect(goalPlan({ ...example, weeks: 0 })).toBeNull();
    expect(goalPlan({ ...example, cpa: NaN })).toBeNull();
  });

  it('scales conversations for the stress test', () => {
    expect(goalPlan(example, 1.5)!.convs).toBe(1170);
  });

  it('counts a goal that divides evenly without rounding up', () => {
    expect(goalPlan({ ...example, goal: 13000 })!.closings).toBe(2);
  });
});

describe('fmtPerDay', () => {
  it.each([[0.4, '0.4'], [3, '3'], [3.25, '3 to 4'], [0.99, '1.0']])('%s -> %s', (n, out) => {
    expect(fmtPerDay(n)).toBe(out);
  });
});

describe('goalVerdict', () => {
  const as = goalPlan(example)!;
  it('says the example sits inside Table 8.2', () => {
    expect(goalVerdict(as, 1, as)).toMatch(/^That sits inside the 15 to 25/);
  });
  it('notes a cushion below the range and a stretch above it', () => {
    const low = goalPlan({ ...example, goal: 20000 })!;
    expect(goalVerdict(low, 1, low)).toMatch(/leaves you a cushion/);
    const high = goalPlan({ ...example, goal: 200000 })!;
    expect(goalVerdict(high, 1, high)).toMatch(/above the top/);
  });
  it('prefixes the stress-test comparison', () => {
    const shown = goalPlan(example, 1.25)!;
    expect(goalVerdict(shown, 1.25, as)).toMatch(/^At 25% more conversations than planned you would need 20 a week, up from 16\./);
  });
});
