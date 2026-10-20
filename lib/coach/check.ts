import { CONCEPTS } from '../../content/data/concepts';
import { QUESTIONS, type Question } from '../../content/data/questions';
import type { AttemptInput } from './actions';
import type { Confidence } from './types';

const CHAPTER_OF = new Map(CONCEPTS.map(c => [c.id, c.chapter]));
const VERSION_OF = new Map(CONCEPTS.map(c => [c.id, c.version]));

/**
 * The questions a chapter's end-of-chapter check asks: its reviewed (non-draft) questions, multiple-choice first and
 * then the fill-in-the-blank. Draft questions stay out until someone who has worked as an agent has signed them off.
 */
export function chapterCheck(chapter: string): Question[] {
  const own = QUESTIONS.filter(q => !q.draft && CHAPTER_OF.get(q.concept) === chapter);
  return [...own.filter(q => q.kind === 'mcq'), ...own.filter(q => q.kind === 'blank')];
}

/** True when the chapter has tagged questions, so its check should record attempts. */
export const hasCoachCheck = (chapter: string): boolean => chapterCheck(chapter).length > 0;

/** `response` is the chosen option index for a multiple-choice question and the typed text for a blank. */
export function isCorrect(q: Question, response: number | string): boolean {
  if (q.kind === 'mcq') return response === q.answer;
  return typeof response === 'string' && q.accept.includes(response.trim().toLowerCase());
}

export function attemptInput(q: Question, correct: boolean, confidence: Confidence, kind: AttemptInput['kind']): AttemptInput {
  return {
    questionId: q.id,
    questionVersion: q.version,
    conceptId: q.concept,
    conceptVersion: VERSION_OF.get(q.concept) ?? 0,
    correct,
    confidence,
    kind,
  };
}
