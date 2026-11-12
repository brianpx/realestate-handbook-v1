// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { PublicHeader } from './PublicHeader';

const navigation = vi.hoisted(() => ({ pathname: '/' }));
const session = vi.hoisted(() => ({ signedIn: false, account: { status: 'idle' } as { status: string; account?: { displayName: string; email: string; avatarUrl: null } } }));
vi.mock('next/navigation', () => ({ usePathname: () => navigation.pathname }));
vi.mock('./useSignedIn', () => ({ useSignedIn: () => session.signedIn }));
vi.mock('./useAccountSummary', () => ({ useAccountSummary: () => session.account }));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  navigation.pathname = '/';
  session.signedIn = false;
  session.account = { status: 'idle' };
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

it('keeps the Sign in action for a visitor and for a stale sign-in flag', async () => {
  await act(() => root.render(<PublicHeader />));
  expect(container.querySelector('.pub-nav-cta')?.textContent).toBe('Sign in');
  expect(container.querySelector('.pub-user, .pub-account')).toBeNull();
  session.signedIn = true;
  session.account = { status: 'out' };
  await act(() => root.render(<PublicHeader />));
  expect(container.querySelector('.pub-nav-cta')?.textContent).toBe('Sign in');
});

it('reserves the avatar space while the account loads, with no Sign in or Open handbook action', async () => {
  session.signedIn = true;
  session.account = { status: 'loading' };
  await act(() => root.render(<PublicHeader />));
  expect(container.querySelector('.pub-user [aria-hidden="true"]')).not.toBeNull();
  expect(container.querySelector('.pub-nav-cta')).toBeNull();
});

it('replaces the call to action with the user menu and an inline account panel once signed in', async () => {
  session.signedIn = true;
  session.account = { status: 'ready', account: { displayName: 'Sam Rivera', email: 'sam@example.com', avatarUrl: null } };
  await act(() => root.render(<PublicHeader />));
  expect(container.querySelector('.pub-nav-cta')).toBeNull();
  expect(container.textContent).not.toContain('Open handbook');
  expect(container.querySelector('.pub-user button[aria-haspopup="menu"]')?.getAttribute('aria-label')).toBe('Account menu for Sam Rivera');
  expect(container.querySelector('.pub-account')?.textContent).toContain('sam@example.com');
  expect(container.querySelector('.pub-menu-btn')?.getAttribute('aria-controls')).toBe('pubNav');
});
