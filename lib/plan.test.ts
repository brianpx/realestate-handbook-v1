import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { UNITS } from '@/content/data/plan';
import { isoDate } from './dates';
import { htmlText } from './html-text';
import { PAGE_IDS } from './pages';
import {
  fmtClock, fmtSpan, phaseSummary, planBlocks, plannerVerdict, postCloseEvents, postCloseNote, postCloseSchedule, roadmapEvents, roadmapStatus,
  ROADMAP_PHASES, TIMEBLOCK_DEFAULTS, timeblockEvents, toMinutes, type PostCloseRows,
} from './plan';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);
const page = (id: string) => readFileSync(`content/pages/${id}.html`, 'utf8');

describe('reading plan', () => {
  const order = UNITS.flatMap(u => u.chapters);
  const readBefore = (earlier: string, later: string) => order.indexOf(earlier) < order.indexOf(later);

  it('lists the same weeks and chapters in the preface as content/data/plan.ts', () => {
    const weeks = [...page('pref').matchAll(/<li><strong>Week (\d+):<\/strong> Chapters ([^.]+)\./g)]
      .map(m => ({ unit: Number(m[1]), chapters: m[2]!.split(/, | and /).map(n => `ch${n}`) }));
    expect(weeks).toEqual(UNITS);
  });
  it('reads every chapter once, in book order (OD-03)', () => {
    expect(order).toEqual(PAGE_IDS.filter(id => /^ch\d+$/.test(id)));
  });
  // A chapter may point ahead ("Chapter 5 explains it"), but a sentence that assumes the reader has done the work
  // must name a chapter the plan has already scheduled.
  const LOOK_BACK = /\byour? (?:[a-z-]+ ){0,4}?(?:from|(?:built|wrote|made|set|set up|did|practiced|created) in) Chapters? (\d+)(?: (to|and) (\d+))?/gi;
  const lookBacks = (text: string) =>
    [...text.matchAll(LOOK_BACK)].filter(m => !/\bwill\b/i.test(m[0])).map(m => {
      const first = Number(m[1]);
      const last = Number(m[3] ?? m[1]);
      const chapters = m[2] === 'and' ? [first, last] : Array.from({ length: last - first + 1 }, (_, i) => first + i);
      return { phrase: m[0], chapters: chapters.map(n => `ch${n}`) };
    });
  it('recognizes the look-back phrasings and skips pointers ahead', () => {
    expect(lookBacks('the list you set in Chapter 1, your opening from Chapter 6, the work you did in Chapters 2 and 3').map(l => l.chapters))
      .toEqual([['ch1'], ['ch6'], ['ch2', 'ch3']]);
    expect(lookBacks('the work you did in Chapters 1 to 3')[0]!.chapters).toEqual(['ch1', 'ch2', 'ch3']);
    expect(lookBacks('You will split it across lead sources in Chapter 2. Chapter 5 explains it. You will use it from Chapter 8 on.')).toEqual([]);
  });
  it('only looks back at chapters the plan has already scheduled', () => {
    const bad = order.flatMap(id =>
      lookBacks(htmlText(page(id))).flatMap(l => l.chapters.filter(ch => !readBefore(ch, id)).map(ch => `${id}: "${l.phrase}" (${ch})`)));
    expect(bad).toEqual([]);
  });
  it('names the first week the same way on the handbook home and at the end of the guided setup', () => {
    const week1 = UNITS[0]!.chapters.map(ch => ch.slice(2));
    const words = `Chapters ${week1.slice(0, -1).join(', ')} and ${week1.at(-1)}`;
    const setup = readFileSync('components/handbook/StartSetup.tsx', 'utf8');
    expect(readFileSync('components/handbook/home/HowToUse.tsx', 'utf8')).toContain(`${words} set`);
    expect(setup).toContain(`first week is ${words}:`);
    const links = /What to read next[\s\S]*?<\/ul>/.exec(setup)?.[0] ?? '';
    expect([...links.matchAll(/pageHref\('(ch\d+)'\)/g)].map(m => m[1])).toEqual(UNITS[0]!.chapters);
  });
  it('schedules Chapter 2 before Chapter 4, whose Try It imports the Chapter 2 sphere list', () => {
    expect(htmlText(page('ch4'))).toContain('Start by importing the sphere list you built in Chapter 2.');
    expect(readBefore('ch2', 'ch4')).toBe(true);
  });
  it('schedules Chapter 12, which says the reader has met every part of the system, after Chapters 1 to 11', () => {
    expect(htmlText(page('ch12'))).toContain('You have now met every part of the system.');
    expect(order.slice(0, order.indexOf('ch12'))).toEqual(order.filter(id => Number(id.slice(2)) < 12));
  });
});

