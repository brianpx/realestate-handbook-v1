import { describe, expect, it } from 'vitest';
import { MemoryAccessStore } from '@/lib/access/memory-store';
import { MemoryAuthStore } from '@/lib/auth/memory-store';
import { sessionExpiry } from '@/lib/auth/session';
import { hashSecret, newSecret } from '@/lib/auth/token';
import { MemoryUserStore } from '@/lib/users/store';
import { accountSummary } from './me';
import { handleReadMe } from './me-handler';

const NOW = new Date('2026-11-08T12:00:00Z');

describe('accountSummary', () => {
  it('uses the trimmed first and last name when there is one', () => {
    expect(accountSummary({ email: 'sam@example.com', firstName: ' Sam ', lastName: 'Rivera' })).toEqual({ displayName: 'Sam Rivera', email: 'sam@example.com', avatarUrl: null });
    expect(accountSummary({ email: 'sam@example.com', firstName: 'Sam', lastName: null }).displayName).toBe('Sam');
    expect(accountSummary({ email: 'sam@example.com', firstName: null, lastName: 'Rivera' }).displayName).toBe('Rivera');
  });
  it('falls back to the address local part when no name is stored or the name is blank', () => {
    expect(accountSummary({ email: 'sam.rivera@example.com' }).displayName).toBe('sam.rivera');
    expect(accountSummary({ email: 'sam@example.com', firstName: '  ', lastName: '' }).displayName).toBe('sam');
  });
});

describe('GET /api/account/me handler', () => {
  async function setup() {
    const users = new MemoryUserStore();
    const auth = new MemoryAuthStore();
    const access = new MemoryAccessStore({ users, auth });
    const { user } = await users.upsertVerified({ email: 'reader@example.com', termsVersion: 'v1', at: NOW });
    const session = newSecret();
    await auth.createSession({ idHash: hashSecret(session), userId: user.id, createdAt: NOW, expiresAt: sessionExpiry(NOW) });
    const deps = { stores: { users, auth, access }, now: () => NOW };
    const req = (sessionId: string | undefined) => ({ url: 'https://handbook.example/api/account/me', origin: null, ip: '203.0.113.9', body: '', sessionId });
    return { deps, req, session };
  }

  it('answers the summary for a live session', async () => {
    const { deps, req, session } = await setup();
    expect(await handleReadMe(req(session), deps)).toEqual({ status: 200, body: { ok: true, displayName: 'reader', email: 'reader@example.com', avatarUrl: null } });
  });
  it('is a 401 without a live session and a 503 without a store', async () => {
    const { deps, req } = await setup();
    expect((await handleReadMe(req(undefined), deps)).status).toBe(401);
    expect((await handleReadMe(req(newSecret()), deps)).status).toBe(401);
    expect((await handleReadMe(req(undefined), { ...deps, stores: null })).status).toBe(503);
  });
});
