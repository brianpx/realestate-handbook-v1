import { CONCEPTS } from '../../content/data/concepts';
import type { Store } from '../state/store';
import { buildPlan, reflow, type Plan, type PlanInput } from './plan';
import { replay } from './replay';
import type { CoachState } from './schema';
import type { Attempt, ConceptState } from './types';

export type AttemptInput = Pick<Attempt, 'questionId' | 'questionVersion' | 'conceptId' | 'conceptVersion' | 'correct' | 'confidence' | 'kind'>;
export type Step = 'read' | 'did' | 'checked';

type CoachStore = Store<CoachState>;
type Deps = { now?: () => Date; newId?: () => string };

/** The learner's IANA zone, for deciding which calendar day an answer belongs to. */
export const browserTimeZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * Appends one immutable attempt and returns it. If storage is blocked the attempt is still kept for this visit.
 * Each device gets a stable id on first use.
 */
export function recordAttempt(store: CoachStore, input: AttemptInput, { now = () => new Date(), newId = () => crypto.randomUUID() }: Deps = {}): Attempt {
  let attempt!: Attempt;
  store.update(s => {
    s.deviceId ||= newId();
    attempt = { ...input, id: newId(), answeredAt: now().toISOString(), deviceId: s.deviceId };
    s.attempts.push(attempt);
  });
  return attempt;
}

/** Merges attempts from elsewhere (another device, an import). Set union by id; existing attempts win. Returns how many were new. */
export function mergeAttempts(store: CoachStore, incoming: readonly Attempt[]): number {
  const known = new Set(store.get().attempts.map(a => a.id));
  const fresh = incoming.filter((a, i) => !known.has(a.id) && incoming.findIndex(b => b.id === a.id) === i);
  if (fresh.length === 0) return 0;
  store.update(s => { s.attempts.push(...fresh); });
  return fresh.length;
}

/** Marks one step of a session done. Monotonic: a step already recorded keeps its earliest timestamp and is never cleared. */
export function markStep(store: CoachStore, sessionId: string, step: Step, at: Date = new Date()): void {
  if (store.get().completions[sessionId]?.[step]) return;
  store.update(s => {
    (s.completions[sessionId] ??= {})[step] = at.toISOString();
  });
}

export function savePlan(store: CoachStore, plan: NonNullable<CoachState['plan']>): void {
  store.update(s => { s.plan = plan; });
}

/**
 * Lays out the plan and saves it with its schedule. The first call builds from the start date; later calls (a changed
 * pace or study days, or "Reschedule") reflow from `today`, so finished sessions keep their dates.
 * `today` is the learner's local calendar date.
 */
export function applyPlan(store: CoachStore, input: PlanInput & { tz: string }, today: string, now: Date = new Date()): Plan {
  const { plan: existing, completions } = store.get();
  const { tz, ...layout } = input;
  const laidOut = existing && existing.sessions.length > 0 ? reflow(layout, existing.sessions, completions, today) : buildPlan(layout);
  store.update(s => {
    s.plan = { startDate: input.startDate, pace: input.pace, studyDays: [...input.studyDays], time: s.plan?.time ?? '08:00', tz, updatedAt: now.toISOString(), sessions: laidOut.sessions };
  });
  return laidOut;
}

/** Re-flows what is left from `today` using the saved pace and study days. */
export function reschedule(store: CoachStore, today: string, now: Date = new Date()): Plan | undefined {
  const plan = store.get().plan;
  if (!plan) return undefined;
  return applyPlan(store, { startDate: plan.startDate, pace: plan.pace, studyDays: plan.studyDays, tz: plan.tz }, today, now);
}

const CURRENT_VERSIONS: Record<string, number> = Object.fromEntries(CONCEPTS.map(c => [c.id, c.version]));

/** Concept states replayed from the stored attempts, in the plan's zone (or the browser's). */
export function deriveConceptStates(state: CoachState, tz: string = state.plan?.tz ?? browserTimeZone()): Record<string, ConceptState> {
  return replay(state.attempts, CURRENT_VERSIONS, tz);
}
