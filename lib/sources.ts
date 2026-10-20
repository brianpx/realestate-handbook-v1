import { LEAD_SOURCES } from '@/content/data/lead-sources';
import { fmtMoney } from './format';

// Cost per closed deal across lead sources. Ported from setupLeadSources in legacy/js/widgets-practice.js.
export type SourceRow = { spend?: number; hours?: number; closings?: number };
export type SourceResult = { key: string; name: string; entered: boolean; total: number; per?: number; text: string };

export function sourceResults(rows: Record<string, SourceRow>, hourly: number): SourceResult[] {
  return LEAD_SOURCES.map(s => {
    const r = rows[s.key] ?? {};
    const entered = r.spend !== undefined || r.hours !== undefined || r.closings !== undefined;
    if (!entered) return { key: s.key, name: s.name, entered, total: 0, text: '' };
    const total = (r.spend ?? 0) + (r.hours ?? 0) * hourly;
    if ((r.closings ?? 0) > 0) {
      const per = total / r.closings!;
      return { key: s.key, name: s.name, entered, total, per, text: `${fmtMoney(total)} invested → ${fmtMoney(per)} per closed deal` };
    }
    return { key: s.key, name: s.name, entered, total, text: `${fmtMoney(total)} invested, no closings yet` };
  });
}

export function sourceSummary(results: SourceResult[], hourly: number): string {
  const priced = results.filter((r): r is SourceResult & { per: number } => r.per !== undefined);
  if (priced.length < 2) return priced.length === 1 ? 'Enter a second source to compare.' : '';
  const sorted = [...priced].sort((a, b) => a.per - b.per);
  const low = sorted[0]!;
  const high = sorted[sorted.length - 1]!;
  return `Lowest cost per closed deal: ${low.name} (${fmtMoney(low.per)}). Highest: ${high.name} (${fmtMoney(high.per)}). ` + (hourly ? '' : 'Add a rate for your time to see the true comparison.');
}
