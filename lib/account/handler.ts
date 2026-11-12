import { deleteAccountSchema } from '@/lib/access/validate';
import { audit, auditBy } from '@/lib/audit';
import { MAX_BODY_BYTES, SIGN_IN_PATH } from '@/lib/auth/config';
import { clearedCookieHeaders, isSecureRequest } from '@/lib/auth/cookie';
import type { AuthDeps, AuthReply, AuthRequest } from '@/lib/auth/handler';
import { signedInUser } from '@/lib/auth/request-user';
import { hashKey } from '@/lib/auth/token';
import type { LeadStore } from '@/lib/leads/store';
import type { ProfileStore } from '@/lib/users/profile-store';

export type AccountDeps = Pick<AuthDeps, 'stores' | 'allowedOrigins' | 'ipSalt' | 'now'> & { leads: LeadStore | null; profiles: ProfileStore | null };

export const ACCOUNT_PATH = '/account';
export const GOODBYE_PATH = '/goodbye';
const SIGN_IN = `${SIGN_IN_PATH}?next=${encodeURIComponent(ACCOUNT_PATH)}`;

const redirect = (location: string, headers: Record<string, string | string[]> = {}): AuthReply => ({ status: 303, headers: { Location: location, ...headers } });
const originRefused = (req: AuthRequest, deps: AccountDeps) => !req.origin || !deps.allowedOrigins.includes(req.origin);
const UNAVAILABLE = `${ACCOUNT_PATH}?error=unavailable`;

// The account routes are plain form posts from the account page, so they answer with redirects. The session is
// read through lib/auth/request-user.ts, not the page's data-access layer; the profile routes
// (profile-handler.ts) and the admin routes read it the same way.

/** "Sign out everywhere": every session of the reader's, this one included, is revoked, and the fact is logged. */
export async function handleSignOutAll(req: AuthRequest, deps: AccountDeps): Promise<AuthReply> {
  // A failed attempt leaves the reader signed in: no cookie is cleared, and the account page can be retried.
  if (originRefused(req, deps)) return redirect(UNAVAILABLE);
  if (!deps.stores) return redirect(UNAVAILABLE);
  const cleared = { 'Set-Cookie': clearedCookieHeaders(isSecureRequest(req.url)) };
  try {
    const now = deps.now();
    const user = await signedInUser(req.sessionId, deps.stores, now);
    if (!user) return redirect(SIGN_IN, cleared);
    const revoked = await deps.stores.auth.revokeAllForUser(user.id, now);
    if (revoked > 0) {
      const actor = { kind: 'user' as const, userId: user.id, ipHash: hashKey(req.ip, deps.ipSalt) };
      await deps.stores.access.appendAudit(audit(actor, 'session.revoke_all', { table: 'sessions', id: user.id }, { after: { revoked } }, now));
    }
    return redirect(SIGN_IN, cleared);
  } catch (err) {
    console.error('account: sign-out-all failed', err instanceof Error ? err.name : 'error');
    return redirect(UNAVAILABLE);
  }
}

/**
 * Deletes the account (OD-21: the reader types their address to confirm). The realtor profile and the marketing
 * row go first: if either delete throws, anonymise has not run and the account stays active. The database
 * statement removes those rows again with the user, sessions, and tokens, so a crash inside it cannot leave a
 * license number or a marketing address after the account address is gone. Grants and billing rows stay.
 */
export async function handleDeleteAccount(req: AuthRequest, deps: AccountDeps): Promise<AuthReply> {
  // A failed attempt leaves the reader signed in: no cookie is cleared, and nothing is deleted.
  if (originRefused(req, deps)) return redirect(UNAVAILABLE);
  if (!deps.stores) return redirect(UNAVAILABLE);
  if (Buffer.byteLength(req.body) > MAX_BODY_BYTES) return redirect(UNAVAILABLE);
  const cleared = { 'Set-Cookie': clearedCookieHeaders(isSecureRequest(req.url)) };
  try {
    const now = deps.now();
    const user = await signedInUser(req.sessionId, deps.stores, now);
    if (!user) return redirect(SIGN_IN, cleared);
    const { id: userId, email } = user; // copied: the store may rewrite the user object it handed out
    const parsed = deleteAccountSchema.safeParse({ confirmEmail: new URLSearchParams(req.body).get('confirmEmail') ?? '' });
    if (!parsed.success || parsed.data.confirmEmail !== email) return redirect(`${ACCOUNT_PATH}?error=confirm`);

    // Before anonymise, so a throw here leaves the account active. The Neon statement deletes the same rows.
    if (deps.profiles) await deps.profiles.deleteByUser(userId);
    if (deps.leads) await deps.leads.deleteByEmail(email);
    const actor = { kind: 'user' as const, userId, ipHash: hashKey(req.ip, deps.ipSalt) };
    const done = await deps.stores.access.anonymise({ userId, email, emailHash: hashKey(email, deps.ipSalt), at: now }, auditBy(actor, 'user.anonymize', now));
    if (!done) return redirect(SIGN_IN, cleared); // deleted by a concurrent request a moment ago: nothing to say goodbye to
    return redirect(GOODBYE_PATH, cleared);
  } catch (err) {
    console.error('account: delete failed', err instanceof Error ? err.name : 'error');
    return redirect(UNAVAILABLE);
  }
}
