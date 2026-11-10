import { describe, expect, it } from 'vitest';
import { buildPlan, type Completion } from './plan';
import { formatDay, nextUp, progressCounts, scheduleRows, warningText } from './today';

const plan = buildPlan({ startDate: '2026-10-19', pace: 'default', studyDays: [1, 2, 3, 4, 5] }); // ch1 Mon, ch2 Tue, ch3 Wed, ch4 Thu
const done: Completion = { read: 'x', did: 'x', checked: 'x' };
const partly: Completion = { read: 'x', checked: 'x' };

describe('nextUp', () => {
  it('is today when the first todo session is dated today', () => {
    expect(nextUp(plan.sessions, {}, '2026-10-19')).toMatchObject({ session: { id: 'ch1' }, when: 'today', daysBehind: 0 });
  });

  it('is later before the plan starts or when the next date is ahead', () => {
    expect(nextUp(plan.sessions, {}, '2026-10-12')).toMatchObject({ when: 'later' });
    expect(nextUp(plan.sessions, { ch1: done }, '2026-10-19')).toMatchObject({ session: { id: 'ch2' }, when: 'later' });
  });

  it('reports days behind as a plain number, still offering the same session', () => {
    expect(nextUp(plan.sessions, { ch1: done }, '2026-10-30')).toMatchObject({ session: { id: 'ch2' }, when: 'behind', daysBehind: 10 });
  });

  it('skips partly done sessions and carries the finished steps', () => {
    expect(nextUp(plan.sessions, { ch1: partly }, '2026-10-19')?.session.id).toBe('ch2');
    expect(nextUp(plan.sessions, { ch1: { read: 'x' } }, '2026-10-19')?.steps).toEqual({ read: true, did: false, checked: false });
  });

  it('is undefined when nothing is left', () => {
    const all = Object.fromEntries(plan.sessions.map(s => [s.id, done]));
    expect(nextUp(plan.sessions, all, '2026-12-01')).toBeUndefined();
  });

  it('follows the saved dates of a plan made in the old reading order (ch1, ch4, ch12, ch2)', () => {
    const old = ['ch1', 'ch4', 'ch12', 'ch2'].map((id, i) => ({ id, chapter: id, unit: 1, date: `2026-10-${19 + i}`, week: 1 }));
    expect(nextUp(old, { ch1: done }, '2026-10-20')).toMatchObject({ session: { id: 'ch4' }, when: 'today' });
    expect(nextUp(old, { ch1: done, ch4: done }, '2026-10-21')).toMatchObject({ session: { id: 'ch12' }, when: 'today' });
    expect(scheduleRows(old, { ch1: done }, '2026-10-20').filter(r => r.isNext).map(r => r.session.id)).toEqual(['ch4']);
  });

  it('breaks a date tie by reading order', () => {
    const tied = ['ch3', 'ch2'].map(id => ({ id, chapter: id, unit: 1, date: '2026-10-20', week: 1 }));
    expect(nextUp(tied, {}, '2026-10-20')?.session.id).toBe('ch2');
  });
});

describe('scheduleRows and progressCounts', () => {
  it('lists every session in date order, marking the next one', () => {
    const rows = scheduleRows(plan.sessions, { ch1: done, ch2: partly }, '2026-10-20');
    expect(rows).toHaveLength(13);
    expect(rows.map(r => r.status).slice(0, 3)).toEqual(['complete', 'partly', 'todo']);
    expect(rows.filter(r => r.isNext).map(r => r.session.id)).toEqual(['ch3']);
    expect(rows.every((r, i) => i === 0 || r.session.date >= rows[i - 1]!.session.date)).toBe(true);
  });

  it('counts only complete sessions', () => {
    expect(progressCounts(plan.sessions, { ch1: done, ch2: partly })).toEqual({ complete: 1, total: 13 });
  });
});

describe('text', () => {
  it('formats a date in its own calendar', () => {
    expect(formatDay('2026-10-20')).toBe('Tue, Oct 20');
    expect(formatDay('2026-11-01')).toBe('Sun, Nov 1');
  });

  it('words each warning', () => {
    expect(warningText({ code: 'too-few-study-days', studyDays: 2, needed: 4 })).toContain('needs 4 study days');
    expect(warningText({ code: 'extended', finishesInWeek: 7, targetWeeks: 4 })).toBe('At this pace the plan finishes in week 7, not week 4.');
  });
});
