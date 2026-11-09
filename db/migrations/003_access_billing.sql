-- Access, membership, billing and audit tables for the access stores (lib/access/neon-store.ts). Needs 002.
-- Not yet applied anywhere. Apply to a branch of the Neon resource on the `meded` team first, run the integration
-- tests against that branch (TEST_DATABASE_URL), and only then, with permission, to the default branch. Never to
-- the old resource, and never straight to production (docs/plans/MASTER-PROMPT.md, M3 and M5 steps 10 and 11).
--
-- The billing tables ship now so the schema is complete; nothing writes them until M7 (the webhook and the admin
-- screens). Rules the code relies on:
--   * what a reader may open is computed at read time by entitlement() (lib/access/entitlement.ts) from
--     `users.status`, `memberships.suspended_at`, the grants and the billing records; it never reads
--     `memberships.status`, which is a cached projection for admin lists (recomputeMembership, lib/access/membership.ts)
--   * `access_grants.tier` is 'basic' or 'pro' (decision OD-31); the source plan's single 'standard' tier is gone
--   * a mutation and its audit row go to the database in one transaction() batch; the row is skipped when nothing changed
--   * `audit_log` is append-only: the application has no update or delete statement for it
--   * account deletion anonymises the user row and deletes its sessions and tokens; grants and billing rows stay

create table if not exists access_grants (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references users (id) on delete restrict,
  kind               text not null check (kind in ('purchase', 'subscription', 'complimentary', 'promo')),
  scope              text not null default 'full' check (scope = 'full'),
  tier               text not null check (tier in ('basic', 'pro')),
  starts_at          timestamptz not null default now(),
  ends_at            timestamptz,                                  -- null = for the life of the edition
  billing_record_id  uuid,                                         -- FK added below, after billing_records exists
  granted_by         uuid references users (id),
  grant_note         text check (grant_note is null or length(grant_note) <= 500),
  revoked_at         timestamptz,
  revoked_by         uuid references users (id),
  revoke_reason      text check (revoke_reason is null or revoke_reason in ('refund', 'chargeback', 'abuse', 'admin', 'expired_promo')),
  created_at         timestamptz not null default now(),
  constraint access_grants_paid_have_billing check ((kind in ('purchase', 'subscription')) = (billing_record_id is not null)),
  constraint access_grants_hand_made_have_granter check ((kind in ('complimentary', 'promo')) = (granted_by is not null)),
  constraint access_grants_revoke_fields check ((revoked_at is null) = (revoked_by is null) and (revoked_at is null) = (revoke_reason is null))
);
create index if not exists access_grants_live on access_grants (user_id) where revoked_at is null;

-- Revocation is one conditional update, so a second revoke of the same grant changes no row and writes no audit row:
--   update access_grants set revoked_at = $2, revoked_by = $3, revoke_reason = $4
--   where id = $1 and revoked_at is null
--   returning *;

create table if not exists memberships (
  user_id           uuid primary key references users (id) on delete cascade,
  status            text not null default 'none' check (status in ('none', 'active', 'lapsed', 'suspended')),
  tier              text check (tier is null or tier in ('basic', 'pro')),
  started_at        timestamptz,
  ends_at           timestamptz,
  current_grant_id  uuid references access_grants (id) on delete set null,
  complimentary     boolean not null default false,
  suspended_at      timestamptz,                                   -- the one field enforcement reads
  suspended_by      uuid references users (id),
  suspend_reason    text,
  updated_at        timestamptz not null default now(),
  constraint memberships_suspended_status check ((status = 'suspended') = (suspended_at is not null)),
  constraint memberships_suspend_fields check ((suspended_at is null) = (suspended_by is null) and (suspended_at is null) = (suspend_reason is null))
);

-- The projection is rewritten whole by recomputeMembership; the suspension triple is carried over unchanged:
--   insert into memberships (user_id, status, tier, started_at, ends_at, current_grant_id, complimentary, suspended_at, suspended_by, suspend_reason, updated_at)
--   values (...)
--   on conflict (user_id) do update set status = excluded.status, tier = excluded.tier, ... , updated_at = excluded.updated_at;

