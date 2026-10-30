import { describe, expect, it } from 'vitest';
import { dayOfWeek } from './dates';
import {
  buildPlan, CHAPTERS, daysBehind, longSessions, nextSession, outstandingExercises, PACES, reflow, sessionStatus,
  type Completion, type PlanInput,
} from './plan';

const MON = '2026-10-19'; // a Monday
const MWF = [1, 3, 5];
const input = (over: Partial<PlanInput> = {}): PlanInput => ({ startDate: MON, pace: 'default', studyDays: [1, 2, 3, 4, 5], ...over });
const done: Completion = { read: 'x', did: 'x', checked: 'x' };
const partly: Completion = { read: 'x', checked: 'x' };

const perDay = (dates: string[]) => dates.reduce<Record<string, number>>((m, d) => ({ ...m, [d]: (m[d] ?? 0) + 1 }), {});
const perWeek = (p: { week: number }[]) => p.reduce<Record<number, number>>((m, s) => ({ ...m, [s.week]: (m[s.week] ?? 0) + 1 }), {});

describe('buildPlan', () => {
  it('flattens the preface units in order', () => {
    expect(CHAPTERS.map(c => c.chapter)).toEqual(['ch1', 'ch4', 'ch12', 'ch2', 'ch5', 'ch6', 'ch7', 'ch8', 'ch9', 'ch3', 'ch10', 'ch11', 'ch13']);
  });

  it.each(['sprint', 'default', 'relaxed'] as const)('places every chapter exactly once, in order, at %s pace', pace => {
    const { sessions } = buildPlan(input({ pace, studyDays: [0, 1, 2, 3, 4, 5, 6] }));
    expect(sessions.map(s => s.chapter)).toEqual(CHAPTERS.map(c => c.chapter));
    expect(sessions.every((s, i) => i === 0 || s.date > sessions[i - 1]!.date)).toBe(true);
  });

  it.each(['sprint', 'default', 'relaxed'] as const)('never exceeds the weekly cap or one session a day at %s pace', pace => {
    const { sessions } = buildPlan(input({ pace, studyDays: [0, 1, 2, 3, 4, 5, 6] }));
    expect(Math.max(...Object.values(perWeek(sessions)))).toBeLessThanOrEqual(PACES[pace].perWeek);
    expect(Math.max(...Object.values(perDay(sessions.map(s => s.date))))).toBe(1);
  });

  it('only uses the chosen study days and never a day before the start', () => {
    const { sessions } = buildPlan(input({ studyDays: MWF, startDate: '2026-10-20' }));
    for (const s of sessions) {
      expect(MWF).toContain(dayOfWeek(s.date));
      expect(s.date >= '2026-10-20').toBe(true);
    }
    expect(sessions[0]!.date).toBe('2026-10-21');
  });

  it('finishes the default pace in four weeks with five study days', () => {
    const plan = buildPlan(input());
    expect(Object.values(perWeek(plan.sessions))).toEqual([4, 4, 4, 1]);
    expect(plan.warnings).toEqual([]);
  });

  it('extends the end date and warns, rather than compressing, when study days are too few', () => {
    const plan = buildPlan(input({ studyDays: [1, 3] }));
    expect(plan.sessions).toHaveLength(13);
    expect(Math.max(...Object.values(perWeek(plan.sessions)))).toBe(2);
    expect(plan.warnings).toEqual([
      { code: 'too-few-study-days', studyDays: 2, needed: 4 },
      { code: 'extended', finishesInWeek: 7, targetWeeks: 4 },
    ]);
  });

  it('keeps the sprint inside two weeks with every day', () => {
    const plan = buildPlan(input({ pace: 'sprint', studyDays: [0, 1, 2, 3, 4, 5, 6] }));
    expect(plan.endDate).toBe('2026-10-31');
    expect(plan.warnings).toEqual([]);
  });

  it('puts the relaxed pace at two a week without extending past eight weeks', () => {
    const plan = buildPlan(input({ pace: 'relaxed', studyDays: [1, 4] }));
    expect(Math.max(...Object.values(perWeek(plan.sessions)))).toBe(2);
    expect(plan.warnings).toEqual([]);
  });

  it('is DST-safe: sessions land on the same weekdays across the November change', () => {
    const { sessions } = buildPlan(input({ studyDays: MWF }));
    for (const s of sessions) expect(MWF).toContain(dayOfWeek(s.date));
    expect(sessions.some(s => s.date > '2026-11-01')).toBe(true);
  });

  it('rejects empty or invalid study days', () => {
    expect(() => buildPlan(input({ studyDays: [] }))).toThrow(RangeError);
    expect(() => buildPlan(input({ studyDays: [7] }))).toThrow(RangeError);
  });
});

