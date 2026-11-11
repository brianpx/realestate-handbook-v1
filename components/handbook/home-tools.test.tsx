// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { Entitlement } from '@/lib/access/entitlement';
import HandbookHome from '@/app/(product)/handbook/page';

const viewer = vi.hoisted(() => ({ entitlement: { level: 'preview', suspended: false } as Entitlement }));
vi.mock('@/lib/auth/dal', () => ({ requireViewer: async () => ({ entitlement: viewer.entitlement }) }));
vi.mock('next/navigation', () => ({ usePathname: () => '/handbook', useRouter: () => ({ push: vi.fn() }) }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const tool = (page: string) => {
  const link = container.querySelector(`a.hb-tool[data-goto="${page}"]`);
  if (!(link instanceof HTMLAnchorElement)) throw new Error(`missing tool link for ${page}`);
  return link;
};

async function renderHome() {
  await act(async () => { root.render(await HandbookHome()); });
}

it('omits data-widget on a locked tool and keeps the link to the upsell', async () => {
  viewer.entitlement = { level: 'preview', suspended: false };
  await renderHome();
  const locked = tool('ch2');
  expect(locked.getAttribute('data-goto')).toBe('ch2');
  expect(locked.getAttribute('href')).toBe('/handbook/ch2');
  expect(locked.hasAttribute('data-widget')).toBe(false);
  expect(tool('ch1').getAttribute('data-widget')).toBe('goal-calculator');
  for (const page of ['ch6', 'ch8', 'ch12', 'app-a']) {
    expect(tool(page).getAttribute('data-goto')).toBe(page);
    expect(tool(page).hasAttribute('data-widget')).toBe(false);
  }
});

it('keeps data-widget when the tool page is open', async () => {
  viewer.entitlement = { level: 'member', tier: 'pro' };
  await renderHome();
  expect(tool('ch1').getAttribute('data-widget')).toBe('goal-calculator');
  expect(tool('ch2').getAttribute('data-widget')).toBe('lead-sources');
  expect(tool('ch6').getAttribute('data-widget')).toBe('script-practice');
  expect(tool('ch8').getAttribute('data-widget')).toBe('timeblock-planner');
  expect(tool('ch12').getAttribute('data-widget')).toBe('roadmap');
  expect(tool('app-a').getAttribute('data-widget')).toBe('scorecard');
});
