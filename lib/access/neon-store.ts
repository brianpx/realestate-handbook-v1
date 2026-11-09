import type { AuditEntry, AuditRow, AuditStub } from '@/lib/audit';
import { toDate, toDateOrNull, toText, type Row, type Sql } from '@/lib/db/sql';
import type { AccessStore, Anonymisation, NewGrant, Revocation } from './store';
import type { AccessSnapshot, BillingAccess, Grant, Membership } from './types';

export const rowToGrant = (row: Row): Grant => ({
  id: String(row.id),
  userId: String(row.user_id),
  kind: row.kind as Grant['kind'],
  tier: row.tier as Grant['tier'],
  startsAt: toDate(row.starts_at),
  endsAt: toDateOrNull(row.ends_at),
  billingRecordId: toText(row.billing_record_id),
  grantedBy: toText(row.granted_by),
  grantNote: toText(row.grant_note),
  revokedAt: toDateOrNull(row.revoked_at),
  revokedBy: toText(row.revoked_by),
  revokeReason: toText(row.revoke_reason) as Grant['revokeReason'],
  createdAt: toDate(row.created_at),
});

export const rowToMembership = (row: Row): Membership => ({
  userId: String(row.user_id),
  status: row.status as Membership['status'],
  tier: toText(row.tier) as Membership['tier'],
  startedAt: toDateOrNull(row.started_at),
  endsAt: toDateOrNull(row.ends_at),
  currentGrantId: toText(row.current_grant_id),
  complimentary: Boolean(row.complimentary),
  suspendedAt: toDateOrNull(row.suspended_at),
  suspendedBy: toText(row.suspended_by),
  suspendReason: toText(row.suspend_reason),
  updatedAt: toDate(row.updated_at),
});

export const rowToBilling = (row: Row): BillingAccess => {
  const base = { id: String(row.id), tier: row.tier as BillingAccess['tier'], accessEndsAt: toDateOrNull(row.access_ends_at) };
  return row.kind === 'purchase'
    ? { ...base, kind: 'purchase', status: row.status as Extract<BillingAccess, { kind: 'purchase' }>['status'], currentPeriodEnd: null }
    : { ...base, kind: 'subscription', status: row.status as Extract<BillingAccess, { kind: 'subscription' }>['status'], currentPeriodEnd: toDateOrNull(row.current_period_end) };
};

export const rowToAudit = (row: Row): AuditRow => ({
  id: String(row.id),
  at: toDate(row.at),
  actorUserId: toText(row.actor_user_id),
  actorKind: row.actor_kind as AuditRow['actorKind'],
  action: row.action as AuditRow['action'],
  subjectTable: String(row.subject_table),
  subjectId: toText(row.subject_id),
  before: row.before ?? null,
  after: row.after ?? null,
  reason: toText(row.reason),
  ipHash: toText(row.ip_hash),
});

const iso = (d: Date | null): string | null => (d ? d.toISOString() : null);

/**
 * The production store. Tables and the statements below are documented in db/migrations/003_access_billing.sql.
 * Each mutation is one statement whose data-modifying CTEs change the row and write its audit entry together: the
 * entry is selected from the changed row, so when nothing matched there is no entry either.
 */
export class NeonAccessStore implements AccessStore {
  constructor(private readonly sql: Sql) {}

  async loadAccess(userId: string): Promise<AccessSnapshot> {
    // three reads, one round trip
    const [grants, memberships, billing] = await this.sql.transaction([
      this.sql`
        select id, user_id, kind, tier, starts_at, ends_at, billing_record_id, granted_by, grant_note, revoked_at, revoked_by, revoke_reason, created_at
        from access_grants where user_id = ${userId} order by created_at`,
      this.sql`
        select user_id, status, tier, started_at, ends_at, current_grant_id, complimentary, suspended_at, suspended_by, suspend_reason, updated_at
        from memberships where user_id = ${userId}`,
      this.sql`select id, kind, tier, status, access_ends_at, current_period_end from billing_records where user_id = ${userId}`,
    ]);
    return { grants: grants!.map(rowToGrant), membership: memberships![0] ? rowToMembership(memberships![0]) : null, billing: billing!.map(rowToBilling) };
  }

  async listGrants(userId: string) {
    const rows = await this.sql`
      select id, user_id, kind, tier, starts_at, ends_at, billing_record_id, granted_by, grant_note, revoked_at, revoked_by, revoke_reason, created_at
      from access_grants where user_id = ${userId} order by created_at`;
    return rows.map(rowToGrant);
  }

  async createGrant(g: NewGrant, a: AuditStub) {
    const rows = await this.sql`
      with g as (
        insert into access_grants (user_id, kind, tier, starts_at, ends_at, billing_record_id, granted_by, grant_note, created_at)
        values (${g.userId}, ${g.kind}, ${g.tier}, ${g.startsAt.toISOString()}, ${iso(g.endsAt)}, ${g.billingRecordId}, ${g.grantedBy}, ${g.grantNote}, ${g.createdAt.toISOString()})
        returning id, user_id, kind, tier, starts_at, ends_at, billing_record_id, granted_by, grant_note, revoked_at, revoked_by, revoke_reason, created_at
      ), logged as (
        insert into audit_log (at, actor_user_id, actor_kind, action, subject_table, subject_id, before, after, reason, ip_hash)
        select ${a.at.toISOString()}, ${a.actorUserId}, ${a.actorKind}, ${a.action}, 'access_grants', g.id, null, to_jsonb(g), ${a.reason}, ${a.ipHash} from g
      )
      select * from g`;
    const row = rows[0];
    if (!row) throw new Error('access_grants insert returned no row');
    return rowToGrant(row);
  }

