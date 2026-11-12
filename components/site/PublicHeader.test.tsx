// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { PublicHeader } from './PublicHeader';

const navigation = vi.hoisted(() => ({ pathname: '/' }));
vi.mock('next/navigation', () => ({ usePathname: () => navigation.pathname }));
vi.mock('./useSignedIn', () => ({ useSignedIn: () => false }));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  navigation.pathname = '/';
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

it('does not mark either home section as current from pathname alone', async () => {
  await act(() => root.render(<PublicHeader />));
  expect(container.querySelectorAll('nav a[href*="#"]')).toHaveLength(2);
  expect(container.querySelectorAll('[aria-current]')).toHaveLength(0);
});

it('retains a single current page state when the route changes', async () => {
  navigation.pathname = '/pricing';
  await act(() => root.render(<PublicHeader />));
  expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  expect(container.querySelector('[aria-current]')?.getAttribute('href')).toBe('/pricing');
  navigation.pathname = '/preview';
  await act(() => root.render(<PublicHeader />));
  expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  expect(container.querySelector('[aria-current]')?.getAttribute('href')).toBe('/preview');
});

it.each(['/signin', '/signup'])('hides the competing header action on %s', async pathname => {
  navigation.pathname = pathname;
  await act(() => root.render(<PublicHeader />));
  expect(container.querySelector('.pub-nav-cta')).toBeNull();
  expect(container.querySelectorAll('nav a')).toHaveLength(4);
});
