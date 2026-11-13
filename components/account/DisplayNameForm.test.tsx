// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { DisplayNameForm } from './DisplayNameForm';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let fetchMock: Mock<typeof fetch>;

const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const render = (initial: string | null = null) => act(() => root.render(<DisplayNameForm initial={initial} placeholder="reader" />));
const input = () => container.querySelector<HTMLInputElement>('input[name="displayName"]')!;
const button = () => container.querySelector('button')!;
const type = (value: string) => act(() => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input(), value);
  input().dispatchEvent(new Event('input', { bubbles: true }));
});
const submit = () => act(async () => { container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });

beforeEach(() => {
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

describe('DisplayNameForm', () => {
  it('is a labelled box with the saved name, the fallback as placeholder and the 32-character hint', async () => {
    await render('Pat');
    expect(input().value).toBe('Pat');
    expect(input().placeholder).toBe('reader');
    expect(input().maxLength).toBe(32);
    expect(container.querySelector(`label[for="${input().id}"]`)).not.toBeNull();
    expect(container.textContent).toContain('Please use 32 characters at maximum.');
  });
  it('keeps Save off until the name changes, then PUTs the trimmed-by-server value and announces it', async () => {
    fetchMock.mockResolvedValue(reply(200, { ok: true, displayName: 'Pat R' }));
    await render('Pat');
    expect(button().disabled).toBe(true);
    await type('  Pat R ');
    expect(button().disabled).toBe(false);
    await submit();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/account/preferences');
    expect((init as RequestInit).method).toBe('PUT');
    expect(JSON.parse(String((init as RequestInit).body))).toEqual({ displayName: '  Pat R ' });
    expect(input().value).toBe('Pat R');
    expect(container.querySelector('[role="status"]')?.textContent).toBe('Saved.');
    expect(button().disabled).toBe(true);
  });
  it('clears the saved name when the box is emptied and saved', async () => {
    fetchMock.mockResolvedValue(reply(200, { ok: true, displayName: null }));
    await render('Pat');
    await type('');
    expect(button().disabled).toBe(false);
    await submit();
    expect(JSON.parse(String((fetchMock.mock.calls[0]![1] as RequestInit).body))).toEqual({ displayName: '' });
    expect(container.querySelector('[role="status"]')?.textContent).toBe('Saved.');
    expect(input().value).toBe('');
    expect(button().disabled).toBe(true);
  });
  it('names a rejected value on the box and in an alert', async () => {
    fetchMock.mockResolvedValue(reply(400, { ok: false, error: 'invalid_display_name' }));
    await render('Pat');
    await type('   ');
    await submit();
    const alert = container.querySelector('[role="alert"]')!;
    expect(alert.textContent).toBe('Use 32 characters at most, with no control characters.');
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(input().getAttribute('aria-describedby')).toBe(alert.id);
  });
  it('says so when the sign-in has ended, saving is down, or the request fails', async () => {
    await render('Pat');
    await type('Pat R');
    fetchMock.mockResolvedValueOnce(reply(401, { ok: false, error: 'unauthorized' }));
    await submit();
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Your sign-in has ended');
    fetchMock.mockResolvedValueOnce(reply(503, { ok: false, error: 'unavailable' }));
    await submit();
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('not available right now');
    fetchMock.mockRejectedValueOnce(new TypeError('offline'));
    await submit();
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Something went wrong');
    expect(input().getAttribute('aria-invalid')).toBeNull();
    expect(input().value).toBe('Pat R');
  });
});
