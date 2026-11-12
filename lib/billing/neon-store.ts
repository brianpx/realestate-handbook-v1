import type { Actor } from '@/lib/audit';
import { SESSION_CAP_SECONDS } from '@/lib/auth/config';
import { sqlFromUrl, toDate, toDateOrNull, toText, type Row, type Sql } from '@/lib/db/sql';
import type { Role, User, UserStatus } from '@/lib/users/types';
import type { BillingStore, ClaimResult, MirrorResult, ResendWrite } from './store';
import {
  isPurchaseStatus,
  isSubscriptionStatus,
  UPGRADE_PRODUCT_KEY,
  type BillingRecord,
  type BillingStatus,
  type EventStatus,
  type MirrorInput,
  type NewBillingEvent,
} from './types';

export type { Sql };

// `access_grants.billing_record_id` has no unique index (the migration shipped without one). The grant write is a
// single-statement insert guarded by `not exists`, not `on conflict`, so a retry still cannot add a second grant.
// `billing_records` has no manage-url column; the account page refetches that from the provider when a key is set.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const iso = (d: Date | null): string | null => (d ? d.toISOString() : null);

function claimFrom(row: Row | undefined): ClaimResult {
  if (!row || row.id === undefined || row.id === null) return { claimed: false };
  const claimed = row.claimed === true || row.claimed === 't';
  if (claimed) return { claimed: true, id: String(row.id) };
  const status = eventStatus(row.status);
  const receivedAt = toDateOrNull(row.received_at) ?? undefined;
  return status ? { claimed: false, status, ...(receivedAt ? { receivedAt } : {}) } : { claimed: false };
}

function eventStatus(value: unknown): EventStatus | null {
  return value === 'received' || value === 'processed' || value === 'ignored_stale' || value === 'unmatched' || value === 'failed' ? value : null;
}

function named(name: string): Error {
  const error = new Error(name);
  error.name = name;
  return error;
}

function uuidOrNull(value: string | null): string | null {
  if (value === null) return null;
  if (!UUID.test(value)) throw named('InvalidUserId');
  return value;
}

export class NeonBillingStore implements BillingStore {
  constructor(private readonly sql: Sql) {}

  static fromUrl(url: string): NeonBillingStore {
    return new NeonBillingStore(sqlFromUrl(url));
  }

  async claimEvent(event: NewBillingEvent, at: Date): Promise<ClaimResult> {
    const payload = event.payload === undefined ? null : JSON.stringify(event.payload);
    // The claimed row is read from RETURNING, never from the table: the outer query runs on the statement's
    // snapshot and cannot see a row this statement inserted. RETURNING is empty when the stored row is not
    // `failed`, and the second arm then reports that row's status. A duplicate of `processed` can answer 200;
    // a duplicate of `received` must not. No row at all means another delivery inserted it after the snapshot.
    const rows = await this.sql`
      with ins as (
        insert into billing_events (provider, provider_event_id, event_type, object_id, event_created_at, status, payload)
        values (${event.provider}, ${event.providerEventId}, ${event.eventType}, ${event.objectId}, ${iso(event.eventCreatedAt)}::timestamptz, 'received', ${payload}::jsonb)
        on conflict (provider, provider_event_id) do update
          set status = 'received', error = null, received_at = ${iso(at)}::timestamptz
          where billing_events.status = 'failed'
        returning id
      )
      select id, true as claimed, null::text as status, null::timestamptz as received_at from ins
      union all
      select id, false as claimed, status, received_at from billing_events
      where provider = ${event.provider} and provider_event_id = ${event.providerEventId} and not exists (select 1 from ins)`;
    return claimFrom(rows[0]);
  }

  async attachUser(recordId: string, userId: string) {
    await this.sql`
      update billing_records set user_id = ${uuidOrNull(userId)}::uuid
      where id = ${uuidOrNull(recordId)}::uuid and user_id is null`;
  }

  async setEventStatus(id: string, status: EventStatus, error: string | null, at: Date) {
    await this.sql`
      update billing_events
      set status = ${status},
          error = ${error},
          processed_at = case when ${status} in ('processed', 'ignored_stale', 'unmatched') then ${iso(at)}::timestamptz else processed_at end
      where id = ${uuidOrNull(id)}::uuid`;
  }

  async findRecord(provider: string, providerObjectId: string) {
    const rows = await this.sql`select * from billing_records where provider = ${provider} and provider_object_id = ${providerObjectId}`;
    return rows[0] ? rowToRecord(rows[0]) : null;
  }

