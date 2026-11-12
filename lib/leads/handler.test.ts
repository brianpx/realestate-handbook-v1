import { describe, expect, it, vi, type Mock } from 'vitest';
import { hashSecret } from '@/lib/auth/token';
import { DEFAULT_SEND_CEILING, SEND_CEILING_WINDOW_SECONDS } from '@/lib/send-ceiling';
import { CONFIRM_PATH, CONFIRM_RETRY_SECONDS, CONSENT_TEXTS, CONSENT_VERSION, RATE_LIMIT, UNSUBSCRIBE_API, UNSUBSCRIBE_PATH } from './config';
import { CONFIRM_FAILED, CONFIRMED, handleConfirm, handleLead, handleUnsubscribe, hashIp, UNSUBSCRIBE_FAILED, UNSUBSCRIBED, type LeadDeps } from './handler';
import { confirmationMessage, mailFromEnv, sendConfirmation, type MailConfig } from './mail';
import { MemoryLeadStore } from './store';
import { signUnsubscribe } from './unsubscribe';

const NOW = new Date('2026-11-02T12:00:00Z');
const SITE = 'https://handbook.example';
const body = (o: Record<string, unknown>) => JSON.stringify({ consentVersion: CONSENT_VERSION, source: 'sample', ...o });
const UNSUB = { page: 'https://x.co/subscribe/unsubscribe?token=u', oneClick: 'https://x.co/api/lead/unsubscribe?token=u' };
const ok = (init?: Partial<Response>) => Promise.resolve({ ok: true, status: 202, ...init } as Response);

function setup(over: Partial<LeadDeps> & { fetchImpl?: Mock<typeof fetch> } = {}) {
  const store = new MemoryLeadStore();
  const fetchImpl = over.fetchImpl ?? vi.fn<typeof fetch>(() => ok()); // the one sentLink() reads from
  const mail: MailConfig = { provider: 'sendgrid', apiKey: 'SG.x', from: 'me@example.test', fromName: 'Handbook', replyTo: 'me@example.test', mailingAddress: '1 Main St' };
  const deps: LeadDeps = { store, mail, allowedOrigins: [SITE], siteUrl: SITE, ipSalt: 's', sendCeiling: DEFAULT_SEND_CEILING, now: () => NOW, fetchImpl, ...over };
  const post = (b: string, extra: { origin?: string | null; ip?: string } = {}) =>
    handleLead({ origin: extra.origin === undefined ? SITE : extra.origin, ip: extra.ip ?? '203.0.113.9', body: b }, deps);
  const confirm = (token: string, extra: { origin?: string | null; ip?: string } = {}) =>
    handleConfirm({ origin: extra.origin === undefined ? SITE : extra.origin, ip: extra.ip ?? '203.0.113.9', body: new URLSearchParams({ token }).toString() }, deps);
  const sentLink = (call = 0): string => {
    const sent = JSON.parse(fetchImpl.mock.calls[call]![1]!.body as string) as { content: { value: string }[] };
    return /https?:\/\/\S+/.exec(sent.content[0]!.value)![0];
  };
  return { store, fetchImpl, post, confirm, sentLink, deps };
}

