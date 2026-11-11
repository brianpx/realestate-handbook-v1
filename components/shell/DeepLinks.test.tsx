// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { settingsStore } from '@/lib/state';
import { DeepLinks } from './DeepLinks';

const navigation = vi.hoisted(() => ({ pathname: '/handbook/ch2' }));
vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: vi.fn() }),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  navigation.pathname = '/handbook/ch2';
  localStorage.clear();
  settingsStore.invalidate();
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  vi.useFakeTimers();
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  document.getElementById('pageStatus')?.remove();
  document.getElementById('content-container')?.remove();
  vi.useRealTimers();
});

const status = () => {
  const region = document.createElement('div');
  region.id = 'pageStatus';
  document.body.append(region);
  return region;
};

const content = (html: string) => {
  const node = document.createElement('div');
  node.id = 'content-container';
  node.innerHTML = html;
  document.body.append(node);
  return node;
};

async function activate(widget: string) {
  await act(() => root.render(<DeepLinks />));
  const link = document.createElement('a');
  link.href = '/handbook/ch2';
  link.dataset.goto = 'ch2';
  link.dataset.widget = widget;
  link.textContent = widget;
  document.body.append(link);
  await act(() => { link.click(); });
  link.remove();
  await act(() => { vi.advanceTimersByTime(0); });
  await act(() => { vi.advanceTimersByTime(50); });
}

it('announces the upsell title instead of a missing tool', async () => {
  const region = status();
  content('<h1 id="upsellTitle">2. Finding Clients</h1>');
  await activate('lead-sources');
  expect(region.textContent).toBe('2. Finding Clients');
  expect(region.textContent).not.toContain('Could not find that tool');
});

it('stays quiet when focus is already on the upsell title', async () => {
  const region = status();
  const node = content('<h1 id="upsellTitle" tabindex="-1">2. Finding Clients</h1>');
  const title = node.querySelector('#upsellTitle');
  if (!(title instanceof HTMLElement)) throw new Error('missing upsell title');
  title.focus();
  await activate('lead-sources');
  expect(document.activeElement).toBe(title);
  expect(region.textContent).toBe('');
});

it('still says the tool is missing when the page has no upsell', async () => {
  const region = status();
  content('<p>Chapter</p>');
  await activate('lead-sources');
  expect(region.textContent).toBe('Could not find that tool in 2. Finding Clients.');
});

it('still says Essential tools only is on when that is why the tool is gone', async () => {
  localStorage.setItem('handbookSettings', JSON.stringify({ essentialOnly: true }));
  settingsStore.invalidate();
  const region = status();
  content('<p>Chapter</p>');
  await activate('lead-sources');
  expect(region.textContent).toBe('That tool is off while Essential tools only is on. Turn it off in Settings to open this one.');
});
