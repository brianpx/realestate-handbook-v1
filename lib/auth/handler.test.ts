import { describe, expect, it, vi } from 'vitest';
import { MemoryAccessStore } from '@/lib/access/memory-store';
import { DEFAULT_SEND_CEILING, SEND_CEILING_WINDOW_SECONDS } from '@/lib/send-ceiling';
import { MemoryUserStore } from '@/lib/users/store';
import { REQUEST_LINK_LIMITS, TERMS_VERSION, VERIFY_LIMIT } from './config';
import { handleRequestLink, handleSignOut, handleVerify, type AuthDeps } from './handler';
import { MemoryAuthStore } from './memory-store';
import { hashSecret, newSecret } from './token';

const NOW = new Date('2026-11-08T12:00:00Z');
const ORIGIN = 'https://handbook.example';
const ok = (init?: Partial<Response>) => Promise.resolve({ ok: true, status: 202, ...init } as Response);
const body = (o: Record<string, unknown>) => JSON.stringify({ termsVersion: TERMS_VERSION, source: 'hero', ...o });

function setup(over: Partial<AuthDeps> = {}) {
  const users = new MemoryUserStore();
  const auth = new MemoryAuthStore();
  const access = new MemoryAccessStore({ users, auth });
  const fetchImpl = vi.fn<typeof fetch>(() => ok());
  let now = NOW;
  const deps: AuthDeps = {
    stores: { users, auth, access },
    mail: { provider: 'sendgrid', apiKey: 'SG.x', from: 'me@example.test', fromName: 'Handbook', replyTo: 'me@example.test', mailingAddress: '' },
    allowedOrigins: [ORIGIN],
    ipSalt: 's',
    sendCeiling: DEFAULT_SEND_CEILING,
    bootstrapEmails: [],
    now: () => now,
    fetchImpl,
    ...over,
  };
  const request = (b: string, extra: { origin?: string | null; ip?: string; url?: string } = {}) =>
    handleRequestLink({ url: extra.url ?? `${ORIGIN}/api/auth/request-link`, origin: extra.origin === undefined ? ORIGIN : extra.origin, ip: extra.ip ?? '203.0.113.9', body: b }, deps);
  const verify = (token: string, extra: { origin?: string | null; ip?: string; url?: string } = {}) =>
    handleVerify({ url: extra.url ?? `${ORIGIN}/api/auth/verify`, origin: extra.origin === undefined ? ORIGIN : extra.origin, ip: extra.ip ?? '203.0.113.9', body: new URLSearchParams({ token }).toString() }, deps);
  const sentLink = (call = 0): string => {
    const sent = JSON.parse(fetchImpl.mock.calls[call]![1]!.body as string) as { content: { value: string }[] };
    return /https?:\/\/\S+/.exec(sent.content[0]!.value)![0];
  };
  const rawToken = (call = 0) => new URL(sentLink(call)).searchParams.get('token')!;
  return { users, auth, access, fetchImpl, deps, request, verify, sentLink, rawToken, advance: (ms: number) => { now = new Date(now.getTime() + ms); } };
}

