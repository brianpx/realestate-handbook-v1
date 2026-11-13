-- The picture a reader uploads on the account page (app/api/account/avatar/route.ts, lib/users/neon-store.ts). The
-- image itself lives in a private Vercel Blob store, not in this database; only its key and the time it last changed
-- are kept here. Needs 002. Additive only.
-- Not yet applied anywhere. Apply to a branch of the Neon resource on the `meded` team first, run the integration
-- tests against that branch (TEST_DATABASE_URL), and only then, with permission, to the default branch; a production
-- deployment applies it through db/migrate.ts (docs/plans/MASTER-PROMPT.md, M3 and M5 step 20).
--
-- Rules the code relies on:
--   * null means "no picture": the header and the account page show the initials instead
--   * the key is chosen by the server, never by the reader: avatars/<user id>/<32 hex characters>.webp, a new one for
--     every upload so a changed picture is never served from a stale cache entry (lib/users/avatar.ts)
--   * avatar_updated_at is the version in /api/account/avatar?v=<epoch ms>; the two columns are written together
--   * only the signed-in reader writes them, for their own row, by the statements below
--   * the blob goes with the picture: a replaced or removed picture has its old blob deleted, and account deletion
--     (which anonymises the user row rather than removing it) deletes the blob and clears both columns as its own
--     step (lib/account/handler.ts, lib/access/neon-store.ts)

alter table users
  add column if not exists avatar_key text
    check (avatar_key is null or avatar_key ~ '^avatars/[0-9a-f-]{36}/[0-9a-f]{32}[.]webp$'),
  add column if not exists avatar_updated_at timestamptz;

-- The save or removal, for the session's user only; it answers the key it replaced so the caller can delete that
-- blob. No row back means the user is gone or no longer active:
--   with old as (select avatar_key from users where id = $1 and status = 'active' for update)
--   update users set avatar_key = $2, avatar_updated_at = $3, updated_at = $3
--   from old where users.id = $1 returning old.avatar_key as previous_key;

-- down
--   alter table users drop column if exists avatar_key, drop column if exists avatar_updated_at;
