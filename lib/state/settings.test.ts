// @vitest-environment happy-dom
import { beforeEach, expect, it, vi } from 'vitest';
import { settingsStore, writeSettings } from './index';

beforeEach(() => {
  window.localStorage.clear();
  settingsStore.invalidate();
});

it('keeps a saved choice', () => {
  expect(writeSettings({ dark: true })).toBe(true);
  expect(settingsStore.get().dark).toBe(true);
});

it('drops a choice that could not be saved', () => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => { throw new Error('blocked'); } });
  expect(writeSettings({ fullWidth: true })).toBe(false);
  expect(settingsStore.get().fullWidth).toBeUndefined();
  vi.unstubAllGlobals();
});