  async findRecordById(id: string) {
    if (!UUID.test(id)) return null;
    const rows = await this.sql`select * from billing_records where id = ${id}::uuid`;
    return rows[0] ? rowToRecord(rows[0]) : null;
  }

  async listRecordsForUser(userId: string) {
    if (!UUID.test(userId)) return [];
    const rows = await this.sql`select * from billing_records where user_id = ${userId}::uuid order by created_at`;
    return rows.map(rowToRecord);
  }

  async listNonTerminal() {
    const rows = await this.sql`
      select * from billing_records
      where status in ('pending', 'paid', 'partially_refunded', 'disputed', 'incomplete', 'trialing', 'active', 'past_due', 'paused')
      order by updated_at`;
    return rows.map(rowToRecord);
  }

  async listPaidMissingReadyEmail() {
    const rows = await this.sql`
      select * from billing_records
      where status = 'paid' and ready_email_sent_at is null and user_id is not null and product_key <> ${UPGRADE_PRODUCT_KEY}
      order by created_at`;
    return rows.map(rowToRecord);
  }

  async commitMirror(input: MirrorInput): Promise<MirrorResult> {
    if (input.grant === 'revoke' && !input.revokeReason) throw named('BillingMirrorError');
    const userId = uuidOrNull(input.userId);
    const actorId = uuidOrNull(input.actor.userId);
    const now = iso(input.at);
    const { sql } = this;
    // One statement, so the record, the grant, the membership projection and the audit row commit together or
    // not at all. The HTTP driver cannot hold an interactive transaction across those writes.
    const [rows] = await sql.transaction([
      sql`
        with prior as (
          select id, status, tier, user_id, access_ends_at
          from billing_records
          where provider = ${input.provider} and provider_object_id = ${input.providerObjectId}
        ),
        cust_write as (
          insert into billing_customers (user_id, provider, provider_customer_id, email_at_provider, created_at, updated_at)
          select ${userId}::uuid, ${input.provider}, ${input.customerId}, ${input.customerEmail}, ${now}::timestamptz, ${now}::timestamptz
          where ${userId}::uuid is not null
            and ${input.customerId}::text is not null
            and not exists (
              select 1 from billing_customers
              where user_id = ${userId}::uuid and provider = ${input.provider} and provider_customer_id <> ${input.customerId}
            )
          on conflict (provider, provider_customer_id) do update
            set email_at_provider = excluded.email_at_provider, updated_at = excluded.updated_at
            where billing_customers.user_id = excluded.user_id
          returning id
        ),
        rec as (
          insert into billing_records (
            kind, billing_customer_id, user_id, provider, provider_object_id, provider_payment_id,
            product_key, tier, provider_price_id, amount_cents, currency, status, provider_status,
            paid_at, refunded_at, disputed_at, trial_ends_at, current_period_start, current_period_end,
            cancel_requested_at, cancel_effective_at, access_ends_at, last_event_at, notes, created_at, updated_at
          )
          values (
            ${input.kind}, (select id from cust_write limit 1), ${userId}::uuid, ${input.provider}, ${input.providerObjectId}, ${input.providerPaymentId},
            ${input.productKey}, ${input.tier}, ${input.providerPriceId}, ${input.amountCents}, ${input.currency}, ${input.status}, ${input.providerStatus},
            ${iso(input.paidAt)}::timestamptz, ${iso(input.refundedAt)}::timestamptz, ${iso(input.disputedAt)}::timestamptz,
            ${iso(input.trialEndsAt)}::timestamptz, ${iso(input.currentPeriodStart)}::timestamptz, ${iso(input.currentPeriodEnd)}::timestamptz,
            ${iso(input.cancelRequestedAt)}::timestamptz, ${iso(input.cancelEffectiveAt)}::timestamptz, ${iso(input.accessEndsAt)}::timestamptz,
            ${iso(input.lastEventAt)}::timestamptz, ${input.notes}, ${now}::timestamptz, ${now}::timestamptz
          )
          on conflict (provider, provider_object_id) do update set
            kind = excluded.kind,
            billing_customer_id = coalesce(excluded.billing_customer_id, billing_records.billing_customer_id),
            user_id = coalesce(billing_records.user_id, excluded.user_id),
            provider_payment_id = excluded.provider_payment_id,
            product_key = excluded.product_key,
            tier = excluded.tier,
            provider_price_id = excluded.provider_price_id,
            amount_cents = excluded.amount_cents,
            currency = excluded.currency,
            status = excluded.status,
            provider_status = excluded.provider_status,
            paid_at = coalesce(billing_records.paid_at, excluded.paid_at),
            refunded_at = excluded.refunded_at,
            disputed_at = excluded.disputed_at,
            trial_ends_at = excluded.trial_ends_at,
            current_period_start = excluded.current_period_start,
            current_period_end = excluded.current_period_end,
            cancel_requested_at = excluded.cancel_requested_at,
            cancel_effective_at = excluded.cancel_effective_at,
            access_ends_at = excluded.access_ends_at,
            last_event_at = excluded.last_event_at,
            notes = excluded.notes,
            updated_at = excluded.updated_at
          where billing_records.last_event_at is null or billing_records.last_event_at <= excluded.last_event_at
          returning *
        ),
        live_grant as (
          select g.id from access_grants g
          where g.billing_record_id = (select id from rec) and g.revoked_at is null
        ),
        revoked as (
          update access_grants g
          set revoked_at = ${now}::timestamptz, revoke_reason = ${input.revokeReason}
          where ${input.grant} = 'revoke' and g.id in (select id from live_grant)
          returning g.id
        ),
        -- Refunding a Basic purchase for the first time also revokes an upgrade bought on top of it. A re-read of an
        -- already refunded Basic does not, or it would take away an upgrade bought later on a new Basic.
        cascade_revoked as (
          update access_grants g
          set revoked_at = ${now}::timestamptz, revoke_reason = ${input.revokeReason}
          where ${input.grant} = 'revoke'
            and (select tier from rec) = 'basic'
            and (select product_key from rec) <> ${UPGRADE_PRODUCT_KEY}
            and coalesce((select status from prior), '') not in ('refunded', 'chargeback_lost')
            and g.user_id = (select user_id from rec)
            and g.revoked_at is null
            and g.billing_record_id in (
              select u.id from billing_records u
              where u.user_id = (select user_id from rec) and u.product_key = ${UPGRADE_PRODUCT_KEY} and u.id <> (select id from rec)
            )
          returning g.id, g.billing_record_id
        ),
        cascade_records as (
          update billing_records u
          set access_ends_at = ${now}::timestamptz, updated_at = ${now}::timestamptz
          where u.id in (select billing_record_id from cascade_revoked)
          returning u.id
        ),
        grant_inserted as (
          insert into access_grants (user_id, kind, tier, starts_at, ends_at, billing_record_id, granted_by, created_at)
          select rec.user_id, rec.kind, rec.tier, ${now}::timestamptz, null, rec.id, null, ${now}::timestamptz
          from rec
          where ${input.grant} = 'grant'
            and rec.user_id is not null
            and not exists (select 1 from live_grant)
            and not exists (
              select 1 from access_grants g where g.billing_record_id = rec.id and g.revoked_at is not null
            )
          returning id
        ),
        visible as (
          select g.id, g.kind, g.tier, g.starts_at, g.ends_at
          from access_grants g
          where g.user_id = (select user_id from rec)
            and g.revoked_at is null
            and g.starts_at <= ${now}::timestamptz
            and (g.ends_at is null or g.ends_at > ${now}::timestamptz)
            and not exists (select 1 from revoked r where r.id = g.id)
            and not exists (select 1 from cascade_revoked c where c.id = g.id)
          union all
          select i.id, rec.kind, rec.tier, ${now}::timestamptz, null::timestamptz
          from grant_inserted i
          join rec on true
        ),
        chosen as (
          select id, kind, tier, starts_at, ends_at from visible
          order by case when kind in ('purchase', 'subscription') then 0 else 1 end, ends_at desc nulls first,
            case when tier = 'pro' then 0 else 1 end
          limit 1
        ),
        has_grant as (
          select g.id from access_grants g where g.user_id = (select user_id from rec)
          union all
          select id from grant_inserted
        ),
        mem as (
          insert into memberships (
            user_id, status, tier, started_at, ends_at, current_grant_id, complimentary,
            suspended_at, suspended_by, suspend_reason, updated_at
          )
          select rec.user_id,
            case when em.suspended_at is not null then 'suspended'
                 when ch.id is not null then 'active'
                 when exists (select 1 from has_grant) then 'lapsed'
                 else 'none' end,
            ch.tier, ch.starts_at, ch.ends_at, ch.id,
            coalesce(ch.id is not null and ch.kind not in ('purchase', 'subscription'), false),
            em.suspended_at, em.suspended_by, em.suspend_reason, ${now}::timestamptz
          from rec
          left join chosen ch on true
          left join memberships em on em.user_id = rec.user_id
          where rec.user_id is not null
          on conflict (user_id) do update set
            status = excluded.status, tier = excluded.tier, started_at = excluded.started_at, ends_at = excluded.ends_at,
            current_grant_id = excluded.current_grant_id, complimentary = excluded.complimentary,
            suspended_at = memberships.suspended_at, suspended_by = memberships.suspended_by,
            suspend_reason = memberships.suspend_reason, updated_at = excluded.updated_at
          returning user_id
        ),
        logged as (
          insert into audit_log (at, actor_user_id, actor_kind, action, subject_table, subject_id, before, after, reason, ip_hash)
          select ${now}::timestamptz, ${actorId}::uuid, ${input.actor.kind}, 'billing.event', 'billing_records', rec.id,
            case when prior.id is null then null else jsonb_build_object(
              'status', prior.status, 'tier', prior.tier, 'userId', prior.user_id, 'accessEndsAt', prior.access_ends_at
            ) end,
            jsonb_build_object('status', rec.status, 'tier', rec.tier, 'userId', rec.user_id, 'accessEndsAt', rec.access_ends_at),
            null, ${input.actor.ipHash ?? null}
          from rec
          left join prior on true
          where prior.id is null
             or prior.status is distinct from rec.status
             or prior.tier is distinct from rec.tier
             or prior.user_id is distinct from rec.user_id
             or prior.access_ends_at is distinct from rec.access_ends_at
        )
        select * from rec`,
    ]);
    const row = rows?.[0];
    return row ? { applied: true, record: rowToRecord(row) } : { applied: false };
  }