describe('request-link', () => {
  it('stores a hashed token with the path and placement, emails the link and creates no user', async () => {
    const { users, auth, fetchImpl, request, sentLink } = setup();
    expect(await request(body({ email: ' Reader@Example.COM ', next: '/handbook/ch2' }))).toEqual({ status: 200, body: { ok: true } });
    expect(users.users).toHaveLength(0);
    expect(auth.tokens).toHaveLength(1);
    const token = auth.tokens[0]!;
    expect(token).toMatchObject({ email: 'reader@example.com', nextPath: '/handbook/ch2', termsVersion: 'v1', source: 'hero', consumedAt: null, createdAt: NOW });
    expect(token.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(token.expiresAt.toISOString()).toBe('2026-11-08T12:15:00.000Z');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const sent = JSON.parse(fetchImpl.mock.calls[0]![1]!.body as string);
    expect(sent.personalizations[0].to[0].email).toBe('reader@example.com');
    expect(sent.content[0].value).not.toContain('reader@example.com');
    const link = sentLink();
    expect(link.startsWith(`${ORIGIN}/auth/verify?token=`)).toBe(true);
    expect(hashSecret(new URL(link).searchParams.get('token')!)).toBe(token.tokenHash);
  });
  it('answers a known and an unknown address byte for byte the same, one email each', async () => {
    const { users, request, fetchImpl } = setup();
    await users.upsertVerified({ email: 'known@example.com', termsVersion: 'v1', at: NOW });
    const known = await request(body({ email: 'known@example.com' }));
    const unknown = await request(body({ email: 'unknown@example.com' }));
    expect(JSON.stringify(known)).toBe(JSON.stringify(unknown));
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
  it('treats a filled hidden field as a bot: success on the surface, nothing stored or sent', async () => {
    const { auth, request, fetchImpl } = setup();
    expect(await request(body({ email: 'bot@spam.co', _gotcha: 'http://spam' }))).toEqual({ status: 200, body: { ok: true } });
    expect(auth.tokens).toHaveLength(0);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it('refuses a missing or foreign Origin before touching anything', async () => {
    const { auth, request } = setup();
    expect((await request(body({ email: 'a@b.co' }), { origin: null })).status).toBe(403);
    expect((await request(body({ email: 'a@b.co' }), { origin: 'https://evil.example' })).status).toBe(403);
    expect(auth.attempts).toHaveLength(0);
  });
  it('rejects bad bodies: not JSON, a bad address, an unknown terms version or placement', async () => {
    const { request } = setup();
    expect((await request('{nope')).body).toEqual({ ok: false, error: 'invalid_request' });
    expect((await request(body({ email: 'nope' }))).body).toEqual({ ok: false, error: 'invalid_email' });
    expect((await request(body({ email: 'a@b.co', termsVersion: 'v99' }))).body).toEqual({ ok: false, error: 'invalid_request' });
    expect((await request(body({ email: 'a@b.co', source: 'popup' }))).body).toEqual({ ok: false, error: 'invalid_request' });
    expect((await request(`{"email":"a@b.co","pad":"${'x'.repeat(5000)}"}`)).status).toBe(413);
  });
  it('replaces an unsafe next path with the handbook home', async () => {
    const { auth, request } = setup();
    await request(body({ email: 'a@b.co', next: '//evil.example' }));
    await request(body({ email: 'b@b.co', next: 'https://evil.example/x' }));
    expect(auth.tokens.map(t => t.nextPath)).toEqual(['/handbook', '/handbook']);
  });
  it('limits one connection to five requests in ten minutes, counting bad ones too', async () => {
    const { request } = setup();
    for (let i = 0; i < REQUEST_LINK_LIMITS.ip.attempts; i++) expect((await request(body({ email: `r${i}@b.co` }))).status).toBe(200);
    const sixth = await request('{nope');
    expect(sixth).toEqual({ status: 429, body: { ok: false, error: 'rate_limited', retryAfterSeconds: 600 }, headers: { 'Retry-After': '600' } });
    expect((await request(body({ email: 'other@b.co' }), { ip: '198.51.100.7' })).status).toBe(200);
  });
  it('limits one address to three links an hour, whatever the connection', async () => {
    const { request, fetchImpl } = setup();
    for (let i = 0; i < REQUEST_LINK_LIMITS.email.attempts; i++) expect((await request(body({ email: 'same@b.co' }), { ip: `198.51.100.${i}` })).status).toBe(200);
    const fourth = await request(body({ email: 'SAME@b.co' }), { ip: '198.51.100.9' });
    expect(fourth.status).toBe(429);
    expect(fourth.headers).toEqual({ 'Retry-After': '3600' });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });
  it('refuses every caller alike with the per-connection 429 once the window is full, and opens again in the next', async () => {
    const { auth, fetchImpl, request, advance } = setup({ sendCeiling: 2 });
    expect((await request(body({ email: 'a@b.co' }), { ip: '198.51.100.1' })).status).toBe(200);
    expect((await request(body({ email: 'b@b.co' }), { ip: '198.51.100.2' })).status).toBe(200);
    const over = await request(body({ email: 'c@b.co' }), { ip: '198.51.100.3' });
    expect(over).toEqual({ status: 429, body: { ok: false, error: 'rate_limited', retryAfterSeconds: SEND_CEILING_WINDOW_SECONDS }, headers: { 'Retry-After': String(SEND_CEILING_WINDOW_SECONDS) } });
    expect(await request(body({ email: 'a@b.co' }), { ip: '198.51.100.4' })).toEqual(over); // a known address: the same
    expect(auth.tokens).toHaveLength(2);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect((await request('{nope', { ip: '198.51.100.5' })).status).toBe(400); // nothing to send: no slot taken
    expect(auth.sends.get(NOW.toISOString())).toBe(4); // the four well-formed requests, the refused two included
    advance(SEND_CEILING_WINDOW_SECONDS * 1000);
    expect((await request(body({ email: 'c@b.co' }), { ip: '198.51.100.3' })).status).toBe(200);
  });
  it('is a 503 for everyone when there is no store, no sender, or the send fails', async () => {
    expect((await setup({ stores: null }).request(body({ email: 'a@b.co' }))).status).toBe(503);
    expect((await setup({ mail: { provider: 'none' } }).request(body({ email: 'a@b.co' }))).status).toBe(503);
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const failing = setup({ fetchImpl: vi.fn<typeof fetch>(() => ok({ ok: false, status: 500 })) });
      expect((await failing.request(body({ email: 'a@b.co' }))).status).toBe(503);
      failing.auth.failWith = new Error('db down');
      expect((await failing.request(body({ email: 'a@b.co' }))).status).toBe(503);
    } finally {
      spy.mockRestore();
    }
  });
});

describe('verify', () => {
  it('creates the user, a session and the cookie from a fresh link, then lands on the stored path', async () => {
    const t = setup();
    await t.request(body({ email: 'Reader@Example.com', next: '/handbook/ch2' }));
    const reply = await t.verify(t.rawToken());
    expect(reply.status).toBe(303);
    expect(reply.headers?.Location).toBe('/handbook/ch2');
    expect(reply.headers?.['Set-Cookie']).toEqual([expect.stringMatching(/^__Host-hb_session=[A-Za-z0-9_-]{43}; Path=\/; Max-Age=7776000; HttpOnly; SameSite=Lax; Secure$/), 'hb_signed_in=1; Path=/; Max-Age=7776000; SameSite=Lax; Secure']);
    expect(t.users.users).toHaveLength(1);
    expect(t.users.users[0]).toMatchObject({ email: 'reader@example.com', role: 'reader', status: 'active', emailVerifiedAt: NOW, acceptedTermsVersion: 'v1', acceptedTermsAt: NOW, lastSignInAt: NOW });
    const rawId = /hb_session=([^;]+)/.exec(String(reply.headers!['Set-Cookie']))![1]!;
    expect(t.auth.sessions).toHaveLength(1);
    expect(t.auth.sessions[0]).toMatchObject({ idHash: hashSecret(rawId), userId: t.users.users[0]!.id, createdAt: NOW, expiresAt: new Date('2027-02-06T12:00:00Z') });
    expect(t.auth.tokens[0]!.consumedAt).toEqual(NOW);
  });
  it('uses the plain cookie name without Secure over http', async () => {
    const t = setup({ allowedOrigins: ['http://localhost:3187'] });
    await t.request(body({ email: 'a@b.co' }), { origin: 'http://localhost:3187', url: 'http://localhost:3187/api/auth/request-link' });
    const reply = await t.verify(t.rawToken(), { origin: 'http://localhost:3187', url: 'http://localhost:3187/api/auth/verify' });
    expect(reply.headers?.['Set-Cookie']).toEqual([expect.stringMatching(/^hb_session=[A-Za-z0-9_-]{43}; Path=\/; Max-Age=7776000; HttpOnly; SameSite=Lax$/), 'hb_signed_in=1; Path=/; Max-Age=7776000; SameSite=Lax']);
    expect(reply.headers?.Location).toBe('/handbook');
  });
  it('fails the same way for a second use, an expired link, an unknown token and a disabled account', async () => {
    const t = setup();
    await t.request(body({ email: 'a@b.co' }));
    const first = await t.verify(t.rawToken());
    const again = await t.verify(t.rawToken());
    expect(first.status).toBe(303);
    expect(again).toEqual({ status: 303, headers: { Location: '/auth/verify?error=1' } });
    await t.request(body({ email: 'late@b.co' }));
    t.advance(15 * 60 * 1000);
    expect(await t.verify(t.rawToken(1))).toEqual(again);
    expect(await t.verify(newSecret())).toEqual(again);
    expect(await t.verify('not-a-token')).toEqual(again);
    await t.request(body({ email: 'off@b.co' }));
    const { user } = await t.users.upsertVerified({ email: 'off@b.co', termsVersion: 'v1', at: NOW });
    user.status = 'disabled';
    expect(await t.verify(t.rawToken(2))).toEqual(again);
    expect(t.auth.sessions).toHaveLength(1);
  });
  it('keeps the first terms version on a returning reader and records the new sign-in time', async () => {
    const t = setup();
    await t.users.upsertVerified({ email: 'a@b.co', termsVersion: 'v0', at: new Date('2026-01-01T00:00:00Z') });
    await t.request(body({ email: 'a@b.co' }));
    await t.verify(t.rawToken());
    expect(t.users.users).toHaveLength(1);
    expect(t.users.users[0]).toMatchObject({ acceptedTermsVersion: 'v0', lastSignInAt: NOW });
  });
  it('counts sign-ins apart from link requests, so a reader can sign in five times in ten minutes', async () => {
    const t = setup();
    for (let i = 0; i < REQUEST_LINK_LIMITS.ip.attempts; i++) {
      expect((await t.request(body({ email: `r${i}@b.co` }))).status).toBe(200);
      expect((await t.verify(t.rawToken(i))).status).toBe(303);
    }
    expect(t.auth.sessions).toHaveLength(REQUEST_LINK_LIMITS.ip.attempts);
  });
  it('refuses a missing Origin and limits one connection to ten tries in ten minutes', async () => {
    const t = setup();
    expect((await t.verify(newSecret(), { origin: null })).status).toBe(403);
    for (let i = 0; i < VERIFY_LIMIT.attempts; i++) expect((await t.verify(newSecret())).status).toBe(303);
    const eleventh = await t.verify(newSecret());
    expect(eleventh.status).toBe(429);
    expect(eleventh.headers).toEqual({ 'Retry-After': '600' });
  });
  it('makes the first bootstrap address an administrator and stays inert once one exists', async () => {
    const t = setup({ bootstrapEmails: ['owner@example.com', 'second@example.com'] });
    await t.request(body({ email: 'owner@example.com' }));
    await t.verify(t.rawToken(0));
    await t.request(body({ email: 'second@example.com' }));
    await t.verify(t.rawToken(1));
    await t.request(body({ email: 'reader@example.com' }));
    await t.verify(t.rawToken(2));
    expect(t.users.users.map(u => [u.email, u.role])).toEqual([['owner@example.com', 'admin'], ['second@example.com', 'reader'], ['reader@example.com', 'reader']]);
    // the owner reads through a grant like everyone else, and both steps are on the record; the second address got nothing
    const owner = t.users.users[0]!;
    expect(t.access.grants).toHaveLength(1);
    expect(t.access.grants[0]).toMatchObject({ userId: owner.id, kind: 'complimentary', tier: 'pro', grantedBy: owner.id });
    expect(t.access.audit.map(a => [a.action, a.actorKind, a.subjectId])).toEqual([['bootstrap_admin', 'system', owner.id], ['grant.create', 'system', t.access.grants[0]!.id]]);
    expect(t.access.audit[0]).toMatchObject({ before: { role: 'reader' }, after: { role: 'admin' } });
  });
  it('is a 503 when the store is missing or fails', async () => {
    expect((await setup({ stores: null }).verify(newSecret())).status).toBe(503);
    const t = setup();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      t.auth.failWith = new Error('db down');
      expect((await t.verify(newSecret())).status).toBe(503);
    } finally {
      spy.mockRestore();
    }
  });
});

describe('sign-out', () => {
  it('revokes the session named by the cookie, clears the cookie and goes home', async () => {
    const t = setup();
    const rawId = newSecret();
    await t.auth.createSession({ idHash: hashSecret(rawId), userId: 'u', createdAt: NOW, expiresAt: new Date('2027-02-06T12:00:00Z') });
    const reply = await handleSignOut({ url: `${ORIGIN}/api/auth/sign-out`, origin: ORIGIN, ip: 'x', body: '', sessionId: rawId }, t.deps);
    expect(reply).toEqual({ status: 303, headers: { Location: '/', 'Set-Cookie': ['__Host-hb_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure', 'hb_signed_in=; Path=/; Max-Age=0; SameSite=Lax; Secure'] } });
    expect(t.auth.sessions[0]!.revokedAt).toEqual(NOW);
  });
  it('still clears and redirects without a cookie, and refuses a foreign Origin', async () => {
    const t = setup();
    expect((await handleSignOut({ url: `${ORIGIN}/api/auth/sign-out`, origin: ORIGIN, ip: 'x', body: '' }, t.deps)).status).toBe(303);
    expect((await handleSignOut({ url: `${ORIGIN}/api/auth/sign-out`, origin: 'https://evil.example', ip: 'x', body: '' }, t.deps)).status).toBe(403);
  });
});

describe('the emailed link', () => {
  it('is built on the allow-listed Origin, never on the request host', async () => {
    const { request, sentLink } = setup();
    await request(body({ email: 'a@b.co' }), { url: 'https://attacker.example/api/auth/request-link' });
    expect(sentLink().startsWith(`${ORIGIN}/auth/verify?token=`)).toBe(true);
  });
});
