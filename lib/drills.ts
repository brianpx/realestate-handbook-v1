// Pure logic for the practice tools, ported from legacy/js/widgets-practice.js.
import { CYCLE_NODES, CYCLE_TOOLS } from '@/content/data/pitfall';
import { QUALIFY_FIELDS, type QualifyScenario } from '@/content/data/qualify';

/** Compares what the reader ticked and chose with the scenario. `missed` lists fields marked the wrong way round. */
export function gradeQualify(s: QualifyScenario, picked: readonly string[], stage: string): { right: boolean; missed: string[] } {
  const missed = QUALIFY_FIELDS.filter(f => s.answered.includes(f) !== picked.includes(f));
  return { right: missed.length === 0 && stage === s.stage, missed };
}

export type ErrorRow = { name: string; cost: string; fix: string };

/** Errors the reader has rated, highest score first (ties keep table order). */
export function rankErrors(errors: readonly ErrorRow[], scores: Record<string, unknown>): (ErrorRow & { score: number })[] {
  return errors
    .map((e, i) => ({ ...e, score: typeof scores[i] === 'number' ? (scores[i] as number) : 0 }))
    .filter(e => e.score)
    .sort((a, b) => b.score - a.score);
}

/** The chapter a Fix cell points at, written like "(Ch. 4)". */
export const fixChapter = (fix: string): string | undefined => /\(Ch\. (\d+)\)/.exec(fix)?.[1];

/** For each loop link, the names of the switched-on tools that interrupt it. */
export function interruptions(active: ReadonlySet<number>): string[][] {
  const out: string[][] = CYCLE_NODES.map(() => []);
  active.forEach(i => CYCLE_TOOLS[i]!.breaks.forEach(n => out[n]!.push(CYCLE_TOOLS[i]!.name)));
  return out;
}

export function cycleStatus(active: ReadonlySet<number>): string {
  if (!active.size) return 'With nothing installed, the loop runs on its own: each link causes the next.';
  const count = interruptions(active).filter(x => x.length).length;
  const reasons = [...active].map(i => `${CYCLE_TOOLS[i]!.name}: ${CYCLE_TOOLS[i]!.why}`).join(' ');
  return `Interrupted at ${count} of ${CYCLE_NODES.length} links. ${reasons} Installing all four makes the loop hard to restart.`;
}

/** Asking (step 2) and listening (step 3) should be at least half the meeting. */
export function allocSummary(minutes: readonly number[]): { total: number; core: number; share: number; ok: boolean; text: string } {
  const total = minutes.reduce((a, b) => a + b, 0);
  const core = (minutes[1] ?? 0) + (minutes[2] ?? 0);
  const share = total ? Math.round((core / total) * 100) : 0;
  const ok = share >= 50;
  const text = total === 0
    ? 'Give the steps some time.'
    : `Asking and listening: ${core} of ${total} minutes (${share}%). ` +
      (ok ? '✓ That meets the "at least half" rule.' : '✗ Below half. Move time from presenting into asking and listening.');
  return { total, core, share, ok, text };
}
