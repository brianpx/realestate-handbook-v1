// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it } from 'vitest';
import { HowToUse } from './HowToUse';

async function render(free: boolean) {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(<HowToUse free={free} />));
  return { host, done: async () => { await act(async () => root.unmount()); host.remove(); } };
}

it('shows three free-set cards that never link the guided setup', async () => {
  const { host, done } = await render(true);
  expect(host.querySelector('h2')?.textContent).toBe('How to use the free set');
  expect(host.querySelectorAll('.hb-home-step')).toHaveLength(3);
  const hrefs = Array.from(host.querySelectorAll('a')).map(a => a.getAttribute('href'));
  expect(hrefs).toEqual(['/handbook/ch1', '/handbook/ch7', '/handbook/pref', '/account']);
  expect(hrefs).not.toContain('/handbook/start');
  await done();
});

it('shows the original three steps to members with the guided setup link', async () => {
  const { host, done } = await render(false);
  expect(host.querySelector('h2')?.textContent).toBe('How to use the handbook');
  expect(Array.from(host.querySelectorAll('h3')).map(h => h.textContent)).toEqual([
    'Do the guided setup once', 'Follow the first-week reading', 'Review every Friday',
  ]);
  expect(host.querySelector('a[href="/handbook/start"]')?.textContent).toBe('Start here');
  expect(host.querySelector('a[href="/account"]')).not.toBeNull();
  await done();
});
