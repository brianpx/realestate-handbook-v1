import { localDate } from './dates';
import { grade } from './grade';
import { newConceptState, type Attempt, type ConceptState } from './types';

/** Server time bounds client time: a device clock running ahead cannot place an attempt in the future. */
export function effectiveTime(a: Attempt): number {
  const answered = Date.parse(a.answeredAt);
  const received = a.receivedAt ? Date.parse(a.receivedAt) : Infinity;
  return Math.min(answered, received);
}

/**
 * Derives concept state from the attempt log. Pure and order-independent: the same set of attempts gives the
 * same state on every device. Duplicate ids count once; attempts on an old concept version are ignored.
 * `conceptVersions` maps each known concept id to its current version; unknown concepts are ignored.
 */
export function replay(
  attempts: readonly Attempt[],
  conceptVersions: Readonly<Record<string, number>>,
  tz: string,
): Record<string, ConceptState> {
  const unique = new Map<string, Attempt>();
  for (const a of attempts) if (!unique.has(a.id)) unique.set(a.id, a);

  const ordered = [...unique.values()]
    .filter(a => conceptVersions[a.conceptId] === a.conceptVersion)
    .sort((a, b) => effectiveTime(a) - effectiveTime(b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const states: Record<string, ConceptState> = {};
  for (const a of ordered) {
    const prev = states[a.conceptId] ?? newConceptState();
    const day = localDate(new Date(effectiveTime(a)), tz);
    const scheduled = prev.lastAttemptDay !== day && (prev.due === null || day >= prev.due);
    states[a.conceptId] = grade(prev, { correct: a.correct, confidence: a.confidence, scheduled }, day);
  }
  return states;
}