  async revokeGrant(id: string, r: Revocation, a: AuditStub) {
    // a grant already revoked matches no row, so a repeat changes nothing and logs nothing
    const rows = await this.sql`
      with before as (
        select id, user_id, kind, tier, starts_at, ends_at, billing_record_id, granted_by, grant_note, revoked_at, revoked_by, revoke_reason, created_at
        from access_grants where id = ${id} and revoked_at is null for update
      ), after as (
        update access_grants g set revoked_at = ${r.at.toISOString()}, revoked_by = ${r.by}, revoke_reason = ${r.reason}
        from before where g.id = before.id
        returning g.id, g.user_id, g.kind, g.tier, g.starts_at, g.ends_at, g.billing_record_id, g.granted_by, g.grant_note, g.revoked_at, g.revoked_by, g.revoke_reason, g.created_at
      ), logged as (
        insert into audit_log (at, actor_user_id, actor_kind, action, subject_table, subject_id, before, after, reason, ip_hash)
        select ${a.at.toISOString()}, ${a.actorUserId}, ${a.actorKind}, ${a.action}, 'access_grants', after.id, to_jsonb(before), to_jsonb(after), ${a.reason}, ${a.ipHash}
        from before join after on after.id = before.id
      )
      select * from after`;
    return rows[0] ? rowToGrant(rows[0]) : null;
  }

  async findMembership(userId: string) {
    const rows = await this.sql`
      select user_id, status, tier, started_at, ends_at, current_grant_id, complimentary, suspended_at, suspended_by, suspend_reason, updated_at
      from memberships where user_id = ${userId}`;
    return rows[0] ? rowToMembership(rows[0]) : null;
  }

  async saveMembership(m: Membership) {
    await this.sql`
      insert into memberships (user_id, status, tier, started_at, ends_at, current_grant_id, complimentary, suspended_at, suspended_by, suspend_reason, updated_at)
      values (${m.userId}, ${m.status}, ${m.tier}, ${iso(m.startedAt)}, ${iso(m.endsAt)}, ${m.currentGrantId}, ${m.complimentary}, ${iso(m.suspendedAt)}, ${m.suspendedBy}, ${m.suspendReason}, ${m.updatedAt.toISOString()})
      on conflict (user_id) do update set
        status = excluded.status, tier = excluded.tier, started_at = excluded.started_at, ends_at = excluded.ends_at,
        current_grant_id = excluded.current_grant_id, complimentary = excluded.complimentary,
        suspended_at = excluded.suspended_at, suspended_by = excluded.suspended_by, suspend_reason = excluded.suspend_reason,
        updated_at = excluded.updated_at`;
  }

  async anonymise({ userId, email, emailHash, at }: Anonymisation, a: AuditStub) {
    const atIso = at.toISOString();
    // the audit entry carries the status and role change only, never the address; `exists (select 1 from before)`
    // keeps the deletes from running for an account that was already deleted. The role goes back to reader so a
    // deleted administrator no longer counts for the bootstrap rule; the membership projection goes, the grants stay.
    const rows = await this.sql`
      with before as (
        select id, status, role from users where id = ${userId} and status <> 'deleted'
      ), changed as (
        update users set status = 'deleted', role = 'reader', deleted_at = ${atIso}, email = 'deleted+' || users.id || '@invalid.local',
          first_name = null, last_name = null, auth_provider_id = null, updated_at = ${atIso}
        from before where users.id = before.id
        returning users.id
      ), membership_gone as (
        delete from memberships where user_id = ${userId} and exists (select 1 from before)
      ), sessions_gone as (
        delete from sessions where user_id = ${userId} and exists (select 1 from before)
      ), tokens_gone as (
        delete from auth_tokens where email = ${email} and exists (select 1 from before)
      ), billing_hashed as (
        update billing_customers set email_at_provider = ${emailHash}, updated_at = ${atIso}
        where user_id = ${userId} and email_at_provider is not null and exists (select 1 from before)
      ), logged as (
        insert into audit_log (at, actor_user_id, actor_kind, action, subject_table, subject_id, before, after, reason, ip_hash)
        select ${a.at.toISOString()}, ${a.actorUserId}, ${a.actorKind}, ${a.action}, 'users', before.id,
          jsonb_build_object('status', before.status, 'role', before.role), jsonb_build_object('status', 'deleted', 'role', 'reader'), ${a.reason}, ${a.ipHash}
        from before
      )
      select id from changed`;
    return rows.length > 0;
  }

  async appendAudit(e: AuditEntry) {
    // an absent before or after is SQL null, as in the statements above, not the JSON value null
    const json = (value: unknown) => (value === null || value === undefined ? null : JSON.stringify(value));
    await this.sql`
      insert into audit_log (at, actor_user_id, actor_kind, action, subject_table, subject_id, before, after, reason, ip_hash)
      values (${e.at.toISOString()}, ${e.actorUserId}, ${e.actorKind}, ${e.action}, ${e.subjectTable}, ${e.subjectId}, ${json(e.before)}::jsonb, ${json(e.after)}::jsonb, ${e.reason}, ${e.ipHash})`;
  }

  async listAudit(subjectTable: string, subjectId: string) {
    const rows = await this.sql`
      select id, at, actor_user_id, actor_kind, action, subject_table, subject_id, before, after, reason, ip_hash
      from audit_log where subject_table = ${subjectTable} and subject_id = ${subjectId} order by at`;
    return rows.map(rowToAudit);
  }
}
