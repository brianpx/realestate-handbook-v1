import { CONCEPTS } from '../../content/data/concepts';
import { QUESTIONS, type Question } from '../../content/data/questions';
import { diffDays } from './dates';
import { dueQueue, interleave, pickQuestion } from './queue';
import type { Attempt, ConceptState } from './types';

const CHAPTER_OF = new Map(CONCEPTS.map(c => [c.id, c.chapter]));

export type DeckItem = { conceptId: string; questionId: string; retest?: boolean };
export type Deck = {
  items: DeckItem[];
  /** Due concepts held back by the daily cap; they keep their due dates. */
  deferred: number;
  /** Earliest future due date, for the "nothing due" message. */
  nextDue: string | null;
  /** True once the learner has answered anything, so the empty state can say why nothing is due. */
  hasHistory: boolean;
};

/** Reviewed (non-draft) questions per concept. Draft questions stay out of review until someone signs them off. */
export function reviewQuestionIds(conceptId: string, bank: readonly Question[] = QUESTIONS): string[] {
  return bank.filter(q => !q.draft && q.concept === conceptId).map(q => q.id);
}

/** Most recent question served for each concept, so the next one can differ. */
function lastQuestions(attempts: readonly Attempt[]): Map<string, string> {
  const latest = new Map<string, Attempt>();
  for (const a of attempts) {
    const seen = latest.get(a.conceptId);
    if (!seen || Date.parse(a.answeredAt) >= Date.parse(seen.answeredAt)) latest.set(a.conceptId, a);
  }
  return new Map([...latest].map(([concept, a]) => [concept, a.questionId]));
}

/**
 * Today's deck: due concepts, oldest-due first, capped, then interleaved so no chapter runs more than twice in a row.
 * Each concept gets a question other than its last one when another exists. Concepts with no reviewable question are
 * skipped (they are not counted as deferred either).
 */
export function buildDeck(
  states: Readonly<Record<string, ConceptState>>,
  attempts: readonly Attempt[],
  today: string,
  { cap, bank = QUESTIONS }: { cap?: number; bank?: readonly Question[] } = {},
): Deck {
  const reviewable = Object.fromEntries(Object.entries(states).filter(([id]) => reviewQuestionIds(id, bank).length > 0));
  const { serve, deferred } = dueQueue(reviewable, today, cap);
  const last = lastQuestions(attempts);
  const items = interleave(
    serve.map(conceptId => ({ conceptId, questionId: pickQuestion(reviewQuestionIds(conceptId, bank), last.get(conceptId) ?? null)! })),
    item => CHAPTER_OF.get(item.conceptId) ?? item.conceptId,
  );
  const future = Object.values(reviewable).flatMap(s => (s.due !== null && s.due > today ? [s.due] : []));
  return {
    items,
    deferred: deferred.length,
    nextDue: future.length ? future.reduce((a, b) => (a < b ? a : b)) : null,
    hasHistory: Object.keys(states).length > 0,
  };
}

/**
 * After a miss, puts the concept back later in the same sitting as practice, at least `gap` questions further on (or at
 * the end when fewer remain). `questionId` is the question to ask next time. Never requeues a retest.
 */
export function requeueMiss(items: readonly DeckItem[], index: number, questionId: string, gap = 3): DeckItem[] {
  const missed = items[index];
  if (!missed || missed.retest) return [...items];
  const at = Math.min(items.length, index + 1 + gap);
  const next = [...items];
  next.splice(at, 0, { conceptId: missed.conceptId, questionId, retest: true });
  return next;
}

/** "tomorrow", "in 3 days", "today" for a due date seen from `today`. */
export function dueLabel(today: string, due: string): string {
  const days = diffDays(today, due);
  if (days <= 0) return 'today';
  return days === 1 ? 'tomorrow' : `in ${days} days`;
}
