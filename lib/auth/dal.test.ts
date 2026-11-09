import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryUserStore } from '@/lib/users/store';
import { MemoryAuthStore } from './memory-store';
import { sessionExpiry } from './session';
import { hashSecret, newSecret } from './token';

// The DAL reads Next's request helpers; here they read from a jar and a path the test sets. `server-only` resolves
// to an empty module under vitest (vitest.config.ts).
const fake = vi.hoisted(() => ({ jar: new Map<string, string>(), path: null as string | null, users: null as unknown, auth: null as unknown }));
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (name: string) => (fake.jar.has(name) ? { name, value: fake.jar.get(name)! } : undefined) }),
  headers: async () => ({ get: (name: string) => (name === 'x-hb-path' ? fake.path : null) }),
}));
vi.mock('next/navigation', () => ({ redirect: (to: string) => { throw new Error(`redirect:${to}`); } }));
vi.mock('./store', () => ({ authStoresFromEnv: () => (fake.users ? { users: fake.users, auth: fake.auth } : null) }));

import { getViewer, requireAdmin, requireViewer } from './dal';

const NOW = Date.now();
const hours = (n: number) => new Date(NOW + n * 3600 * 1000);
let users: MemoryUserStore;
let auth: MemoryAuthStore;

async function signedIn(over: { createdAt?: Date; expiresAt?: Date; lastSeenAt?: Date; revoked?: boolean; status?: 'active' | 'disabled' | 'deleted' } = {}) {
  const { user } = await users.upsertVerified({ email: 'a@b.co', termsVersion: 'v1', at: hours(-1) });
  if (over.status) user.status = over.status;
  const raw = newSecret();
  const createdAt = over.createdAt ?? hours(-1);
  await auth.createSession({ idHash: hashSecret(raw), userId: user.id, createdAt, expiresAt: over.expiresAt ?? sessionExpiry(createdAt) });
  const session = auth.sessions.at(-1)!;
  if (over.lastSeenAt) session.lastSeenAt = over.lastSeenAt;
  if (over.revoked) session.revokedAt = hours(-0.5);
  fake.jar.set('hb_session', raw);
  return { user, raw, session };
}

beforeEach(() => {
  users = new MemoryUserStore();
  auth = new MemoryAuthStore();
  fake.users = users;
  fake.auth = auth;
  fake.jar.clear();
  fake.path = null;
});

describe('getViewer', () => {
  it('returns the user and role for a live session', async () => {
    const { user } = await signedIn();
    expect(await getViewer()).toEqual({ user, role: 'reader' });
  });
  it.each([
    ['no cookie', async () => {}],
    ['a malformed cookie', async () => { fake.jar.set('hb_session', 'short'); }],
    ['an unknown session', async () => { fake.jar.set('hb_session', newSecret()); }],
    ['a revoked session', async () => { await signedIn({ revoked: true }); }],
    ['an expired session', async () => { await signedIn({ expiresAt: hours(-1) }); }],
    ['a session past the one-year cap', async () => { await signedIn({ createdAt: hours(-24 * 366), expiresAt: hours(24) }); }],
    ['a disabled account', async () => { await signedIn({ status: 'disabled' }); }],
    ['no store', async () => { await signedIn(); fake.users = null; }],
  ])('is null for %s', async (_, arrange) => {
    await arrange();
    expect(await getViewer()).toBeNull();
  });
  it('reads the __Host- cookie first', async () => {
    const { raw } = await signedIn();
    fake.jar.set('__Host-hb_session', raw);
    fake.jar.set('hb_session', newSecret());
    expect(await getViewer()).not.toBeNull();
  });
  it('slides a session last seen over a day ago, and leaves a fresh one alone', async () => {
    const stale = await signedIn({ lastSeenAt: hours(-25) });
    await getViewer();
    expect(stale.session.lastSeenAt.getTime()).toBeGreaterThan(hours(-1).getTime());
    const before = stale.session.expiresAt.getTime();
    await getViewer();
    expect(stale.session.expiresAt.getTime()).toBe(before);
  });
});

describe('requireViewer and requireAdmin', () => {
  it('sends a signed-out reader to sign in with the path the proxy recorded', async () => {
    fake.path = '/handbook/ch3?x=1';
    await expect(requireViewer()).rejects.toThrow('redirect:/signup?next=%2Fhandbook%2Fch3%3Fx%3D1');
    fake.path = null;
    await expect(requireViewer()).rejects.toThrow('redirect:/signup?next=%2Fhandbook');
  });
  it('lets a reader through, and sends a reader who is not an admin to the handbook home', async () => {
    const { user } = await signedIn();
    expect((await requireViewer()).user.id).toBe(user.id);
    await expect(requireAdmin()).rejects.toThrow('redirect:/handbook');
    await users.setRole(user.id, 'admin');
    expect((await requireAdmin()).role).toBe('admin');
  });
});
