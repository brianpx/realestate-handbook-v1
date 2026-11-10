import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CHECKPOINT_ANSWERS } from '@/content/data/checkpoints';
import { NURTURE_TOUCHES } from '@/content/data/nurture';
import { NURTURE_STATIC_HTML } from '@/content/data/nurture-static';
import { LIVE_CALL_MINUTES, NINE_PM_TEST_HOUR, NURTURE_PLAN_DAYS, POST_CLOSE_TOUCHES_PHRASE, POST_CLOSE_TOUCHES_YEAR_ONE, RULES } from '@/content/data/rules';
import { htmlText, tableRows } from './html-text';
import { POST_CLOSE_STEPS } from './plan';

// One nurture plan, one count. These tests read the prose, the answer keys and the no-JS figure and fail when any of
// them disagrees with NURTURE_TOUCHES, which is what the explorer and the Chapter 13 one-card are built from. The
// numbers the plan relies on (the 90 days, the same-day call, the seven post-close touches) come from rules.ts.
const N = NURTURE_TOUCHES.length;
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const page = (id: string) => readFileSync(`content/pages/${id}.html`, 'utf8');
const sources = [
  ...readdirSync('content/pages').filter(f => f.endsWith('.html')).map(f => `content/pages/${f}`),
  ...readdirSync('content/data').filter(f => f.endsWith('.ts') && f !== 'nurture.ts').map(f => `content/data/${f}`),
].map(file => ({ file, text: readFileSync(file, 'utf8') }));

describe('Appendix B.1 matches the plan data', () => {
  const rows = tableRows(page('app-b')); // the first table in Appendix B is B.1
  it('lists every touch with the same day and number', () => {
    expect(rows.map(r => [Number(r[0]), Number(r[1])])).toEqual(NURTURE_TOUCHES.map(t => [t.day, t.n]));
  });
});

describe('the no-JavaScript Figure 5', () => {
  const items = [...NURTURE_STATIC_HTML.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => htmlText(m[1]!));
  it('has one line per touch, on the same days', () => {
    expect(items.map(line => Number(/^Day (\d+)\./.exec(line)?.[1]))).toEqual(NURTURE_TOUCHES.map(t => t.day));
  });
  it('names the same value touches as the data', () => {
    const values = NURTURE_TOUCHES.filter(t => t.value).map(t => t.n);
    expect(htmlText(NURTURE_STATIC_HTML)).toContain(`Value touches are ${values.slice(0, -1).join(', ')} and ${values.at(-1)}.`);
  });
  it('marks value on the same lines as the data', () => {
    expect(items.map(line => line.endsWith('Value.'))).toEqual(NURTURE_TOUCHES.map(t => t.value));
  });
});

describe('every stated touch count is the plan count', () => {
  it(`says ${N} wherever a digit count is attached to "touch"`, () => {
    const bad = sources.flatMap(({ file, text }) =>
      [...text.matchAll(/\b(\d+)[ -]touch(?:es)?\b/gi)].filter(m => Number(m[1]) !== N).map(m => `${file}: "${m[0]}"`));
    expect(bad).toEqual([]);
  });
  it('never gives the old 8 to 12 range for touches', () => {
    const bad = sources.flatMap(({ file, text }) => (/\b8\s*(?:to|-|–)\s*12\s+touch/i.test(text) ? [file] : []));
    expect(bad).toEqual([]);
  });
  it(`ends the plan at day ${NURTURE_PLAN_DAYS}, which the "${NURTURE_PLAN_DAYS}-day" wording relies on`, () => {
    expect(NURTURE_TOUCHES.at(-1)!.day).toBe(NURTURE_PLAN_DAYS);
  });
});

describe('value cadence is one rule', () => {
  const values = NURTURE_TOUCHES.filter(t => t.value).map(t => t.n);
  it('puts value on every third touch', () => {
    expect(values).toEqual(values.map((_, i) => 3 * (i + 1)));
  });
  it('never hedges with "third or fourth"', () => {
    expect(sources.filter(({ text }) => /third or fourth/i.test(text)).map(s => s.file)).toEqual([]);
  });
});

describe('8x8 means only the eight-week sphere plan', () => {
  it('is defined as eight touches over eight weeks in the glossary', () => {
    expect(htmlText(page('app-d'))).toMatch(/8x8\s*A follow-up plan of eight touches over eight weeks/);
  });
  it('is the eight-week plan in Appendix B.2', () => {
    expect(htmlText(page('app-b'))).toContain('New sphere contact: 8x8 (8 weeks)');
  });
  it('is eight touches over eight weeks, for sphere contacts, in Table 5.1', () => {
    const row = tableRows(page('ch5')).find(r => r[0] === '8x8');
    expect(row).toEqual(['8x8', 'Establish a new sphere relationship', '8', 'Fresh sphere contacts', '8 weeks']);
  });
  it('is never tied to days', () => {
    const bad = sources.flatMap(({ file, text }) =>
      [...htmlText(text).matchAll(/8x8[^.]{0,80}\b(?:eight|8)[ -]days?\b/gi)].map(m => `${file}: "${m[0]}"`));
    expect(bad).toEqual([]);
  });
});

