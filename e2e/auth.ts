import { rm } from 'node:fs/promises';
import { grantAccess, revokeAccess } from '../lib/access/grants';
import { FileAuthStore } from '../lib/auth/file-store';
import { sessionExpiry } from '../lib/auth/session';
import { hashSecret, newSecret } from '../lib/auth/token';
import type { PaidTier } from '../lib/access/types';
import { BASE_URL, IS_REMOTE } from './target';

// The suite's signed-in readers. The local server keeps users, sessions and grants in this file (AUTH_STORE=file in
// playwright.config.ts); global setup writes them before the first test, and the default storage state carries the
// member's cookie, so every product-page test starts signed in with the whole handbook open. The raw ids are fixed
// and test-only: 43 base64url characters, the shape the proxy checks. A test that signs out or revokes must not use
// the shared sessions; it seeds its own with extraReader(). An administrator (no grant: the role opens nothing by
// itself) and a preview reader (no grant, the free set) are seeded the same way.
export const AUTH_FILE = '.data/e2e-auth.json';
export const READER_EMAIL = 'reader@e2e.test';
export const SESSION_ID = 'e2e-reader-session'.padEnd(43, '0');
export const PREVIEW_EMAIL = 'preview@e2e.test';
export const PREVIEW_SESSION_ID = 'e2e-preview-session'.padEnd(43, '0');
export const ADMIN_EMAIL = 'admin@e2e.test';
export const ADMIN_SESSION_ID = 'e2e-admin-session'.padEnd(43, '0');

const SYSTEM = { kind: 'system' as const, userId: null };

async function seedUser(store: FileAuthStore, email: string, sessionId: string, now: Date) {
  const { user } = await store.upsertVerified({ email, termsVersion: 'v1', at: now });
  await store.createSession({ idHash: hashSecret(sessionId), userId: user.id, createdAt: now, expiresAt: sessionExpiry(now) });
  return user;
}

export async function seedSession(): Promise<void> {
  await rm(AUTH_FILE, { force: true });
  const store = new FileAuthStore(AUTH_FILE);
  const now = new Date();
  const reader = await seedUser(store, READER_EMAIL, SESSION_ID, now);
  await grantAccess(store, { userId: reader.id, kind: 'complimentary', tier: 'pro', grantedBy: reader.id, grantNote: 'e2e member' }, SYSTEM, now);
  await seedUser(store, PREVIEW_EMAIL, PREVIEW_SESSION_ID, now);
  const admin = await seedUser(store, ADMIN_EMAIL, ADMIN_SESSION_ID, now);
  await store.setRole(admin.id, 'admin');
}

/** Another live session for a user, as a second browser would hold. Returns the raw id for the cookie. */
export async function extraSessionFor(userId: string): Promise<string> {
  const store = new FileAuthStore(AUTH_FILE);
  const raw = newSecret();
  const now = new Date();
  await store.createSession({ idHash: hashSecret(raw), userId, createdAt: now, expiresAt: sessionExpiry(now) });
  return raw;
}

/** A second live session for the seeded member, for a test that will revoke it. */
export async function extraSession(): Promise<string> {
  const user = await new FileAuthStore(AUTH_FILE).findByEmail(READER_EMAIL);
  if (!user) throw new Error('the seeded reader is missing; did global setup run?');
  return extraSessionFor(user.id);
}

/**
 * A reader of the test's own, with a live session and, when a tier is given, a grant at that tier. For tests that
 * revoke, sign out everywhere or delete, which must leave the shared readers alone.
 */
export async function extraReader(tier: PaidTier | null = null): Promise<{ email: string; sessionId: string; userId: string; grantId: string | null }> {
  const store = new FileAuthStore(AUTH_FILE);
  const now = new Date();
  const email = `reader-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@e2e.test`;
  const sessionId = newSecret();
  const user = await seedUser(store, email, sessionId, now);
  const grant = tier ? await grantAccess(store, { userId: user.id, kind: 'complimentary', tier, grantedBy: user.id }, SYSTEM, now) : null;
  return { email, sessionId, userId: user.id, grantId: grant?.id ?? null };
}

/** What an administrator (or SQL on a branch) does to a grant while the member's session is live. */
export async function revokeGrant(grantId: string): Promise<void> {
  const store = new FileAuthStore(AUTH_FILE);
  const revoked = await revokeAccess(store, { grantId, reason: 'admin' }, SYSTEM, new Date());
  if (!revoked) throw new Error(`grant ${grantId} was not live`);
}

type LocalStorageEntry = { name: string; value: string };

/** Storage state for a signed-in reader: the session cookie plus whatever localStorage the test wants. */
export function signedInState(localStorage: LocalStorageEntry[], sessionId = SESSION_ID) {
  const { hostname } = new URL(BASE_URL);
  // A deployment cannot be seeded from here, so remote runs get no cookie and the product specs redirect there.
  const cookies = IS_REMOTE ? [] : [{ name: 'hb_session', value: sessionId, domain: hostname, path: '/', expires: -1, httpOnly: true, secure: false, sameSite: 'Lax' as const }];
  return { cookies, origins: localStorage.length ? [{ origin: BASE_URL, localStorage }] : [] };
}
