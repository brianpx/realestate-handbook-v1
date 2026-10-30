import type { ConceptState } from './types';

export const DAILY_CAP = 10;

/** Oldest-due first; overflow is deferred, never dropped or re-dated. */
export function dueQueue(
  states: Readonly<Record<string, ConceptState>>,
  today: string,
  cap = DAILY_CAP,
): { serve: string[]; deferred: string[] } {
  const due = Object.entries(states)
    .filter(([, s]) => s.due !== null && s.due <= today)
    .sort(([ia, a], [ib, b]) => (a.due! < b.due! ? -1 : a.due! > b.due! ? 1 : a.box - b.box || (ia < ib ? -1 : ia > ib ? 1 : 0)))
    .map(([id]) => id);
  return { serve: due.slice(0, cap), deferred: due.slice(cap) };
}

/** Reorders so no more than `maxRun` consecutive items share a chapter, when the pool allows. Stable otherwise. */
export function interleave<T>(items: readonly T[], chapterOf: (item: T) => string, maxRun = 2): T[] {
  const rest = [...items];
  const out: T[] = [];
  let run = 0;
  let last: string | null = null;
  while (rest.length) {
    let i = rest.findIndex(x => last === null || chapterOf(x) !== last || run < maxRun);
    if (i < 0) i = 0;
    const [item] = rest.splice(i, 1) as [T];
    const ch = chapterOf(item);
    run = ch === last ? run + 1 : 1;
    last = ch;
    out.push(item);
  }
  return out;
}

/** Prefers a question other than the one served last time; falls back to it when it is the only one. */
export function pickQuestion(questionIds: readonly string[], lastId: string | null): string | undefined {
  return questionIds.find(id => id !== lastId) ?? questionIds[0];
}
