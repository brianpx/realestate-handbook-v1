-- One-click unsubscribe for the marketing list (lib/leads/unsubscribe.ts, lib/leads/neon-store.ts). Needs 001 and 004.
-- Not yet applied anywhere. Apply to a branch of the Neon resource on the `meded` team first, run the integration
-- tests against that branch (TEST_DATABASE_URL), and only then, with permission, to the default branch; a production
-- deployment applies it through db/migrate.ts (docs/plans/MASTER-PROMPT.md, M3 and M5 step 20).
--
-- Rules the code relies on:
--   * the unsubscribe link carries the lead's id and an HMAC of it, so nothing about the link is stored; the one
--     statement below only sets the time
--   * a lead may be mailed only while confirmed_at is set and unsubscribed_at is null; the row stays, so the
--     address is not mailed again by a later sign-up and the consent record survives
--   * a second click keeps the first time
--   * confirming after unsubscribing does not undo it: confirm() leaves unsubscribed_at alone

alter table leads add column if not exists unsubscribed_at timestamptz;

-- Unsubscribes once and tolerates a second click; no row back means the id is unknown:
--   update leads set unsubscribed_at = coalesce(unsubscribed_at, $2) where id = $1 returning id;

-- down
--   alter table leads drop column if exists unsubscribed_at;
