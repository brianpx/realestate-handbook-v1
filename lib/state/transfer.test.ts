// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import legacyState from './fixtures/legacy-handbook-state.json';
import { SCHEMA_VERSION } from './schema';
import { buildExport, describeSummary, MAX_IMPORT_BYTES, parseImport } from './transfer';
import { createStore } from './store';
import { handbookStateSchema } from './schema';

const file = (state: unknown, settings: unknown = {}) => JSON.stringify(buildExport(state, settings, new Date('2026-11-02T12:00:00Z')));

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
