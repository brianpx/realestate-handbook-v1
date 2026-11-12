import { describe, expect, it, vi } from 'vitest';
import { MemoryAccessStore } from '@/lib/access/memory-store';
import { MemoryAuthStore } from '@/lib/auth/memory-store';
import { sessionExpiry } from '@/lib/auth/session';
import { hashSecret, newSecret } from '@/lib/auth/token';
import { MemoryUserStore } from '@/lib/users/store';
import { handleSavePreferences, type PreferencesDeps } from './preferences-handler';

const NOW = new Date('2026-11-08T12:00:00Z');
const ORIGIN = 'https://handbook.example';

async function setup() {
  const users = new MemoryUserStore();
  const auth = new MemoryAuthStore();
  const access = new MemoryAccessStore({ users, auth });
  const deps: PreferencesDeps = { stores: { users, auth, access }, allowedOrigins: [ORIGIN], now: () => NOW };
  const { user } = await users.upsertVerified({ email: 'reader@example.com', termsVersion: 'v1', at: NOW });
  const { user: other } = await users.upsertVerified({ email: 'other@example.com', termsVersion: 'v1', at: NOW });
  const session = newSecret();
  await auth.createSession({ idHash: hashSecret(session), userId: user.id, createdAt: NOW, expiresAt: sessionExpiry(NOW) });
  const req = (body: unknown = '', extra: { origin?: string | null; sessionId?: string } = {}) => ({
    url: `${ORIGIN}/api/account/preferences`,
    origin: extra.origin === undefined ? ORIGIN : extra.origin,
    ip: '203.0.113.9',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    sessionId: 'sessionId' in extra ? extra.sessionId : session,
  });
  return { users, auth, deps, user, other, req };
}

describe('saving the preferences', () => {
  it('stores the trimmed name against the session user and answers it back', async () => {
    const { users, deps, user, other, req } = await setup();
    expect(await handleSavePreferences(req({ displayName: '  Pat Realtor ' }), deps)).toEqual({ status: 200, body: { ok: true, displayName: 'Pat Realtor' } });
    expect((await users.findById(user.id))?.displayName).toBe('Pat Realtor');
    expect((await users.findById(other.id))?.displayName).toBeNull();
  });
  it('clears the name when an empty one is saved', async () => {
    const { users, deps, user, req } = await setup();
    await handleSavePreferences(req({ displayName: 'Pat' }), deps);
    expect(await handleSavePreferences(req({ displayName: '   ' }), deps)).toEqual({ status: 200, body: { ok: true, displayName: null } });
    expect((await users.findById(user.id))?.displayName).toBeNull();
  });
  it('rejects a name that is too long, has control characters, or comes with an account id, and writes nothing', async () => {
    const { users, deps, user, other, req } = await setup();
    for (const body of [{ displayName: 'a\u202Eb' }, { displayName: 'x'.repeat(33) }, { displayName: 7 }, {}, { displayName: 'Pat', userId: other.id }, []]) {
      expect(await handleSavePreferences(req(body), deps)).toEqual({ status: 400, body: { ok: false, error: 'invalid_display_name' } });
    }
    expect(await handleSavePreferences(req('not json'), deps)).toEqual({ status: 400, body: { ok: false, error: 'invalid_request' } });
    expect((await handleSavePreferences(req({ displayName: 'x'.repeat(5000) }), deps)).status).toBe(413);
    expect((await users.findById(user.id))?.displayName).toBeNull();
    expect((await handleSavePreferences(req({ displayName: 'x'.repeat(32) }), deps)).status).toBe(200);
  });
  it('checks the origin first, then the stores, then the session', async () => {
    const { auth, users, deps, user, req } = await setup();
    expect((await handleSavePreferences(req({ displayName: 'Pat' }, { origin: 'https://evil.example', sessionId: undefined }), deps)).status).toBe(403);
    expect((await handleSavePreferences(req({ displayName: 'Pat' }, { origin: null }), deps)).status).toBe(403);
    expect((await handleSavePreferences(req({ displayName: 'Pat' }, { sessionId: undefined }), { ...deps, stores: null })).status).toBe(503);
    expect((await handleSavePreferences(req({ displayName: 'Pat' }, { sessionId: undefined }), deps)).status).toBe(401);
    expect((await handleSavePreferences(req({ displayName: 'Pat' }, { sessionId: newSecret() }), deps)).status).toBe(401);
    await auth.revokeAllForUser(user.id, NOW);
    expect((await handleSavePreferences(req({ displayName: 'Pat' }), deps)).status).toBe(401);
    expect((await users.findById(user.id))?.displayName).toBeNull();
  });
  it('is a 503 when the store fails, with the error name logged and nothing else', async () => {
    const { users, deps, req } = await setup();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const failing = vi.spyOn(users, 'setDisplayName').mockRejectedValue(new Error('db down'));
      expect((await handleSavePreferences(req({ displayName: 'Pat' }), deps)).status).toBe(503);
      expect(spy.mock.calls[0]).toEqual(['account: preferences save failed', 'Error']);
      failing.mockRestore();
    } finally {
      spy.mockRestore();
    }
  });
});
