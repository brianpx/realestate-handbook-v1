import { neon } from '@neondatabase/serverless';
import type { EmailStatus, LeadStore, NewLead } from './store';

// The production store: Postgres on Neon over its HTTP driver, so each call is one stateless request and
// every server instance shares the same rate-limit counters. Tables are defined in db/migrations/001_leads.sql.
export type Sql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>;

export class NeonLeadStore implements LeadStore {
  constructor(private readonly sql: Sql) {}

  static fromUrl(url: string): NeonLeadStore {
    return new NeonLeadStore(neon(url) as unknown as Sql);
  }

  async insert(lead: NewLead) {
    const { sql } = this;
    // one statement tells a new address from a repeat: a conflict returns no row
    const created = await sql`
      insert into leads (email, source, consent_version, consent_text, created_at)
      values (${lead.email}, ${lead.source}, ${lead.consentVersion}, ${lead.consentText}, ${lead.at.toISOString()})
      on conflict (email) do nothing
      returning id`;
    if (created[0]) return { created: true, id: String(created[0].id) };
    const existing = await sql`select id from leads where email = ${lead.email}`;
    return { created: false, id: String(existing[0]?.id ?? '') };
  }

  async setEmailStatus(id: string, status: EmailStatus) {
    await this.sql`update leads set email_status = ${status} where id = ${id}`;
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
}
