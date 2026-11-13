// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { settingsStore } from '@/lib/state';
import { AccountPanel, UserMenu } from './UserMenu';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ACCOUNT = { displayName: 'Sam Rivera', email: 'sam@example.com', avatarUrl: null };
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  window.localStorage.clear();
  settingsStore.invalidate();
  document.documentElement.classList.remove('dark');
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const trigger = () => container.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]')!;
const popup = () => document.querySelector<HTMLElement>('[data-slot="dropdown-menu-content"]');
async function openMenu() {
  await act(() => root.render(<UserMenu account={ACCOUNT} />));
  await act(async () => { trigger().click(); });
  return popup()!;
}

it('shows initials on the avatar button for a named account and names the button', async () => {
  await act(() => root.render(<UserMenu account={ACCOUNT} />));
  expect(trigger().getAttribute('aria-label')).toBe('Account menu for Sam Rivera');
  expect(trigger().textContent).toBe('SR');
});

it('gives an account with no name a gradient instead of initials', async () => {
  await act(() => root.render(<UserMenu account={{ displayName: 'sam', email: 'sam@example.com', avatarUrl: null }} />));
  const fallback = trigger().querySelector<HTMLElement>('[data-slot="avatar-fallback"]')!;
  expect(fallback.textContent).toBe('');
  expect(fallback.style.background).toContain('linear-gradient');
});

it('lists the header, the items in order with their links, and a sign-out form post', async () => {
  const menu = await openMenu();
  expect(menu.textContent).toContain('Sam Rivera');
  expect(menu.textContent).toContain('sam@example.com');
  const rows = [...menu.querySelectorAll('[role="menuitem"], [role="menuitemradio"]')].map(el => el.getAttribute('aria-label') ?? el.textContent);
  expect(rows).toEqual(['Account settings', 'Feedback', 'System', 'Light', 'Dark', 'Home Page', 'Help', 'Docs', 'Changelog', 'Log Out']);
  const hrefs = [...menu.querySelectorAll('a')].map(a => a.getAttribute('href'));
  expect(hrefs).toEqual(['/account', '/support?topic=feedback', '/', '/support', '/handbook', '/updates']);
  const form = menu.querySelector('form')!;
  expect(form.getAttribute('method')).toBe('post');
  expect(form.getAttribute('action')).toBe('/api/auth/sign-out');
  expect(form.querySelector('button[type="submit"]')?.textContent).toBe('Log Out');
});

it('switches the theme without closing the menu, and system clears the stored choice', async () => {
  const menu = await openMenu();
  const radio = (name: string) => menu.querySelector<HTMLElement>(`[role="menuitemradio"][aria-label="${name}"]`)!;
  expect(radio('System').getAttribute('aria-checked')).toBe('true');
  await act(async () => { radio('Dark').click(); });
  expect(popup()).not.toBeNull();
  expect(document.documentElement.classList.contains('dark')).toBe(true);
  expect(settingsStore.get().dark).toBe(true);
  expect(radio('Dark').getAttribute('aria-checked')).toBe('true');
  await act(async () => { radio('Light').click(); });
  expect(document.documentElement.classList.contains('dark')).toBe(false);
  expect(settingsStore.get().dark).toBe(false);
  await act(async () => { radio('System').click(); });
  expect(settingsStore.get().dark).toBeUndefined();
  expect(popup()).not.toBeNull();
});

it('closes on Escape', async () => {
  await openMenu();
  await act(async () => { popup()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
  expect(popup()).toBeNull();
});

it('renders the same items inline for the phone panel, with the theme as a pressed-state group', async () => {
  await act(() => root.render(<AccountPanel account={ACCOUNT} />));
  expect([...container.querySelectorAll('a')].map(a => a.getAttribute('href'))).toEqual(['/account', '/support?topic=feedback', '/', '/support', '/handbook', '/updates']);
  expect(container.querySelector('form[action="/api/auth/sign-out"][method="post"] button[type="submit"]')?.textContent).toBe('Log Out');
  const pills = [...container.querySelectorAll<HTMLButtonElement>('.pub-theme-pill button')];
  expect(pills.map(b => b.getAttribute('aria-label'))).toEqual(['System', 'Light', 'Dark']);
  expect(pills.map(b => b.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'false']);
  await act(async () => { pills[2]!.click(); });
  expect(container.querySelector('.pub-theme-pill button[aria-label="Dark"]')?.getAttribute('aria-pressed')).toBe('true');
  expect(document.documentElement.classList.contains('dark')).toBe(true);
});
