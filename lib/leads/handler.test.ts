import { describe, expect, it, vi } from 'vitest';
import { CONSENT_TEXTS, CONSENT_VERSION, RATE_LIMIT } from './config';
import { handleLead, hashIp, type LeadDeps } from './handler';
import { mailFromEnv, sendWelcome, welcomeMessage, type MailConfig } from './mail';
import { MemoryLeadStore } from './store';

const NOW = new Date('2026-11-02T12:00:00Z');
const body = (o: Record<string, unknown>) => JSON.stringify({ consentVersion: CONSENT_VERSION, ...o });
const ok = (init?: Partial<Response>) => Promise.resolve({ ok: true, status: 202, ...init } as Response);

function setup(over: Partial<LeadDeps> = {}) {
  const store = new MemoryLeadStore();
  const fetchImpl = vi.fn<typeof fetch>(() => ok());
  const mail: MailConfig = { provider: 'sendgrid', apiKey: 'SG.x', from: 'me@example.test', fromName: 'Handbook', replyTo: 'me@example.test', mailingAddress: '1 Main St' };
  const deps: LeadDeps = { store, mail, allowedOrigins: ['https://handbook.example'], ipSalt: 's', now: () => NOW, fetchImpl, ...over };
  const post = (b: string, extra: { origin?: string | null; ip?: string } = {}) =>
    handleLead({ origin: extra.origin === undefined ? 'https://handbook.example' : extra.origin, ip: extra.ip ?? '203.0.113.9', body: b }, deps);
  return { store, fetchImpl, post, deps };
}