  async markReadyEmailSent(id: string, at: Date) {
    await this.sql`
      update billing_records set ready_email_sent_at = ${iso(at)}::timestamptz
      where id = ${uuidOrNull(id)}::uuid and ready_email_sent_at is null`;
  }

  async recordResend(id: string, at: Date, actor: Actor): Promise<ResendWrite> {
    const when = iso(at);
    const rows = await this.sql`
      with found as (
        select id, status, ready_email_sent_at from billing_records where id = ${uuidOrNull(id)}::uuid
      ),
      updated as (
        update billing_records set ready_email_sent_at = ${when}::timestamptz, updated_at = ${when}::timestamptz
        where id = (select id from found) and status = 'paid'
        returning id, ready_email_sent_at
      ),
      logged as (
        insert into audit_log (at, actor_user_id, actor_kind, action, subject_table, subject_id, before, after, reason, ip_hash)
        select ${when}::timestamptz, ${uuidOrNull(actor.userId)}::uuid, ${actor.kind}, 'billing.resend_ready_email', 'billing_records', updated.id,
          jsonb_build_object('readyEmailSentAt', found.ready_email_sent_at),
          jsonb_build_object('readyEmailSentAt', updated.ready_email_sent_at),
          null, ${actor.ipHash ?? null}
        from found
        join updated on updated.id = found.id
        where found.ready_email_sent_at is distinct from updated.ready_email_sent_at
      )
      select found.status as status, (updated.id is not null) as wrote from found left join updated on true`;
    const row = rows[0];
    if (!row) return { ok: false, reason: 'missing' };
    return row.wrote === true || row.wrote === 't' ? { ok: true } : { ok: false, reason: 'not_paid' };
  }

