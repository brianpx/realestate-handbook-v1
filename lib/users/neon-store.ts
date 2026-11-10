import { toDate, toDateOrNull, type Sql } from '@/lib/db/sql';
import type { Page, UserStore, VerifiedSignIn } from './store';
import type { Role, User, UserStatus } from './types';

export function rowToUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    email: String(row.email),
    emailVerifiedAt: toDateOrNull(row.email_verified_at),
    role: row.role as Role,
    status: row.status as UserStatus,
    acceptedTermsVersion: row.accepted_terms_version === null || row.accepted_terms_version === undefined ? null : String(row.accepted_terms_version),
    acceptedTermsAt: toDateOrNull(row.accepted_terms_at),
    lastSignInAt: toDateOrNull(row.last_sign_in_at),
    createdAt: toDate(row.created_at),
  };
}

// The production store. Tables are defined in db/migrations/002_users_auth.sql, which also lists the statements
// the code relies on. The column list is repeated in each statement because the driver binds values, not SQL.
export class NeonUserStore implements UserStore {
  constructor(private readonly sql: Sql) {}

  async findByEmail(email: string) {
    const rows = await this.sql`
      select id, email, email_verified_at, role, status, accepted_terms_version, accepted_terms_at, last_sign_in_at, created_at
      from users where email = ${email}`;
    return rows[0] ? rowToUser(rows[0]) : null;
  }

  async findById(id: string) {
    const rows = await this.sql`
      select id, email, email_verified_at, role, status, accepted_terms_version, accepted_terms_at, last_sign_in_at, created_at
      from users where id = ${id}`;
    return rows[0] ? rowToUser(rows[0]) : null;
  }

  async upsertVerified({ email, termsVersion, at }: VerifiedSignIn) {
    const atIso = at.toISOString();
    // one statement for first and repeat sign-ins; xmax = 0 is Postgres's way of saying the row was inserted
    const rows = await this.sql`
      insert into users (email, email_verified_at, accepted_terms_version, accepted_terms_at, created_at, updated_at)
      values (${email}, ${atIso}, ${termsVersion}, ${atIso}, ${atIso}, ${atIso})
      on conflict (email) do update set
        email_verified_at = coalesce(users.email_verified_at, excluded.email_verified_at),
        accepted_terms_version = coalesce(users.accepted_terms_version, excluded.accepted_terms_version),
        accepted_terms_at = coalesce(users.accepted_terms_at, excluded.accepted_terms_at),
        updated_at = excluded.updated_at
      returning id, email, email_verified_at, role, status, accepted_terms_version, accepted_terms_at, last_sign_in_at, created_at,
        (xmax = 0) as created`;
    const row = rows[0];
    if (!row) throw new Error('users upsert returned no row');
    return { user: rowToUser(row), created: Boolean(row.created) };
  }

  async countAdmins() {
    const rows = await this.sql`select count(*)::int as n from users where role = 'admin'`;
    return Number(rows[0]?.n ?? 0);
  }

  async setRole(id: string, role: Role, at: Date) {
    await this.sql`update users set role = ${role}, updated_at = ${at.toISOString()} where id = ${id}`;
  }

  async touchSignIn(id: string, at: Date) {
    const atIso = at.toISOString();
    await this.sql`update users set last_sign_in_at = ${atIso}, updated_at = ${atIso} where id = ${id}`;
  }

  async list({ offset, limit }: Page) {
    // the count and the page in one round trip, so the two agree on a listing that is being written to
    const [counted, rows] = await this.sql.transaction([
      this.sql`select count(*)::int as n from users`,
      this.sql`
        select id, email, email_verified_at, role, status, accepted_terms_version, accepted_terms_at, last_sign_in_at, created_at
        from users order by created_at desc, id desc limit ${limit} offset ${offset}`,
    ]);
    return { users: rows!.map(rowToUser), total: Number(counted![0]?.n ?? 0) };
  }

  async findByIds(ids: string[]) {
    if (ids.length === 0) return [];
    const rows = await this.sql`
      select id, email, email_verified_at, role, status, accepted_terms_version, accepted_terms_at, last_sign_in_at, created_at
      from users where id = any(${ids}::uuid[])`;
    return rows.map(rowToUser);
  }
}
