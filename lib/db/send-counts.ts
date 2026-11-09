import type { Sql } from './sql';

// The send-ceiling counter of the Neon stores (lib/send-ceiling.ts), one row per route and window in the table from
// db/migrations/005_send_ceiling.sql. Shared by the lead and auth stores so the statement exists once.
export type SendChannel = 'lead' | 'auth';

/** Counts one send for the window and answers the new total; the insert and the increment are one statement. */
export async function countSend(sql: Sql, channel: SendChannel, windowStart: Date): Promise<number> {
  const rows = await sql`
    insert into send_counts (channel, window_start, n) values (${channel}, ${windowStart.toISOString()}, 1)
    on conflict (channel, window_start) do update set n = send_counts.n + 1
    returning n`;
  try {
    // Its own statement: a cleanup failure must not fail the count above.
    await sql`delete from send_counts where window_start < now() - interval '1 day'`;
  } catch (err) {
    console.error(`${channel}: send count cleanup failed`, err instanceof Error ? err.name : 'error');
  }
  return Number(rows[0]?.n ?? 0);
}
