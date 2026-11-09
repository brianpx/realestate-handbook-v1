import { LEAD_SOURCES } from '@/content/data/lead-sources';
import { fmtMoney } from './format';

// Cost per appointment and cost per closed deal across lead sources. Ported from setupLeadSources in
// legacy/js/widgets-practice.js; appointments were added so a source can be compared before it has closed anything.
export type SourceRow = { spend?: number; hours?: number; appointments?: number; closings?: number };
export type SourceResult = { key: string; name: string; entered: boolean; total: number; perAppointment?: number; per?: number; text: string };

export function sourceResults(rows: Record<string, SourceRow>, hourly: number): SourceResult[] {
  return LEAD_SOURCES.map(s => {
    const r = rows[s.key] ?? {};
    const entered = r.spend !== undefined || r.hours !== undefined || r.appointments !== undefined || r.closings !== undefined;
    if (!entered) return { key: s.key, name: s.name, entered, total: 0, text: '' };
    const total = (r.spend ?? 0) + (r.hours ?? 0) * hourly;
    const perAppointment = (r.appointments ?? 0) > 0 ? total / r.appointments! : undefined;
    const per = (r.closings ?? 0) > 0 ? total / r.closings! : undefined;
    const parts = [
      perAppointment === undefined ? undefined : `${fmtMoney(perAppointment)} per appointment`,
      per === undefined ? 'no closings yet' : `${fmtMoney(per)} per closed deal`,
    ].filter((p): p is string => p !== undefined);
    const text = per === undefined && perAppointment === undefined ? `${fmtMoney(total)} invested, no closings yet` : `${fmtMoney(total)} invested → ${parts.join(', ')}`;
    return { key: s.key, name: s.name, entered, total, perAppointment, per, text };
  });
}

// Compares on cost per closed deal when two sources have closed; otherwise on cost per appointment, the early measure.
export function sourceSummary(results: SourceResult[], hourly: number): string {
  const closed = results.filter((r): r is SourceResult & { per: number } => r.per !== undefined);
  const booked = results.filter((r): r is SourceResult & { perAppointment: number } => r.perAppointment !== undefined);
  const nudge = hourly ? '' : 'Add a rate for your time to see the true comparison.';
  if (closed.length >= 2) {
    const sorted = [...closed].sort((a, b) => a.per - b.per);
    const low = sorted[0]!;
    const high = sorted[sorted.length - 1]!;
    return `Lowest cost per closed deal: ${low.name} (${fmtMoney(low.per)}). Highest: ${high.name} (${fmtMoney(high.per)}). ` + nudge;
  }
  if (booked.length >= 2) {
    const sorted = [...booked].sort((a, b) => a.perAppointment - b.perAppointment);
    const low = sorted[0]!;
    const high = sorted[sorted.length - 1]!;
    return `Lowest cost per appointment: ${low.name} (${fmtMoney(low.perAppointment)}). Highest: ${high.name} (${fmtMoney(high.perAppointment)}). Cost per closed deal will confirm this once each source has a closing. ` + nudge;
  }
  return closed.length + booked.length >= 1 ? 'Enter a second source to compare.' : '';
}
