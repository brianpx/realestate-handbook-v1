// Logic for the roadmap, the weekly time-block planner and the post-close scheduler. Ported from
// legacy/js/widgets-plan.js; the components only draw what these return.
import { addDays, addMonths, daysBetween, firstOnOrAfter, firstWorkingDay, shortDate, withTime } from './dates';
import type { IcsEvent } from './ics';

/* ---------- 90-day roadmap (Chapter 12) ---------- */

export const ROADMAP_PHASES = [
  { startDay: 1, endDay: 30, name: 'Install the system' },
  { startDay: 31, endDay: 60, name: 'Build the rhythm' },
  { startDay: 61, endDay: 90, name: 'Grow the pipeline' },
] as const;

export function roadmapStatus(start: Date | null, today: Date): string {
  if (!start) return 'Pick a start date to see your three milestone dates.';
  const day = daysBetween(start, today) + 1;
  if (day < 1) return `Day 1 is in ${1 - day} days.`;
  return day <= 90 ? `Today is day ${day} of 90.` : 'The 90 days are complete. Plan the next 90 from your own ratios.';
}

export function phaseSummary(phase: (typeof ROADMAP_PHASES)[number], start: Date, today: Date, done: number, total: number, locale?: string): string {
  const from = addDays(start, phase.startDay - 1);
  const to = addDays(start, phase.endDay - 1);
  const open = total - done;
  let note: string;
  if (!open) note = 'complete';
  else if (daysBetween(to, today) > 0) note = `${open} open, past the target date`;
  else if (daysBetween(from, today) >= 0) note = `${open} open, ${daysBetween(today, to)} days left`;
  else note = 'not started';
  return ` ${shortDate(from, locale)} – ${shortDate(to, locale)} · ${done} of ${total} done · ${note}`;
}

/** `items[i]` are the milestone lines of phase i. */
export function roadmapEvents(start: Date, items: readonly (readonly string[])[]): IcsEvent[] {
  const events: IcsEvent[] = ROADMAP_PHASES.map((phase, i) => ({
    summary: `Handbook milestone, day ${phase.endDay}: ${phase.name}`,
    description: (items[i] ?? []).map(s => `- ${s}`).join('\n'),
    start: addDays(start, phase.endDay - 1),
    allDay: true,
  }));
  const friday = firstOnOrAfter(start, 5);
  events.push({
    summary: 'Friday scorecard and pipeline review',
    description: 'Fill in the Appendix A scorecard and run the weekly pipeline review.',
    start: withTime(friday, 16 * 60),
    end: withTime(friday, 16 * 60 + 30),
    rrule: 'FREQ=WEEKLY;BYDAY=FR;COUNT=13',
  });
  for (let m = 1; m <= 3; m++) {
    const day = firstWorkingDay(start.getFullYear(), start.getMonth() + m);
    events.push({
      summary: 'Monthly review (one hour)',
      description: 'Which source produced the most appointments per hour? Which follow-up plan got the most replies? Where did leads stall? What one change will I make this month?',
      start: withTime(day, 9 * 60),
      end: withTime(day, 10 * 60),
    });
  }
  return events;
}

/* ---------- Weekly time-block planner (Chapter 8) ---------- */

export const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
export const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export type TimeblockCfg = { start: string; followUps: number; prospecting: number; endOfDay: string; days: number[]; friday: boolean };
export const TIMEBLOCK_DEFAULTS: TimeblockCfg = { start: '08:00', followUps: 60, prospecting: 90, endOfDay: '17:30', days: [1, 2, 3, 4, 5], friday: true };

export const toMinutes = (value: string | undefined): number => {
  const [h, m] = (value || '0:0').split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};
