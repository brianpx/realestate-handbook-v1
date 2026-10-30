// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import legacyState from './fixtures/legacy-handbook-state.json';
import { handbookStateSchema, migrate, SCHEMA_VERSION, settingsSchema } from './schema';
import { createStore } from './store';

beforeEach(() => window.localStorage.clear());

describe('createStore', () => {
  it('starts from defaults when nothing is stored', () => {
    const store = createStore({ key: 'k', schema: handbookStateSchema });
    expect(store.get().read).toEqual({});
    expect(store.get().widgets).toEqual({});
  });

  it('reads what the static site wrote, keeping unknown keys', () => {
    window.localStorage.setItem('k', JSON.stringify({ read: { ch1: true }, calc: { goal: 80000 }, extra: 1 }));
    const store = createStore({ key: 'k', schema: handbookStateSchema });
    expect(store.get().read).toEqual({ ch1: true });
    expect(store.get().calc).toEqual({ goal: 80000 });
    expect(store.get()).toHaveProperty('extra', 1);
  });

  it('recovers a bad field without losing the others', () => {
    window.localStorage.setItem('k', JSON.stringify({ read: 'oops', calc: { a: 1 } }));
    const store = createStore({ key: 'k', schema: handbookStateSchema });
    expect(store.get().read).toEqual({});
    expect(store.get().calc).toEqual({ a: 1 });
  });

  it('falls back to defaults on corrupt JSON', () => {
    window.localStorage.setItem('k', '{not json');
    const store = createStore({ key: 'k', schema: settingsSchema });
    expect(store.get().dark).toBeUndefined();
  });

  it('persists updates, notifies subscribers and returns a new snapshot', () => {
    const store = createStore({ key: 'k', schema: handbookStateSchema });
    const listener = vi.fn();
    store.subscribe(listener);
    const before = store.get();
    expect(store.update(s => { s.read.ch1 = true; })).toBe(true);
    expect(listener).toHaveBeenCalledOnce();
    expect(store.get()).not.toBe(before);
    expect(JSON.parse(window.localStorage.getItem('k')!).read).toEqual({ ch1: true });
  });

  it('keeps working in memory and reports false when storage is blocked', () => {
    const store = createStore({ key: 'k', schema: handbookStateSchema });
    const real = window.localStorage;
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => { throw new Error('blocked'); },
    });
    expect(store.update(s => { s.read.ch2 = true; })).toBe(false);
    expect(store.get().read.ch2).toBe(true);
    vi.unstubAllGlobals();
    expect(window.localStorage).toBe(real);
  });

  it('re-reads storage after another tab writes', () => {
    const store = createStore({ key: 'k', schema: settingsSchema });
    store.get();
    const listener = vi.fn();
    store.subscribe(listener);
    window.localStorage.setItem('k', JSON.stringify({ dark: true }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'k' }));
    expect(listener).toHaveBeenCalled();
    expect(store.get().dark).toBe(true);
  });
});

describe('versioning and recovery', () => {
  // The fixture is hand-written to match what the static site stored (no `version` key). Replace it with a
  // payload exported from the live static site when one is available.
  it('migrates a legacy payload without losing any field', () => {
    window.localStorage.setItem('k', JSON.stringify(legacyState));
    const store = createStore({ key: 'k', schema: handbookStateSchema, migrate });
    expect(store.get()).toEqual({ ...legacyState, version: SCHEMA_VERSION });
  });

  it('moves Chapter 4 and 5 checkpoint answers down one place where a question was inserted', () => {
    const stored = { widgets: { checkpoints: { 'ch4:0': { text: 'six parts', status: 'got' }, 'ch4:2': { status: 'review' }, 'ch5:0': { text: 'x' }, 'ch5:1': { text: 'y' }, 'ch5:2': { status: 'got' }, 'ch6:1': { text: 'z' } }, other: { a: 1 } } };
    window.localStorage.setItem('k', JSON.stringify(stored));
    const state = createStore({ key: 'k', schema: handbookStateSchema, migrate }).get();
    expect(state.widgets.checkpoints).toEqual({ 'ch4:1': { text: 'six parts', status: 'got' }, 'ch4:3': { status: 'review' }, 'ch5:0': { text: 'x' }, 'ch5:2': { text: 'y' }, 'ch5:3': { status: 'got' }, 'ch6:1': { text: 'z' } });
    expect(state.widgets.other).toEqual({ a: 1 });
    expect(window.localStorage.getItem('k.backup')).toBe(JSON.stringify(stored));
  });

  it('keeps the original legacy payload in a backup before the first write', () => {
    const original = JSON.stringify(legacyState);
    window.localStorage.setItem('k', original);
    const store = createStore({ key: 'k', schema: handbookStateSchema, migrate });
    store.update(s => { s.read.ch3 = true; });
    expect(window.localStorage.getItem('k.backup')).toBe(original);
    expect(JSON.parse(window.localStorage.getItem('k')!).version).toBe(SCHEMA_VERSION);
  });

  it('does not back up a payload that is already current', () => {
    window.localStorage.setItem('k', JSON.stringify({ version: SCHEMA_VERSION, read: { ch1: true } }));
    createStore({ key: 'k', schema: handbookStateSchema, migrate }).get();
    expect(window.localStorage.getItem('k.backup')).toBeNull();
  });

  it('preserves corrupt JSON in a backup instead of overwriting it', () => {
    window.localStorage.setItem('k', '{not json');
    const store = createStore({ key: 'k', schema: handbookStateSchema, migrate });
    store.update(s => { s.read.ch1 = true; });
    expect(window.localStorage.getItem('k.backup')).toBe('{not json');
  });

  it('preserves a payload that is the wrong top-level type', () => {
    window.localStorage.setItem('k', '[1,2]');
    createStore({ key: 'k', schema: handbookStateSchema, migrate }).get();
    expect(window.localStorage.getItem('k.backup')).toBe('[1,2]');
  });

  it('never overwrites an existing backup', () => {
    window.localStorage.setItem('k.backup', 'first');
    window.localStorage.setItem('k', '{not json');
    createStore({ key: 'k', schema: handbookStateSchema, migrate }).get();
    expect(window.localStorage.getItem('k.backup')).toBe('first');
  });

  it('leaves a payload from a newer build untouched', () => {
    const newer = { version: SCHEMA_VERSION + 1, read: {} };
    expect(migrate(newer)).toBe(newer);
  });
});
