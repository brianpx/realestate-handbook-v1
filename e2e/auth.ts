import { rm } from 'node:fs/promises';
import { FileAuthStore } from '../lib/auth/file-store';
import { sessionExpiry } from '../lib/auth/session';
import { hashSecret, newSecret } from '../lib/auth/token';
import { BASE_URL, IS_REMOTE } from './target';

// The suite's signed-in reader. The local server keeps users and sessions in this file (AUTH_STORE=file in
// playwright.config.ts); global setup writes one user and one live session into it, and the default storage state
// carries the matching cookie, so every product-page test starts signed in. The raw id is fixed and test-only:
// 43 base64url characters, the shape the proxy checks. A test that signs out must not use this shared session;
// it seeds its own with extraSession(). An administrator is seeded the same way for the admin spec.
export const AUTH_FILE = '.data/e2e-auth.json';
export const READER_EMAIL = 'reader@e2e.test';
export const SESSION_ID = 'e2e-reader-session'.padEnd(43, '0');
export const ADMIN_EMAIL = 'admin@e2e.test';
export const ADMIN_SESSION_ID = 'e2e-admin-session'.padEnd(43, '0');

export async function seedSession(): Promise<void> {
  await rm(AUTH_FILE, { force: true });
  const store = new FileAuthStore(AUTH_FILE);
  const now = new Date();
  const { user } = await store.upsertVerified({ email: READER_EMAIL, termsVersion: 'v1', at: now });
  await store.createSession({ idHash: hashSecret(SESSION_ID), userId: user.id, createdAt: now, expiresAt: sessionExpiry(now) });
  const { user: admin } = await store.upsertVerified({ email: ADMIN_EMAIL, termsVersion: 'v1', at: now });
  await store.setRole(admin.id, 'admin');
  await store.createSession({ idHash: hashSecret(ADMIN_SESSION_ID), userId: admin.id, createdAt: now, expiresAt: sessionExpiry(now) });
}

/** A second live session for the seeded reader, for a test that will revoke it. Returns the raw id for the cookie. */
export async function extraSession(): Promise<string> {
  const store = new FileAuthStore(AUTH_FILE);
  const user = await store.findByEmail(READER_EMAIL);
  if (!user) throw new Error('the seeded reader is missing; did global setup run?');
  const raw = newSecret();
  const now = new Date();
  await store.createSession({ idHash: hashSecret(raw), userId: user.id, createdAt: now, expiresAt: sessionExpiry(now) });
  return raw;
}

type LocalStorageEntry = { name: string; value: string };

/** Storage state for a signed-in reader: the session cookie plus whatever localStorage the test wants. */
export function signedInState(localStorage: LocalStorageEntry[], sessionId = SESSION_ID) {
  const { hostname } = new URL(BASE_URL);
  // A deployment cannot be seeded from here, so remote runs get no cookie and the product specs redirect there.
  const cookies = IS_REMOTE ? [] : [{ name: 'hb_session', value: sessionId, domain: hostname, path: '/', expires: -1, httpOnly: true, secure: false, sameSite: 'Lax' as const }];
  return { cookies, origins: localStorage.length ? [{ origin: BASE_URL, localStorage }] : [] };
}
