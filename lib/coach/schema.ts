import { z } from 'zod';
import type { Attempt } from './types';

// Coach progress lives under its own key so the static site's `handbookState` payload stays untouched.
// Attempts are the source of truth; concept state is derived from them (see `deriveConceptStates`).
export const COACH_KEY = 'handbookCoach';
export const COACH_SCHEMA_VERSION = 1;

const timestamp = z.string().refine(s => !Number.isNaN(Date.parse(s)), 'expected an ISO timestamp');

export const attemptSchema = z.object({
  id: z.string().min(1),
  questionId: z.string().min(1),
  questionVersion: z.number().int().nonnegative(),
  conceptId: z.string().min(1),
  conceptVersion: z.number().int().nonnegative(),
  correct: z.boolean(),
  confidence: z.enum(['guess', 'think', 'sure']),
  kind: z.enum(['chapter_check', 'review', 'retest', 'diagnostic']),
  answeredAt: timestamp,
  receivedAt: timestamp.optional(),
  deviceId: z.string().min(1),
});

export const completionSchema = z.object({ read: timestamp.optional(), did: timestamp.optional(), checked: timestamp.optional() });

export const sessionSchema = z.object({
  id: z.string().min(1),
  chapter: z.string().min(1),
  unit: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  week: z.number().int().positive(),
});

export const planPrefsSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pace: z.enum(['sprint', 'default', 'relaxed']),
  studyDays: z.array(z.number().int().min(0).max(6)).min(1),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  tz: z.string().min(1),
  /** Client clock; the server assigns its own on sync and decides conflicts per field. */
  updatedAt: timestamp,
  /**
   * The last laid-out schedule. Stored, not re-derived, because a reflow depends on what was done when: sessions
   * that are complete or partly done keep the dates they had.
   */
  sessions: z.array(sessionSchema).catch([]).default([]),
});

/** One bad attempt must not wipe the rest of a learner's history, so each is validated on its own. */
const attempts = z
  .array(z.unknown())
  .catch([])
  .transform(items => items.flatMap(item => {
    const parsed = attemptSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  }));

export const coachSchema = z.looseObject({
  version: z.number().int().nonnegative().catch(COACH_SCHEMA_VERSION).default(COACH_SCHEMA_VERSION),
  /** Stable per browser; stamped on every attempt so sync can tell devices apart. */
  deviceId: z.string().catch('').default(''),
  attempts,
  completions: z.record(z.string(), completionSchema).catch({}),
  plan: planPrefsSchema.optional().catch(undefined),
});
export type CoachState = z.infer<typeof coachSchema>;

// Compile-time check that stored attempts are usable by the scheduler.
const _attemptFits = (a: z.infer<typeof attemptSchema>): Attempt => a;
void _attemptFits;
