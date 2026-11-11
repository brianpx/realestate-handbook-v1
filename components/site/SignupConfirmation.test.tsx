// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { SignupForm } from './SignupForm';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it('shows an accessible inbox notification and lets the reader change their address', async () => {
  vi.useFakeTimers();
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(() => root.render(<SignupForm source="hero" variant="hero" />));
    const input = host.querySelector<HTMLInputElement>('input[type=email]')!;
    await act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'reader@example.com');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    const notice = host.querySelector('[role=region]')!;
    expect(notice.classList.contains('signup-notice')).toBe(true);
    expect(notice.getAttribute('aria-labelledby')).toBe(host.querySelector('h2')!.id);
    expect(notice.querySelector('h2')?.textContent).toBe('Check your inbox.');
    expect(notice.querySelector('.signup-notice-email')?.textContent).toBe('reader@example.com');
    expect(notice.textContent).toContain('expires in 15 minutes');
    expect(notice.textContent).toContain('Check spam or promotions.');
    expect(host.querySelector('[role=status]')?.textContent).toBe('Check your inbox at reader@example.com.');
    const resend = notice.querySelector<HTMLButtonElement>('button')!;
    expect(resend.disabled).toBe(true);
    await act(async () => vi.advanceTimersByTimeAsync(31_000));
    expect(resend.disabled).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(() => [...notice.querySelectorAll('button')].find(button => button.textContent === 'Use a different email')!.click());
    expect(host.querySelector('[role=region]')).toBeNull();
    expect(host.querySelector<HTMLInputElement>('input[type=email]')!.value).toBe('');
    expect(document.activeElement).toBe(host.querySelector('input[type=email]'));
  } finally {
    await act(() => root.unmount()); host.remove(); vi.useRealTimers(); vi.unstubAllGlobals();
  }
});
