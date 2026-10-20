// Local-calendar date helpers for the planning tools. Everything works in the reader's local time on purpose:
// a milestone date is a day on their wall calendar, not an instant. Ported from legacy/js/widgets.js and
// legacy/js/widgets-plan.js.
export const addDays = (date: Date, n: number): Date => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + n);
  return d;
};

/** Month arithmetic that clamps to the last day instead of spilling into the next month. */
export const addMonths = (date: Date, n: number): Date => {
  const d = new Date(date.getFullYear(), date.getMonth() + n, 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(date.getDate(), last));
  return d;
};

export const isoDate = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** "2026-11-02" to a local Date, or null for anything else (including an empty date input). */
export const parseIso = (value: string | undefined): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  // new Date rolls 2026-02-31 into March; treat that as not a date
  return d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[3]) ? d : null;
};

/** `weekday` is 0 (Sunday) to 6 (Saturday). */
export const firstOnOrAfter = (date: Date, weekday: number): Date => addDays(date, (weekday - date.getDay() + 7) % 7);

/** First Monday-to-Friday day of the month; `month` is 0-based and may overflow into the next year. */
export const firstWorkingDay = (year: number, month: number): Date => {
  const d = new Date(year, month, 1);
  return d.getDay() === 6 ? addDays(d, 2) : d.getDay() === 0 ? addDays(d, 1) : d;
};

export const withTime = (date: Date, minutes: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(minutes / 60), minutes % 60);

export const nextMonday = (from: Date = new Date()): Date => firstOnOrAfter(addDays(from, 1), 1);

/** Whole days from `a` to `b`, counting calendar days (so a daylight-saving change cannot shift the answer). */
export const daysBetween = (a: Date, b: Date): number =>
  Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000);

export const shortDate = (d: Date, locale?: string): string => d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
export const fmtDate = (d: Date, locale?: string): string => d.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