describe('roadmap', () => {
  const start = d(2026, 11, 2);
  it('says where today falls in the 90 days', () => {
    expect(roadmapStatus(null, d(2026, 11, 2))).toBe('Pick a start date to see your three milestone dates.');
    expect(roadmapStatus(start, d(2026, 10, 30))).toBe('Day 1 is in 3 days.');
    expect(roadmapStatus(start, start)).toBe('Today is day 1 of 90.');
    expect(roadmapStatus(start, d(2027, 1, 30))).toBe('Today is day 90 of 90.');
    expect(roadmapStatus(start, d(2027, 1, 31))).toBe('The 90 days are complete. Plan the next 90 from your own ratios.');
  });
  it('summarises a phase before, during and after its dates', () => {
    const p = ROADMAP_PHASES[0];
    expect(phaseSummary(p, start, d(2026, 10, 1), 0, 6, 'en-US')).toBe(' Nov 2 – Dec 1 · 0 of 6 done · not started');
    expect(phaseSummary(p, start, d(2026, 11, 20), 2, 6, 'en-US')).toBe(' Nov 2 – Dec 1 · 2 of 6 done · 4 open, 11 days left');
    expect(phaseSummary(p, start, d(2026, 12, 2), 2, 6, 'en-US')).toBe(' Nov 2 – Dec 1 · 2 of 6 done · 4 open, past the target date');
    expect(phaseSummary(p, start, d(2026, 12, 2), 6, 6, 'en-US')).toContain('· complete');
    expect(phaseSummary(p, start, d(2026, 12, 1), 5, 6, 'en-US')).toContain('1 open, 0 days left'); // the last day is still on time
  });
  it('exports three milestones, a Friday review and three monthly reviews', () => {
    const items = [['CRM setup', 'Contacts tagged'], ['Morning blocks'], ['5+ active opportunities']];
    const events = roadmapEvents(start, items);
    expect(events).toHaveLength(7);
    expect(events.slice(0, 3).map(e => [isoDate(e.start), e.allDay])).toEqual([['2026-12-01', true], ['2026-12-31', true], ['2027-01-30', true]]);
    expect(events[0]!.summary).toBe('Handbook milestone, day 30: Install the system');
    expect(events[0]!.description).toBe('- CRM setup\n- Contacts tagged');
    expect(events[3]).toMatchObject({ summary: 'Friday scorecard and pipeline review', rrule: 'FREQ=WEEKLY;BYDAY=FR;COUNT=13' });
    expect(isoDate(events[3]!.start)).toBe('2026-11-06');
    expect(events.slice(4).map(e => isoDate(e.start))).toEqual(['2026-12-01', '2027-01-01', '2027-02-01']);
  });
});

describe('time formatting', () => {
  it.each([['08:00', 480], ['17:30', 1050], ['', 0]])('toMinutes %j', (v, n) => expect(toMinutes(v)).toBe(n));
  it.each([[0, '12:00 am'], [480, '8:00 am'], [720, '12:00 pm'], [1050, '5:30 pm'], [1439, '11:59 pm']])('fmtClock %s', (m, s) => expect(fmtClock(m)).toBe(s));
  it('formats a span', () => expect(fmtSpan(255)).toBe('4h 15m'));
});

