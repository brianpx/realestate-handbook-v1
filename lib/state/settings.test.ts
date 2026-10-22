// @vitest-environment happy-dom
import { beforeEach, expect, it, vi } from 'vitest';
import { settingsStore, textSize, writeSettings } from './index';

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

it('reads text size as medium until the reader picks another', () => {
  expect(textSize(settingsStore.get())).toBe('medium');
  expect(writeSettings({ textSize: 'large' })).toBe(true);
  expect(textSize(settingsStore.get())).toBe('large');
});

it('ignores a stored text size it does not know, and keeps the other settings', () => {
  window.localStorage.setItem('handbookSettings', JSON.stringify({ dark: true, textSize: 'huge' }));
  settingsStore.invalidate();
  expect(textSize(settingsStore.get())).toBe('medium');
  expect(settingsStore.get().dark).toBe(true);
});