describe('the post-close plan is six steps and seven dated touches in year one', () => {
  const ch10 = htmlText(page('ch10'));
  const steps = tableRows(page('ch10')).map(r => r[0]);
  it('has the six steps the scheduler is built from', () => {
    expect(steps).toEqual(['Closing day', '1 week', '30 days', 'Quarterly', 'Home anniversary', 'Annually']);
    expect(new Set(POST_CLOSE_STEPS.map(s => s.key))).toEqual(new Set(steps.slice(0, 5))); // the annual event is not a dated row
  });
  it('says so in Chapter 10: six steps, seven dated touches, then the quarterly plan', () => {
    expect(POST_CLOSE_STEPS).toHaveLength(POST_CLOSE_TOUCHES_YEAR_ONE);
    expect(ch10).toContain('the six-step post-close plan');
    expect(ch10).toContain(POST_CLOSE_TOUCHES_PHRASE);
    expect(ch10).toContain('stays on the Quarterly Call Plan (Appendix B.3)');
  });
  it('says the same in Appendix B.4 and Table 5.1', () => {
    expect(htmlText(page('app-b'))).toContain('seven dated touches per client in the first year');
    const row = tableRows(page('ch5')).find(r => r[0] === 'Post-Close Plan');
    expect(row?.[2]).toBe('7 in year one');
  });
  it('has no leftover "4 to 6" post-close count', () => {
    expect(sources.filter(({ text }) => /Post-Close Thank You/.test(text)).map(s => s.file)).toEqual([]);
  });
});

/** Plain text of the section under the h2 or h3 with `id`, up to the next heading of the same level. */
function section(html: string, id: string): string {
  const start = html.search(new RegExp(`<h[23]\\s[^>]*\\bid="${id}"`));
  if (start < 0) throw new Error(`no heading #${id}`);
  const rest = html.slice(start);
  const level = /^<h([23])/.exec(rest)![1];
  const next = rest.slice(1).search(new RegExp(`<h${level}\\b`));
  return htmlText(next < 0 ? rest : rest.slice(0, next + 1));
}

// Each signed sentence in rules.ts appears verbatim under the heading that defines the rule, and again where the
// plans and checklists apply it; the numbers beside the sentences agree with them and with the plan data.
describe('each rule is stated verbatim where the handbook defines it', () => {
  for (const [id, rule] of Object.entries(RULES)) {
    it(`${id}: ${rule.chapter}#${rule.anchor}`, () => {
      expect(section(page(rule.chapter), rule.anchor)).toContain(rule.sentence);
    });
  }
  it('the consent rule is restated verbatim beside the plans that automate texts', () => {
    for (const id of ['ch4', 'ch5', 'app-b']) expect(htmlText(page(id)), id).toContain(RULES.consent.sentence);
  });
  it('the 9 p.m. test is restated verbatim in Appendix C', () => {
    expect(htmlText(page('app-c'))).toContain(RULES.ninePmTest.sentence);
  });
  it('the speed-to-lead standard is the Chapter 4 checkpoint answer, verbatim', () => {
    const keyPoints = CHECKPOINT_ANSWERS.ch4!.flatMap(a => (Array.isArray(a) ? a : []));
    expect(keyPoints).toContain(RULES.speedToLead.sentence);
  });
});

describe('the signed rules agree with their numbers and the plan data', () => {
  it('the speed-to-lead standard: the live call is the stopwatch limit, the same day, and the plan\'s second touch', () => {
    const rule = RULES.speedToLead.sentence;
    expect(rule).toContain(`within ${WORDS[LIVE_CALL_MINUTES]} minutes`);
    expect(rule).toContain('always the same day');
    const ch4 = htmlText(page(RULES.speedToLead.chapter));
    expect(ch4).toContain(`within ${WORDS[LIVE_CALL_MINUTES]} minutes`);
    expect(ch4).toContain('always the same day');
    expect(NURTURE_TOUCHES[1]).toMatchObject({ n: 2, day: 0, channels: ['call'] });
    expect(NURTURE_TOUCHES[1]!.plan).toContain('Speed-to-lead');
  });
  it('the 9 p.m. test: the hour, the automated reply and the plan length, restated in Chapters 2 and 3', () => {
    const hour = `${NINE_PM_TEST_HOUR - 12} p.m.`;
    const rule = RULES.ninePmTest.sentence;
    expect(rule).toContain(`pass the ${hour} test`);
    expect(rule).toContain('an immediate automated reply');
    expect(rule).toContain(`a ${NURTURE_PLAN_DAYS}-day plan`);
    for (const id of ['ch2', RULES.ninePmTest.chapter]) {
      const text = htmlText(page(id));
      expect(text, id).toContain(`${hour} test`);
      expect(text, id).toContain('an immediate automated reply');
      expect(text, id).toContain(`a ${NURTURE_PLAN_DAYS}-day plan`);
    }
  });
  it('the post-close milestone: seven dated touches, as the scheduler and Chapter 10 count them', () => {
    expect(POST_CLOSE_TOUCHES_PHRASE).toBe(`${WORDS[POST_CLOSE_TOUCHES_YEAR_ONE]} dated touches in the first year`);
    expect(RULES.postClose.sentence).toContain(POST_CLOSE_TOUCHES_PHRASE);
    expect(RULES.postClose.sentence).toContain('activated on closing day');
    expect(POST_CLOSE_STEPS[0]!.key).toBe('Closing day');
  });
  it('the consent rule: Chapter 11 stops at the first opt-out, and the day-0 text waits for consent', () => {
    expect(RULES.consent.sentence).toContain('stop at the first opt-out');
    expect(htmlText(page(RULES.consent.chapter))).toContain('stop at the first opt-out');
    expect(NURTURE_TOUCHES[0]!.channels).toContain('text');
    expect(htmlText(page('app-b'))).toContain('The day-0 text waits until you have that permission.');
  });
});
