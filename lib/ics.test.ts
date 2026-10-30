import { describe, expect, it } from 'vitest';
import { buildIcs, foldLine, icsDate, icsDateTime, icsEscape } from './ics';

const now = new Date(Date.UTC(2026, 10, 2, 12, 0, 0));
const unfold = (s: string) => s.replace(/\r\n /g, '');
const lines = (s: string) => unfold(s).split('\r\n');

describe('escaping and dates', () => {
  it('escapes backslash, semicolon, comma and newline', () => {
    expect(icsEscape('a\\b;c,d\ne')).toBe('a\\\\b\;c\\,d\\ne');
  });
  it('writes floating local times', () => {
    const d = new Date(2026, 10, 6, 16, 5);
    expect(icsDate(d)).toBe('20261106');
    expect(icsDateTime(d)).toBe('20261106T160500');
  });
});

describe('buildIcs', () => {
  it('writes an all-day event ending the next day', () => {
    const out = lines(buildIcs([{ summary: 'Milestone, day 30', start: new Date(2026, 11, 1), allDay: true }], { now, uidSeed: 7 }));
    expect(out).toEqual([
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Handbook//Interactive tools//EN', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT', 'UID:7-0@handbook.local', 'DTSTAMP:20261102T120000Z',
      'DTSTART;VALUE=DATE:20261201', 'DTEND;VALUE=DATE:20261202', 'SUMMARY:Milestone\\, day 30',
      'END:VEVENT', 'END:VCALENDAR',
    ]);
  });
  it('writes a timed recurring event with a description', () => {
    const out = lines(buildIcs([{
      summary: 'Friday review', description: 'Line one\nLine two', start: new Date(2026, 10, 6, 16, 0), end: new Date(2026, 10, 6, 16, 30),
      rrule: 'FREQ=WEEKLY;BYDAY=FR;COUNT=13',
    }], { now, uidSeed: 1 }));
    expect(out).toContain('DTSTART:20261106T160000');
    expect(out).toContain('DTEND:20261106T163000');
    expect(out).toContain('RRULE:FREQ=WEEKLY;BYDAY=FR;COUNT=13');
    expect(out).toContain('DESCRIPTION:Line one\\nLine two');
  });
  it('numbers each event UID and joins lines with CRLF', () => {
    const ics = buildIcs([{ summary: 'a', start: new Date(2026, 0, 1), allDay: true }, { summary: 'b', start: new Date(2026, 0, 2), allDay: true }], { now, uidSeed: 9 });
    expect(ics).toContain('UID:9-0@handbook.local');
    expect(ics).toContain('UID:9-1@handbook.local');
    expect(ics.split('\r\n').length).toBeGreaterThan(10);
    expect(ics).not.toMatch(/[^\r]\n/);
  });
});

describe('foldLine', () => {
  it('leaves short lines alone', () => {
    expect(foldLine('SUMMARY:short')).toBe('SUMMARY:short');
  });
  it('folds long lines at 75 bytes and unfolds back to the original', () => {
    const long = `DESCRIPTION:${'word '.repeat(60)}`;
    const folded = foldLine(long);
    expect(folded.split('\r\n').every(l => new TextEncoder().encode(l).length <= 75)).toBe(true);
    expect(unfold(folded)).toBe(long);
  });
  it('never splits a multi-byte character', () => {
    const long = `SUMMARY:${'é–✓'.repeat(40)}`;
    const folded = foldLine(long);
    expect(folded.split('\r\n').every(l => new TextEncoder().encode(l).length <= 75)).toBe(true);
    expect(unfold(folded)).toBe(long);
  });
});