  async requeueStuckReceived(olderThan: Date) {
    const rows = await this.sql`
      update billing_events set status = 'failed', error = 'StaleReceived'
      where status = 'received' and received_at < ${iso(olderThan)}::timestamptz
      returning id`;
    return rows.length;
  }

  async nullPayloadsOlderThan(olderThan: Date) {
    const rows = await this.sql`
      update billing_events set payload = null
      where payload is not null and received_at < ${iso(olderThan)}::timestamptz
      returning id`;
    return rows.length;
  }

  async deleteExpiredAuth(now: Date) {
    const cap = new Date(now.getTime() - SESSION_CAP_SECONDS * 1000).toISOString();
    await this.sql.transaction([
      this.sql`delete from auth_tokens where expires_at < ${iso(now)}::timestamptz`,
      this.sql`delete from sessions where expires_at < ${iso(now)}::timestamptz or created_at < ${cap}::timestamptz`,
    ]);
  }

  async findUserById(id: string) {
    if (!UUID.test(id)) return null;
    const rows = await this.sql`
      select id, email, email_verified_at, role, status, accepted_terms_version, accepted_terms_at, last_sign_in_at, created_at
      from users where id = ${id}::uuid`;
    return rows[0] ? rowToUser(rows[0]) : null;
  }

  async findUserByEmail(email: string) {
    const rows = await this.sql`
      select id, email, email_verified_at, role, status, accepted_terms_version, accepted_terms_at, last_sign_in_at, created_at
      from users where email = ${email}`;
    return rows[0] ? rowToUser(rows[0]) : null;
  }