export const fmtClock = (minutes: number): string => {
  const h = Math.floor(minutes / 60) % 24;
  return `${((h + 11) % 12) + 1}:${String(minutes % 60).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}`;
};
export const fmtSpan = (minutes: number): string => `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;

export type Block = { name: string; from: number; mins: number; cls: number };

export function planBlocks(cfg: TimeblockCfg): { blocks: Block[]; start: number; prosEnd: number; eod: number; valid: boolean } {
  const start = toMinutes(cfg.start);
  const prosStart = start + 15 + cfg.followUps;
  const prosEnd = prosStart + cfg.prospecting;
  const eod = toMinutes(cfg.endOfDay);
  const blocks: Block[] = [
    { name: 'CRM dashboard', from: start, mins: 15, cls: 0 },
    { name: 'Follow-up plan tasks', from: start + 15, mins: cfg.followUps, cls: 1 },
    { name: 'Prospecting', from: prosStart, mins: cfg.prospecting, cls: 2 },
    { name: 'Appointments and client work', from: prosEnd, mins: Math.max(eod - prosEnd, 0), cls: 3 },
    { name: 'End-of-day CRM update', from: eod, mins: 15, cls: 4 },
  ];
  return { blocks, start, prosEnd, eod, valid: eod >= prosEnd };
}

export function plannerVerdict(cfg: TimeblockCfg): { ok: boolean; text: string } {
  const { start, prosEnd, eod, valid } = planBlocks(cfg);
  if (!valid) return { ok: false, text: `✗ Your end-of-day update (${fmtClock(eod)}) comes before prospecting ends (${fmtClock(prosEnd)}). Move it later.` };
  const beforeNoon = prosEnd <= 12 * 60;
  return {
    ok: beforeNoon,
    text: `${fmtSpan(prosEnd - start)} protected, finishing at ${fmtClock(prosEnd)}. ` +
      (beforeNoon
        ? '✓ Lead generation is done before noon. Clients, lenders and inspectors will ask for afternoons: give them afternoons.'
        : '✗ Prospecting runs past noon. The morning is the only time nobody else wants, so start earlier or shorten the blocks.'),
  };
}

/** Twelve weeks of the chosen days. The appointments block is left off the calendar on purpose. */
export function timeblockEvents(cfg: TimeblockCfg, weekStart: Date): IcsEvent[] {
  const { blocks, prosEnd } = planBlocks(cfg);
  const days = cfg.days;
  const first = days.map(d => firstOnOrAfter(weekStart, d)).sort((a, b) => a.getTime() - b.getTime())[0]!;
  const rrule = `FREQ=WEEKLY;BYDAY=${days.map(d => WEEKDAYS[d]).join(',')};COUNT=${12 * days.length}`;
  const events: IcsEvent[] = blocks.filter(b => b.mins && b.cls !== 3).map(b => ({
    summary: b.name, start: withTime(first, b.from), end: withTime(first, b.from + b.mins), rrule,
  }));
  if (cfg.friday && days.includes(5)) {
    const friday = firstOnOrAfter(weekStart, 5);
    events.push({
      summary: 'Weekly pipeline review',
      description: 'No conversation in 14 days and no next step: that contact gets a call on Monday.',
      start: withTime(friday, prosEnd),
      end: withTime(friday, prosEnd + 30),
      rrule: 'FREQ=WEEKLY;BYDAY=FR;COUNT=12',
    });
  }
  return events;
}

/* ---------- Post-close scheduler (Chapter 10) ---------- */

export const POST_CLOSE_STEPS = [
  { key: 'Closing day', label: 'Closing day', at: (d: Date) => d },
  { key: '1 week', label: '1 week', at: (d: Date) => addDays(d, 7) },
  { key: '30 days', label: '30 days', at: (d: Date) => addDays(d, 30) },
  { key: 'Quarterly', label: 'Quarter 1 (3 months)', at: (d: Date) => addMonths(d, 3) },
  { key: 'Quarterly', label: 'Quarter 2 (6 months)', at: (d: Date) => addMonths(d, 6) },
  { key: 'Quarterly', label: 'Quarter 3 (9 months)', at: (d: Date) => addMonths(d, 9) },
  { key: 'Home anniversary', label: 'Home anniversary', at: (d: Date) => addMonths(d, 12) },
] as const;

export type PostCloseRows = Record<string, { touch: string; purpose: string }>;
export type PostCloseItem = { key: string; label: string; date: Date; touch: string; purpose: string };

/** Throws if the Table 10.1 rows the steps rely on are missing, so a renamed row fails the build. */
export function postCloseSchedule(closing: Date | null, rows: PostCloseRows): PostCloseItem[] {
  for (const s of POST_CLOSE_STEPS) if (!rows[s.key]) throw new Error(`Table 10.1 has no "${s.key}" row`);
  if (!closing) return [];
  return POST_CLOSE_STEPS.map(s => ({ key: s.key, label: s.label, date: s.at(closing), touch: rows[s.key]!.touch, purpose: rows[s.key]!.purpose }));
}

export function postCloseEvents(plan: readonly PostCloseItem[], who: string): IcsEvent[] {
  const name = who.trim();
  return plan.map(p => ({ summary: `Post-close${name ? ` (${name})` : ''}: ${p.label}`, description: `${p.touch} ${p.purpose}`, start: p.date, allDay: true }));
}

const POST_CLOSE_SHAPE = 'Months 3, 6 and 9 are the quarterly touches. Month 12 is the home anniversary, which takes the place of a fourth quarter. The annual appreciation event is not a separate dated row.';
export function postCloseNote(closings: number | undefined): string {
  return closings !== undefined && closings > 0
    ? `${POST_CLOSE_STEPS.length} dated touches per client in the first year × ${closings} closings = ${POST_CLOSE_STEPS.length * closings} touches. ${POST_CLOSE_SHAPE}`
    : POST_CLOSE_SHAPE;
}
