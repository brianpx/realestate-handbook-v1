// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { settingsStore, stateStore } from '@/lib/state';
import { Hero } from './Hero';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const LOCKED = ['ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch8', 'ch9', 'ch10', 'ch11', 'ch12', 'ch13', 'app-a'];
type Props = Parameters<typeof Hero>[0];

async function render(props: Props) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  await act(() => root.render(<Hero {...props} />));
  return { host, done: async () => { await act(() => root.unmount()); host.remove(); } };
}

const free: Props = { free: true, suspended: false, purchaseOpen: false, locked: LOCKED };
const links = (host: HTMLElement) => [...host.querySelectorAll('.hb-home-actions a')].map(a => [a.textContent, a.getAttribute('href')]);

beforeEach(() => window.localStorage.clear());
afterEach(() => {
  window.localStorage.clear();
  stateStore.invalidate();
  settingsStore.invalidate();
});

it('shows only the header to a member', async () => {
  const { host, done } = await render({ ...free, free: false, locked: [] });
  expect(host.querySelector('h1')?.textContent).toBe('Finding, Nurturing, and Keeping Clients');
  expect(host.querySelector('.hb-home-actions')).toBeNull();
  expect(host.querySelector('[data-free-set]')).toBeNull();
  await done();
});

it('offers Chapter 1 and Chapter 7 to a free reader with nothing read', async () => {
  const { host, done } = await render(free);
  expect(links(host)).toEqual([['Read Chapter 1', '/handbook/ch1'], ['Read Chapter 7', '/handbook/ch7']]);
  expect(host.querySelector('.hb-home-btn-primary svg')?.getAttribute('aria-hidden')).toBe('true');
  await done();
});

it('continues to Chapter 7 once Chapter 1 is read, and drops the duplicate secondary button', async () => {
  stateStore.update(s => { s.read.ch1 = true; });
  const { host, done } = await render(free);
  expect(links(host)).toEqual([['Continue: Chapter 7', '/handbook/ch7']]);
  await done();
});

it('ignores read state when progress tracking is off', async () => {
  stateStore.update(s => { s.read.ch1 = true; });
  settingsStore.update(s => { s.trackProgress = false; });
  const { host, done } = await render(free);
  expect(links(host)[0]).toEqual(['Read Chapter 1', '/handbook/ch1']);
  await done();
});

it('says what the free set is, with the not-on-sale wording and pricing link', async () => {
  const { host, done } = await render(free);
  const band = host.querySelector('[data-free-set]')!;
  expect(band.querySelector('.hb-home-pill-set')?.textContent).toBe('Free set');
  expect(band.querySelector('.hb-home-freeset-text')?.textContent).toBe(
    'You are reading the free set. The overview, Chapter 1 and Chapter 7 are open in full, with their tools. Everything else is part of the paid handbook, which is not on sale yet.',
  );
  const link = band.querySelector('a.hb-home-freeset-link')!;
  expect([link.textContent, link.getAttribute('href')]).toEqual(['Pricing and availability', '/pricing']);
  await done();
});

it('changes the band when purchase is open', async () => {
  const { host, done } = await render({ ...free, purchaseOpen: true });
  expect(host.querySelector('.hb-home-freeset-text')?.textContent).toMatch(/paid handbook\.$/);
  expect(host.querySelector('.hb-home-freeset-link')?.textContent).toBe('See plans and buy');
  await done();
});

it('says access is paused when suspended', async () => {
  const { host, done } = await render({ ...free, suspended: true });
  expect(host.querySelector('.hb-home-freeset-text strong')?.textContent).toBe('Your access is paused.');
  await done();
});
