// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { EMPTY_PROFILE, type ProfileFields } from '@/lib/users/profile';
import { ProfileForm } from './ProfileForm';

// react-dom warns and skips act() batching unless the host declares itself an act environment
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SAVED = '2026-11-08T12:00:00.000Z';
const FULL: ProfileFields = { ...EMPTY_PROFILE, professionalRole: 'agent', brokerageName: 'Example Realty', licenseJurisdiction: 'TX', yearFirstLicensed: 2025, phone: '+15125550123', narMember: true, narMemberSince: '2025-03-01' };

let container: HTMLDivElement;
let root: Root;
let fetchMock: Mock<typeof fetch>;

const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const render = (initial: ProfileFields, updatedAt: string | null) => act(() => root.render(<ProfileForm accountId="account-a" initial={initial} updatedAt={updatedAt} />));
const field = (name: string) => container.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${name}"]`)!;
const button = () => container.querySelector('button')!;
// React watches the node's own `value`, so the prototype setter is used to slip past its tracker the way typing would
const setNative = (el: HTMLInputElement | HTMLSelectElement, value: string) => act(() => {
  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value')!.set!.call(el, value);
  el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
});
const submit = () => act(async () => { container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
const sentBody = () => JSON.parse(String((fetchMock.mock.calls[0]![1] as RequestInit).body)) as Record<string, unknown>;

beforeEach(() => {
  window.sessionStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe('ProfileForm', () => {
  it('shows the server values, with the choices, the year and the membership answer in their boxes', async () => {
    await render(FULL, SAVED);
    expect(field('professionalRole').value).toBe('agent');
    expect(field('brokerageName').value).toBe('Example Realty');
    expect(field('licenseJurisdiction').value).toBe('TX');
    expect(field('yearFirstLicensed').value).toBe('2025');
    expect(field('narMember').value).toBe('yes');
    expect(field('narMemberSince').value).toBe('2025-03-01');
    expect(field('teamName').value).toBe('');
    expect(container.textContent).toContain('Last saved Nov 8, 2026, 12:00 PM UTC.');
    expect(button().disabled).toBe(false); // mounted, so hydrated
  });

  it('puts the whole form as JSON, with the year as a number and the membership as a boolean, then shows the saved state', async () => {
    await render(EMPTY_PROFILE, null);
    expect(container.textContent).toContain('Nothing saved yet.');
    await setNative(field('brokerageName'), 'Example Realty');
    await setNative(field('yearFirstLicensed'), '2025');
    await setNative(field('narMember'), 'no');
    await setNative(field('licenseStatus'), 'active');
    fetchMock.mockResolvedValueOnce(reply(200, { ok: true, profile: { ...EMPTY_PROFILE, brokerageName: 'Example Realty', yearFirstLicensed: 2025, narMember: false, licenseStatus: 'active' }, updatedAt: SAVED }));
    await submit();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/account/profile');
    expect(init?.method).toBe('PUT');
    expect(sentBody()).toEqual({ ...Object.fromEntries(Object.keys(EMPTY_PROFILE).map(k => [k, ''])), brokerageName: 'Example Realty', yearFirstLicensed: 2025, narMember: false, licenseStatus: 'active' });
    expect(container.querySelector('[role="status"]')!.textContent).toBe('Saved.');
    expect(container.textContent).toContain('Last saved Nov 8, 2026, 12:00 PM UTC.');
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it('sends a blank year and an unmade membership choice as null, and a year that is not a number as typed', async () => {
    await render(FULL, SAVED);
    await setNative(field('yearFirstLicensed'), '');
    await setNative(field('narMember'), '');
    fetchMock.mockResolvedValueOnce(reply(200, { ok: true, profile: EMPTY_PROFILE, updatedAt: SAVED }));
    await submit();
    expect(sentBody()).toMatchObject({ yearFirstLicensed: null, narMember: null });
    await setNative(field('yearFirstLicensed'), '20x5');
    fetchMock.mockResolvedValueOnce(reply(400, { ok: false, error: 'invalid_profile', fields: ['yearFirstLicensed'] }));
    await submit();
    expect(JSON.parse(String((fetchMock.mock.calls[1]![1] as RequestInit).body))).toMatchObject({ yearFirstLicensed: '20x5' });
  });

  it('names the fields a 400 points at and marks them invalid; the next good save clears that', async () => {
    await render(FULL, SAVED);
    fetchMock.mockResolvedValueOnce(reply(400, { ok: false, error: 'invalid_profile', fields: ['phone', 'yearFirstLicensed', 'bogus'] }));
    await submit();
    expect(container.querySelector('[role="alert"]')!.textContent).toBe('Please check: Phone, Year first licensed.');
    expect(field('phone').getAttribute('aria-invalid')).toBe('true');
    expect(field('yearFirstLicensed').getAttribute('aria-invalid')).toBe('true');
    expect(field('brokerageName').getAttribute('aria-invalid')).toBeNull();
    fetchMock.mockResolvedValueOnce(reply(200, { ok: true, profile: FULL, updatedAt: SAVED }));
    await submit();
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(field('phone').getAttribute('aria-invalid')).toBeNull();
  });

  it.each([
    [401, { ok: false, error: 'unauthorized' }, 'Your sign-in has ended. Sign in again, then come back to this page.'],
    [503, { ok: false, error: 'unavailable' }, 'Saving is not available right now. Please try again later.'],
    [403, { ok: false, error: 'forbidden' }, 'Something went wrong. Please try again in a moment.'],
  ])('explains a %s', async (status, body, message) => {
    await render(FULL, SAVED);
    fetchMock.mockResolvedValueOnce(reply(status, body));
    await submit();
    expect(container.querySelector('[role="alert"]')!.textContent).toBe(message);
  });

  it('reports a network failure the same way and leaves the boxes as they were', async () => {
    await render(FULL, SAVED);
    await setNative(field('teamName'), 'The A Team');
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await submit();
    expect(container.querySelector('[role="alert"]')!.textContent).toBe('Something went wrong. Please try again in a moment.');
    expect(field('teamName').value).toBe('The A Team');
  });
});


it('locks all editable fields until the pending save completes', async () => {
  await render(FULL, SAVED);
  let resolve!: (response: Response) => void;
  fetchMock.mockReturnValueOnce(new Promise<Response>(done => { resolve = done; }));
  await submit();
  expect([...container.querySelectorAll('input, select')].every(el => (el as HTMLInputElement).disabled)).toBe(true);
  await act(async () => resolve(reply(200, { profile: FULL, updatedAt: SAVED })));
  expect(field('phone').disabled).toBe(false);
});

it('recovers an expired-session draft only for its account and clears it after saving', async () => {
  await render(FULL, SAVED);
  await setNative(field('teamName'), 'Unsaved team');
  fetchMock.mockResolvedValueOnce(reply(401, { error: 'unauthorized' }));
  await submit();
  expect(container.querySelector('a')?.getAttribute('href')).toBe('/signin?next=%2Faccount');
  await setNative(field('teamName'), 'Updated after session expired');
  await act(() => container.querySelector('a')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));

  await act(() => root.unmount());
  root = createRoot(container);
  await render(FULL, SAVED);
  expect(field('teamName').value).toBe('Updated after session expired');
  expect(container.textContent).toContain('Your unsaved draft was recovered');
  fetchMock.mockResolvedValueOnce(reply(200, { profile: FULL, updatedAt: SAVED }));
  await submit();
  expect(sessionStorage.getItem('handbook-profile-draft')).toBeNull();
});

it.each(['expired', 'different-account'])('discards a %s draft', async kind => {
  sessionStorage.setItem('handbook-profile-draft', JSON.stringify({
    accountId: kind === 'different-account' ? 'other' : 'account-a',
    expiresAt: Date.now() + (kind === 'expired' ? -1 : 60_000),
    values: { teamName: 'Private draft' },
  }));
  await render(FULL, SAVED);
  expect(field('teamName').value).toBe('');
  expect(sessionStorage.getItem('handbook-profile-draft')).toBeNull();
});
