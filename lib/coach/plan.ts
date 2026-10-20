import { UNITS } from '../../content/data/plan';
import { addDays, dayOfWeek, diffDays } from './dates';

export type Pace = 'sprint' | 'default' | 'relaxed';

/** The chapters in reading order: the preface's four units, flattened. One session is one chapter. */
export const CHAPTERS: readonly { chapter: string; unit: number }[] = UNITS.flatMap(u => u.chapters.map(chapter => ({ chapter, unit: u.unit })));

/** `perWeek` is the cap on sessions in any 7-day block from the start date. */
export const PACES: Record<Pace, { targetWeeks: number; perWeek: number }> = {
  sprint: { targetWeeks: 2, perWeek: Math.ceil(CHAPTERS.length / 2) },
  default: { targetWeeks: 4, perWeek: Math.ceil(CHAPTERS.length / 4) },
  relaxed: { targetWeeks: 8, perWeek: Math.ceil(CHAPTERS.length / 8) },
};

export type PlanInput = {
  /** First day the plan may use, YYYY-MM-DD in the learner's zone. */
  startDate: string;
  pace: Pace;
  /** 0 = Sunday ... 6 = Saturday. */
  studyDays: readonly number[];
};

/** `id` is the chapter id and is stable across reflows. `week` counts 7-day blocks from startDate, from 1. */
export type Session = { id: string; chapter: string; unit: number; date: string; week: number };

export type Completion = { read?: string; did?: string; checked?: string };
export type SessionStatus = 'complete' | 'partly' | 'todo';

/**
 * complete: read, exercise and check all done.
 * partly: read and check done, exercise outstanding ("do it later"). It is not rescheduled and never overdue.
 * todo: anything less.
 */
export function sessionStatus(c: Completion | undefined): SessionStatus {
  if (c?.read && c.checked && c.did) return 'complete';
  if (c?.read && c.checked) return 'partly';
  return 'todo';
}

export type PlanWarning =
  | { code: 'too-few-study-days'; studyDays: number; needed: number }
  | { code: 'extended'; finishesInWeek: number; targetWeeks: number };

export type Plan = { sessions: Session[]; endDate: string; warnings: PlanWarning[] };

const weekOf = (startDate: string, date: string) => Math.floor(diffDays(startDate, date) / 7) + 1;

function normalizeDays(days: readonly number[]): Set<number> {
  const set = new Set(days);
  if (set.size === 0 || [...set].some(d => !Number.isInteger(d) || d < 0 || d > 6)) throw new RangeError('studyDays must be 1-7 distinct weekdays, 0-6');
  return set;
}

/**
 * Places `chapters`, in order, on study days from `from` onward: at most one per day and at most the pace's cap in
 * any 7-day block from startDate. `frozen` sessions keep their dates and use up their days and block capacity.
 */
function place(input: PlanInput, chapters: readonly { chapter: string; unit: number }[], frozen: Session[], from: string): Session[] {
  const days = normalizeDays(input.studyDays);
  const cap = PACES[input.pace].perWeek;
  const used = new Set(frozen.map(s => s.date));
  const perBlock = new Map<number, number>();
  for (const s of frozen) perBlock.set(s.week, (perBlock.get(s.week) ?? 0) + 1);

  const placed: Session[] = [];
  let date = from < input.startDate ? input.startDate : from;
  for (const { chapter, unit } of chapters) {
    for (let guard = 0; ; guard++) {
      if (guard > 1000) throw new RangeError('could not place session');
      const week = weekOf(input.startDate, date);
      if (days.has(dayOfWeek(date)) && !used.has(date) && (perBlock.get(week) ?? 0) < cap) {
        placed.push({ id: chapter, chapter, unit, date, week });
        used.add(date);
        perBlock.set(week, (perBlock.get(week) ?? 0) + 1);
        break;
      }
      date = addDays(date, 1);
    }
  }
  return placed;
}

function describe(input: PlanInput, sessions: Session[]): Plan {
  const { perWeek, targetWeeks } = PACES[input.pace];
  const days = normalizeDays(input.studyDays);
  const ordered = [...sessions].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const last = ordered.at(-1);
  const warnings: PlanWarning[] = [];
  if (days.size < perWeek) warnings.push({ code: 'too-few-study-days', studyDays: days.size, needed: perWeek });
  if (last && last.week > targetWeeks) warnings.push({ code: 'extended', finishesInWeek: last.week, targetWeeks });
  return { sessions: ordered, endDate: last?.date ?? input.startDate, warnings };
}

/** Never compresses: too few study days extends the end date and says so in `warnings`. */
export function buildPlan(input: PlanInput): Plan {
  return describe(input, place(input, CHAPTERS, [], input.startDate));
}

/**
 * Re-flows what is left from `today`. Sessions that are complete or partly done are frozen with their dates and
 * are never moved; the rest are placed from `today` on, at most one per study day and within the pace's weekly cap,
 * so missed sessions never pile onto today. Review due dates are not an input and cannot change.
 */
export function reflow(input: PlanInput, previous: readonly Session[], completions: Readonly<Record<string, Completion>>, today: string): Plan {
  const frozen = previous.filter(s => sessionStatus(completions[s.id]) !== 'todo');
  const frozenIds = new Set(frozen.map(s => s.id));
  const remaining = CHAPTERS.filter(c => !frozenIds.has(c.chapter));
  return describe(input, [...frozen, ...place(input, remaining, frozen, today)]);
}

/** Chapters whose exercise is still outstanding, in reading order. */
export function outstandingExercises(completions: Readonly<Record<string, Completion>>): string[] {
  return CHAPTERS.filter(c => sessionStatus(completions[c.chapter]) === 'partly').map(c => c.chapter);
}

/** The next session to do: the first todo session in reading order. */
export function nextSession(sessions: readonly Session[], completions: Readonly<Record<string, Completion>>): Session | undefined {
  return sessions.filter(s => sessionStatus(completions[s.id]) === 'todo').sort((a, b) => (a.date < b.date ? -1 : 1))[0];
}

/** How many days the next session's date is behind today. A fact for the UI, never a grade. */
export function daysBehind(next: Session | undefined, today: string): number {
  return next ? Math.max(0, diffDays(next.date, today)) : 0;
}

/** Chapters whose read plus exercise time exceeds `limit` minutes, for the setup screen's heads-up. */
export function longSessions(minutes: Readonly<Record<string, { read: number; do: number }>>, limit = 75): string[] {
  return CHAPTERS.filter(c => {
    const m = minutes[c.chapter];
    return m !== undefined && m.read + m.do > limit;
  }).map(c => c.chapter);
}
