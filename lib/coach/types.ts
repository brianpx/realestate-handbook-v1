export type Confidence = 'guess' | 'think' | 'sure';

export type Attempt = {
  id: string;
  questionId: string;
  questionVersion: number;
  conceptId: string;
  conceptVersion: number;
  correct: boolean;
  confidence: Confidence;
  kind: 'chapter_check' | 'review' | 'retest' | 'diagnostic';
  /** Client clock, ISO. */
  answeredAt: string;
  /** Server clock, ISO. Absent for attempts that have not synced yet. */
  receivedAt?: string;
  deviceId: string;
};

/** `due` is a calendar date (YYYY-MM-DD) in the learner's time zone, null until the first answer. */
export type ConceptState = {
  box: number;
  due: string | null;
  flagged: boolean;
  seen: number;
  /** Local date of the most recent attempt; drives the once-per-day credit rule. */
  lastAttemptDay: string | null;
};

export const newConceptState = (): ConceptState => ({ box: 0, due: null, flagged: false, seen: 0, lastAttemptDay: null });
