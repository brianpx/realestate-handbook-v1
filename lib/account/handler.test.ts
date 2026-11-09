import { describe, expect, it, vi } from 'vitest';
import { grantAccess } from '@/lib/access/grants';
import { MemoryAccessStore } from '@/lib/access/memory-store';
import { MemoryAuthStore } from '@/lib/auth/memory-store';
import { sessionExpiry } from '@/lib/auth/session';
import { hashSecret, newSecret } from '@/lib/auth/token';
import { MemoryLeadStore } from '@/lib/leads/store';
import { MemoryUserStore } from '@/lib/users/store';
import { handleDeleteAccount, handleSignOutAll, type AccountDeps } from './handler';

const NOW = new Date('2026-11-08T12:00:00Z');
const ORIGIN = 'https://handbook.example';
const EMAIL = 'reader@example.com';

async function setup() {
  const users = new MemoryUserStore();
  const auth = new MemoryAuthStore();
  const access = new MemoryAccessStore({ users, auth });
  const leads = new MemoryLeadStore();
  const deps: AccountDeps = { stores: { users, auth, access }, leads, allowedOrigins: [ORIGIN], ipSalt: 's', now: () => NOW };
  const { user } = await users.upsertVerified({ email: EMAIL, termsVersion: 'v1', at: NOW });
  const sessions = [newSecret(), newSecret()];
  for (const raw of sessions) await auth.createSession({ idHash: hashSecret(raw), userId: user.id, createdAt: NOW, expiresAt: sessionExpiry(NOW) });
  await leads.insert({ email: EMAIL, source: 'hero', consentVersion: 'v1', consentText: 't', at: NOW });
  await auth.createToken({ tokenHash: 'h'.repeat(64), email: EMAIL, nextPath: null, termsVersion: 'v1', source: 'hero', expiresAt: NOW, createdIpHash: null, createdAt: NOW });
  const req = (body = '', extra: { origin?: string | null; sessionId?: string; url?: string } = {}) => ({
    url: extra.url ?? `${ORIGIN}/api/account/x`,
    origin: extra.origin === undefined ? ORIGIN : extra.origin,
    ip: '203.0.113.9',
    body,
    sessionId: 'sessionId' in extra ? extra.sessionId : sessions[0],
  });
  return { users, auth, access, leads, deps, user, sessions, req };
}

describe('sign out everywhere', () => {
  it('revokes every session of the reader, logs it once, clears the cookie and sends them to sign in again', async () => {
    const { auth, access, deps, user, req } = await setup();
    const res = await handleSignOutAll(req(), deps);
    expect(res.status).toBe(303);
    expect(res.headers?.Location).toBe('/signup?next=%2Faccount');
    expect(res.headers?.['Set-Cookie']).toContain('__Host-hb_session=;');
    expect(auth.sessions.every(s => s.revokedAt !== null)).toBe(true);
    expect(access.audit).toHaveLength(1);
    expect(access.audit[0]).toMatchObject({ action: 'session.revoke_all', actorKind: 'user', actorUserId: user.id, subjectTable: 'sessions', subjectId: user.id, after: { revoked: 2 } });
    expect(access.audit[0]!.ipHash).toMatch(/^[0-9a-f]+$/);
    expect(access.audit[0]!.ipHash).not.toContain('203.0.113.9');
    // nothing left to revoke: no second audit row either
    await handleSignOutAll(req('', { sessionId: newSecret() }), deps);
    expect(access.audit).toHaveLength(1);
  });
  it('refuses a foreign origin, and without a live session only clears the cookie', async () => {
    const { auth, deps, req } = await setup();
    expect((await handleSignOutAll(req('', { origin: 'https://evil.example' }), deps)).status).toBe(403);
    expect((await handleSignOutAll(req('', { origin: null }), deps)).status).toBe(403);
    const res = await handleSignOutAll(req('', { sessionId: undefined }), deps);
    expect(res.status).toBe(303);
    expect(res.headers?.['Set-Cookie']).toContain('hb_session=;');
    expect(auth.sessions.every(s => s.revokedAt === null)).toBe(true);
    expect((await handleSignOutAll(req(), { ...deps, stores: null })).status).toBe(503);
  });
});

describe('delete account', () => {
  it('needs the typed address to match, then anonymises, keeps the grants, drops the lead row and clears the cookie', async () => {
    const { users, auth, access, leads, deps, user, req } = await setup();
    await grantAccess(access, { userId: user.id, kind: 'complimentary', tier: 'basic', grantedBy: user.id }, { kind: 'system', userId: null }, NOW);
    const wrong = await handleDeleteAccount(req(new URLSearchParams({ confirmEmail: 'other@example.com' }).toString()), deps);
    expect(wrong.status).toBe(303);
    expect(wrong.headers?.Location).toBe('/account?error=confirm');
    expect(users.users[0]!.status).toBe('active');

    const res = await handleDeleteAccount(req(new URLSearchParams({ confirmEmail: ' Reader@Example.com ' }).toString()), deps);
    expect(res.status).toBe(303);
    expect(res.headers?.Location).toBe('/goodbye');
    expect(res.headers?.['Set-Cookie']).toContain('hb_session=;');
    expect(users.users[0]).toMatchObject({ status: 'deleted', email: `deleted+${user.id}@invalid.local` });
    expect(auth.sessions).toHaveLength(0);
    expect(auth.tokens).toHaveLength(0);
    expect(await leads.list()).toHaveLength(0);
    expect(access.grants).toHaveLength(1);
    const anonymised = access.audit.find(a => a.action === 'user.anonymize');
    expect(anonymised).toMatchObject({ actorKind: 'user', actorUserId: user.id, subjectTable: 'users', subjectId: user.id, before: { status: 'active' }, after: { status: 'deleted' } });
    expect(JSON.stringify(access.audit)).not.toContain(EMAIL);
  });
  it('refuses a foreign origin and an oversized body, and sends a signed-out visitor to sign in', async () => {
    const { users, deps, req } = await setup();
    const body = new URLSearchParams({ confirmEmail: EMAIL }).toString();
    expect((await handleDeleteAccount(req(body, { origin: 'https://evil.example' }), deps)).status).toBe(403);
    expect((await handleDeleteAccount(req('x'.repeat(5000)), deps)).status).toBe(413);
    const out = await handleDeleteAccount(req(body, { sessionId: undefined }), deps);
    expect(out.status).toBe(303);
    expect(out.headers?.Location).toBe('/signup?next=%2Faccount');
    expect(users.users[0]!.status).toBe('active');
  });
  it('is a 503 when the store fails, and the lead store failing does not fail the deletion', async () => {
    const { auth, leads, deps, req, users } = await setup();
    const body = new URLSearchParams({ confirmEmail: EMAIL }).toString();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      auth.failWith = new Error('db down');
      expect((await handleDeleteAccount(req(body), deps)).status).toBe(503);
      expect((await handleSignOutAll(req(), deps)).status).toBe(503);
      expect(users.users[0]!.status).toBe('active');
      auth.failWith = null;
      leads.failWith = new Error('leads down');
      const res = await handleDeleteAccount(req(body), deps);
      expect(res.status).toBe(303);
      expect(res.headers?.Location).toBe('/goodbye');
      expect(users.users[0]!.status).toBe('deleted');
    } finally {
      spy.mockRestore();
    }
  });
});
