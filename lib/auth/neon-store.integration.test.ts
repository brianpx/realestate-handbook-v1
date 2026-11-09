import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { sqlFromUrl } from '@/lib/db/sql';
import { NeonUserStore } from '@/lib/users/neon-store';
import { NeonAuthStore } from './neon-store';
import { sessionExpiry, tokenExpiry } from './session';
import { hashSecret, newSecret } from './token';

// Runs against a real Neon database with db/migrations/002_users_auth.sql applied, so it only runs when
// TEST_DATABASE_URL is set (a branch, never production). It writes rows with random names and removes them afterwards.
const url = process.env.TEST_DATABASE_URL;
const run = url ? describe : describe.skip;

run('the auth and user stores against a real database', () => {
  const sql = sqlFromUrl(url!);
  const users = new NeonUserStore(sql);
  const auth = new NeonAuthStore(sql);
  const tag = randomUUID().slice(0, 8);
  const email = `it-${tag}@integration.test`;
  const NOW = new Date();

  afterAll(async () => {
    await sql`delete from auth_tokens where email like ${`it-${tag}%`}`;
    await sql`delete from users where email like ${`it-${tag}%`}`; // sessions cascade
    await sql`delete from auth_attempts where key_hash like ${`it-${tag}%`}`;
  });

  it('creates a user once, fills only empty fields on a repeat, and refuses an un-normalised address', async () => {
    const first = await users.upsertVerified({ email, termsVersion: 'v1', at: NOW });
    const again = await users.upsertVerified({ email, termsVersion: 'v2', at: new Date(NOW.getTime() + 1000) });
    expect(first.created).toBe(true);
    expect(again.created).toBe(false);
    expect(again.user.id).toBe(first.user.id);
    expect(again.user.acceptedTermsVersion).toBe('v1');
    await expect(sql`insert into users (email) values (${email.toUpperCase()})`).rejects.toThrow();
    await expect(sql`insert into users (email) values (${email})`).rejects.toThrow(); // unique
  });

  it('consumes a token exactly once under two concurrent attempts', async () => {
    const raw = newSecret();
    await auth.createToken({ tokenHash: hashSecret(raw), email, nextPath: '/handbook/ch2', termsVersion: 'v1', source: 'hero', expiresAt: tokenExpiry(NOW), createdIpHash: null, createdAt: NOW });
    const results = await Promise.all([auth.consumeToken(hashSecret(raw), new Date()), auth.consumeToken(hashSecret(raw), new Date())]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(results.find(Boolean)).toEqual({ email, nextPath: '/handbook/ch2', termsVersion: 'v1', source: 'hero' });
    expect(await auth.consumeToken(hashSecret(raw), new Date())).toBeNull();
    const expired = newSecret();
    await auth.createToken({ tokenHash: hashSecret(expired), email, nextPath: null, termsVersion: 'v1', source: null, expiresAt: new Date(NOW.getTime() - 1000), createdIpHash: null, createdAt: NOW });
    expect(await auth.consumeToken(hashSecret(expired), new Date())).toBeNull();
    expect((await auth.peekToken(hashSecret(expired)))?.consumedAt).toBeNull();
  });

  it('renews a stale session once under two concurrent attempts, never a fresh or revoked one, and cascades on user removal', async () => {
    const { user } = await users.upsertVerified({ email: `it-${tag}-s@integration.test`, termsVersion: 'v1', at: NOW });
    const raw = newSecret();
    const idHash = hashSecret(raw);
    const twoDaysAgo = new Date(NOW.getTime() - 48 * 3600 * 1000);
    await auth.createSession({ idHash, userId: user.id, createdAt: twoDaysAgo, expiresAt: sessionExpiry(twoDaysAgo) });
    const renewed = await Promise.all([auth.renewSession(idHash, NOW), auth.renewSession(idHash, NOW)]);
    expect(renewed.filter(Boolean)).toHaveLength(1);
    const after = await auth.findSession(idHash);
    expect(after?.expiresAt.getTime()).toBe(sessionExpiry(NOW).getTime());
    expect(await auth.renewSession(idHash, new Date(NOW.getTime() + 1000))).toBe(false);
    await auth.revokeAllForUser(user.id, NOW);
    expect(await auth.renewSession(idHash, new Date(NOW.getTime() + 30 * 3600 * 1000))).toBe(false);
    await sql`delete from users where id = ${user.id}`;
    expect(await auth.findSession(idHash)).toBeNull();
  });

  it('counts attempts per scope and key, and the table refuses an unknown scope', async () => {
    const key = `it-${tag}-k`;
    const since = new Date(NOW.getTime() - 600 * 1000);
    expect(await auth.recordAndCount('ip', key, NOW, since)).toBe(1);
    expect(await auth.recordAndCount('ip', key, NOW, since)).toBe(2);
    expect(await auth.recordAndCount('email', key, NOW, since)).toBe(1);
    await expect(sql`insert into auth_attempts (scope, key_hash) values ('bogus', ${key})`).rejects.toThrow();
  });

  it('bootstraps one admin from two listed addresses verifying in sequence', async () => {
    const a = await users.upsertVerified({ email: `it-${tag}-a@integration.test`, termsVersion: 'v1', at: NOW });
    const b = await users.upsertVerified({ email: `it-${tag}-b@integration.test`, termsVersion: 'v1', at: NOW });
    const before = await users.countAdmins();
    if ((await users.countAdmins()) === 0) await users.setRole(a.user.id, 'admin', NOW);
    if ((await users.countAdmins()) === 0) await users.setRole(b.user.id, 'admin', NOW);
    expect((await users.findById(b.user.id))?.role).toBe('reader');
    if (before === 0) expect((await users.findById(a.user.id))?.role).toBe('admin');
    await users.setRole(a.user.id, 'reader', NOW);
  });
});
