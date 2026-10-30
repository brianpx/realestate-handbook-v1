import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SCORE_ROWS, SCORECARD_CAPTION } from '@/content/data/scorecard';
import { htmlText, tableRows } from './html-text';
import { TIMEBLOCK_DEFAULTS } from './plan';

// One weekly scorecard: Appendix A. Table 8.2 and Chapter 12 are the same list, so these tests tie the prose, the
// answer keys and the planner to SCORE_ROWS, which the scorecard widget is built from.
const read = (file: string) => readFileSync(file, 'utf8');
const page = (id: string) => read(`content/pages/${id}.html`);
const text = (id: string) => htmlText(page(id));
const targets = Object.fromEntries(SCORE_ROWS.map(r => [r.id, r.target]));

/** Body rows of the table in `html` whose header contains `marker`, as plain-text cells. */
function tableWith(html: string, marker: string): string[][] {
  const table = html.split(/<table/i).slice(1).find(t => t.includes(marker));
  if (!table) throw new Error(`no table with ${marker}`);
  return tableRows(`<table${table}`);
}
const sources = [
  ...readdirSync('content/pages').filter(f => f.endsWith('.html')).map(f => `content/pages/${f}`),
  ...readdirSync('content/data').filter(f => f.endsWith('.ts') && f !== 'scorecard.ts').map(f => `content/data/${f}`),
].map(file => ({ file, text: read(file) }));

describe('Table 8.2 is the Appendix A list', () => {
  const rows = tableWith(page('ch8'), 'WEEKLY TARGET');
  it('has one row per scorecard row, in order', () => {
    expect(rows).toHaveLength(SCORE_ROWS.length);
  });
  it('gives each row the scorecard target (the events row may add its ramp-up)', () => {
    SCORE_ROWS.forEach((row, i) => expect(rows[i]![1]!.startsWith(row.target), `${row.id}: "${rows[i]![1]}" vs "${row.target}"`).toBe(true));
  });
  it('says it is the same list as Appendix A, and Appendix A says it matches', () => {
    expect(text('ch8')).toContain('These are the same rows as Appendix A');
    expect(SCORECARD_CAPTION).toBe('Table A.1. Weekly scorecard. The rows match Table 8.2.');
  });
});

describe('the answer keys give the scorecard numbers', () => {
  const keys = readFileSync('content/data/checkpoints.ts', 'utf8');
  const ch8Key = keys.split('ch8: [')[1]!.split('ch9: [')[0]!;
  const ch12Key = keys.split('ch12: [')[1]!;
  it('Chapter 8 lists the first five targets as the scorecard does', () => {
    for (const [label, id] of [['calls', 'calls'], ['conversations', 'conversations'], ['follow-ups', 'followups'], ['appointments set', 'appts-set']] as const) {
      expect(ch8Key, `${label} ${targets[id]}`).toContain(`${label} ${targets[id]}`);
    }
    expect(ch8Key).toContain(`appointments held ${targets['appts-held']!.replace('+', ' or more')}`);
  });
  it('Chapter 12 points at Appendix A and Table 8.2 as one list', () => {
    expect(ch12Key).toContain('Appendix A, and Table 8.2 is the same list');
    expect(text('ch12')).toContain('Do not keep a second, shorter scorecard');
  });
  it('Chapter 12 quotes the same conversation and appointment targets', () => {
    expect(text('ch12')).toContain(`${targets.conversations} conversations a week and ${targets['appts-set']} appointments set`);
  });
});

describe('no page keeps the old appointment target', () => {
  it('has no "3 to 6" next to appointments', () => {
    const bad = sources.flatMap(({ file, text: t }) =>
      [...htmlText(t).matchAll(/appointments?[^.]{0,40}\b3 to 6\b|\b3 to 6\b[^.]{0,30}appointments?/gi)].map(m => `${file}: "${m[0]}"`));
    expect(bad).toEqual([]);
  });
});

describe('the morning prospecting block is one length', () => {
  const minutes = TIMEBLOCK_DEFAULTS.prospecting;
  it('is the planner default in the sample day, Table 8.1 and Table 8.2', () => {
    expect(minutes).toBe(90);
    expect(text('ch8')).toContain(`at ${minutes} minutes, whichever comes first`);
    expect(tableWith(page('ch8'), 'Prospecting')[2]![1]).toContain(`Prospecting, ${minutes} minutes`);
    expect(text('ch8')).toContain(`The ${minutes}-minute prospecting block, before 11:00.`);
  });
  it('fits the clock times: 9:30 to the 11:00 break is the same length', () => {
    const rows = tableWith(page('ch8'), 'Prospecting');
    const [start, end] = [rows.find(r => r[1]?.startsWith('Prospecting'))![0]!, rows[rows.findIndex(r => r[1]?.startsWith('Prospecting')) + 1]![0]!];
    const mins = (hm: string) => { const [h, m] = hm.split(':').map(Number); return h! * 60 + m!; };
    expect(mins(end) - mins(start)).toBe(minutes);
  });
  it('is never longer than the block in Table 4.1', () => {
    const row = tableWith(page('ch4'), 'Prospecting block').find(r => r[0] === 'Prospecting block')!;
    expect(row[2]).toBe(`60 to ${minutes} min`);
  });
});
