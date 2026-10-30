import { addDays } from './dates';
import type { Confidence, ConceptState } from './types';

/** Days until the next review, indexed by box. Box 5 is a label, not an exit: it keeps recurring. */
export const INTERVALS = [0, 1, 3, 7, 14, 30] as const;
export const MAX_BOX = INTERVALS.length - 1;

export type GradeInput = {
  correct: boolean;
  confidence: Confidence;
  /** First attempt on this concept this local day, made when it is due or unseen. Anything else is practice. */
  scheduled: boolean;
};

/** `today` is the learner's local calendar date. */
export function grade(c: ConceptState, a: GradeInput, today: string): ConceptState {
  const next = { ...c, seen: c.seen + 1, lastAttemptDay: today };
  if (!a.correct) {
    return { ...next, box: a.confidence === 'sure' ? 1 : Math.max(1, c.box - 2), due: addDays(today, 1), flagged: true };
  }
  if (!a.scheduled) return next;
  if (a.confidence === 'guess') return { ...next, due: addDays(today, 1) };
  const nextBox = Math.min(MAX_BOX, c.box + 1);
  return { ...next, box: nextBox, due: addDays(today, INTERVALS[nextBox]!), flagged: false };
}
