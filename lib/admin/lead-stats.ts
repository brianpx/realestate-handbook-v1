import type { EmailStatus, LeadRow } from '@/lib/leads/store';

export type SourceShare = { source: string; count: number; share: number };
export type LeadStats = {
  total: number;
  last7Days: number;
  last30Days: number;
  emailFailed: number;
  /** Largest first; `share` is a fraction of the total (0 when there are no leads). */
  bySource: SourceShare[];
  /** A lead whose follow-up has not been tried yet (null in the store) counts as pending. */
  byEmailStatus: Record<EmailStatus | 'pending', number>;
  recent: LeadRow[];
};

export const RECENT_COUNT = 10;
const DAY_MS = 24 * 3600 * 1000;

/** The overview's numbers from a listing. Pure: `now` is passed in so the windows are testable. */
export function leadStats(rows: LeadRow[], now: Date): LeadStats {
  const since = (days: number) => now.getTime() - days * DAY_MS;
  const bySource = new Map<string, number>();
  const byEmailStatus: LeadStats['byEmailStatus'] = { sent: 0, failed: 0, skipped: 0, pending: 0 };
  for (const row of rows) {
    bySource.set(row.source, (bySource.get(row.source) ?? 0) + 1);
    byEmailStatus[row.emailStatus ?? 'pending'] += 1;
  }
  const total = rows.length;
  return {
    total,
    last7Days: rows.filter(r => r.createdAt.getTime() >= since(7)).length,
    last30Days: rows.filter(r => r.createdAt.getTime() >= since(30)).length,
    emailFailed: byEmailStatus.failed,
    bySource: [...bySource]
      .map(([source, count]) => ({ source, count, share: total ? count / total : 0 }))
      .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source)),
    byEmailStatus,
    // the stores list newest first, but a caller that built the rows itself may not have
    recent: [...rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, RECENT_COUNT),
  };
}
