-- Users and sign-in tables for the auth stores (lib/users/neon-store.ts, lib/auth/neon-store.ts).
-- Not yet applied anywhere. Apply to a branch of the Neon resource on the `meded` team first, run the integration
-- tests against that branch (TEST_DATABASE_URL), and only then, with permission, to the default branch. Never to
-- the old resource, and never straight to production (docs/plans/MASTER-PROMPT.md, M3 and M5 step 10).
--
-- Rules the code relies on:
--   * one row per address, stored trimmed and lower-cased (the stores normalise before they write)
--   * raw sign-in tokens and session ids never reach the database: only their SHA-256 hex hashes
--   * a token is consumed by one atomic update (below), so two clicks cannot both sign in
--   * a session is renewed by one conditional update (below), at most once a day, never once revoked or expired
--   * `auth_attempts` is the rate-limit counter for both routes; rows older than a day are deleted on the request path

create table if not exists users (
  id                      uuid primary key default gen_random_uuid(),
  auth_provider_id        text,                                   -- a provider's user id if Neon Auth is adopted later
  email                   text not null,
  email_verified_at       timestamptz,
  first_name              text,
  last_name               text,
  role                    text not null default 'reader' check (role in ('reader', 'admin')),
  status                  text not null default 'active' check (status in ('active', 'disabled', 'deleted')),
  disabled_at             timestamptz,
  disabled_by             uuid references users (id),
  disable_reason          text,
  deleted_at              timestamptz,
  accepted_terms_version  text,
  accepted_terms_at       timestamptz,
  last_sign_in_at         timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint users_email_normalised check (email = lower(btrim(email))),
  constraint users_disabled_fields check ((disabled_at is null) = (disabled_by is null) and (disabled_at is null) = (disable_reason is null)),
  constraint users_deleted_at check ((status = 'deleted') = (deleted_at is not null))
);
create unique index if not exists users_email_key on users (email);
create unique index if not exists users_auth_provider_id_key on users (auth_provider_id) where auth_provider_id is not null;

-- First sign-in creates the row; a later sign-in only fills what is still empty:
--   insert into users (email, email_verified_at, accepted_terms_version, accepted_terms_at)
--   values ($1, $2, $3, $2)
--   on conflict (email) do update set
--     email_verified_at = coalesce(users.email_verified_at, excluded.email_verified_at),
--     accepted_terms_version = coalesce(users.accepted_terms_version, excluded.accepted_terms_version),
--     accepted_terms_at = coalesce(users.accepted_terms_at, excluded.accepted_terms_at),
--     updated_at = now()
--   returning *, (xmax = 0) as created;

create table if not exists auth_tokens (
  token_hash       text primary key,                              -- SHA-256 hex of 32 random bytes
  email            text not null check (email = lower(btrim(email))),
  purpose          text not null default 'sign_in' check (purpose in ('sign_in')),
  next_path        text,                                          -- validated by the app: starts with '/', not '//', no scheme
  source           text check (source in ('hero', 'calculator', 'final', 'signup-page', 'signin', 'account')),
  expires_at       timestamptz not null,
  consumed_at      timestamptz,
  created_ip_hash  text,
  created_at       timestamptz not null default now()
);
create index if not exists auth_tokens_expires_at on auth_tokens (expires_at);

-- The one statement that consumes a link; no row back means expired, used or unknown, all reported alike:
--   update auth_tokens set consumed_at = $2
--   where token_hash = $1 and consumed_at is null and expires_at > $2
--   returning email, next_path, source;

create table if not exists sessions (
  id_hash       text primary key,                                 -- SHA-256 hex of the cookie value
  user_id       uuid not null references users (id) on delete cascade,
  created_at    timestamptz not null default now(),               -- absolute cap: refused after one year
  expires_at    timestamptz not null,                             -- 90 days, sliding
  last_seen_at  timestamptz not null default now(),               -- written only by the renewal statement below
  revoked_at    timestamptz
);
create index if not exists sessions_user_id on sessions (user_id);
create index if not exists sessions_expires_at on sessions (expires_at);

-- Sliding renewal, at most once a day, never for a revoked, expired or over-cap session. Zero rows updated is the
-- normal case. The intervals are bound from lib/auth/config.ts (90 days, one year, 24 hours):
--   update sessions set expires_at = $2 + interval '90 days', last_seen_at = $2
--   where id_hash = $1 and revoked_at is null and expires_at > $2
--     and created_at > $2 - interval '1 year' and last_seen_at < $2 - interval '24 hours';

create table if not exists auth_attempts (
  scope     text not null check (scope in ('ip', 'email')),
  key_hash  text not null,
  at        timestamptz not null default now()
);
create index if not exists auth_attempts_lookup on auth_attempts (scope, key_hash, at desc);

-- Rows older than a day are deleted on the request path, as a separate statement, after the attempt is counted:
--   delete from auth_attempts where at < now() - interval '1 day';

-- down (reverse dependency order; drop-only, so nothing that existed before this file is lost)
--   drop table if exists auth_attempts;
--   drop table if exists sessions;
--   drop table if exists auth_tokens;
--   drop table if exists users;
