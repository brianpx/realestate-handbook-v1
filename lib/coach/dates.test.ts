import { describe, expect, it } from 'vitest';
import { addDays, localDate } from './dates';

describe('dates', () => {
  it('adds calendar days across a month end and a leap day', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-12-31', 30)).toBe('2027-01-30');
  });

  it('keeps the same wall-clock date across a DST change', () => {
    // US clocks go back on 2026-11-01; adding 7 days is still a calendar step.
    expect(addDays('2026-10-28', 7)).toBe('2026-11-04');
  });

  it('reads the date in the learner zone, not UTC', () => {
    expect(localDate('2026-10-20T03:30:00Z', 'America/New_York')).toBe('2026-10-19');
    expect(localDate('2026-10-20T03:30:00Z', 'Asia/Tokyo')).toBe('2026-10-20');
  });
});
