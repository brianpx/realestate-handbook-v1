import path from 'node:path';
import { sqlFromUrl } from '@/lib/db/sql';
import { NeonUserStore } from '@/lib/users/neon-store';
import type { UserStore } from '@/lib/users/store';
import type { Source } from './config';
import { FileAuthStore } from './file-store';
import { NeonAuthStore } from './neon-store';
import type { AuthToken, Session } from './types';

export type NewToken = { tokenHash: string; email: string; nextPath: string | null; source: Source | null; expiresAt: Date; createdIpHash: string | null; createdAt: Date };
export type NewSession = { idHash: string; userId: string; createdAt: Date; expiresAt: Date };
export type ConsumedToken = { email: string; nextPath: string | null; source: Source | null };
export type AttemptScope = 'ip' | 'email';

/**
 * Where sign-in tokens, sessions and the rate-limit counters live. Production uses the database so every server
 * instance sees the same rows; the memory store is for unit tests and the file store for local development.
 * The stores hold rows; the rules (expiry, the cap, when to renew) are in session.ts, and the Neon statements
 * encode the same rules so one round trip decides.
 */
export interface AuthStore {
  createToken(token: NewToken): Promise<void>;
  /** Read-only: the verify page looks before the reader presses the button, so a link preview consumes nothing. */
  peekToken(tokenHash: string): Promise<AuthToken | null>;
  /** One atomic step: null when the token is unknown, already used or expired, all reported alike. */
  consumeToken(tokenHash: string, now: Date): Promise<ConsumedToken | null>;
  createSession(session: NewSession): Promise<void>;
  findSession(idHash: string): Promise<Session | null>;
  /** Extends a live session last extended over a day ago; false when there was nothing to do. */
  renewSession(idHash: string, now: Date): Promise<boolean>;
  revokeSession(idHash: string, now: Date): Promise<void>;
  revokeAllForUser(userId: string, now: Date): Promise<void>;
  /** Insert and in-window count in one step, including the new row, so two requests cannot both slip under the limit. */
  recordAndCount(scope: AttemptScope, keyHash: string, at: Date, since: Date): Promise<number>;
}

export type AuthStores = { users: UserStore; auth: AuthStore };

/**
 * Picks the stores from the environment: a database when DATABASE_URL is set, the throwaway file store only when
 * asked for by name and only outside a hosted deployment (its disk is ephemeral; see lib/leads/store.ts), otherwise
 * none (the routes then answer 503 and the handbook cannot be opened).
 */
export function authStoresFromEnv(env: Record<string, string | undefined>): AuthStores | null {
  const hosted = Boolean(env.VERCEL_ENV) && env.VERCEL_ENV !== 'development';
  if (env.AUTH_STORE === 'file' && !hosted) {
    const store = new FileAuthStore(env.AUTH_STORE_PATH ?? path.join(process.cwd(), '.data', 'auth.json'));
    return { users: store, auth: store };
  }
  if (env.DATABASE_URL) {
    const sql = sqlFromUrl(env.DATABASE_URL);
    return { users: new NeonUserStore(sql), auth: new NeonAuthStore(sql) };
  }
  return null;
}