create table if not exists billing_customers (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references users (id) on delete restrict,
  provider              text not null check (provider in ('stripe', 'lemonsqueezy', 'paddle', 'manual')),
  provider_customer_id  text not null,
  email_at_provider     text,                                      -- replaced by its hash when the account is deleted
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (user_id, provider),
  unique (provider, provider_customer_id)
);

create table if not exists billing_records (
  id                     uuid primary key default gen_random_uuid(),
  kind                   text not null check (kind in ('purchase', 'subscription')),
  billing_customer_id    uuid references billing_customers (id) on delete restrict,
  user_id                uuid references users (id) on delete restrict,   -- null until the checkout is matched to a user
  provider               text not null,
  provider_object_id     text not null,
  provider_payment_id    text,
  product_key            text not null,
  tier                   text not null check (tier in ('basic', 'pro')),
  provider_price_id      text,
  amount_cents           integer,
  currency               text,
  status                 text not null check (status in (
                           'pending', 'paid', 'refunded', 'partially_refunded', 'disputed', 'chargeback_lost',
                           'incomplete', 'trialing', 'active', 'past_due', 'unpaid', 'canceled', 'paused')),
  provider_status        text,
  paid_at                timestamptz,
  refunded_at            timestamptz,
  disputed_at            timestamptz,
  trial_ends_at          timestamptz,
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  cancel_requested_at    timestamptz,
  cancel_effective_at    timestamptz,
  access_ends_at         timestamptz,                              -- set by the app: refund, chargeback, grace, cancellation
  last_event_at          timestamptz,
  ready_email_sent_at    timestamptz,
  notes                  text check (notes is null or length(notes) <= 1000),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (provider, provider_object_id)
);
create index if not exists billing_records_user_product on billing_records (user_id, product_key);

alter table access_grants drop constraint if exists access_grants_billing_record_id_fkey;
alter table access_grants add constraint access_grants_billing_record_id_fkey
  foreign key (billing_record_id) references billing_records (id) on delete set null;

create table if not exists billing_events (
  id                 uuid primary key default gen_random_uuid(),
  provider           text not null,
  provider_event_id  text not null,
  event_type         text not null,
  object_id          text,
  event_created_at   timestamptz,
  received_at        timestamptz not null default now(),
  processed_at       timestamptz,
  status             text not null default 'received' check (status in ('received', 'processed', 'ignored_stale', 'unmatched', 'failed')),
  error              text,
  payload            jsonb,                                        -- nulled after 90 days by the reconciliation job
  unique (provider, provider_event_id)
);
create index if not exists billing_events_object on billing_events (object_id, event_created_at);

create table if not exists audit_log (
  id             uuid primary key default gen_random_uuid(),
  at             timestamptz not null default now(),
  actor_user_id  uuid references users (id) on delete set null,
  actor_kind     text not null check (actor_kind in ('user', 'admin', 'system', 'webhook')),
  action         text not null,
  subject_table  text not null,
  subject_id     uuid,
  before         jsonb,
  after          jsonb,
  reason         text,
  ip_hash        text
);
create index if not exists audit_log_subject on audit_log (subject_table, subject_id);
create index if not exists audit_log_actor on audit_log (actor_user_id, at desc);

-- Account deletion (lib/access/neon-store.ts, anonymise): one batch, so the row and its audit entry land together:
--   insert into audit_log (...) values (...);
--   update users set status = 'deleted', deleted_at = $2, email = 'deleted+' || id || '@invalid.local',
--     first_name = null, last_name = null, auth_provider_id = null, updated_at = $2 where id = $1 and status <> 'deleted';
--   delete from sessions where user_id = $1;
--   delete from auth_tokens where email = $3;
--   update billing_customers set email_at_provider = $4 where user_id = $1 and email_at_provider is not null;

-- down (reverse dependency order; drop-only, so nothing that existed before this file is lost)
--   drop table if exists audit_log;
--   drop table if exists billing_events;
--   alter table access_grants drop constraint if exists access_grants_billing_record_id_fkey;
--   drop table if exists billing_records;
--   drop table if exists billing_customers;
--   drop table if exists memberships;
--   drop table if exists access_grants;
