import { sqlFromUrl, toDate, toDateOrNull, type Sql } from '@/lib/db/sql';
import { LEAD_LIST_CAP, type EmailStatus, type Inserted, type LeadRow, type LeadStore, type NewLead } from './store';

// The production store: Postgres on Neon over its HTTP driver, so each call is one stateless request and
// every server instance shares the same rate-limit counters. Tables are defined in db/migrations/001_leads.sql and
// the confirmation columns in 004_leads_confirmation.sql.
export type { Sql };

// The column is checked in the database, so anything else can only be a null.
const emailStatus = (value: unknown): EmailStatus | null => (value === 'sent' || value === 'failed' || value === 'skipped' ? value : null);

export class NeonLeadStore implements LeadStore {
  constructor(private readonly sql: Sql) {}

  static fromUrl(url: string): NeonLeadStore {
    return new NeonLeadStore(sqlFromUrl(url));
  }

  async insert(lead: NewLead): Promise<Inserted> {
    const { sql } = this;
    // one statement tells a new address from a repeat: a conflict returns no row
    const created = await sql`
      insert into leads (email, source, consent_version, consent_text, confirm_token_hash, confirm_token_expires_at, created_at)
      values (${lead.email}, ${lead.source}, ${lead.consentVersion}, ${lead.consentText}, ${lead.confirmTokenHash}, ${lead.confirmExpiresAt.toISOString()}, ${lead.at.toISOString()})
      on conflict (email) do nothing
      returning id`;
    if (created[0]) return { created: true, id: String(created[0].id), emailStatus: null, confirmedAt: null };
    const existing = await sql`select id, email_status, confirmed_at from leads where email = ${lead.email}`;
    return { created: false, id: String(existing[0]?.id ?? ''), emailStatus: emailStatus(existing[0]?.email_status), confirmedAt: toDateOrNull(existing[0]?.confirmed_at) };
  }

  async resetConfirmation(id: string, tokenHash: string, expiresAt: Date) {
    await this.sql`update leads set confirm_token_hash = ${tokenHash}, confirm_token_expires_at = ${expiresAt.toISOString()} where id = ${id}`;
  }

  async setEmailStatus(id: string, status: EmailStatus) {
    await this.sql`update leads set email_status = ${status} where id = ${id}`;
  }

  async confirm(tokenHash: string, now: Date) {
    const nowIso = now.toISOString();
    // one statement: a second click keeps the first time, and no row back means the token is unknown or expired
    const rows = await this.sql`
      update leads set confirmed_at = coalesce(confirmed_at, ${nowIso})
      where confirm_token_hash = ${tokenHash} and (confirmed_at is not null or confirm_token_expires_at > ${nowIso})
      returning id`;
    return rows.length > 0;
  }

  async recordAttempt(ipHash: string, at: Date) {
    await this.sql`insert into lead_attempts (ip_hash, at) values (${ipHash}, ${at.toISOString()})`;
  }

  async countAttempts(ipHash: string, since: Date) {
    const rows = await this.sql`select count(*)::int as n from lead_attempts where ip_hash = ${ipHash} and at >= ${since.toISOString()}`;
    return Number(rows[0]?.n ?? 0);
  }

  async recordAndCount(ipHash: string, at: Date, since: Date) {
    const atIso = at.toISOString();
    const sinceIso = since.toISOString();
    // The count cannot see this statement's insert, so the new row is added from RETURNING.
    const rows = await this.sql`
      with inserted as (
        insert into lead_attempts (ip_hash, at) values (${ipHash}, ${atIso})
        returning at
      )
      select count(*)::int as n from (
        select at from lead_attempts where ip_hash = ${ipHash} and at >= ${sinceIso}
        union all
        select at from inserted where at >= ${sinceIso}
      ) as in_window`;
    try {
      // Its own statement: a cleanup failure must not fail the insert above.
      await this.sql`delete from lead_attempts where at < now() - interval '1 day'`;
    } catch (err) {
      console.error('lead: attempt cleanup failed', err instanceof Error ? err.name : 'error');
    }
    return Number(rows[0]?.n ?? 0);
  }

  async list(): Promise<LeadRow[]> {
    const rows = await this.sql`
      select id, email, source, created_at, consent_version, email_status, confirmed_at from leads
      order by created_at desc limit ${LEAD_LIST_CAP}`;
    return rows.map(r => ({
      id: String(r.id),
      email: String(r.email),
      source: String(r.source),
      createdAt: toDate(r.created_at),
      consentVersion: String(r.consent_version),
      emailStatus: emailStatus(r.email_status),
      confirmedAt: toDateOrNull(r.confirmed_at),
    }));
  }

  async deleteByEmail(email: string) {
    await this.sql`delete from leads where email = ${email}`;
  }
}
