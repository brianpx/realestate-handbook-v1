-- Lead capture tables for the Neon store (lib/leads/neon-store.ts).
-- Applied 2026-10-19 to the default branch of Neon project morning-credit-15469990 ("realestate-handbook"), which
-- was empty at the time. For any later change, apply to a branch first, never straight to production.
--
-- Rules the code relies on:
--   * one row per address, compared case-insensitively (the route lower-cases before it inserts)
--   * the consent text is stored with the lead, as shown when they agreed
--   * attempts hold a salted hash of the visitor's address, never the address itself

create table if not exists leads (
  id              uuid primary key default gen_random_uuid(),
  email           text not null,
  created_at      timestamptz not null default now(),
  source          text not null,
  consent_version text not null,
  consent_text    text not null,
  email_status    text check (email_status in ('sent', 'failed', 'skipped')),  -- null until the follow-up email has been tried
  constraint leads_email_lower check (email = lower(email))
);
create unique index if not exists leads_email_key on leads (email);

-- Insert that tells a new address from a repeat in one statement:
--   insert into leads (email, source, consent_version, consent_text) values ($1, $2, $3, $4)
--   on conflict (email) do nothing returning id;      -- no row back means it was already there

create table if not exists lead_attempts (
  ip_hash text not null,
  at      timestamptz not null default now()
);
create index if not exists lead_attempts_lookup on lead_attempts (ip_hash, at desc);

-- Rows older than a day are deleted on the request path, after the attempt is inserted and counted.
-- That delete is its own statement: a cleanup failure must not fail the insert. The counters only matter
-- for ten minutes.
--   delete from lead_attempts where at < now() - interval '1 day';
