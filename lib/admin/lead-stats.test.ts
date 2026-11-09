import { describe, expect, it } from 'vitest';
import type { LeadRow } from '@/lib/leads/store';
import { leadStats } from './lead-stats';

const now = new Date('2026-11-08T12:00:00Z');
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 3600 * 1000);
let seq = 0;
const row = (over: Partial<LeadRow> = {}): LeadRow => {
  seq += 1;
  return { id: `l-${seq}`, email: `r${seq}@example.com`, source: 'gate', createdAt: daysAgo(1), consentVersion: 'v1', emailStatus: null, confirmedAt: null, ...over };
};

describe('leadStats', () => {
  it('is all zeros and empty lists for no leads', () => {
    expect(leadStats([], now)).toEqual({
      total: 0, last7Days: 0, last30Days: 0, emailFailed: 0, confirmed: 0,
      bySource: [], byEmailStatus: { sent: 0, failed: 0, skipped: 0, pending: 0 }, recent: [],
    });
  });

  it('counts the addresses that confirmed their link', () => {
    const rows = [row({ confirmedAt: now }), row({ confirmedAt: daysAgo(2) }), row()];
    expect(leadStats(rows, now).confirmed).toBe(2);
  });

  it('counts the windows from `now`, including a lead exactly at the edge', () => {
    const rows = [row({ createdAt: daysAgo(0) }), row({ createdAt: daysAgo(7) }), row({ createdAt: daysAgo(7.5) }), row({ createdAt: daysAgo(30) }), row({ createdAt: daysAgo(31) })];
    const stats = leadStats(rows, now);
    expect(stats.total).toBe(5);
    expect(stats.last7Days).toBe(2);
    expect(stats.last30Days).toBe(4);
  });

  it('tallies email outcomes with null as pending, and reports the failures on their own', () => {
    const rows = [row({ emailStatus: 'sent' }), row({ emailStatus: 'failed' }), row({ emailStatus: 'failed' }), row({ emailStatus: 'skipped' }), row()];
    const stats = leadStats(rows, now);
    expect(stats.byEmailStatus).toEqual({ sent: 1, failed: 2, skipped: 1, pending: 1 });
    expect(stats.emailFailed).toBe(2);
  });

  it('groups by source, largest first with ties by name, as a share of the total', () => {
    const rows = [row({ source: 'gate' }), row({ source: 'gate' }), row({ source: 'hero' }), row({ source: 'final' })];
    expect(leadStats(rows, now).bySource).toEqual([
      { source: 'gate', count: 2, share: 0.5 },
      { source: 'final', count: 1, share: 0.25 },
      { source: 'hero', count: 1, share: 0.25 },
    ]);
  });

  it('keeps the ten newest as recent, whatever order the rows came in', () => {
    const rows = Array.from({ length: 12 }, (_, i) => row({ createdAt: daysAgo(i) })).reverse();
    const recent = leadStats(rows, now).recent;
    expect(recent).toHaveLength(10);
    expect(recent[0]!.createdAt).toEqual(daysAgo(0));
    expect(recent[9]!.createdAt).toEqual(daysAgo(9));
  });
});
