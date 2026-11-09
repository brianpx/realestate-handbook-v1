import { rm } from 'node:fs/promises';
import { grantAccess, revokeAccess } from '../lib/access/grants';
import { NeonAccessStore } from '../lib/access/neon-store';
import type { AccessStore } from '../lib/access/store';
import type { PaidTier } from '../lib/access/types';
import { FileAuthStore } from '../lib/auth/file-store';
import { NeonAuthStore } from '../lib/auth/neon-store';
import { sessionExpiry } from '../lib/auth/session';
import type { AuthStore } from '../lib/auth/store';
import { hashSecret, newSecret } from '../lib/auth/token';
import { sqlFromUrl } from '../lib/db/sql';
import { NeonUserStore } from '../lib/users/neon-store';
import type { UserStore } from '../lib/users/store';
import { BASE_URL, CAN_SEED, SEED_DATABASE_URL } from './target';

// The suite's signed-in readers. Locally the server keeps users, sessions and grants in a JSON file (AUTH_STORE=file
// in playwright.config.ts); against a deployment they go into the database the deployment reads (E2E_DATABASE_URL,
// a non-production Neon branch, see e2e/target.ts). Global setup writes them before the first test, and the default
// storage state carries the member's cookie, so every product-page test starts signed in with the whole handbook
// open. The raw ids are fixed and test-only: 43 base64url characters, the shape the proxy checks. A test that signs
// out or revokes must not use the shared sessions; it seeds its own with extraReader(). An administrator (no grant:
// the role opens nothing by itself) and a preview reader (no grant, the free set) are seeded the same way.
export const AUTH_FILE = '.data/e2e-auth.json';
export const READER_EMAIL = 'reader@e2e.test';
export const SESSION_ID = 'e2e-reader-session'.padEnd(43, '0');
export const PREVIEW_EMAIL = 'preview@e2e.test';
export const PREVIEW_SESSION_ID = 'e2e-preview-session'.padEnd(43, '0');
export const ADMIN_EMAIL = 'admin@e2e.test';
export const ADMIN_SESSION_ID = 'e2e-admin-session'.padEnd(43, '0');
/** Every address the suite creates ends like this, so a database seed can remove the previous run's rows. */
export const E2E_DOMAIN = '@e2e.test';

const SYSTEM = { kind: 'system' as const, userId: null };

export type Stores = { users: UserStore; auth: AuthStore; access: AccessStore };

/** The stores the suite seeds through: the file store locally, the Neon stores against a deployment. */
export function stores(): Stores {
  if (SEED_DATABASE_URL) {
    const sql = sqlFromUrl(SEED_DATABASE_URL);
    return { users: new NeonUserStore(sql), auth: new NeonAuthStore(sql), access: new NeonAccessStore(sql) };
  }
  const file = new FileAuthStore(AUTH_FILE);
  return { users: file, auth: file, access: file };
}

async function seedUser(s: Stores, email: string, sessionId: string, now: Date) {
  const { user } = await s.users.upsertVerified({ email, termsVersion: 'v1', at: now });
  await s.auth.createSession({ idHash: hashSecret(sessionId), userId: user.id, createdAt: now, expiresAt: sessionExpiry(now) });
  return user;
}

// A database keeps the previous run's rows; the file is simply replaced. Grants restrict user deletion, so they go
// first; sessions and memberships cascade; audit rows about these users go too, so the branch does not fill up.
async function clearPreviousRun() {
  if (!SEED_DATABASE_URL) return rm(AUTH_FILE, { force: true });
  const sql = sqlFromUrl(SEED_DATABASE_URL);
  const pattern = `%${E2E_DOMAIN}`;
  await sql.transaction([
    sql`delete from audit_log where subject_id in (select id from users where email like ${pattern}) or subject_id in (select id from access_grants where user_id in (select id from users where email like ${pattern}))`,
    sql`delete from access_grants where user_id in (select id from users where email like ${pattern})`,
    sql`delete from auth_tokens where email like ${pattern}`,
    sql`delete from users where email like ${pattern}`,
  ]);
}

export async function seedSession(): Promise<void> {
  await clearPreviousRun();
  const s = stores();
  const now = new Date();
  const reader = await seedUser(s, READER_EMAIL, SESSION_ID, now);
  await grantAccess(s.access, { userId: reader.id, kind: 'complimentary', tier: 'pro', grantedBy: reader.id, grantNote: 'e2e member' }, SYSTEM, now);
  await seedUser(s, PREVIEW_EMAIL, PREVIEW_SESSION_ID, now);
  const admin = await seedUser(s, ADMIN_EMAIL, ADMIN_SESSION_ID, now);
  await s.users.setRole(admin.id, 'admin', now);
}

/** Another live session for a user, as a second browser would hold. Returns the raw id for the cookie. */
export async function extraSessionFor(userId: string): Promise<string> {
  const raw = newSecret();
  const now = new Date();
  await stores().auth.createSession({ idHash: hashSecret(raw), userId, createdAt: now, expiresAt: sessionExpiry(now) });
  return raw;
}

/** A second live session for the seeded member, for a test that will revoke it. */
export async function extraSession(): Promise<string> {
  const user = await stores().users.findByEmail(READER_EMAIL);
  if (!user) throw new Error('the seeded reader is missing; did global setup run?');
  return extraSessionFor(user.id);
}

/**
 * A reader of the test's own, with a live session and, when a tier is given, a grant at that tier. For tests that
 * revoke, sign out everywhere or delete, which must leave the shared readers alone.
 */
export async function extraReader(tier: PaidTier | null = null): Promise<{ email: string; sessionId: string; userId: string; grantId: string | null }> {
  const s = stores();
  const now = new Date();
  const email = `reader-${Date.now()}-${Math.random().toString(36).slice(2, 7)}${E2E_DOMAIN}`;
  const sessionId = newSecret();
  const user = await seedUser(s, email, sessionId, now);
  const grant = tier ? await grantAccess(s.access, { userId: user.id, kind: 'complimentary', tier, grantedBy: user.id }, SYSTEM, now) : null;
  return { email, sessionId, userId: user.id, grantId: grant?.id ?? null };
}

/** What an administrator (or SQL on a branch) does to a grant while the member's session is live. */
export async function revokeGrant(grantId: string): Promise<void> {
  const revoked = await revokeAccess(stores().access, { grantId, reason: 'admin' }, SYSTEM, new Date());
  if (!revoked) throw new Error(`grant ${grantId} was not live`);
}

type LocalStorageEntry = { name: string; value: string };

/** Storage state for a signed-in reader: the session cookie plus whatever localStorage the test wants. */
export function signedInState(localStorage: LocalStorageEntry[], sessionId = SESSION_ID) {
  const { hostname, protocol } = new URL(BASE_URL);
  // over https the cookie is the __Host- one (lib/auth/cookie.ts); a deployment with no seed path gets no cookie at all
  const secure = protocol === 'https:';
  const cookies = CAN_SEED
    ? [
        { name: secure ? '__Host-hb_session' : 'hb_session', value: sessionId, domain: hostname, path: '/', expires: -1, httpOnly: true, secure, sameSite: 'Lax' as const },
        // the readable flag the public site shows "Welcome back" on (lib/auth/cookie.ts), set beside the session at sign-in
        { name: 'hb_signed_in', value: '1', domain: hostname, path: '/', expires: -1, httpOnly: false, secure, sameSite: 'Lax' as const },
      ]
    : [];
  return { cookies, origins: localStorage.length ? [{ origin: BASE_URL, localStorage }] : [] };
}
