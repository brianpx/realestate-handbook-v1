// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { accountDeletedMessage, authMailFromEnv, readyMessage, sendAccountDeleted, sendReadyLink, sendSignInLink, sendWelcome, signInMessage, TRANSACTIONAL_SEND_TIMEOUT_MS, welcomeMessage } from './mail';

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
    expect(text).toContain("Didn't ask for this?");
    expect(text.indexOf('https://handbook.example/auth/verify?token=abc')).toBeLessThan(text.indexOf('support@'));
  });
  it('includes an HTML sign-in button and safely escapes the fallback link', () => {
    const link = 'https://handbook.example/auth/verify?token=abc&next="<test>"';
    const { html, text } = signInMessage(link);
    const container = document.createElement('div');
    container.innerHTML = html!;
    const links = [...container.querySelectorAll('a')];
    const signIn = links.find(anchor => anchor.textContent === 'Sign in');
    const fallback = links.find(anchor => anchor.textContent === link);
    const support = links.find(anchor => anchor.getAttribute('href')?.startsWith('mailto:'));
    expect(signIn?.getAttribute('href')).toBe(link);
    expect(fallback?.getAttribute('href')).toBe(link);
    expect(support?.textContent).toBe('support@findnurturekeep.com');
    expect(container.textContent).toContain('Your sign-in link is ready');
    expect(container.textContent).toContain('Works once and expires in 15 minutes.');
    expect(html).toContain('https://handbook.example/images/logo3-sidebar-transparent.png');
    expect(html).toContain('#14304D');
    expect(html).toContain('.btn a{display:block !important;width:100% !important;');
    expect(container.querySelector('test')).toBeNull();
    expect(text).toContain(link);
  });
  it('sends both formats through SendGrid', async () => {
    const fetchImpl = vi.fn<typeof fetch>(() => ok());
    const cfg = authMailFromEnv({ SENDGRID_API_KEY: 'k', LEAD_FROM_EMAIL: 'me@x.co' });
    const link = 'https://h.example/auth/verify?token=t';
    expect(await sendSignInLink(cfg, 'to@y.co', link, fetchImpl)).toBe('sent');
    const message = signInMessage(link);
    expect(JSON.parse(fetchImpl.mock.calls[0]![1]!.body as string).content).toEqual([
      { type: 'text/plain', value: message.text },
      { type: 'text/html', value: message.html },
    ]);
  });
  it('is sent through the shared transport and reports the outcome', async () => {
    const fetchImpl = vi.fn<typeof fetch>(() => ok());
    const cfg = authMailFromEnv({ MAILPIT_URL: 'http://localhost:8025', LEAD_FROM_EMAIL: 'me@x.co' });
    expect(await sendSignInLink(cfg, 'to@y.co', 'https://h.example/auth/verify?token=t', fetchImpl)).toBe('sent');
    expect(fetchImpl.mock.calls[0]![0]).toBe('http://localhost:8025/api/v1/send');
    expect(JSON.parse(fetchImpl.mock.calls[0]![1]!.body as string)).toMatchObject({ To: [{ Email: 'to@y.co' }], Subject: 'Your sign-in link', Text: signInMessage('https://h.example/auth/verify?token=t').text, HTML: signInMessage('https://h.example/auth/verify?token=t').html });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(await sendSignInLink(cfg, 'to@y.co', 'https://h.example/auth/verify?token=t', vi.fn<typeof fetch>(() => ok({ ok: false, status: 500 })))).toBe('failed');
      expect(spy).toHaveBeenCalledWith('sign-in email: mailpit answered 500');
    } finally {
      spy.mockRestore();
    }
    expect(await sendSignInLink({ provider: 'none' }, 'to@y.co', 'https://h.example/auth/verify?token=t', fetchImpl)).toBe('skipped');
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

describe('the welcome and deletion notes', () => {
  it('welcomes a new account without a postal address, and points at the handbook', () => {
    const { subject, text, html } = welcomeMessage('https://handbook.example');
    expect(subject).toBe('Welcome to Finding, Nurturing, and Keeping Clients');
    expect(text).toContain('https://handbook.example/handbook');
    expect(text).toContain('Chapter 1 and Chapter 7');
    expect(text).toContain('does not add you to the notes list');
    expect(text).not.toContain('Main St');
    const container = document.createElement('div');
    container.innerHTML = html!;
    const anchors = [...container.querySelectorAll('a')];
    expect(anchors.find(a => a.textContent === 'Open the handbook')?.getAttribute('href')).toBe('https://handbook.example/handbook');
    expect(anchors.find(a => a.getAttribute('href') === 'https://handbook.example/signup')?.textContent).toBe('https://handbook.example/signup');
  });
  it('says the notes list is gone only when that step succeeded', () => {
    expect(accountDeletedMessage('https://handbook.example', true).text).toContain('taken off the notes list');
    const { subject, text } = accountDeletedMessage('https://handbook.example', false);
    expect(subject).toBe('Your account has been deleted');
    expect(text).toContain('reply "unsubscribe"');
    expect(text).not.toContain('taken off the notes list');
  });
  it('sends the welcome through the same transport', async () => {
    const fetchImpl = vi.fn<typeof fetch>(() => ok());
    const cfg = authMailFromEnv({ MAILPIT_URL: 'http://localhost:8025', LEAD_FROM_EMAIL: 'me@x.co' });
    expect(await sendWelcome(cfg, 'to@y.co', 'https://handbook.example', fetchImpl)).toBe('sent');
    expect(JSON.parse(fetchImpl.mock.calls[0]![1]!.body as string).Subject).toBe(welcomeMessage('https://handbook.example').subject);
  });
});

describe('the welcome and deletion notes wait only so long for the provider', () => {
  const cfg = { provider: 'mailpit', url: 'http://localhost:8025', from: 'me@example.test', fromName: 'Handbook', mailingAddress: '' } as const;
  const ADDRESS = 'to@y.co';
  const send = {
    welcome: (fetchImpl: typeof fetch) => sendWelcome(cfg, ADDRESS, 'https://handbook.example', fetchImpl),
    deleted: (fetchImpl: typeof fetch) => sendAccountDeleted(cfg, ADDRESS, 'https://handbook.example', true, fetchImpl),
  };
  // Behaves like fetch: it never answers by itself and rejects when its signal aborts, `lag` ms later.
  const stalled = (lag = 0) => vi.fn<typeof fetch>((_url, init) => new Promise<Response>((_resolve, reject) => {
    const fail = () => reject(new DOMException('The operation was aborted.', 'AbortError'));
    init?.signal?.addEventListener('abort', () => { if (lag === 0) fail(); else setTimeout(fail, lag); });
  }));
  const withFakeTimers = async (run: () => Promise<void>) => {
    vi.useFakeTimers();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await run();
      expect(JSON.stringify(spy.mock.calls)).not.toContain(ADDRESS);
    } finally {
      spy.mockRestore();
      vi.useRealTimers();
    }
  };

  it.each(['welcome', 'deleted'] as const)('%s: a send that answers carries the deadline and leaves no timer behind', async kind => {
    await withFakeTimers(async () => {
      const fetchImpl = vi.fn<typeof fetch>(() => ok());
      expect(await send[kind](fetchImpl)).toBe('sent');
      expect(fetchImpl.mock.calls[0]![1]!.signal).toBeInstanceOf(AbortSignal);
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  it.each(['welcome', 'deleted'] as const)('%s: a provider rejection is a failure, with the status logged and no timer behind', async kind => {
    await withFakeTimers(async () => {
      const fetchImpl = vi.fn<typeof fetch>(() => ok({ ok: false, status: 500 }));
      expect(await send[kind](fetchImpl)).toBe('failed');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('answered 500'));
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  it.each(['welcome', 'deleted'] as const)('%s: a send that never settles is given up on at the deadline, once, and delivery is called unknown', async kind => {
    await withFakeTimers(async () => {
      const fetchImpl = stalled();
      let result: string | undefined;
      const pending = send[kind](fetchImpl).then(r => { result = r; });
      await vi.advanceTimersByTimeAsync(TRANSACTIONAL_SEND_TIMEOUT_MS - 1);
      expect(result).toBeUndefined();
      await vi.advanceTimersByTimeAsync(1);
      await pending;
      expect(result).toBe('failed');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining(`did not answer within ${TRANSACTIONAL_SEND_TIMEOUT_MS} ms; delivery unknown`));
      await vi.advanceTimersByTimeAsync(60_000);
      expect(fetchImpl).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  it('a send that only rejects some time after the deadline is still one failure and no unhandled rejection', async () => {
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    try {
      await withFakeTimers(async () => {
        const fetchImpl = stalled(25);
        let result: string | undefined;
        const pending = sendWelcome(cfg, ADDRESS, 'https://handbook.example', fetchImpl).then(r => { result = r; });
        await vi.advanceTimersByTimeAsync(TRANSACTIONAL_SEND_TIMEOUT_MS);
        expect(result).toBeUndefined();
        await vi.advanceTimersByTimeAsync(25);
        await pending;
        expect(result).toBe('failed');
        expect(vi.getTimerCount()).toBe(0);
      });
      await new Promise(resolve => setImmediate(resolve));
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', unhandled);
    }
  });

  it('leaves the sign-in link and the ready link without a deadline', async () => {
    await withFakeTimers(async () => {
      const fetchImpl = vi.fn<typeof fetch>(() => ok());
      expect(await sendSignInLink(cfg, ADDRESS, 'https://h.example/auth/verify?token=t', fetchImpl)).toBe('sent');
      expect(await sendReadyLink(cfg, ADDRESS, 'https://h.example/auth/verify?token=t', fetchImpl)).toBe('sent');
      expect(fetchImpl.mock.calls.every(call => call[1]!.signal === undefined)).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
    });
  });
});
