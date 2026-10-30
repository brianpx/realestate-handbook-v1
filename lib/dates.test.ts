import { describe, expect, it } from 'vitest';
import { addDays, addMonths, daysBetween, firstOnOrAfter, firstWorkingDay, isoDate, nextMonday, parseIso, withTime } from './dates';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

describe('addDays / addMonths', () => {
  it('adds calendar days across month and year ends', () => {
    expect(isoDate(addDays(d(2026, 12, 30), 3))).toBe('2027-01-02');
    expect(isoDate(addDays(d(2026, 11, 2), 89))).toBe('2027-01-30'); // day 90 of a plan that starts on day 1 = Nov 2
  });
  it('does not shift across a daylight-saving change', () => {
    expect(isoDate(addDays(d(2026, 3, 7), 2))).toBe('2026-03-09');
    expect(isoDate(addDays(d(2026, 10, 31), 2))).toBe('2026-11-02');
  });
  it('clamps month arithmetic to the last day', () => {
    expect(isoDate(addMonths(d(2026, 1, 31), 1))).toBe('2026-02-28');
    expect(isoDate(addMonths(d(2027, 12, 31), 2))).toBe('2028-02-29'); // leap year
    expect(isoDate(addMonths(d(2026, 11, 30), 3))).toBe('2027-02-28');
    expect(isoDate(addMonths(d(2026, 5, 15), 12))).toBe('2027-05-15');
  });
});

describe('parseIso / isoDate', () => {
  it('round-trips a real date and rejects the rest', () => {
    expect(isoDate(parseIso('2026-11-02')!)).toBe('2026-11-02');
    for (const bad of ['', undefined, '2026-2-3', 'nope', '2026-02-31', '2026-13-01']) expect(parseIso(bad as string)).toBeNull();
  });
});

describe('weekday helpers', () => {
  it('finds the first matching weekday on or after a date', () => {
    expect(isoDate(firstOnOrAfter(d(2026, 11, 2), 1))).toBe('2026-11-02'); // Monday stays
    expect(isoDate(firstOnOrAfter(d(2026, 11, 3), 1))).toBe('2026-11-09');
    expect(isoDate(firstOnOrAfter(d(2026, 11, 2), 5))).toBe('2026-11-06'); // Friday
    expect(isoDate(firstOnOrAfter(d(2026, 11, 6), 5))).toBe('2026-11-06');
  });
  it('moves a weekend first-of-month to Monday', () => {
    expect(isoDate(firstWorkingDay(2026, 10))).toBe('2026-11-02'); // Nov 1 2026 is a Sunday
    expect(isoDate(firstWorkingDay(2026, 7))).toBe('2026-08-03'); // Aug 1 2026 is a Saturday
    expect(isoDate(firstWorkingDay(2026, 8))).toBe('2026-09-01'); // Tuesday
  });
  it('lets the month overflow into the next year', () => {
    expect(isoDate(firstWorkingDay(2026, 12))).toBe('2027-01-01'); // Friday
  });
  it('picks the Monday after a given day', () => {
    expect(isoDate(nextMonday(d(2026, 11, 2)))).toBe('2026-11-09'); // a Monday asks for the next one
    expect(isoDate(nextMonday(d(2026, 11, 6)))).toBe('2026-11-09');
    expect(isoDate(nextMonday(d(2026, 11, 8)))).toBe('2026-11-09'); // Sunday
  });
});

describe('daysBetween / withTime', () => {
  it('counts calendar days, not 24-hour blocks', () => {
    expect(daysBetween(d(2026, 11, 2), d(2026, 11, 2))).toBe(0);
    expect(daysBetween(d(2026, 10, 31), d(2026, 11, 2))).toBe(2);
    expect(daysBetween(d(2026, 3, 7), d(2026, 3, 9))).toBe(2); // spring forward
    expect(daysBetween(d(2026, 11, 5), d(2026, 11, 2))).toBe(-3);
  });
  it('sets a clock time on a date', () => {
    const t = withTime(d(2026, 11, 6), 16 * 60 + 30);
    expect([t.getHours(), t.getMinutes(), isoDate(t)]).toEqual([16, 30, '2026-11-06']);
  });
});