describe('time-block planner', () => {
  it('lays out the default day', () => {
    const { blocks, prosEnd, valid } = planBlocks(TIMEBLOCK_DEFAULTS);
    expect(blocks.map(b => [b.name, fmtClock(b.from), b.mins])).toEqual([
      ['CRM dashboard', '8:00 am', 15], ['Follow-up plan tasks', '8:15 am', 60], ['Prospecting', '9:15 am', 90],
      ['Appointments and client work', '10:45 am', 405], ['End-of-day CRM update', '5:30 pm', 15],
    ]);
    expect(fmtClock(prosEnd)).toBe('10:45 am');
    expect(valid).toBe(true);
  });
  it('passes the before-noon test by default and fails it when the day starts late', () => {
    expect(plannerVerdict(TIMEBLOCK_DEFAULTS)).toEqual({ ok: true, text: '2h 45m protected, finishing at 10:45 am. ✓ Lead generation is done before noon. Clients, lenders and inspectors will ask for afternoons: give them afternoons.' });
    const late = plannerVerdict({ ...TIMEBLOCK_DEFAULTS, start: '10:30' });
    expect(late.ok).toBe(false);
    expect(late.text).toMatch(/^2h 45m protected, finishing at 1:15 pm\. ✗ Prospecting runs past noon/);
  });
  it('rejects an end-of-day update that comes before prospecting ends', () => {
    const v = plannerVerdict({ ...TIMEBLOCK_DEFAULTS, endOfDay: '10:00' });
    expect(v).toEqual({ ok: false, text: '✗ Your end-of-day update (10:00 am) comes before prospecting ends (10:45 am). Move it later.' });
    expect(planBlocks({ ...TIMEBLOCK_DEFAULTS, endOfDay: '10:00' }).valid).toBe(false);
  });
  it('exports four recurring blocks plus the Friday review, for twelve weeks of the chosen days', () => {
    const events = timeblockEvents(TIMEBLOCK_DEFAULTS, d(2026, 11, 9));
    expect(events.map(e => e.summary)).toEqual(['CRM dashboard', 'Follow-up plan tasks', 'Prospecting', 'End-of-day CRM update', 'Weekly pipeline review']);
    expect(events[0]).toMatchObject({ rrule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;COUNT=60' });
    expect(isoDate(events[0]!.start)).toBe('2026-11-09');
    expect(events[4]).toMatchObject({ rrule: 'FREQ=WEEKLY;BYDAY=FR;COUNT=12' });
    expect(isoDate(events[4]!.start)).toBe('2026-11-13');
    expect([events[4]!.start.getHours(), events[4]!.start.getMinutes()]).toEqual([10, 45]);
  });
  it('starts on the first chosen day and skips the Friday review when Friday is off or not blocked', () => {
    const tue = timeblockEvents({ ...TIMEBLOCK_DEFAULTS, days: [2, 4] }, d(2026, 11, 9));
    expect(isoDate(tue[0]!.start)).toBe('2026-11-10');
    expect(tue[0]!.rrule).toBe('FREQ=WEEKLY;BYDAY=TU,TH;COUNT=24');
    expect(tue.some(e => e.summary === 'Weekly pipeline review')).toBe(false);
    expect(timeblockEvents({ ...TIMEBLOCK_DEFAULTS, friday: false }, d(2026, 11, 9)).some(e => e.summary === 'Weekly pipeline review')).toBe(false);
  });
});

describe('post-close scheduler', () => {
  const rows: PostCloseRows = Object.fromEntries(['Closing day', '1 week', '30 days', 'Quarterly', 'Home anniversary', 'Annually'].map(k => [k, { touch: `${k} touch.`, purpose: `${k} purpose.` }]));
  it('dates the seven touches of the first year', () => {
    const plan = postCloseSchedule(d(2026, 8, 31), rows);
    expect(plan.map(p => [p.label, isoDate(p.date)])).toEqual([
      ['Closing day', '2026-08-31'], ['1 week', '2026-09-07'], ['30 days', '2026-09-30'], ['Quarter 1 (3 months)', '2026-11-30'],
      ['Quarter 2 (6 months)', '2027-02-28'], ['Quarter 3 (9 months)', '2027-05-31'], ['Home anniversary', '2027-08-31'],
    ]);
  });
  it('is empty without a date, and fails when the table loses a row', () => {
    expect(postCloseSchedule(null, rows)).toEqual([]);
    const { Quarterly: _, ...missing } = rows;
    expect(() => postCloseSchedule(d(2026, 1, 1), missing)).toThrow('Table 10.1 has no "Quarterly" row');
  });
  it('names the client in the calendar entries when one is given', () => {
    const events = postCloseEvents(postCloseSchedule(d(2026, 8, 31), rows).slice(0, 2), '  Sam ');
    expect(events[0]).toMatchObject({ summary: 'Post-close (Sam): Closing day', description: 'Closing day touch. Closing day purpose.', allDay: true });
    expect(postCloseEvents(postCloseSchedule(d(2026, 8, 31), rows).slice(0, 1), '')[0]!.summary).toBe('Post-close: Closing day');
  });
  it('multiplies touches by expected closings', () => {
    expect(postCloseNote(undefined)).toMatch(/^Months 3, 6 and 9/);
    expect(postCloseNote(0)).toMatch(/^Months 3, 6 and 9/);
    expect(postCloseNote(12)).toMatch(/^7 dated touches per client in the first year × 12 closings = 84 touches\. Months 3/);
  });
});
