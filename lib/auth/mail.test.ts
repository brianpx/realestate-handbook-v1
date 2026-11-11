import { describe, expect, it, vi } from 'vitest';
import { authMailFromEnv, readyMessage, sendReadyLink, sendSignInLink, signInMessage } from './mail';

const ok = (init?: Partial<Response>) => Promise.resolve({ ok: true, status: 202, ...init } as Response);

describe('authMailFromEnv', () => {
  it('needs a from-address for SendGrid but not a postal address', () => {
    expect(authMailFromEnv({ SENDGRID_API_KEY: 'k' })).toEqual({ provider: 'none' });
    expect(authMailFromEnv({ SENDGRID_API_KEY: 'k', LEAD_FROM_EMAIL: 'me@x.co' })).toMatchObject({ provider: 'sendgrid', from: 'me@x.co', replyTo: 'me@x.co' });
    expect(authMailFromEnv({ MAILPIT_URL: 'http://localhost:8025/' })).toMatchObject({ provider: 'mailpit', url: 'http://localhost:8025' });
    expect(authMailFromEnv({})).toEqual({ provider: 'none' });
  });
});

describe('the sign-in message', () => {
  it('carries the link, the single-use and expiry notice, and nothing about the address', () => {
    const { subject, text } = signInMessage('https://handbook.example/auth/verify?token=abc');
    expect(subject).toBe('Your sign-in link');
    expect(text).toContain('https://handbook.example/auth/verify?token=abc');
    expect(text).toContain('expires in 15 minutes');
    expect(text).toContain('If you did not ask for it');
  });
  it('is sent through the shared transport and reports the outcome', async () => {
    const fetchImpl = vi.fn<typeof fetch>(() => ok());
    const cfg = authMailFromEnv({ MAILPIT_URL: 'http://localhost:8025', LEAD_FROM_EMAIL: 'me@x.co' });
    expect(await sendSignInLink(cfg, 'to@y.co', 'https://h.example/auth/verify?token=t', fetchImpl)).toBe('sent');
    expect(fetchImpl.mock.calls[0]![0]).toBe('http://localhost:8025/api/v1/send');
    expect(JSON.parse(fetchImpl.mock.calls[0]![1]!.body as string)).toMatchObject({ To: [{ Email: 'to@y.co' }], Subject: 'Your sign-in link' });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(await sendSignInLink(cfg, 'to@y.co', 'x', vi.fn<typeof fetch>(() => ok({ ok: false, status: 500 })))).toBe('failed');
      expect(spy).toHaveBeenCalledWith('sign-in email: mailpit answered 500');
    } finally {
      spy.mockRestore();
    }
    expect(await sendSignInLink({ provider: 'none' }, 'to@y.co', 'x', fetchImpl)).toBe('skipped');
  });
});

describe('the ready message', () => {
  it('carries a one-time sign-in link and no price or postal address', async () => {
    const link = 'https://handbook.example/auth/verify?token=abc';
    const { subject, text } = readyMessage(link);
    expect(subject).toBe('Your handbook is ready');
    expect(text).toContain(link);
    expect(text).toContain('expires in 15 minutes');
    expect(text).not.toMatch(/\$|\d{2,}\s*(cents|dollars)/);
    expect(text).not.toContain('unsubscribe');
    const fetchImpl = vi.fn<typeof fetch>(() => ok());
    const cfg = authMailFromEnv({ MAILPIT_URL: 'http://localhost:8025', LEAD_FROM_EMAIL: 'me@x.co' });
    expect(await sendReadyLink(cfg, 'buyer@e2e.test', link, fetchImpl)).toBe('sent');
    expect(JSON.parse(fetchImpl.mock.calls[0]![1]!.body as string)).toMatchObject({ Subject: 'Your handbook is ready', To: [{ Email: 'buyer@e2e.test' }] });
    expect(await sendReadyLink(cfg, 'buyer@e2e.test', link, vi.fn<typeof fetch>(() => ok({ ok: false, status: 500 })))).toBe('failed');
  });
});
