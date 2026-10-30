import { addDays, diffDays } from './dates';
import { CHAPTERS, sessionStatus, type Completion, type PlanWarning, type Session, type SessionStatus } from './plan';

export type Completions = Readonly<Record<string, Completion>>;

export type NextUp = {
  session: Session;
  /** today: due today. later: due on a future day. behind: its date has passed, which is a fact, not a failure. */
  when: 'today' | 'later' | 'behind';
  daysBehind: number;
  steps: { read: boolean; did: boolean; checked: boolean };
};

/** The first session still to do, in reading order. Partly done sessions are not "next": only their exercise is open. */
export function nextUp(sessions: readonly Session[], completions: Completions, today: string): NextUp | undefined {
  const order = new Map(CHAPTERS.map((c, i) => [c.chapter, i]));
  const session = sessions
    .filter(s => sessionStatus(completions[s.id]) === 'todo')
    .sort((a, b) => (order.get(a.chapter) ?? 0) - (order.get(b.chapter) ?? 0))[0];
  if (!session) return undefined;
  const c = completions[session.id];
  const behind = diffDays(session.date, today);
  return {
    session,
    when: behind > 0 ? 'behind' : session.date === today ? 'today' : 'later',
    daysBehind: Math.max(0, behind),
    steps: { read: Boolean(c?.read), did: Boolean(c?.did), checked: Boolean(c?.checked) },
  };
}

export type ScheduleRow = { session: Session; status: SessionStatus; isNext: boolean };

/** Every session in date order with its status, for the full-schedule list. */
export function scheduleRows(sessions: readonly Session[], completions: Completions, today: string): ScheduleRow[] {
  const next = nextUp(sessions, completions, today)?.session.id;
  return [...sessions]
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map(session => ({ session, status: sessionStatus(completions[session.id]), isNext: session.id === next }));
}

/** Sessions complete, out of all of them. */
export function progressCounts(sessions: readonly Session[], completions: Completions): { complete: number; total: number } {
  return { complete: sessions.filter(s => sessionStatus(completions[s.id]) === 'complete').length, total: sessions.length };
}

/** "Tue, Oct 20" for a YYYY-MM-DD date, in the date's own calendar (no time-zone shift). */
export function formatDay(date: string): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
}

export function warningText(w: PlanWarning): string {
  if (w.code === 'too-few-study-days') {
    return `This pace needs ${w.needed} study days a week and you chose ${w.studyDays}, so it will take longer.`;
  }
  return `At this pace the plan finishes in week ${w.finishesInWeek}, not week ${w.targetWeeks}.`;
}

/** The seven days starting today, for "this week" copy. */
export const weekEnd = (today: string): string => addDays(today, 6);
