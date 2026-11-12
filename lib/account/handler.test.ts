import { describe, expect, it, vi } from 'vitest';
import { grantAccess } from '@/lib/access/grants';
import { MemoryAccessStore } from '@/lib/access/memory-store';
import { MemoryAuthStore } from '@/lib/auth/memory-store';
import { sessionExpiry } from '@/lib/auth/session';
import { hashSecret, newSecret } from '@/lib/auth/token';
import { MemoryLeadStore } from '@/lib/leads/store';
import { newAvatarKey } from '@/lib/users/avatar';
import { MemoryAvatarStorage } from '@/lib/users/avatar-storage';
import { MemoryBillingInfoStore } from '@/lib/users/billing-info-store';
import { EMPTY_PROFILE } from '@/lib/users/profile';
import { MemoryProfileStore } from '@/lib/users/profile-store';
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
  const profiles = new MemoryProfileStore();
  const billingInfo = new MemoryBillingInfoStore();
  const avatars = new MemoryAvatarStorage();
  const deps: AccountDeps = { stores: { users, auth, access }, leads, profiles, billingInfo, avatars, allowedOrigins: [ORIGIN], ipSalt: 's', now: () => NOW };
  const { user } = await users.upsertVerified({ email: EMAIL, termsVersion: 'v1', at: NOW });
  await profiles.save(user.id, { ...EMPTY_PROFILE, brokerageName: 'Example Realty' }, 'user', NOW);
  const avatarKey = newAvatarKey(user.id);
  await avatars.put(avatarKey, new Uint8Array([1]));
  await users.setAvatar(user.id, avatarKey, NOW);
  await users.setDisplayName(user.id, 'Pat', NOW);
  await billingInfo.save(user.id, { companyName: 'Example LLC', taxIdType: 'us_ein', taxIdValue: '12-3456789' }, NOW);
  const sessions = [newSecret(), newSecret()];
  for (const raw of sessions) await auth.createSession({ idHash: hashSecret(raw), userId: user.id, createdAt: NOW, expiresAt: sessionExpiry(NOW) });
  await leads.insert({ email: EMAIL, source: 'signup', consentVersion: 'v1', consentText: 't', confirmTokenHash: 'c'.repeat(64), confirmExpiresAt: NOW, at: NOW });
  await auth.createToken({ tokenHash: 'h'.repeat(64), email: EMAIL, nextPath: null, termsVersion: 'v1', source: 'hero', expiresAt: NOW, createdIpHash: null, createdAt: NOW });
  const req = (body = '', extra: { origin?: string | null; sessionId?: string; url?: string } = {}) => ({
    url: extra.url ?? `${ORIGIN}/api/account/x`,
    origin: extra.origin === undefined ? ORIGIN : extra.origin,
    ip: '203.0.113.9',
    body,
    sessionId: 'sessionId' in extra ? extra.sessionId : sessions[0],
  });
  return { users, auth, access, leads, profiles, billingInfo, avatars, avatarKey, deps, user, sessions, req };
}

describe('sign out everywhere', () => {
  it('revokes every session of the reader, logs it once, clears the cookie and sends them to sign in again', async () => {
    const { auth, access, deps, user, req } = await setup();
    const res = await handleSignOutAll(req(), deps);
    expect(res.status).toBe(303);
    expect(res.headers?.Location).toBe('/signup?next=%2Faccount');
    expect(String(res.headers?.['Set-Cookie'])).toContain('__Host-hb_session=;');
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
    const unavailable = { status: 303, headers: { Location: '/account?error=unavailable' } };
    expect(await handleSignOutAll(req('', { origin: 'https://evil.example' }), deps)).toEqual(unavailable);
    expect(await handleSignOutAll(req('', { origin: null }), deps)).toEqual(unavailable);
    const res = await handleSignOutAll(req('', { sessionId: undefined }), deps);
    expect(res.status).toBe(303);
    expect(String(res.headers?.['Set-Cookie'])).toContain('hb_session=;');
    expect(auth.sessions.every(s => s.revokedAt === null)).toBe(true);
    expect(await handleSignOutAll(req(), { ...deps, stores: null })).toEqual(unavailable);
  });
});