describe('sessionStatus', () => {
  it('needs read, exercise and check for complete', () => {
    expect(sessionStatus(done)).toBe('complete');
    expect(sessionStatus(partly)).toBe('partly');
    expect(sessionStatus({ read: 'x' })).toBe('todo');
    expect(sessionStatus(undefined)).toBe('todo');
  });
});

describe('reflow', () => {
  const original = buildPlan(input());

  it('leaves completed sessions exactly where they were', () => {
    const completions = { ch1: done, ch4: done };
    const next = reflow(input(), original.sessions, completions, '2026-11-09');
    for (const id of ['ch1', 'ch4']) {
      expect(next.sessions.find(s => s.id === id)).toEqual(original.sessions.find(s => s.id === id));
    }
  });

  it('keeps every chapter exactly once', () => {
    const next = reflow(input(), original.sessions, { ch1: done }, '2026-11-09');
    expect(next.sessions.map(s => s.chapter).sort()).toEqual(CHAPTERS.map(c => c.chapter).sort());
  });

  it('never piles missed sessions onto today', () => {
    const next = reflow(input(), original.sessions, { ch1: done }, '2026-11-09');
    const remaining = next.sessions.filter(s => s.id !== 'ch1');
    expect(remaining.every(s => s.date >= '2026-11-09')).toBe(true);
    expect(Math.max(...Object.values(perDay(remaining.map(s => s.date))))).toBe(1);
    expect(remaining.filter(s => s.date === '2026-11-09')).toHaveLength(1);
    expect(next.warnings.some(w => w.code === 'extended')).toBe(true);
  });

  it('keeps the weekly cap across frozen and re-placed sessions together', () => {
    const next = reflow(input(), original.sessions, { ch1: done, ch4: done, ch12: done }, '2026-10-22');
    expect(Math.max(...Object.values(perWeek(next.sessions)))).toBeLessThanOrEqual(PACES.default.perWeek);
    expect(Math.max(...Object.values(perDay(next.sessions.map(s => s.date))))).toBe(1);
  });

  it('does not use a day already taken by a session finished early', () => {
    const early = original.sessions.map(s => (s.id === 'ch2' ? { ...s, date: '2026-10-22' } : s));
    const next = reflow(input(), early, { ch2: done }, '2026-10-20');
    expect(next.sessions.filter(s => s.date === '2026-10-22')).toHaveLength(1);
  });

  it('freezes a partly done session and lists its exercise instead of rescheduling', () => {
    const completions = { ch1: partly };
    const next = reflow(input(), original.sessions, completions, '2026-11-09');
    expect(next.sessions.find(s => s.id === 'ch1')).toEqual(original.sessions.find(s => s.id === 'ch1'));
    expect(outstandingExercises(completions)).toEqual(['ch1']);
  });

  it('starts at the start date if today is earlier', () => {
    const next = reflow(input(), original.sessions, {}, '2026-10-01');
    expect(next.sessions[0]!.date).toBe(MON);
  });

  it('with nothing done and today at the start, equals the original plan', () => {
    expect(reflow(input(), original.sessions, {}, MON)).toEqual(original);
  });

  it('honours new study days chosen when rescheduling', () => {
    const next = reflow(input({ studyDays: [2, 4] }), original.sessions, {}, '2026-10-26');
    for (const s of next.sessions) expect([2, 4]).toContain(dayOfWeek(s.date));
  });
});

describe('plan helpers', () => {
  const plan = buildPlan(input());

  it('picks the first todo session as next and measures days behind as a plain number', () => {
    const next = nextSession(plan.sessions, { ch1: done });
    expect(next?.id).toBe('ch4');
    expect(daysBehind(next, '2026-10-20')).toBe(0);
    expect(daysBehind(next, '2026-10-28')).toBe(8);
    expect(daysBehind(undefined, '2026-10-28')).toBe(0);
  });

  it('skips partly done sessions when choosing the next one', () => {
    expect(nextSession(plan.sessions, { ch1: partly, ch4: done })?.id).toBe('ch12');
  });

  it('flags sessions over the time limit only when minutes exist', () => {
    expect(longSessions({})).toEqual([]);
    expect(longSessions({ ch4: { read: 5, do: 45 }, ch2: { read: 6, do: 70 } })).toEqual(['ch2']);
  });
});
