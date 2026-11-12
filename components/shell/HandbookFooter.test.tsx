// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { HandbookFooter } from './HandbookFooter';

vi.mock('next/navigation', () => ({ usePathname: () => '/handbook/ch3' }));

it('links to help and policy pages', async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(<HandbookFooter />));
  const nav = host.querySelector('nav[aria-label="Policies and help"]');
  expect(Array.from(nav?.querySelectorAll('a') ?? []).map((a) => a.getAttribute('href'))).toEqual([
    '/support', '/updates', '/privacy', '/terms', '/refunds',
  ].map((href) => `${href}?from=%2Fhandbook%2Fch3`));
  await act(async () => root.unmount());
  host.remove();
});