describe('delete account', () => {
  it('needs the typed address to match, then anonymises, keeps the grants, drops the profile, the billing details and the lead row and clears the cookie', async () => {
    const { users, auth, access, leads, profiles, billingInfo, avatars, deps, user, req } = await setup();
    await grantAccess(access, { userId: user.id, kind: 'complimentary', tier: 'basic', grantedBy: user.id }, { kind: 'system', userId: null }, NOW);
    const wrong = await handleDeleteAccount(req(new URLSearchParams({ confirmEmail: 'other@example.com' }).toString()), deps);
    expect(wrong.status).toBe(303);
    expect(wrong.headers?.Location).toBe('/account?error=confirm');
    expect(users.users[0]!.status).toBe('active');
    expect(billingInfo.rows).toHaveLength(1);
    expect(profiles.profiles).toHaveLength(1);
    expect(avatars.objects.size).toBe(1);

    const res = await handleDeleteAccount(req(new URLSearchParams({ confirmEmail: ' Reader@Example.com ' }).toString()), deps);
    expect(res.status).toBe(303);
    expect(res.headers?.Location).toBe('/goodbye');
    expect(String(res.headers?.['Set-Cookie'])).toContain('hb_session=;');
    expect(users.users[0]).toMatchObject({ status: 'deleted', role: 'reader', email: `deleted+${user.id}@invalid.local` });
    expect(auth.sessions).toHaveLength(0);
    expect(auth.tokens).toHaveLength(0);
    expect(await leads.list()).toHaveLength(0);
    expect(profiles.profiles).toHaveLength(0);
    expect(billingInfo.rows).toHaveLength(0);
    expect(avatars.objects.size).toBe(0);
    expect(users.users[0]).toMatchObject({ displayName: null, avatarKey: null, avatarUpdatedAt: null });
    expect(access.grants).toHaveLength(1);
    expect(access.memberships).toHaveLength(0);
    const anonymised = access.audit.find(a => a.action === 'user.anonymize');
    expect(anonymised).toMatchObject({ actorKind: 'user', actorUserId: user.id, subjectTable: 'users', subjectId: user.id, before: { status: 'active', role: 'reader' }, after: { status: 'deleted', role: 'reader' } });
    expect(JSON.stringify(access.audit)).not.toContain(EMAIL);
  });
  it('deletes a picture uploaded between the read and the anonymise, and leaves the account active when the picture cannot be removed for want of storage', async () => {
    const { users, access, avatars, deps, user, req } = await setup();
    const body = new URLSearchParams({ confirmEmail: EMAIL }).toString();
    expect(await handleDeleteAccount(req(body), { ...deps, avatars: null })).toEqual({ status: 303, headers: { Location: '/account?error=unavailable' } });
    expect(users.users[0]!.status).toBe('active');

    const real = access.anonymise.bind(access);
    const late = newAvatarKey(user.id);
    vi.spyOn(access, 'anonymise').mockImplementationOnce(async (...args) => {
      await avatars.put(late, new Uint8Array([2]));
      await users.setAvatar(user.id, late, NOW);
      return real(...args);
    });
    expect((await handleDeleteAccount(req(body), deps)).headers?.Location).toBe('/goodbye');
    expect(avatars.objects.size).toBe(0);
  });
  it('a deleted administrator no longer counts as one, so the bootstrap rule can run again', async () => {
    const { users, deps, user, req } = await setup();
    await users.setRole(user.id, 'admin');
    expect(await users.countAdmins()).toBe(1);
    await handleDeleteAccount(req(new URLSearchParams({ confirmEmail: EMAIL }).toString()), deps);
    expect(await users.countAdmins()).toBe(0);
  });
  it('sends a reader whose account was deleted a moment ago to sign in rather than to the goodbye page', async () => {
    const { access, deps, req } = await setup();
    vi.spyOn(access, 'anonymise').mockResolvedValue(false);
    const res = await handleDeleteAccount(req(new URLSearchParams({ confirmEmail: EMAIL }).toString()), deps);
    expect(res.status).toBe(303);
    expect(res.headers?.Location).toBe('/signup?next=%2Faccount');
    expect(String(res.headers?.['Set-Cookie'])).toContain('hb_session=;');
  });
  it('refuses a foreign origin and an oversized body, and sends a signed-out visitor to sign in', async () => {
    const { users, deps, req } = await setup();
    const body = new URLSearchParams({ confirmEmail: EMAIL }).toString();
    const unavailable = { status: 303, headers: { Location: '/account?error=unavailable' } };
    expect(await handleDeleteAccount(req(body, { origin: 'https://evil.example' }), deps)).toEqual(unavailable);
    expect(await handleDeleteAccount(req('x'.repeat(5000)), deps)).toEqual(unavailable);
    const out = await handleDeleteAccount(req(body, { sessionId: undefined }), deps);
    expect(out.status).toBe(303);
    expect(out.headers?.Location).toBe('/signup?next=%2Faccount');
    expect(users.users[0]!.status).toBe('active');
  });
  it('sends the reader back to the account page when the store fails, and a failing lead, profile or billing delete leaves the account active', async () => {
    const { auth, leads, profiles, billingInfo, avatars, avatarKey, deps, req, users } = await setup();
    const body = new URLSearchParams({ confirmEmail: EMAIL }).toString();
    const unavailable = { status: 303, headers: { Location: '/account?error=unavailable' } };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      auth.failWith = new Error('db down');
      expect(await handleDeleteAccount(req(body), deps)).toEqual(unavailable);
      expect(await handleSignOutAll(req(), deps)).toEqual(unavailable);
      expect(users.users[0]!.status).toBe('active');
      expect(auth.sessions.every(s => s.revokedAt === null)).toBe(true);
      auth.failWith = null;
      leads.failWith = new Error('leads down');
      profiles.failWith = new Error('profiles down');
      expect(await handleDeleteAccount(req(body), deps)).toEqual(unavailable);
      expect(users.users[0]!.status).toBe('active');
      expect(profiles.profiles).toHaveLength(1);
      profiles.failWith = null;
      billingInfo.failWith = new Error('billing down');
      expect(await handleDeleteAccount(req(body), deps)).toEqual(unavailable);
      expect(users.users[0]!.status).toBe('active');
      expect(billingInfo.rows).toHaveLength(1);
      billingInfo.failWith = null;
      avatars.failWith = new Error('blob down');
      expect(await handleDeleteAccount(req(body), deps)).toEqual(unavailable);
      expect(users.users[0]!.status).toBe('active');
      expect(users.users[0]!.avatarKey).toBe(avatarKey);
      expect(avatars.objects.size).toBe(1);
    } finally {
      spy.mockRestore();
    }
  });
});
