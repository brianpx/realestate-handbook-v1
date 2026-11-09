-- The global send ceiling (lib/send-ceiling.ts, lib/db/send-counts.ts; M8 step 2, CR-L2): one counter per route and
-- ten-minute window, shared by every server instance, so a burst of sign-up or sign-in requests spread over many
-- addresses cannot run up the email bill. Needs nothing before it.
-- Not yet applied anywhere. Apply to a branch of the Neon resource on the `meded` team first, run the integration
-- tests against that branch (TEST_DATABASE_URL), and only then, with permission, to the default branch; a production
-- deployment applies it through db/migrate.ts (docs/plans/MASTER-PROMPT.md, M3 and M5 step 20).
--
-- Rules the code relies on:
--   * the window start is the clock aligned to ten minutes (lib/send-ceiling.ts), so every instance names the same row
--   * one statement adds a send and answers the new total; the handler refuses once that passes the ceiling, so the
--     row counts every request that was about to send, not only the emails that went out
--   * rows older than a day are deleted on the request path, as a separate statement

create table if not exists send_counts (
  channel      text not null check (channel in ('lead', 'auth')),  -- the route: /api/lead or /api/auth/request-link
  window_start timestamptz not null,
  n            integer not null default 0,
  primary key (channel, window_start)
);

-- Counts one send and answers the window's total in one statement:
--   insert into send_counts (channel, window_start, n) values ($1, $2, 1)
--   on conflict (channel, window_start) do update set n = send_counts.n + 1 returning n;
--   delete from send_counts where window_start < now() - interval '1 day';

-- down
--   drop table if exists send_counts;
