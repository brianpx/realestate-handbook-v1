-- Confirmed opt-in for the marketing list (lib/leads/neon-store.ts). Needs 001.
-- Not yet applied anywhere. Apply to a branch of the Neon resource on the `meded` team first, run the integration
-- tests against that branch (TEST_DATABASE_URL), and only then, with permission, to the default branch. Never to
-- the old resource, and never straight to production (docs/plans/MASTER-PROMPT.md, M3 and M5 step 20).
--
-- Rules the code relies on:
--   * a lead is stored when the form is sent, with the SHA-256 hex hash of the confirmation token in its link;
--     the raw token exists only in the emailed link
--   * the address counts as subscribed only once `confirmed_at` is set, by the one statement below, when the
--     reader opens the link and presses the button; the sign-in form never sets it
--   * rows from before this file (the retired first-visit dialog) stay unconfirmed: they never clicked a link

alter table leads add column if not exists confirm_token_hash text;
alter table leads add column if not exists confirmed_at timestamptz;
create unique index if not exists leads_confirm_token_key on leads (confirm_token_hash) where confirm_token_hash is not null;

-- Confirms once and tolerates a second click; no row back means the token is unknown:
--   update leads set confirmed_at = coalesce(confirmed_at, $2) where confirm_token_hash = $1 returning id;

-- down
--   drop index if exists leads_confirm_token_key;
--   alter table leads drop column if exists confirmed_at;
--   alter table leads drop column if exists confirm_token_hash;
