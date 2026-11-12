-- A display name the reader chooses on the account page (app/api/account/preferences/route.ts, lib/users/neon-store.ts).
-- Needs 002. Additive only.
-- Not yet applied anywhere. Apply to a branch of the Neon resource on the `meded` team first, run the integration
-- tests against that branch (TEST_DATABASE_URL), and only then, with permission, to the default branch; a production
-- deployment applies it through db/migrate.ts (docs/plans/MASTER-PROMPT.md, M3 and M5 step 20).
--
-- Rules the code relies on:
--   * null means "not chosen": the name shown falls back to first_name and last_name, then to the part of the
--     address before the @ (lib/users/display-name.ts)
--   * the value is stored trimmed, 1 to 32 characters; saving an empty name writes null, never an empty string
--   * only the signed-in reader writes it, for their own row, by the one statement below

alter table users add column if not exists display_name text
  check (display_name is null or length(btrim(display_name)) between 1 and 32);

-- The save, for the session's user only; no row back means the user is gone:
--   update users set display_name = $2, updated_at = $3 where id = $1 and status = 'active' returning id;

-- down
--   alter table users drop column if exists display_name;