describe('a new address', () => {
  it('is stored with the consent text for the version named, lower-cased, and gets one email', async () => {
    const { store, post, fetchImpl } = setup();
    const r = await post(body({ email: '  Sam@Example.COM ' }));
    expect(r).toEqual({ status: 200, body: { ok: true } });
    expect(store.leads).toHaveLength(1);
    expect(store.leads[0]).toMatchObject({ email: 'sam@example.com', source: 'gate', consentVersion: 'v1', consentText: CONSENT_TEXTS.v1, emailStatus: 'sent' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const sent = JSON.parse(fetchImpl.mock.calls[0]![1]!.body as string);
    expect(sent.personalizations[0].to[0].email).toBe('sam@example.com');
    expect(sent.content[0].value).toContain('1 Main St');
  });
  it('is kept even when the email fails, and says so in the record, not to the reader', async () => {
    const { store, post } = setup({ fetchImpl: vi.fn<typeof fetch>(() => ok({ ok: false, status: 500 })) });
    expect(await post(body({ email: 'a@b.co' }))).toEqual({ status: 200, body: { ok: true } });
    expect(store.leads[0]!.emailStatus).toBe('failed');
  });
  it('is kept when the email service cannot be reached', async () => {
    const { store, post } = setup({ fetchImpl: vi.fn<typeof fetch>(() => Promise.reject(new Error('down'))) });
    expect((await post(body({ email: 'a@b.co' }))).status).toBe(200);
    expect(store.leads[0]!.emailStatus).toBe('failed');
  });
  it('is stored with the email marked skipped when no provider is configured', async () => {
    const { store, post, fetchImpl } = setup({ mail: { provider: 'none' } });
    await post(body({ email: 'a@b.co' }));
    expect(store.leads[0]!.emailStatus).toBe('skipped');
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('a repeat or a bot', () => {
  it('looks the same as a new sign-up but adds nothing and sends nothing', async () => {
    const { store, post, fetchImpl } = setup();
    await post(body({ email: 'a@b.co' }));
    const again = await post(body({ email: 'A@B.CO' }));
    expect(again).toEqual({ status: 200, body: { ok: true } });
    expect(store.leads).toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it('treats a filled hidden field as a bot: success on the surface, nothing stored or sent', async () => {
    const { store, post, fetchImpl } = setup();
    expect(await post(body({ email: 'bot@spam.co', _gotcha: 'http://spam' }))).toEqual({ status: 200, body: { ok: true } });
    expect(store.leads).toHaveLength(0);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('bad requests', () => {
  it.each([['not an email'], [''], ['a@'], ['x'.repeat(250) + '@b.co']])('rejects the address %j', async email => {
    const { store, post } = setup();
    expect(await post(body({ email }))).toEqual({ status: 400, body: { ok: false, error: 'invalid_email' } });
    expect(store.leads).toHaveLength(0);
  });
  it('rejects an unknown consent version, so the text stored is never the browser\'s', async () => {
    const { post } = setup();
    expect((await post(body({ email: 'a@b.co', consentVersion: 'v99' }))).body).toEqual({ ok: false, error: 'invalid_request' });
    expect((await post(JSON.stringify({ email: 'a@b.co' }))).body).toEqual({ ok: false, error: 'invalid_request' });
  });
  it('rejects JSON that is not JSON, and bodies that are too large', async () => {
    const { post } = setup();
    expect((await post('{nope')).body).toEqual({ ok: false, error: 'invalid_request' });
    expect((await post(body({ email: 'a@b.co', pad: 'x'.repeat(3000) }))).status).toBe(413);
  });
  it('refuses another site\'s origin but accepts a request with none', async () => {
    const { post } = setup();
    expect((await post(body({ email: 'a@b.co' }), { origin: 'https://evil.example' })).status).toBe(403);
    expect((await post(body({ email: 'c@d.co' }), { origin: null })).status).toBe(200);
  });
});

describe('rate limit', () => {
  it('allows the limit, then answers 429 with Retry-After, counting every attempt', async () => {
    const { post, store } = setup();
    for (let i = 0; i < RATE_LIMIT.attempts; i++) expect((await post('{bad')).status).toBe(400); // failures count too
    const blocked = await post(body({ email: 'a@b.co' }));
    expect(blocked.status).toBe(429);
    expect(blocked.headers).toEqual({ 'Retry-After': String(RATE_LIMIT.windowSeconds) });
    expect(blocked.body).toMatchObject({ ok: false, error: 'rate_limited', retryAfterSeconds: RATE_LIMIT.windowSeconds });
    expect(store.leads).toHaveLength(0);
  });
  it('is per address, and ages out of the window', async () => {
    const { post, store, deps } = setup();
    for (let i = 0; i < RATE_LIMIT.attempts + 1; i++) await post('{bad', { ip: '198.51.100.1' });
    expect((await post(body({ email: 'a@b.co' }), { ip: '198.51.100.2' })).status).toBe(200);
    expect((await post(body({ email: 'b@b.co' }), { ip: '198.51.100.1' })).status).toBe(429);
    const later = new Date(NOW.getTime() + (RATE_LIMIT.windowSeconds + 1) * 1000);
    const r = await handleLead({ origin: null, ip: '198.51.100.1', body: body({ email: 'b@b.co' }) }, { ...deps, now: () => later });
    expect(r.status).toBe(200);
    expect(store.leads.map(l => l.email)).toContain('b@b.co');
  });
  it('never keeps the raw address, only a salted hash', () => {
    expect(hashIp('203.0.113.9', 's')).toMatch(/^[0-9a-f]{32}$/);
    expect(hashIp('203.0.113.9', 's')).not.toBe(hashIp('203.0.113.9', 'other'));
  });
});

describe('storage trouble', () => {
  it('answers 503 when no store is configured, and when the store throws', async () => {
    expect((await setup({ store: null }).post(body({ email: 'a@b.co' }))).body).toEqual({ ok: false, error: 'unavailable' });
    const { store, post } = setup();
    store.failWith = new Error('db down');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await post(body({ email: 'a@b.co' }))).status).toBe(503);
    expect(JSON.stringify(spy.mock.calls)).not.toContain('a@b.co');
    spy.mockRestore();
  });
});

describe('mail', () => {
  it('uses SendGrid only with a sender and a postal address, Mailpit in development, else nothing', () => {
    expect(mailFromEnv({ SENDGRID_API_KEY: 'k' })).toEqual({ provider: 'none' });
    expect(mailFromEnv({ SENDGRID_API_KEY: 'k', LEAD_FROM_EMAIL: 'me@x.co' })).toEqual({ provider: 'none' });
    expect(mailFromEnv({ SENDGRID_API_KEY: 'k', LEAD_FROM_EMAIL: 'me@x.co', LEAD_MAILING_ADDRESS: '1 Main St' })).toMatchObject({ provider: 'sendgrid', from: 'me@x.co', replyTo: 'me@x.co' });
    expect(mailFromEnv({ MAILPIT_URL: 'http://localhost:8025/' })).toMatchObject({ provider: 'mailpit', url: 'http://localhost:8025' });
    expect(mailFromEnv({})).toEqual({ provider: 'none' });
  });
  it('posts to Mailpit\'s send API in its own shape', async () => {
    const fetchImpl = vi.fn<typeof fetch>(() => ok());
    const cfg = mailFromEnv({ MAILPIT_URL: 'http://localhost:8025', LEAD_FROM_EMAIL: 'me@x.co', LEAD_MAILING_ADDRESS: '1 Main St' });
    expect(await sendWelcome(cfg, 'to@y.co', fetchImpl)).toBe('sent');
    expect(fetchImpl.mock.calls[0]![0]).toBe('http://localhost:8025/api/v1/send');
    expect(JSON.parse(fetchImpl.mock.calls[0]![1]!.body as string)).toMatchObject({ From: { Email: 'me@x.co' }, To: [{ Email: 'to@y.co' }], Subject: welcomeMessage('x').subject });
  });
  it('includes how to stop and the postal address in the message', () => {
    const { text } = welcomeMessage('1 Main St, Springfield');
    expect(text).toContain('reply "unsubscribe"');
    expect(text.endsWith('1 Main St, Springfield')).toBe(true);
  });
});
