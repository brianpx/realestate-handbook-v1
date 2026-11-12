// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { SignupForm } from './SignupForm';

it('disables the submit button before hydration so Enter cannot post a form body', () => {
  const html = renderToStaticMarkup(<SignupForm source="signin" />);
  const button = /<button\b([^>]*)>/.exec(html)?.[1] ?? '';
  expect(button).toContain('type="submit"');
  expect(button).toContain('disabled');
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
it('retains the address when reviewing a resend and does not send until explicitly submitted', async () => {
  vi.useFakeTimers();
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(() => root.render(<SignupForm source="signin" />));
    const input = host.querySelector<HTMLInputElement>('input[type=email]')!;
    await act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'reader@example.com');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    await act(async () => vi.advanceTimersByTimeAsync(31_000));
    const resend = [...host.querySelectorAll('button')].find(button => button.textContent === 'Review and send again')!;
    expect(resend.disabled).toBe(false);
    await act(() => resend.click());
    expect(host.querySelector<HTMLInputElement>('input[type=email]')!.value).toBe('reader@example.com');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  } finally {
    await act(() => root.unmount()); host.remove(); vi.useRealTimers(); vi.unstubAllGlobals();
  }
});

it('shows the reference field errors and links without sending an invalid address', async () => {
  const fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', fetchMock);
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(() => root.render(<SignupForm source="signin" variant="page" />));
    const form = host.querySelector('form')!;
    const submit = () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await act(() => { submit(); });
    expect(host.querySelector('[role=alert]')?.textContent).toBe('Enter your email address to get a sign-in link.');
    const input = host.querySelector<HTMLInputElement>('input[type=email]')!;
    expect(document.activeElement).toBe(input);
    await act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'jordan@example');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      submit();
    });
    const error = host.querySelector('[role=alert]')!;
    expect(error.textContent).toBe('That doesn’t look like an email address. Check for a typo.');
    expect(input.getAttribute('aria-describedby')).toBe(error.id);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(error.parentElement).toBe(input.parentElement);
    expect(host.querySelector('a[href="/terms"]')?.textContent).toBe('Terms of Use');
    expect(host.querySelector('a[href="/privacy"]')?.textContent).toBe('Privacy Policy');
    expect(host.querySelector<HTMLInputElement>('input[type=checkbox]')!.checked).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  } finally {
    await act(() => root.unmount()); host.remove(); vi.unstubAllGlobals();
  }
});

it('resends only on request, retains a successful confirmation on failure, and does not repeat notes consent', async () => {
  vi.useFakeTimers();
  const fetchMock = vi.fn<typeof fetch>().mockImplementation(async url =>
    new Response('{}', { status: url === '/api/lead' ? 503 : 200 }));
  vi.stubGlobal('fetch', fetchMock);
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(() => root.render(<SignupForm source="signin" variant="page" next="/handbook/ch2" />));
    const input = host.querySelector<HTMLInputElement>('input[type=email]')!;
    await act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'reader@example.com');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      host.querySelector<HTMLInputElement>('input[type=checkbox]')!.click();
    });
    await act(async () => host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(host.querySelector('h1')?.textContent).toBe('Check your email');
    expect(document.activeElement).not.toBe(host.querySelector('h1'));
    expect(host.querySelector('h1')!.hasAttribute('tabindex')).toBe(false);
    expect(host.querySelector('[role=status]')?.textContent).toBe('Check your inbox at reader@example.com.');
    expect(host.textContent).toContain('The notes sign-up did not go through.');
    expect(host.textContent).toContain('expires after 15 minutes');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await act(async () => vi.advanceTimersByTimeAsync(31_000));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const resend = [...host.querySelectorAll('button')].find(button => button.textContent === 'Resend link')!;
    expect(resend.disabled).toBe(false);
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await act(async () => resend.click());
    expect(host.querySelector('h1')?.textContent).toBe('Check your email');
    expect(host.querySelector('[role=alert]')?.textContent).toContain('Something went wrong.');
    await act(() => [...host.querySelectorAll('button')].find(button => button.textContent === 'Use a different email')!.click());
    const replacement = host.querySelector<HTMLInputElement>('input[type=email]')!;
    await act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(replacement, 'new-reader@example.com');
      replacement.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(host.textContent).toContain('We sent a sign-in link to new-reader@example.com.');
    expect(host.querySelector('[role=alert]')).toBeNull();
    await act(async () => vi.advanceTimersByTimeAsync(31_000));
    const nextResend = [...host.querySelectorAll('button')].find(button => button.textContent === 'Resend link')!;
    await act(async () => nextResend.click());
    expect(fetchMock.mock.calls.filter(([url]) => url === '/api/lead')).toHaveLength(2);
    expect(nextResend.disabled).toBe(true);
    expect(host.querySelector('[role=alert]')).toBeNull();
    await act(() => [...host.querySelectorAll('button')].find(button => button.textContent === 'Use a different email')!.click());
    expect(host.querySelector<HTMLInputElement>('input[type=email]')!.value).toBe('');
    expect(document.activeElement).toBe(host.querySelector('input[type=email]'));
  } finally {
    await act(() => root.unmount()); host.remove(); vi.useRealTimers(); vi.unstubAllGlobals();
  }
});