  async createReader(email: string, at: Date): Promise<User> {
    const when = iso(at);
    // `on conflict do nothing` then read: a second delivery must not touch role or status, whatever the payload said.
    const rows = await this.sql`
      with inserted as (
        insert into users (email, role, status, created_at, updated_at)
        values (${email}, 'reader', 'active', ${when}::timestamptz, ${when}::timestamptz)
        on conflict (email) do nothing
        returning id, email, email_verified_at, role, status, accepted_terms_version, accepted_terms_at, last_sign_in_at, created_at
      )
      select * from inserted
      union all
      select id, email, email_verified_at, role, status, accepted_terms_version, accepted_terms_at, last_sign_in_at, created_at
      from users where email = ${email} and not exists (select 1 from inserted)`;
    const row = rows[0];
    if (!row) throw named('UserInsertFailed');
    return rowToUser(row);
  }
}

function rowToRecord(row: Row): BillingRecord {
  const kind = row.kind === 'purchase' || row.kind === 'subscription' ? row.kind : null;
  const tier = row.tier === 'basic' || row.tier === 'pro' ? row.tier : null;
  const status = typeof row.status === 'string' ? billingStatus(row.status) : null;
  if (!kind || !tier || !status || row.id === undefined || row.id === null) throw named('BillingRowError');
  return {
    id: String(row.id),
    kind,
    billingCustomerId: toText(row.billing_customer_id),
    userId: toText(row.user_id),
    provider: String(row.provider ?? ''),
    providerObjectId: String(row.provider_object_id ?? ''),
    providerPaymentId: toText(row.provider_payment_id),
    productKey: String(row.product_key ?? ''),
    tier,
    providerPriceId: toText(row.provider_price_id),
    amountCents: row.amount_cents === null || row.amount_cents === undefined ? null : Number(row.amount_cents),
    currency: toText(row.currency),
    status,
    providerStatus: toText(row.provider_status),
    paidAt: toDateOrNull(row.paid_at),
    refundedAt: toDateOrNull(row.refunded_at),
    disputedAt: toDateOrNull(row.disputed_at),
    trialEndsAt: toDateOrNull(row.trial_ends_at),
    currentPeriodStart: toDateOrNull(row.current_period_start),
    currentPeriodEnd: toDateOrNull(row.current_period_end),
    cancelRequestedAt: toDateOrNull(row.cancel_requested_at),
    cancelEffectiveAt: toDateOrNull(row.cancel_effective_at),
    accessEndsAt: toDateOrNull(row.access_ends_at),
    lastEventAt: toDateOrNull(row.last_event_at),
    readyEmailSentAt: toDateOrNull(row.ready_email_sent_at),
    notes: toText(row.notes),
    manageUrl: null,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

function billingStatus(status: string): BillingStatus | null {
  if (isPurchaseStatus(status) || isSubscriptionStatus(status)) return status;
  return null;
}

function rowToUser(row: Row): User {
  const role = roleOf(row.role);
  const status = userStatus(row.status);
  if (!role || !status || row.id === undefined || row.id === null) throw named('UserRowError');
  return {
    id: String(row.id),
    email: String(row.email),
    emailVerifiedAt: toDateOrNull(row.email_verified_at),
    role,
    status,
    acceptedTermsVersion: toText(row.accepted_terms_version),
    acceptedTermsAt: toDateOrNull(row.accepted_terms_at),
    lastSignInAt: toDateOrNull(row.last_sign_in_at),
    createdAt: toDate(row.created_at),
  };
}

function roleOf(value: unknown): Role | null {
  return value === 'reader' || value === 'admin' ? value : null;
}

function userStatus(value: unknown): UserStatus | null {
  return value === 'active' || value === 'disabled' || value === 'deleted' ? value : null;
}
