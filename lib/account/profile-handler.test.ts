import { describe, expect, it, vi } from 'vitest';
import { EMPTY_PROFILE } from '@/lib/users/profile';
import { MemoryProfileStore } from '@/lib/users/profile-store';
import { handleReadProfile, handleSaveProfile, type ProfileDeps } from './profile-handler';

const NOW = new Date('2026-11-08T12:00:00Z');
const ORIGIN = 'https://handbook.example';
const USER = 'u-1';
const FULL = { ...EMPTY_PROFILE, professionalRole: 'agent' as const, brokerageName: 'Example Realty', licenseJurisdiction: 'TX' as const, yearFirstLicensed: 2025, phone: '+15125550123', narMember: true, narMemberSince: '2025-03-01' };

function setup() {
  const profiles = new MemoryProfileStore();
  const deps: ProfileDeps = { profiles, allowedOrigins: [ORIGIN], now: () => NOW };
  const req = (body: unknown, extra: { origin?: string | null } = {}) => ({
    url: `${ORIGIN}/api/account/profile`,
    origin: extra.origin === undefined ? ORIGIN : extra.origin,
    ip: '203.0.113.9',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
  return { profiles, deps, req };
}

describe('reading the profile', () => {
  it('answers empty fields for a reader with no row, and the row once there is one', async () => {
    const { profiles, deps } = setup();
    expect(await handleReadProfile(USER, deps)).toEqual({ status: 200, body: { ok: true, profile: EMPTY_PROFILE, updatedAt: null } });
    await profiles.save(USER, FULL, 'survey', NOW);
    expect(await handleReadProfile(USER, deps)).toEqual({ status: 200, body: { ok: true, profile: FULL, updatedAt: NOW.toISOString() } });
  });
  it('is a 401 without a viewer, a 503 without a store or when the store fails', async () => {
    const { profiles, deps } = setup();
    expect((await handleReadProfile(null, deps)).status).toBe(401);
    expect((await handleReadProfile(USER, { ...deps, profiles: null })).status).toBe(503);
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      profiles.failWith = new Error('db down');
      expect((await handleReadProfile(USER, deps)).status).toBe(503);
      expect(spy.mock.calls[0]).toEqual(['account: profile read failed', 'Error']);
    } finally {
      spy.mockRestore();
    }
  });
});

describe('saving the profile', () => {
  it('writes the whole form against the session user with profile_source user, and answers it back', async () => {
    const { profiles, deps, req } = setup();
    const res = await handleSaveProfile(USER, req({ ...FULL, brokerageName: ' Example Realty ', teamName: '' }), deps);
    expect(res).toEqual({ status: 200, body: { ok: true, profile: FULL, updatedAt: NOW.toISOString() } });
    expect(profiles.profiles).toEqual([{ ...FULL, userId: USER, profileSource: 'user', updatedAt: NOW }]);
  });
  it('ignores a user id in the body: the row belongs to the session user', async () => {
    const { profiles, deps, req } = setup();
    await handleSaveProfile(USER, req({ ...FULL, userId: 'someone-else', profileSource: 'admin' }), deps);
    expect(profiles.profiles.map(p => [p.userId, p.profileSource])).toEqual([[USER, 'user']]);
  });
  it('a later save replaces the row whole, so a cleared field is cleared, and takes the source back from the survey', async () => {
    const { profiles, deps, req } = setup();
    await profiles.save(USER, FULL, 'survey', new Date('2026-01-01T00:00:00Z'));
    await handleSaveProfile(USER, req({ teamName: 'The A Team' }), deps);
    expect(profiles.profiles[0]).toEqual({ ...EMPTY_PROFILE, teamName: 'The A Team', userId: USER, profileSource: 'user', updatedAt: NOW });
  });
  it('names the bad fields in a 400 and writes nothing', async () => {
    const { profiles, deps, req } = setup();
    const res = await handleSaveProfile(USER, req({ ...FULL, phone: '512 555 0123', yearFirstLicensed: 1900, licenseStatus: 'revoked' }), deps);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ ok: false, error: 'invalid_profile', fields: ['licenseStatus', 'yearFirstLicensed', 'phone'] });
    expect(profiles.profiles).toHaveLength(0);
    expect((await handleSaveProfile(USER, req('not json'), deps)).body).toEqual({ ok: false, error: 'invalid_request' });
    expect((await handleSaveProfile(USER, req('[]'), deps)).status).toBe(400);
    expect((await handleSaveProfile(USER, req({ brokerageName: 'x'.repeat(5000) }), deps)).status).toBe(413);
    expect(profiles.profiles).toHaveLength(0);
  });
  it('checks the viewer first, then the origin, then the store', async () => {
    const { profiles, deps, req } = setup();
    expect((await handleSaveProfile(null, req(FULL, { origin: 'https://evil.example' }), deps)).status).toBe(401);
    expect((await handleSaveProfile(USER, req(FULL, { origin: 'https://evil.example' }), deps)).status).toBe(403);
    expect((await handleSaveProfile(USER, req(FULL, { origin: null }), deps)).status).toBe(403);
    expect((await handleSaveProfile(USER, req(FULL), { ...deps, profiles: null })).status).toBe(503);
    expect(profiles.profiles).toHaveLength(0);
  });
  it('is a 503 when the store fails, with the error name logged and nothing else', async () => {
    const { profiles, deps, req } = setup();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      profiles.failWith = new Error('db down');
      expect((await handleSaveProfile(USER, req(FULL), deps)).status).toBe(503);
      expect(spy.mock.calls[0]).toEqual(['account: profile save failed', 'Error']);
    } finally {
      spy.mockRestore();
    }
  });
});
