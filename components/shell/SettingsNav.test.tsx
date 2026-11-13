// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it } from 'vitest';
import { SettingsNav } from './SettingsNav';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

async function render(current: string) {
  const host = document.createElement('ul');
  document.body.append(host);
  const root = createRoot(host);
  await act(() => root.render(<SettingsNav current={current} />));
  return { host, done: async () => { await act(() => root.unmount()); host.remove(); } };
}

it('is folded away from the settings pages, with its links out of the tab order', async () => {
  const { host, done } = await render('home');
  try {
    const toggle = host.querySelector('button')!;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(host.querySelector<HTMLElement>(`#${toggle.getAttribute('aria-controls')}`)?.hidden).toBe(true);
    const parent = host.querySelector('a[data-page="account"]')!;
    expect(parent.textContent).toBe('Settings');
    expect(parent.getAttribute('href')).toBe('/account');
    expect(parent.hasAttribute('aria-current')).toBe(false);
  } finally { await done(); }
});

it('opens a folded group with its button and folds it again', async () => {
  const { host, done } = await render('home');
  try {
    const toggle = host.querySelector('button')!;
    await act(() => toggle.click());
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(host.querySelector<HTMLElement>('#navSettings')?.hidden).toBe(false);
    await act(() => toggle.click());
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  } finally { await done(); }
});

it('is open on /account with the Settings row current', async () => {
  const { host, done } = await render('account');
  try {
    const parent = host.querySelector('a[data-page="account"]')!;
    expect(parent.getAttribute('aria-current')).toBe('page');
    expect(host.querySelector('button')!.getAttribute('aria-expanded')).toBe('true');
    const child = host.querySelector('a[href="/account/authentication"]')!;
    expect(child.textContent).toBe('Authentication');
    expect(child.hasAttribute('aria-current')).toBe(false);
    expect(host.querySelector('a[href="/account/billing"]')!.textContent).toBe('Billing Information');
  } finally { await done(); }
});

it('is open on a settings page with that child current and no dead links', async () => {
  const { host, done } = await render('account/authentication');
  try {
    expect(host.querySelector('button')!.getAttribute('aria-expanded')).toBe('true');
    expect(host.querySelector('a[data-page="account"]')!.hasAttribute('aria-current')).toBe(false);
    expect(host.querySelector('a[href="/account/authentication"]')!.getAttribute('aria-current')).toBe('page');
    expect(host.querySelectorAll('#navSettings a')).toHaveLength(2);
    expect(host.querySelector('a[href="/account/billing"]')!.hasAttribute('aria-current')).toBe(false);
  } finally { await done(); }
});

it('marks Billing Information current on its page, after Authentication', async () => {
  const { host, done } = await render('account/billing');
  try {
    expect(host.querySelector('button')!.getAttribute('aria-expanded')).toBe('true');
    expect([...host.querySelectorAll('#navSettings a')].map(a => a.getAttribute('data-page'))).toEqual(['account/authentication', 'account/billing']);
    expect(host.querySelector('a[href="/account/billing"]')!.getAttribute('aria-current')).toBe('page');
    expect(host.querySelector('a[href="/account/authentication"]')!.hasAttribute('aria-current')).toBe(false);
  } finally { await done(); }
});
