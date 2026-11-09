import { deleteAccountSchema } from '@/lib/access/validate';
import { audit, auditBy } from '@/lib/audit';
import { MAX_BODY_BYTES, SIGN_IN_PATH } from '@/lib/auth/config';
import { clearedCookieHeaders, isSecureRequest } from '@/lib/auth/cookie';
import type { AuthDeps, AuthReply, AuthRequest } from '@/lib/auth/handler';
import { sessionLive } from '@/lib/auth/session';
import { hashKey, hashSecret, isSecretShape } from '@/lib/auth/token';
import type { LeadStore } from '@/lib/leads/store';
import type { User } from '@/lib/users/types';

export type AccountDeps = Pick<AuthDeps, 'stores' | 'allowedOrigins' | 'ipSalt' | 'now'> & { leads: LeadStore | null };

export const ACCOUNT_PATH = '/account';
export const GOODBYE_PATH = '/goodbye';
const SIGN_IN = `${SIGN_IN_PATH}?next=${encodeURIComponent(ACCOUNT_PATH)}`;

const reply = (status: number, error: string): AuthReply => ({ status, body: { ok: false, error } });
const redirect = (location: string, headers: Record<string, string | string[]> = {}): AuthReply => ({ status: 303, headers: { Location: location, ...headers } });
const originRefused = (req: AuthRequest, deps: AccountDeps) => !req.origin || !deps.allowedOrigins.includes(req.origin);

// The account routes are plain form posts from the account page, so they answer with redirects. The session is
// read here, not through the page's data-access layer: a route handler has no render to share a cache with.
async function signedInUser(req: AuthRequest, deps: AccountDeps, now: Date): Promise<User | null> {
  if (!deps.stores || !isSecretShape(req.sessionId)) return null;
  const session = await deps.stores.auth.findSession(hashSecret(req.sessionId));
  if (!session || !sessionLive(session, now)) return null;
  const user = await deps.stores.users.findById(session.userId);
  return user && user.status === 'active' ? user : null;
}

/** "Sign out everywhere": every session of the reader's, this one included, is revoked, and the fact is logged. */
export async function handleSignOutAll(req: AuthRequest, deps: AccountDeps): Promise<AuthReply> {
  if (originRefused(req, deps)) return reply(403, 'forbidden');
  if (!deps.stores) return reply(503, 'unavailable');
  const cleared = { 'Set-Cookie': clearedCookieHeaders(isSecureRequest(req.url)) };
  try {
    const now = deps.now();
    const user = await signedInUser(req, deps, now);
    if (!user) return redirect(SIGN_IN, cleared);
    const revoked = await deps.stores.auth.revokeAllForUser(user.id, now);
    if (revoked > 0) {
      const actor = { kind: 'user' as const, userId: user.id, ipHash: hashKey(req.ip, deps.ipSalt) };
      await deps.stores.access.appendAudit(audit(actor, 'session.revoke_all', { table: 'sessions', id: user.id }, { after: { revoked } }, now));
    }
    return redirect(SIGN_IN, cleared);
  } catch (err) {
    console.error('account: sign-out-all failed', err instanceof Error ? err.name : 'error');
    return reply(503, 'unavailable');
  }
}

/**
 * Deletes the account (OD-21: the reader types their address to confirm). One batch anonymises the user row and
 * removes its sessions and tokens; grants and billing rows stay for the accounting record; the marketing list's
 * row for the same address goes too, as a separate best-effort step in its own store.
 */
export async function handleDeleteAccount(req: AuthRequest, deps: AccountDeps): Promise<AuthReply> {
  if (originRefused(req, deps)) return reply(403, 'forbidden');
  if (!deps.stores) return reply(503, 'unavailable');
  if (Buffer.byteLength(req.body) > MAX_BODY_BYTES) return reply(413, 'too_large');
  const cleared = { 'Set-Cookie': clearedCookieHeaders(isSecureRequest(req.url)) };
  try {
    const now = deps.now();
    const user = await signedInUser(req, deps, now);
    if (!user) return redirect(SIGN_IN, cleared);
    const { id: userId, email } = user; // copied: the store may rewrite the user object it handed out
    const parsed = deleteAccountSchema.safeParse({ confirmEmail: new URLSearchParams(req.body).get('confirmEmail') ?? '' });
    if (!parsed.success || parsed.data.confirmEmail !== email) return redirect(`${ACCOUNT_PATH}?error=confirm`);

    const actor = { kind: 'user' as const, userId, ipHash: hashKey(req.ip, deps.ipSalt) };
    const done = await deps.stores.access.anonymise({ userId, email, emailHash: hashKey(email, deps.ipSalt), at: now }, auditBy(actor, 'user.anonymize', now));
    if (!done) return redirect(SIGN_IN, cleared); // deleted by a concurrent request a moment ago: nothing to say goodbye to
    if (deps.leads) {
      try {
        await deps.leads.deleteByEmail(email);
      } catch (err) {
        console.error('account: lead row not removed', err instanceof Error ? err.name : 'error');
      }
    }
    return redirect(GOODBYE_PATH, cleared);
  } catch (err) {
    console.error('account: delete failed', err instanceof Error ? err.name : 'error');
    return reply(503, 'unavailable');
  }
}
