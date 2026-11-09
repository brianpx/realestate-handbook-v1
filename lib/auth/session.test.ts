import { describe, expect, it } from 'vitest';
import { SESSION_CAP_SECONDS, SESSION_MAX_AGE_SECONDS } from './config';
import { MemoryAuthStore } from './memory-store';
import { sessionDueForRenewal, sessionExpiry, sessionLive, tokenExpiry, tokenUsable } from './session';
import { hashSecret, isSecretShape, newSecret } from './token';
import type { Session } from './types';

const NOW = new Date('2026-11-08T12:00:00Z');
const hours = (n: number) => new Date(NOW.getTime() + n * 3600 * 1000);
const session = (over: Partial<Session> = {}): Session => ({ idHash: 'h', userId: 'u', createdAt: hours(-48), expiresAt: hours(24 * 30), lastSeenAt: hours(-48), revokedAt: null, ...over });

describe('secrets', () => {
  it('are 43 base64url characters, hashed to 64 hex', () => {
    const raw = newSecret();
    expect(isSecretShape(raw)).toBe(true);
    expect(hashSecret(raw)).toMatch(/^[0-9a-f]{64}$/);
    expect(newSecret()).not.toBe(raw);
  });
  it.each(['', 'x'.repeat(42), 'x'.repeat(44), `${'x'.repeat(42)}=`, `${'x'.repeat(42)}/`, 42, null])('refuses the shape %j', value => {
    expect(isSecretShape(value)).toBe(false);
  });
});

describe('token rules', () => {
  it('expires fifteen minutes after issue and is usable until then, once', () => {
    expect(tokenExpiry(NOW).toISOString()).toBe('2026-11-08T12:15:00.000Z');
    const token = { tokenHash: 'h', email: 'a@b.co', nextPath: null, source: null, expiresAt: tokenExpiry(NOW), consumedAt: null, createdIpHash: null, createdAt: NOW };
    expect(tokenUsable(token, NOW)).toBe(true);
    expect(tokenUsable(token, new Date('2026-11-08T12:15:00Z'))).toBe(false);
    expect(tokenUsable({ ...token, consumedAt: NOW }, NOW)).toBe(false);
  });
});

describe('session rules', () => {
  it('a fresh session lasts 90 days', () => {
    expect(sessionExpiry(NOW).getTime() - NOW.getTime()).toBe(SESSION_MAX_AGE_SECONDS * 1000);
  });
  it.each([
    ['live', session(), true],
    ['revoked', session({ revokedAt: hours(-1) }), false],
    ['expired', session({ expiresAt: hours(-1) }), false],
    ['over the one-year cap even though expires_at is ahead', session({ createdAt: new Date(NOW.getTime() - SESSION_CAP_SECONDS * 1000) }), false],
  ])('%s', (_, s, live) => {
    expect(sessionLive(s, NOW)).toBe(live);
  });
  it('is due for renewal only when live and last seen over a day ago', () => {
    expect(sessionDueForRenewal(session({ lastSeenAt: hours(-25) }), NOW)).toBe(true);
    expect(sessionDueForRenewal(session({ lastSeenAt: hours(-23) }), NOW)).toBe(false);
    expect(sessionDueForRenewal(session({ lastSeenAt: hours(-25), revokedAt: hours(-2) }), NOW)).toBe(false);
  });
});

describe('MemoryAuthStore', () => {
  it('consumes a token once; the second call and an expired token answer null alike', async () => {
    const store = new MemoryAuthStore();
    await store.createToken({ tokenHash: 't', email: 'a@b.co', nextPath: '/handbook/ch2', source: 'hero', expiresAt: tokenExpiry(NOW), createdIpHash: null, createdAt: NOW });
    expect(await store.consumeToken('t', NOW)).toEqual({ email: 'a@b.co', nextPath: '/handbook/ch2', source: 'hero' });
    expect(await store.consumeToken('t', NOW)).toBeNull();
    await store.createToken({ tokenHash: 'old', email: 'a@b.co', nextPath: null, source: null, expiresAt: hours(-1), createdIpHash: null, createdAt: hours(-2) });
    expect(await store.consumeToken('old', NOW)).toBeNull();
    expect(await store.consumeToken('unknown', NOW)).toBeNull();
    expect((await store.peekToken('t'))?.consumedAt).toEqual(NOW);
  });
  it('renews a stale session once under concurrency and never a fresh or revoked one', async () => {
    const store = new MemoryAuthStore();
    await store.createSession({ idHash: 's', userId: 'u', createdAt: hours(-48), expiresAt: hours(24 * 30) });
    const results = await Promise.all([store.renewSession('s', NOW), store.renewSession('s', NOW)]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect((await store.findSession('s'))?.expiresAt).toEqual(sessionExpiry(NOW));
    expect(await store.renewSession('s', hours(1))).toBe(false);
    await store.revokeSession('s', hours(2));
    expect(await store.renewSession('s', hours(30))).toBe(false);
    expect(sessionLive((await store.findSession('s'))!, hours(30))).toBe(false);
  });
  it('revokes every session of a user, leaving other users alone', async () => {
    const store = new MemoryAuthStore();
    await store.createSession({ idHash: 'a1', userId: 'a', createdAt: NOW, expiresAt: sessionExpiry(NOW) });
    await store.createSession({ idHash: 'a2', userId: 'a', createdAt: NOW, expiresAt: sessionExpiry(NOW) });
    await store.createSession({ idHash: 'b1', userId: 'b', createdAt: NOW, expiresAt: sessionExpiry(NOW) });
    await store.revokeAllForUser('a', NOW);
    expect(store.sessions.map(s => s.revokedAt !== null)).toEqual([true, true, false]);
  });
  it('counts attempts per scope and key within the window, including the one just recorded', async () => {
    const store = new MemoryAuthStore();
    expect(await store.recordAndCount('ip', 'k', NOW, hours(-1))).toBe(1);
    expect(await store.recordAndCount('ip', 'k', NOW, hours(-1))).toBe(2);
    expect(await store.recordAndCount('email', 'k', NOW, hours(-1))).toBe(1);
    expect(await store.recordAndCount('ip', 'k', hours(2), hours(1))).toBe(1);
  });
});
