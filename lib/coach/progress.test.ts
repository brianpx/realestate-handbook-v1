// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createStore } from '../state/store';
import { applyPlan, deriveConceptStates, markStep, mergeAttempts, recordAttempt, reschedule, savePlan, type AttemptInput } from './actions';
import { COACH_KEY, coachSchema } from './schema';
import type { Attempt } from './types';

const make = () => createStore({ key: COACH_KEY, schema: coachSchema });
const input: AttemptInput = {
  questionId: 'ch4.speed-to-lead.two-layers', questionVersion: 1, conceptId: 'ch4.speed-to-lead', conceptVersion: 1,
  correct: true, confidence: 'sure', kind: 'chapter_check',
};
let n = 0;
const deps = (iso: string) => ({ now: () => new Date(iso), newId: () => `id-${++n}` });

beforeEach(() => { window.localStorage.clear(); n = 0; });

describe('recordAttempt', () => {
  it('stores an immutable attempt with an id, a timestamp and a stable device id', () => {
    const store = make();
    const a = recordAttempt(store, input, deps('2026-10-19T14:00:00Z'));
    const b = recordAttempt(store, input, deps('2026-10-19T14:01:00Z'));
    expect(a.answeredAt).toBe('2026-10-19T14:00:00.000Z');
    expect(a.id).not.toBe(b.id);
    expect(a.deviceId).toBe(b.deviceId);
    expect(store.get().attempts).toEqual([a, b]);
  });

  it('persists across a reload', () => {
    recordAttempt(make(), input, deps('2026-10-19T14:00:00Z'));
    const reloaded = make();
    expect(reloaded.get().attempts).toHaveLength(1);
    expect(reloaded.get().deviceId).not.toBe('');
  });

  it('keeps the attempt for this visit when storage is blocked', () => {
    const store = make();
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => { throw new Error('blocked'); } });
    recordAttempt(store, input, deps('2026-10-19T14:00:00Z'));
    expect(store.get().attempts).toHaveLength(1);
    vi.unstubAllGlobals();
  });
});

describe('stored data', () => {
  it('drops a malformed attempt without losing the good ones', () => {
    const good = recordAttempt(make(), input, deps('2026-10-19T14:00:00Z'));
    const raw = JSON.parse(window.localStorage.getItem(COACH_KEY)!);
    raw.attempts.push({ id: 'bad', correct: 'yes' }, 'junk', null);
    window.localStorage.setItem(COACH_KEY, JSON.stringify(raw));
    expect(make().get().attempts).toEqual([good]);
  });

  it('falls back to empty on corrupt JSON and on a non-array attempts field', () => {
    window.localStorage.setItem(COACH_KEY, '{nope');
    expect(make().get().attempts).toEqual([]);
    window.localStorage.setItem(COACH_KEY, JSON.stringify({ attempts: 'x', completions: 7 }));
    const s = make().get();
    expect(s.attempts).toEqual([]);
    expect(s.completions).toEqual({});
  });

  it('keeps unknown keys so a newer build does not lose data to an older one', () => {
    window.localStorage.setItem(COACH_KEY, JSON.stringify({ future: { a: 1 } }));
    expect(make().get()).toHaveProperty('future', { a: 1 });
  });

  it('does not touch the static site key', () => {
    window.localStorage.setItem('handbookState', '{"read":{"ch1":true}}');
    recordAttempt(make(), input, deps('2026-10-19T14:00:00Z'));
    expect(window.localStorage.getItem('handbookState')).toBe('{"read":{"ch1":true}}');
  });
});

describe('mergeAttempts', () => {
  it('adds only attempts it has not seen, once each', () => {
    const store = make();
    const mine = recordAttempt(store, input, deps('2026-10-19T14:00:00Z'));
    const theirs: Attempt = { ...mine, id: 'other-device-1', deviceId: 'd2' };
    expect(mergeAttempts(store, [mine, theirs, { ...theirs }])).toBe(1);
    expect(mergeAttempts(store, [theirs])).toBe(0);
    expect(store.get().attempts).toHaveLength(2);
  });
});

describe('markStep', () => {
  it('records a step and never clears it or moves its time', () => {
    const store = make();
    markStep(store, 'ch4', 'read', new Date('2026-10-19T14:00:00Z'));
    markStep(store, 'ch4', 'read', new Date('2026-10-25T14:00:00Z'));
    markStep(store, 'ch4', 'did', new Date('2026-10-20T14:00:00Z'));
    expect(store.get().completions.ch4).toEqual({ read: '2026-10-19T14:00:00.000Z', did: '2026-10-20T14:00:00.000Z' });
  });
});

describe('savePlan and deriveConceptStates', () => {
  it('saves plan prefs', () => {
    const store = make();
    const plan = { startDate: '2026-10-19', pace: 'default' as const, studyDays: [1, 3, 5], time: '08:00', tz: 'America/New_York', updatedAt: '2026-10-19T12:00:00Z', sessions: [] };
    savePlan(store, plan);
    expect(make().get().plan).toEqual(plan);
  });

  it('derives concept state from stored attempts, using current concept versions only', () => {
    const store = make();
    recordAttempt(store, input, deps('2026-10-19T14:00:00Z'));
    recordAttempt(store, { ...input, conceptId: 'ch4.crm-setup', conceptVersion: 0 }, deps('2026-10-19T14:00:00Z'));
    const states = deriveConceptStates(store.get(), 'America/New_York');
    expect(states['ch4.speed-to-lead']).toMatchObject({ box: 1, due: '2026-10-20' });
    expect(states['ch4.crm-setup']).toBeUndefined();
  });
});

describe('applyPlan and reschedule', () => {
  const layout = { startDate: '2026-10-19', pace: 'default' as const, studyDays: [1, 2, 3, 4, 5], tz: 'America/New_York' };

  it('builds the schedule the first time and stores it', () => {
    const store = make();
    const plan = applyPlan(store, layout, '2026-10-19', new Date('2026-10-19T12:00:00Z'));
    expect(plan.sessions).toHaveLength(13);
    expect(make().get().plan).toMatchObject({ startDate: '2026-10-19', pace: 'default', tz: 'America/New_York', time: '08:00' });
    expect(make().get().plan!.sessions).toEqual(plan.sessions);
  });

  it('reschedules from today and keeps finished sessions where they were', () => {
    const store = make();
    applyPlan(store, layout, '2026-10-19');
    const original = store.get().plan!.sessions;
    markStep(store, 'ch1', 'read'); markStep(store, 'ch1', 'did'); markStep(store, 'ch1', 'checked');
    const plan = reschedule(store, '2026-11-09')!;
    expect(plan.sessions.find(s => s.id === 'ch1')).toEqual(original.find(s => s.id === 'ch1'));
    const rest = plan.sessions.filter(s => s.id !== 'ch1');
    expect(rest.every(s => s.date >= '2026-11-09')).toBe(true);
    expect(new Set(rest.map(s => s.date)).size).toBe(rest.length);
    expect(make().get().plan!.sessions).toEqual(plan.sessions);
  });

  it('does nothing without a plan', () => {
    expect(reschedule(make(), '2026-10-19')).toBeUndefined();
  });

  it('applies a changed pace through a reflow', () => {
    const store = make();
    applyPlan(store, layout, '2026-10-19');
    const plan = applyPlan(store, { ...layout, pace: 'relaxed', studyDays: [1, 4] }, '2026-10-26');
    expect(plan.sessions.every(s => s.date >= '2026-10-26')).toBe(true);
    expect(store.get().plan!.pace).toBe('relaxed');
  });
});
