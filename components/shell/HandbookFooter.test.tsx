// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it } from 'vitest';
import { HandbookFooter } from './HandbookFooter';

it('links to help and policy pages', async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(<HandbookFooter />));
  const nav = host.querySelector('nav[aria-label="Policies and help"]');
  expect(Array.from(nav?.querySelectorAll('a') ?? []).map((a) => a.getAttribute('href'))).toEqual([
    '/support', '/updates', '/privacy', '/terms', '/refunds',
  ]);
  await act(async () => root.unmount());
  host.remove();
});
