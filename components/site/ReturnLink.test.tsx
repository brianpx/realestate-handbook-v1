// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { ReturnLink } from './ReturnLink';

let query = '';
let path = '/pricing';
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(query), usePathname: () => path }));

const render = async (search: string) => {
  query = search;
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(<ReturnLink />));
  return { host, done: async () => { await act(async () => root.unmount()); host.remove(); } };
};

afterEach(() => { document.body.innerHTML = ''; path = '/pricing'; });

it('links back to the page named in ?from=', async () => {
  const { host, done } = await render('from=%2Fhandbook%2Fch3');
  const a = host.querySelector('a');
  expect(a?.getAttribute('href')).toBe('/handbook/ch3');
  expect(a?.textContent).toBe('Back to 3. Marketing & Brand Presence');
  await done();
});

it('shows nothing without a usable ?from=', async () => {
  for (const search of ['', 'from=https%3A%2F%2Fevil.test', 'from=%2F%2Fevil.test']) {
    const { host, done } = await render(search);
    expect(host.querySelector('a')).toBeNull();
    await done();
  }
});

it('falls back to home on policy pages without ?from=', async () => {
  for (const p of ['/privacy', '/terms', '/refunds', '/updates']) {
    path = p;
    const { host, done } = await render('');
    const a = host.querySelector('a');
    expect(a?.getAttribute('href')).toBe('/');
    expect(a?.textContent).toBe('Back to home');
    await done();
  }
});