describe('a new address', () => {
  it('is stored unconfirmed with the consent text for the version named, lower-cased, and gets one confirmation email', async () => {
    const { store, post, fetchImpl, sentLink } = setup();
    const r = await post(body({ email: '  Sam@Example.COM ', source: 'signup' }));
    expect(r).toEqual({ status: 200, body: { ok: true } });
    expect(store.leads).toHaveLength(1);
    expect(store.leads[0]).toMatchObject({ email: 'sam@example.com', source: 'signup', consentVersion: CONSENT_VERSION, consentText: CONSENT_TEXTS[CONSENT_VERSION], emailStatus: 'sent', confirmedAt: null });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const sent = JSON.parse(fetchImpl.mock.calls[0]![1]!.body as string);
    expect(sent.personalizations[0].to[0].email).toBe('sam@example.com');
    expect(sent.content[0].value).toContain('1 Main St');
    expect(sent.content[0].value).not.toContain('sam@example.com');
    // the link is built on the site address, carries the raw token, and the store holds only its hash
    const link = sentLink();
    expect(link.startsWith(`${SITE}${CONFIRM_PATH}?token=`)).toBe(true);
    expect(hashSecret(new URL(link).searchParams.get('token')!)).toBe(store.leads[0]!.confirmTokenHash);
    expect(store.leads[0]!.confirmTokenHash).toMatch(/^[0-9a-f]{64}$/);
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
    const again = await post(body({ email: 'A@B.CO', source: 'upsell' }));
    expect(again).toEqual({ status: 200, body: { ok: true } });
    expect(store.leads).toHaveLength(1);
    expect(store.leads[0]!.source).toBe('sample');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it('gets a fresh link, and the same answer, when the first email failed and the address is still unconfirmed', async () => {
    const fetchImpl = vi.fn<typeof fetch>(() => ok({ ok: false, status: 500 }));
    const { store, post, sentLink } = setup({ fetchImpl });
    await post(body({ email: 'a@b.co' }));
    const firstHash = store.leads[0]!.confirmTokenHash;
    expect(store.leads[0]!.emailStatus).toBe('failed');
    fetchImpl.mockImplementation(() => ok());
    expect(await post(body({ email: 'a@b.co' }))).toEqual({ status: 200, body: { ok: true } });
    expect(store.leads).toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(store.leads[0]!.emailStatus).toBe('sent');
    expect(store.leads[0]!.confirmTokenHash).not.toBe(firstHash);
    expect(hashSecret(new URL(sentLink(1)).searchParams.get('token')!)).toBe(store.leads[0]!.confirmTokenHash);
    // once the link went out, a third submit sends nothing more
    await post(body({ email: 'a@b.co' }));
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
  it('treats a filled hidden field as a bot: success on the surface, nothing stored or sent', async () => {
    const { store, post, fetchImpl } = setup();
    expect(await post(body({ email: 'bot@spam.co', _gotcha: 'http://spam' }))).toEqual({ status: 200, body: { ok: true } });
    expect(store.leads).toHaveLength(0);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('confirmation', () => {
  it('subscribes the address when the link is posted back, once, and a second click lands on the same page', async () => {
    const { store, post, confirm, sentLink } = setup();
    await post(body({ email: 'a@b.co' }));
    const token = new URL(sentLink()).searchParams.get('token')!;
    expect(await confirm(token)).toEqual({ status: 303, headers: { Location: CONFIRMED } });
    expect(store.leads[0]!.confirmedAt).toEqual(NOW);
    const later = { ...setup().deps, store, now: () => new Date(NOW.getTime() + 60_000) };
    expect(await handleConfirm({ origin: SITE, ip: '203.0.113.9', body: new URLSearchParams({ token }).toString() }, later)).toEqual({ status: 303, headers: { Location: CONFIRMED } });
    expect(store.leads[0]!.confirmedAt).toEqual(NOW);
  });
  it('sends an unknown or malformed token to the failure state, and refuses without an allowed origin', async () => {
    const { confirm, store } = setup();
    expect(await confirm('x'.repeat(43))).toEqual({ status: 303, headers: { Location: CONFIRM_FAILED } });
    expect(await confirm('short')).toEqual({ status: 303, headers: { Location: CONFIRM_FAILED } });
    expect(await confirm('x'.repeat(43), { origin: null })).toEqual({ status: 303, headers: { Location: CONFIRM_FAILED } });
    expect(await confirm('x'.repeat(43), { origin: 'https://evil.example' })).toEqual({ status: 303, headers: { Location: CONFIRM_FAILED } });
    expect(store.leads).toHaveLength(0);
  });
  it('refuses a link older than a week, but still answers a confirmed one', async () => {
    const { store, post, confirm, sentLink, deps } = setup();
    await post(body({ email: 'a@b.co' }));
    const token = new URL(sentLink()).searchParams.get('token')!;
    const late = { ...deps, now: () => new Date(NOW.getTime() + 8 * 24 * 3600 * 1000) };
    const at = (t: string) => handleConfirm({ origin: SITE, ip: '203.0.113.9', body: new URLSearchParams({ token: t }).toString() }, late);
    expect(await at(token)).toEqual({ status: 303, headers: { Location: CONFIRM_FAILED } });
    expect(store.leads[0]!.confirmedAt).toBeNull();
    expect(await confirm(token)).toEqual({ status: 303, headers: { Location: CONFIRMED } });
    expect(await at(token)).toEqual({ status: 303, headers: { Location: CONFIRMED } });
  });
  it('is rate-limited per address like the form, and lands on the failure page for the limit, a missing store and a store error, because the reader is navigating', async () => {
    const { confirm, store } = setup();
    for (let i = 0; i < RATE_LIMIT.attempts; i++) await confirm('short');
    expect(await confirm('x'.repeat(43))).toEqual({ status: 303, headers: { Location: CONFIRM_FAILED } });
    expect(await setup({ store: null }).confirm('x'.repeat(43))).toEqual({ status: 303, headers: { Location: CONFIRM_FAILED } });
    store.failWith = new Error('db down');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await confirm('x'.repeat(43), { ip: '198.51.100.7' })).toEqual({ status: 303, headers: { Location: CONFIRM_FAILED } });
    spy.mockRestore();
  });
});

describe('bad requests', () => {
  it.each([['not an email'], [''], ['a@'], ['x'.repeat(250) + '@b.co']])('rejects the address %j', async email => {
    const { store, post } = setup();
    expect(await post(body({ email }))).toEqual({ status: 400, body: { ok: false, error: 'invalid_email' } });
    expect(store.leads).toHaveLength(0);
  });
  it('rejects an unknown consent version, so the text stored is never the browser\'s', async () => {
    const { store, post } = setup();
    expect((await post(body({ email: 'a@b.co', consentVersion: 'v99' }))).body).toEqual({ ok: false, error: 'invalid_request' });
    // a prototype key is not a version either: the old `in` check accepted it and stored a function as the consent text
    expect((await post(body({ email: 'a@b.co', consentVersion: 'constructor' }))).body).toEqual({ ok: false, error: 'invalid_request' });
    expect(store.leads).toHaveLength(0);
    expect((await post(JSON.stringify({ email: 'a@b.co' }))).body).toEqual({ ok: false, error: 'invalid_request' });
  });
  it('rejects a source it does not know, so the admin counts stay by placement', async () => {
    const { store, post } = setup();
    expect((await post(body({ email: 'a@b.co', source: 'gate' }))).body).toEqual({ ok: false, error: 'invalid_request' });
    expect((await post(JSON.stringify({ email: 'a@b.co', consentVersion: CONSENT_VERSION }))).body).toEqual({ ok: false, error: 'invalid_request' });
    expect(store.leads).toHaveLength(0);
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

describe('send ceiling', () => {
  it('refuses every caller alike with the per-connection 429 (rate_limited, Retry-After) once the window is full, stores nothing and sends nothing', async () => {
    const { post, store, fetchImpl } = setup({ sendCeiling: 2 });
    expect((await post(body({ email: 'a@b.co' }), { ip: '198.51.100.1' })).status).toBe(200);
    expect((await post(body({ email: 'b@b.co' }), { ip: '198.51.100.2' })).status).toBe(200);
    const over = await post(body({ email: 'c@b.co' }), { ip: '198.51.100.3' });
    expect(over).toEqual({ status: 429, body: { ok: false, error: 'rate_limited', retryAfterSeconds: SEND_CEILING_WINDOW_SECONDS }, headers: { 'Retry-After': String(SEND_CEILING_WINDOW_SECONDS) } });
    // a repeat address gets the same answer as a new one, so the full window tells nothing about who is on the list
    expect(await post(body({ email: 'a@b.co' }), { ip: '198.51.100.4' })).toEqual(over);
    expect(store.leads.map(l => l.email)).toEqual(['a@b.co', 'b@b.co']);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
  it('counts only requests that were about to send: bad bodies, bad addresses and bots take no slot', async () => {
    const { post, store } = setup({ sendCeiling: 1 });
    expect((await post('{bad', { ip: '198.51.100.1' })).status).toBe(400);
    expect((await post(body({ email: 'nope' }), { ip: '198.51.100.2' })).status).toBe(400);
    expect((await post(body({ email: 'bot@b.co', _gotcha: 'x' }), { ip: '198.51.100.3' })).status).toBe(200);
    expect(store.sends.size).toBe(0);
    expect((await post(body({ email: 'a@b.co' }), { ip: '198.51.100.4' })).status).toBe(200);
    expect((await post(body({ email: 'b@b.co' }), { ip: '198.51.100.5' })).status).toBe(429);
  });
  it('opens again in the next window', async () => {
    const { post, deps } = setup({ sendCeiling: 1 });
    expect((await post(body({ email: 'a@b.co' }), { ip: '198.51.100.1' })).status).toBe(200);
    expect((await post(body({ email: 'b@b.co' }), { ip: '198.51.100.2' })).status).toBe(429);
    const later = new Date(NOW.getTime() + SEND_CEILING_WINDOW_SECONDS * 1000);
    expect((await handleLead({ origin: SITE, ip: '198.51.100.2', body: body({ email: 'b@b.co' }) }, { ...deps, now: () => later })).status).toBe(200);
  });
});

describe('confirmation lease', () => {
  it('sends once for a null status whose lease is older than the retry window, and a fresh lease is not claimed again', async () => {
    const { store, post, fetchImpl } = setup();
    await store.insert({ email: 'a@b.co', source: 'sample', consentVersion: CONSENT_VERSION, consentText: CONSENT_TEXTS[CONSENT_VERSION], confirmTokenHash: 'a'.repeat(64), confirmExpiresAt: new Date(NOW.getTime() + 7 * 24 * 3600 * 1000), at: NOW });
    const row = store.leads[0]!;
    row.emailStatus = null;
    row.confirmDeliveryStartedAt = new Date(NOW.getTime() - (CONFIRM_RETRY_SECONDS + 1) * 1000).toISOString();
    expect((await post(body({ email: 'a@b.co' }))).status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(store.leads[0]!.emailStatus).toBe('sent');
    expect((await post(body({ email: 'a@b.co' }))).status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it('sends one email for overlapping submits, and never emails a confirmed address', async () => {
    const { store, post, fetchImpl, confirm, sentLink } = setup();
    const [first, second] = await Promise.all([post(body({ email: 'a@b.co' })), post(body({ email: 'a@b.co' }))]);
    expect([first.status, second.status]).toEqual([200, 200]);
    expect(store.leads).toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const token = new URL(sentLink()).searchParams.get('token')!;
    expect(await confirm(token)).toEqual({ status: 303, headers: { Location: CONFIRMED } });
    expect((await post(body({ email: 'a@b.co' }))).status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(store.leads[0]!.confirmedAt).toEqual(NOW);
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
    expect(mailFromEnv({ SENDGRID_API_KEY: 'k', LEAD_FROM_EMAIL: 'me@x.co', LEAD_MAILING_ADDRESS: '1 Main St' })).toMatchObject({ provider: 'sendgrid', from: 'me@x.co', replyTo: 'me@x.co', mailingAddress: '1 Main St' });
    expect(mailFromEnv({ MAILPIT_URL: 'http://localhost:8025/' })).toMatchObject({ provider: 'mailpit', url: 'http://localhost:8025', mailingAddress: 'synthetic temp address' });
    expect(mailFromEnv({})).toEqual({ provider: 'none' });
  });
  it('posts to Mailpit\'s send API in its own shape', async () => {
    const fetchImpl = vi.fn<typeof fetch>(() => ok());
    const cfg = mailFromEnv({ MAILPIT_URL: 'http://localhost:8025', LEAD_FROM_EMAIL: 'me@x.co', LEAD_MAILING_ADDRESS: '1 Main St' });
    expect(await sendConfirmation(cfg, 'to@y.co', 'https://x.co/subscribe/confirm?token=t', UNSUB, fetchImpl)).toBe('sent');
    expect(fetchImpl.mock.calls[0]![0]).toBe('http://localhost:8025/api/v1/send');
    expect(JSON.parse(fetchImpl.mock.calls[0]![1]!.body as string)).toMatchObject({ From: { Email: 'me@x.co' }, To: [{ Email: 'to@y.co' }], Subject: confirmationMessage('x', 'y', UNSUB).subject });
    expect(JSON.parse(fetchImpl.mock.calls[0]![1]!.body as string).Headers).toEqual({ 'List-Unsubscribe': `<${UNSUB.oneClick}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' });
  });
  it('carries the link, says nothing is sent without it, how to stop later, and the postal address', () => {
    const { text } = confirmationMessage('https://x.co/subscribe/confirm?token=t', '1 Main St, Springfield', UNSUB);
    expect(text).toContain('https://x.co/subscribe/confirm?token=t');
    expect(text).toContain('Nothing is sent until you do');
    expect(text).toContain('reply "unsubscribe"');
    expect(text).toContain(UNSUB.page);
    expect(text.endsWith('1 Main St, Springfield')).toBe(true);
  });
});

describe('unsubscribing', () => {
  const tokenOf = (link: string) => new URL(link).searchParams.get('token')!;
  const form = (token: string) => new URLSearchParams({ token }).toString();
  const subscribed = async () => {
    const s = setup();
    await s.post(body({ email: 'a@b.co' }));
    await s.confirm(tokenOf(s.sentLink(0)));
    return { ...s, id: s.store.leads[0]!.id };
  };

  it('puts a signed page link and the one-click headers in the confirmation email, and nothing about the address in the link', async () => {
    const { fetchImpl, store, post } = setup();
    await post(body({ email: 'sam@example.com' }));
    const sent = JSON.parse(fetchImpl.mock.calls[0]![1]!.body as string) as { content: { value: string }[]; headers: Record<string, string> };
    const token = signUnsubscribe(store.leads[0]!.id, 's');
    expect(sent.content[0]!.value).toContain(`${SITE}${UNSUBSCRIBE_PATH}?token=${token}`);
    expect(sent.headers).toEqual({ 'List-Unsubscribe': `<${SITE}${UNSUBSCRIBE_API}?token=${token}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' });
    expect(token).not.toContain('sam');
  });
  it('unsubscribes from the page form and ends on the done state, keeping the first time on a second click', async () => {
    const { store, deps, id } = await subscribed();
    const token = signUnsubscribe(id, deps.ipSalt);
    expect(await handleUnsubscribe({ origin: SITE, ip: 'x', body: form(token) }, deps)).toEqual({ status: 303, headers: { Location: UNSUBSCRIBED } });
    const first = store.leads[0]!.unsubscribedAt;
    expect(first).toEqual(NOW);
    expect(await handleUnsubscribe({ origin: SITE, ip: 'x', body: form(token) }, { ...deps, now: () => new Date(NOW.getTime() + 1000) })).toEqual({ status: 303, headers: { Location: UNSUBSCRIBED } });
    expect(store.leads[0]!.unsubscribedAt).toBe(first);
  });
  it('answers a mail client\'s one-click POST with 200, no Origin and the token in the query string', async () => {
    const { store, deps, id } = await subscribed();
    const r = await handleUnsubscribe({ origin: null, ip: 'mx', body: 'List-Unsubscribe=One-Click', search: `?token=${signUnsubscribe(id, deps.ipSalt)}` }, deps);
    expect(r).toEqual({ status: 200, body: { ok: true } });
    expect(store.leads[0]!.unsubscribedAt).toEqual(NOW);
  });
  it('refuses a forged, foreign, malformed or unknown token, changing nothing', async () => {
    const { store, deps, id } = await subscribed();
    const bad = [signUnsubscribe(id, 'another-secret'), `${id}.${'A'.repeat(43)}`, 'junk', '', signUnsubscribe('00000000-0000-4000-8000-000000000000', deps.ipSalt)];
    for (const token of bad) {
      expect(await handleUnsubscribe({ origin: SITE, ip: 'x', body: form(token) }, deps)).toEqual({ status: 303, headers: { Location: UNSUBSCRIBE_FAILED } });
      expect((await handleUnsubscribe({ origin: null, ip: 'x', body: 'List-Unsubscribe=One-Click', search: `?token=${token}` }, deps)).status).toBe(400);
    }
    expect(store.leads[0]!.unsubscribedAt ?? null).toBeNull();
  });
  it('is not undone by confirming afterwards, and does not count as an attempt against the connection', async () => {
    const { store, deps, confirm, sentLink } = setup();
    await handleLead({ origin: SITE, ip: '203.0.113.9', body: body({ email: 'a@b.co' }) }, deps);
    const id = store.leads[0]!.id;
    await handleUnsubscribe({ origin: SITE, ip: 'x', body: form(signUnsubscribe(id, deps.ipSalt)) }, deps);
    await confirm(new URL(sentLink(0)).searchParams.get('token')!);
    expect(store.leads[0]!.unsubscribedAt).toEqual(NOW);
    expect(store.attempts.filter(a => a.ipHash === hashIp('x', deps.ipSalt))).toHaveLength(0);
  });
  it('ends on the failure state, or 503 for a mail client, when there is no store or the store throws, without logging the address', async () => {
    const { store, deps, id } = await subscribed();
    const token = signUnsubscribe(id, deps.ipSalt);
    expect(await handleUnsubscribe({ origin: SITE, ip: 'x', body: form(token) }, { ...deps, store: null })).toEqual({ status: 303, headers: { Location: UNSUBSCRIBE_FAILED } });
    expect((await handleUnsubscribe({ origin: null, ip: 'x', body: 'List-Unsubscribe=One-Click', search: `?token=${token}` }, { ...deps, store: null })).status).toBe(503);
    store.failWith = new Error('db down');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await handleUnsubscribe({ origin: SITE, ip: 'x', body: form(token) }, deps)).toEqual({ status: 303, headers: { Location: UNSUBSCRIBE_FAILED } });
    expect(JSON.stringify(spy.mock.calls)).not.toContain('a@b.co');
    spy.mockRestore();
  });
  it('refuses an oversized body', async () => {
    const { deps } = setup();
    expect((await handleUnsubscribe({ origin: null, ip: 'x', body: 'x'.repeat(5000) }, deps)).status).toBe(413);
  });
});
