import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileAuthStore } from './file-store';
import { sessionExpiry, tokenExpiry } from './session';
import { authStoresFromEnv } from './store';

const NOW = new Date('2026-11-08T12:00:00Z');
const hours = (n: number) => new Date(NOW.getTime() + n * 3600 * 1000);
let dir: string;
let file: string;
beforeEach(async () => { dir = await mkdtemp(path.join(tmpdir(), 'auth-')); file = path.join(dir, 'nested', 'auth.json'); });
afterEach(() => rm(dir, { recursive: true, force: true }));

describe('FileAuthStore', () => {
  it('creates its folder, creates a user once and fills only empty fields on a repeat', async () => {
    const store = new FileAuthStore(file);
    const first = await store.upsertVerified({ email: 'a@b.co', termsVersion: 'v1', at: NOW });
    const again = await store.upsertVerified({ email: 'a@b.co', termsVersion: 'v2', at: hours(1) });
    expect(first.created).toBe(true);
    expect(again.created).toBe(false);
    expect(again.user).toEqual({ ...first.user, acceptedTermsVersion: 'v1' });
    expect((await store.findByEmail('a@b.co'))?.createdAt).toEqual(NOW);
    expect(await store.findById(first.user.id)).toEqual(first.user);
    expect(JSON.parse(await readFile(file, 'utf8')).users).toHaveLength(1);
  });
  it('starts empty when the file holds something other than the four arrays', async () => {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify({ users: 'nope', sessions: null }));
    const store = new FileAuthStore(file);
    expect(await store.findSession('s')).toBeNull();
    expect(await store.countAdmins()).toBe(0);
  });
  it('stores only hashes and round-trips dates for tokens and sessions', async () => {
    const store = new FileAuthStore(file);
    await store.createToken({ tokenHash: 'th', email: 'a@b.co', nextPath: '/handbook/ch2', termsVersion: 'v1', source: 'hero', expiresAt: tokenExpiry(NOW), createdIpHash: 'ip', createdAt: NOW });
    expect((await store.peekToken('th'))?.expiresAt).toEqual(tokenExpiry(NOW));
    expect(await store.consumeToken('th', NOW)).toEqual({ email: 'a@b.co', nextPath: '/handbook/ch2', termsVersion: 'v1', source: 'hero' });
    expect(await store.consumeToken('th', NOW)).toBeNull();
    await store.createSession({ idHash: 'sh', userId: 'u', createdAt: hours(-48), expiresAt: hours(24 * 30) });
    expect(await store.renewSession('sh', NOW)).toBe(true);
    expect(await store.renewSession('sh', NOW)).toBe(false);
    expect((await store.findSession('sh'))?.expiresAt).toEqual(sessionExpiry(NOW));
    await store.revokeAllForUser('u', NOW);
    expect((await store.findSession('sh'))?.revokedAt).toEqual(NOW);
    const raw = await readFile(file, 'utf8');
    expect(raw).not.toContain('"tokenHash":"' + 'x');
    expect(JSON.parse(raw).tokens[0].consumedAt).toBe(NOW.toISOString());
  });
  it('keeps concurrent writes from losing any, and counts attempts in the window', async () => {
    const store = new FileAuthStore(file);
    const counts = await Promise.all(Array.from({ length: 12 }, () => store.recordAndCount('ip', 'k', NOW, hours(-1))));
    expect(counts.sort((a, b) => a - b)).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
    expect(await store.recordAndCount('email', 'k', NOW, hours(-1))).toBe(1);
  });
  it('promotes a role and records a sign-in', async () => {
    const store = new FileAuthStore(file);
    const { user } = await store.upsertVerified({ email: 'a@b.co', termsVersion: 'v1', at: NOW });
    await store.setRole(user.id, 'admin');
    await store.touchSignIn(user.id, hours(1));
    expect(await store.countAdmins()).toBe(1);
    expect((await store.findById(user.id))?.lastSignInAt).toEqual(hours(1));
  });
});

describe('authStoresFromEnv', () => {
  it('uses the file store only when named and only outside a hosted deployment', () => {
    expect(authStoresFromEnv({ AUTH_STORE: 'file', AUTH_STORE_PATH: file })?.auth).toBeInstanceOf(FileAuthStore);
    expect(authStoresFromEnv({ AUTH_STORE: 'file', VERCEL_ENV: 'development' })?.auth).toBeInstanceOf(FileAuthStore);
    expect(authStoresFromEnv({ AUTH_STORE: 'file', VERCEL_ENV: 'preview' })).toBeNull();
    expect(authStoresFromEnv({ AUTH_STORE: 'file', VERCEL_ENV: 'production' })).toBeNull();
    expect(authStoresFromEnv({})).toBeNull();
  });
  it('prefers the database on a hosted deployment even when the file store is named', () => {
    const stores = authStoresFromEnv({ AUTH_STORE: 'file', VERCEL_ENV: 'production', DATABASE_URL: 'postgres://user:pw@host.neon.tech/db' });
    expect(stores?.auth).not.toBeInstanceOf(FileAuthStore);
    expect(stores?.users).toBeDefined();
  });
});
