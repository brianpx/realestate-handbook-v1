import { SESSION_CAP_SECONDS, SESSION_MAX_AGE_SECONDS, SESSION_RENEW_AFTER_SECONDS, TOKEN_TTL_SECONDS } from './config';
import type { AuthToken, Session } from './types';

// The session and token rules as pure functions, so every store applies the same policy and the Neon store's
// statements (db/migrations/002_users_auth.sql) can be checked against them.

export const tokenExpiry = (now: Date): Date => new Date(now.getTime() + TOKEN_TTL_SECONDS * 1000);
export const tokenUsable = (token: AuthToken, now: Date): boolean => token.consumedAt === null && token.expiresAt > now;

export const sessionExpiry = (now: Date): Date => new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000);
const overCap = (session: Session, now: Date) => session.createdAt.getTime() + SESSION_CAP_SECONDS * 1000 <= now.getTime();

/** Not revoked, not expired, and not older than the absolute cap. */
export const sessionLive = (session: Session, now: Date): boolean =>
  session.revokedAt === null && session.expiresAt > now && !overCap(session, now);

/** Live and last extended more than a day ago. Zero renewals is the normal outcome of most requests. */
export const sessionDueForRenewal = (session: Session, now: Date): boolean =>
  sessionLive(session, now) && session.lastSeenAt.getTime() < now.getTime() - SESSION_RENEW_AFTER_SECONDS * 1000;
