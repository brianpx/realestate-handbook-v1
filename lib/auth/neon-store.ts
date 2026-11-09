import { toDate, toDateOrNull, type Sql } from '@/lib/db/sql';
import { SESSION_CAP_SECONDS, SESSION_MAX_AGE_SECONDS, SESSION_RENEW_AFTER_SECONDS, type Source } from './config';
import type { AttemptScope, AuthStore, ConsumedToken, NewSession, NewToken, PlacementStat } from './store';
import type { AuthToken, Session } from './types';

const text = (value: unknown): string | null => (value === null || value === undefined ? null : String(value));

export const rowToToken = (row: Record<string, unknown>): AuthToken => ({
  tokenHash: String(row.token_hash),
  email: String(row.email),
  nextPath: text(row.next_path),
  termsVersion: String(row.terms_version),
  source: text(row.source) as Source | null,
  expiresAt: toDate(row.expires_at),
  consumedAt: toDateOrNull(row.consumed_at),
  createdIpHash: text(row.created_ip_hash),
  createdAt: toDate(row.created_at),
});

export const rowToSession = (row: Record<string, unknown>): Session => ({
  idHash: String(row.id_hash),
  userId: String(row.user_id),
  createdAt: toDate(row.created_at),
  expiresAt: toDate(row.expires_at),
  lastSeenAt: toDate(row.last_seen_at),
  revokedAt: toDateOrNull(row.revoked_at),
});

// The production store. Tables and the statements below are documented in db/migrations/002_users_auth.sql.
// The intervals are bound as seconds so the statements and lib/auth/config.ts cannot drift apart.
export class NeonAuthStore implements AuthStore {
  constructor(private readonly sql: Sql) {}

  async createToken(t: NewToken) {
    await this.sql`
      insert into auth_tokens (token_hash, email, next_path, terms_version, source, expires_at, created_ip_hash, created_at)
      values (${t.tokenHash}, ${t.email}, ${t.nextPath}, ${t.termsVersion}, ${t.source}, ${t.expiresAt.toISOString()}, ${t.createdIpHash}, ${t.createdAt.toISOString()})`;
  }

  async peekToken(tokenHash: string) {
    const rows = await this.sql`
      select token_hash, email, next_path, terms_version, source, expires_at, consumed_at, created_ip_hash, created_at
      from auth_tokens where token_hash = ${tokenHash}`;
    return rows[0] ? rowToToken(rows[0]) : null;
  }

  async consumeToken(tokenHash: string, now: Date): Promise<ConsumedToken | null> {
    const nowIso = now.toISOString();
    // one atomic statement: a used or expired token matches no row, so two clicks cannot both sign in
    const rows = await this.sql`
      update auth_tokens set consumed_at = ${nowIso}
      where token_hash = ${tokenHash} and consumed_at is null and expires_at > ${nowIso}
      returning email, next_path, terms_version, source`;
    const row = rows[0];
    return row ? { email: String(row.email), nextPath: text(row.next_path), termsVersion: String(row.terms_version), source: text(row.source) as Source | null } : null;
  }

  async createSession(s: NewSession) {
    await this.sql`
      insert into sessions (id_hash, user_id, created_at, expires_at, last_seen_at)
      values (${s.idHash}, ${s.userId}, ${s.createdAt.toISOString()}, ${s.expiresAt.toISOString()}, ${s.createdAt.toISOString()})`;
  }

  async findSession(idHash: string) {
    const rows = await this.sql`select id_hash, user_id, created_at, expires_at, last_seen_at, revoked_at from sessions where id_hash = ${idHash}`;
    return rows[0] ? rowToSession(rows[0]) : null;
  }

  async listSessions(userId: string) {
    const rows = await this.sql`select id_hash, user_id, created_at, expires_at, last_seen_at, revoked_at from sessions where user_id = ${userId} order by created_at`;
    return rows.map(rowToSession);
  }

  async renewSession(idHash: string, now: Date) {
    const nowIso = now.toISOString();
    // the single conditional update from the plan: two concurrent calls on a stale session extend it once
    const rows = await this.sql`
      update sessions
      set expires_at = ${nowIso}::timestamptz + make_interval(secs => ${SESSION_MAX_AGE_SECONDS}), last_seen_at = ${nowIso}
      where id_hash = ${idHash}
        and revoked_at is null
        and expires_at > ${nowIso}
        and created_at > ${nowIso}::timestamptz - make_interval(secs => ${SESSION_CAP_SECONDS})
        and last_seen_at < ${nowIso}::timestamptz - make_interval(secs => ${SESSION_RENEW_AFTER_SECONDS})
      returning id_hash`;
    return rows.length > 0;
  }

  async revokeSession(idHash: string, now: Date) {
    await this.sql`update sessions set revoked_at = ${now.toISOString()} where id_hash = ${idHash} and revoked_at is null`;
  }

  async revokeAllForUser(userId: string, now: Date) {
    const rows = await this.sql`update sessions set revoked_at = ${now.toISOString()} where user_id = ${userId} and revoked_at is null returning id_hash`;
    return rows.length;
  }

  async recordAndCount(scope: AttemptScope, keyHash: string, at: Date, since: Date) {
    const atIso = at.toISOString();
    const sinceIso = since.toISOString();
    // The count cannot see this statement's insert, so the new row is added from RETURNING.
    const rows = await this.sql`
      with inserted as (
        insert into auth_attempts (scope, key_hash, at) values (${scope}, ${keyHash}, ${atIso})
        returning at
      )
      select count(*)::int as n from (
        select at from auth_attempts where scope = ${scope} and key_hash = ${keyHash} and at >= ${sinceIso}
        union all
        select at from inserted where at >= ${sinceIso}
      ) as in_window`;
    try {
      // Its own statement: a cleanup failure must not fail the insert above.
      await this.sql`delete from auth_attempts where at < now() - interval '1 day'`;
    } catch (err) {
      console.error('auth: attempt cleanup failed', err instanceof Error ? err.name : 'error');
    }
    return Number(rows[0]?.n ?? 0);
  }

  async placementStats(): Promise<PlacementStat[]> {
    // consumed_at is null for a link never opened, so count() over it is the sign-ins
    const rows = await this.sql`
      select source, count(*)::int as requested, count(consumed_at)::int as signed_in
      from auth_tokens group by source order by requested desc, source`;
    return rows.map(r => ({ source: text(r.source) as Source | null, requested: Number(r.requested), signedIn: Number(r.signed_in) }));
  }
}
