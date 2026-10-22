// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { coachStore } from '../coach';
import { COACH_KEY } from '../coach/schema';
import legacyState from './fixtures/legacy-handbook-state.json';
import { applyImport, exportProgress, settingsStore, stateStore } from './index';
import { SCHEMA_VERSION } from './schema';
import { buildExport, describeSummary, MAX_IMPORT_BYTES, parseImport } from './transfer';
import { createStore } from './store';
import { handbookStateSchema } from './schema';

const attempt = {
  id: 'a1', questionId: 'q1', questionVersion: 0, conceptId: 'c1', conceptVersion: 0,
  correct: false, confidence: 'think', kind: 'chapter_check', answeredAt: '2026-11-02T12:00:00.000Z', deviceId: 'dev',
};
const coach = { version: 1, deviceId: 'dev', attempts: [attempt], completions: { ch4: { checked: '2026-11-02T12:00:00.000Z' } }, future: { a: 1 } };

const file = (state: unknown, settings: unknown = {}, coachSnapshot?: unknown) => JSON.stringify(buildExport(state, settings, new Date('2026-11-02T12:00:00Z'), coachSnapshot));

describe('parseImport', () => {
  it('reads a file written from the static site\'s own stored objects, migrating them', () => {
    const r = parseImport(file({ ...legacyState, widgets: { ...legacyState.widgets, checkpoints: { 'ch4:0': { status: 'got' } } } }, { dark: true, fullWidth: false }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.version).toBe(SCHEMA_VERSION);
    expect(r.state.widgets.checkpoints).toEqual({ 'ch4:1': { status: 'got' } }); // the same migration a reload applies
    expect(r.settings).toMatchObject({ dark: true, fullWidth: false, version: SCHEMA_VERSION });
    expect(r.summary).toEqual({ chaptersRead: 4, checklistTicks: 2, scorecardEntries: 1, tools: 2, checkpointAnswers: 1 });
  });
  it('treats a missing half as nothing saved', () => {
    const r = parseImport(JSON.stringify({ format: 'handbook-progress', version: 1, handbookState: { read: { ch1: true } } }));
    expect(r.ok && r.settings.dark).toBeUndefined();
    expect(r.ok && r.summary.chaptersRead).toBe(1);
  });
  it('keeps keys it does not know', () => {
    const r = parseImport(file({ read: {}, somethingNew: { a: 1 } }));
    expect(r.ok && (r.state as Record<string, unknown>).somethingNew).toEqual({ a: 1 });
  });
  it.each([
    ['not json', '{nope', /not valid JSON/],
    ['another kind of file', JSON.stringify({ hello: 'world' }), /not a handbook progress file\.$/],
    ['a newer format version', JSON.stringify({ format: 'handbook-progress', version: 2 }), /not a handbook progress file\.$/],
    ['an array', '[1,2]', /not a handbook progress file\.$/],
  ])('refuses %s, saying why', (_, text, message) => {
    const r = parseImport(text);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toMatch(message);
  });
  it('refuses a huge file', () => {
    expect(parseImport('x'.repeat(MAX_IMPORT_BYTES + 1))).toEqual({ ok: false, error: 'That file is too large to be a handbook progress file.' });
  });
  it('recovers a damaged field instead of refusing the whole file', () => {
    const r = parseImport(file({ read: 'oops', calc: { goal: 80000 } }));
    expect(r.ok && r.state.read).toEqual({});
    expect(r.ok && r.state.calc).toEqual({ goal: 80000 });
  });
  it('keeps handbookCoach when the file has it, and still reads a file that leaves it out', () => {
    const withCoach = parseImport(file({ read: { ch1: true } }, {}, coach));
    expect(withCoach.ok).toBe(true);
    if (!withCoach.ok) return;
    expect(withCoach.coach).toMatchObject({ deviceId: 'dev', attempts: [attempt], completions: { ch4: { checked: '2026-11-02T12:00:00.000Z' } }, future: { a: 1 } });
    expect(withCoach.state.read).toEqual({ ch1: true });
    expect(JSON.parse(file({ read: { ch1: true } }, {}, coach)).handbookCoach).toMatchObject({ deviceId: 'dev' });

    const without = parseImport(file({ read: { ch1: true } }));
    expect(without.ok && without.coach).toBeUndefined();
    expect(without.ok && without.state.read).toEqual({ ch1: true });
    expect(JSON.parse(file({ read: { ch1: true } }))).not.toHaveProperty('handbookCoach');

    const missing = parseImport(JSON.stringify({ format: 'handbook-progress', version: 1, handbookState: { read: { ch2: true } } }));
    expect(missing.ok && missing.coach).toBeUndefined();
    expect(missing.ok && missing.state.read).toEqual({ ch2: true });
  });
});

describe('handbookCoach transfer', () => {
  beforeEach(() => {
    window.localStorage.clear();
    stateStore.invalidate();
    settingsStore.invalidate();
    coachStore.invalidate();
  });

  it('exports the current coach snapshot', () => {
    window.localStorage.setItem(COACH_KEY, JSON.stringify(coach));
    coachStore.invalidate();
    expect(exportProgress()).toMatchObject({ handbookCoach: { deviceId: 'dev', attempts: [attempt], future: { a: 1 } } });
    expect(exportProgress(coachStore.get()).handbookCoach).toMatchObject({ deviceId: 'dev', attempts: [attempt] });
    window.localStorage.removeItem(COACH_KEY);
    coachStore.invalidate();
    expect(exportProgress().handbookCoach).toEqual({ version: 1, deviceId: '', attempts: [], completions: {} });
  });

  it('restores handbookCoach into the live store and keeps a pre-import backup', () => {
    window.localStorage.setItem(COACH_KEY, JSON.stringify({ deviceId: 'old', attempts: [], completions: { ch1: { read: '2026-10-01T00:00:00.000Z' } } }));
    coachStore.invalidate();
    const r = parseImport(file({ read: { ch2: true } }, { dark: true }, coach));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(applyImport(r, coachStore)).toBe(true);
    expect(coachStore.get().attempts).toEqual([attempt]);
    expect(coachStore.get()).toHaveProperty('future', { a: 1 });
    expect(JSON.parse(window.localStorage.getItem(COACH_KEY)!).attempts).toEqual([attempt]);
    expect(JSON.parse(window.localStorage.getItem(`${COACH_KEY}.pre-import`)!).deviceId).toBe('old');
    expect(stateStore.get().read).toEqual({ ch2: true });
    expect(settingsStore.get().dark).toBe(true);
  });

  it('leaves the coach store alone when the file has no handbookCoach', () => {
    window.localStorage.setItem(COACH_KEY, JSON.stringify({ deviceId: 'keep', attempts: [], completions: {} }));
    window.localStorage.setItem('handbookState', JSON.stringify({ read: { ch9: true } }));
    coachStore.invalidate();
    stateStore.invalidate();
    const r = parseImport(file({ read: { ch1: true } }));
    expect(r.ok && r.coach).toBeUndefined();
    if (!r.ok) return;
    expect(applyImport(r, coachStore)).toBe(true);
    expect(coachStore.get().deviceId).toBe('keep');
    expect(JSON.parse(window.localStorage.getItem(COACH_KEY)!).deviceId).toBe('keep');
    expect(window.localStorage.getItem(`${COACH_KEY}.pre-import`)).toBeNull();
    expect(stateStore.get().read).toEqual({ ch1: true });
    expect(JSON.parse(window.localStorage.getItem('handbookState.pre-import')!).read).toEqual({ ch9: true });
  });
});

describe('describeSummary', () => {
  it('words singular and plural counts', () => {
    expect(describeSummary({ chaptersRead: 1, checklistTicks: 1, scorecardEntries: 1, tools: 1, checkpointAnswers: 1 })).toBe('1 section read, 1 checklist tick, 1 scorecard entry, 1 checkpoint answer, 1 tool with saved work');
    expect(describeSummary({ chaptersRead: 4, checklistTicks: 0, scorecardEntries: 2, tools: 3, checkpointAnswers: 0 })).toBe('4 sections read, 0 checklist ticks, 2 scorecard entries, 0 checkpoint answers, 3 tools with saved work');
  });
});

describe('store.replace', () => {
  it('overwrites what is stored and tells subscribers', () => {
    window.localStorage.clear();
    const store = createStore({ key: 'k', schema: handbookStateSchema });
    store.update(s => { s.read.ch1 = true; });
    let calls = 0;
    store.subscribe(() => { calls++; });
    const next = handbookStateSchema.parse({ read: { ch9: true } });
    expect(store.replace(next)).toBe(true);
    expect(store.get().read).toEqual({ ch9: true });
    expect(JSON.parse(window.localStorage.getItem('k')!).read).toEqual({ ch9: true });
    expect(calls).toBe(1);
  });
});
