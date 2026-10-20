-- Lead capture tables for the Neon store. NOT YET APPLIED: no database exists for this project and the store
-- that would use it (lib/leads/store.ts) is not written. Apply to a branch first, never straight to production.
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

-- Housekeeping, run daily (a Vercel cron or a Neon function): the counters only matter for ten minutes.
--   delete from lead_attempts where at < now() - interval '1 day';
