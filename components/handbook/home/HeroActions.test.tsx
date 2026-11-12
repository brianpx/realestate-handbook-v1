// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { settingsStore, stateStore } from '@/lib/state';
import { HeroActions } from './HeroActions';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

async function render(locked: readonly string[]) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  await act(() => root.render(<HeroActions locked={locked} />));
  const links = [...host.querySelectorAll('a')].map(a => [a.textContent, a.getAttribute('href')]);
  return { links, done: async () => { await act(() => root.unmount()); host.remove(); } };
}

beforeEach(() => window.localStorage.clear());
afterEach(() => {
  window.localStorage.clear();
  stateStore.invalidate();
  settingsStore.invalidate();
});

it('targets the first open chapter that is not read when more chapters are open', async () => {
  stateStore.update(s => { s.read.ch1 = true; s.read.ch2 = true; });
  const { links, done } = await render(['ch4', 'ch5', 'ch6', 'ch7']);
  expect(links).toEqual([['Continue: Chapter 3', '/handbook/ch3']]);
  await done();
});

it('starts at the first open chapter when an earlier chapter is locked', async () => {
  const { links, done } = await render(['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6']);
  expect(links[0]).toEqual(['Read Chapter 7', '/handbook/ch7']);
  expect(links).toHaveLength(1);
  await done();
});

it('omits the Chapter 7 button when Chapter 7 is locked', async () => {
  const { links, done } = await render(['ch7']);
  expect(links).toEqual([['Read Chapter 1', '/handbook/ch1']]);
  await done();
});

it('renders nothing when no chapter is open', async () => {
  const { links, done } = await render(Array.from({ length: 13 }, (_, i) => `ch${i + 1}`));
  expect(links).toEqual([]);
  await done();
});

it('falls back to the first open chapter when every open chapter is read', async () => {
  stateStore.update(s => { s.read.ch1 = true; s.read.ch7 = true; });
  const { links, done } = await render(['ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch8', 'ch9', 'ch10', 'ch11', 'ch12', 'ch13']);
  expect(links[0]).toEqual(['Read Chapter 1', '/handbook/ch1']);
  await done();
});
