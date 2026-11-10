// The handbook's shared rules, stated once. The four sentences are the canonical phrasing the owner signed on
// 9 November 2026 (docs/plans/MASTER-PROMPT.md, section 4, row OD-09), copied verbatim; the numbers are the values
// those sentences and Table 8.2 state. The consistency tests, the scorecard rows and the speed-to-lead stopwatch read
// them from here; the chapter text and answer keys still restate them in their own words until M4 steps 3 to 5 point
// them at this module. Change a value here and the tests name every file that still disagrees.
// `chapter` and `anchor` are the page and heading id where the handbook defines the rule (the coach's review links
// deep-link there); `concepts` are the coach concepts that test it.

export const RULES = {
  consent: {
    sentence: 'Send automated texts or calls only to people whose consent you have recorded in the CRM, and stop at the first opt-out.',
    chapter: 'ch11',
    anchor: 'texts-and-calls',
    concepts: ['ch4.text-permission'],
  },
  speedToLead: {
    sentence: 'Answer every new lead with a live call within five minutes when you can, and always the same day.',
    chapter: 'ch4',
    anchor: 'speed-to-lead',
    concepts: ['ch4.speed-to-lead'],
  },
  ninePmTest: {
    sentence: 'Before you pay for leads, pass the 9 p.m. test: a lead arriving at 9 p.m. tonight gets an immediate automated reply, a call by the next morning and a 90-day plan, all without you having to remember.',
    chapter: 'ch3',
    anchor: 'paid-advertising',
    concepts: ['ch2.online-leads'],
  },
  postClose: {
    sentence: 'The post-close plan is built once, assigned on the day the contract goes under contract, and activated on closing day; it runs seven dated touches in the first year, starting with the closing-day note.',
    chapter: 'ch10',
    anchor: 'the-post-close-plan',
    concepts: ['ch12.pipeline-milestone'],
  },
} as const;

/** The speed-to-lead standard: a live call within this many minutes when you can, and always the same day. */
export const LIVE_CALL_MINUTES = 5;

/** The hour (24-hour clock) the 9 p.m. test's lead arrives. */
export const NINE_PM_TEST_HOUR = 21;

/** The plan the 9 p.m. test requires: the new-lead nurture plan in Appendix B.1 runs this many days. */
export const NURTURE_PLAN_DAYS = 90;

/** Dated touches a client gets in the first year of the post-close plan (Table 10.1). */
export const POST_CLOSE_TOUCHES_YEAR_ONE = 7;

/** The fragment of the post-close sentence that Chapter 10 and Appendix B.4 restate. */
export const POST_CLOSE_TOUCHES_PHRASE = 'seven dated touches in the first year';

/** Weekly activity targets, exactly as the WEEKLY TARGET column of Table 8.2 states them (content/pages/ch8.html),
 *  in table order and keyed by the Appendix A row id in scorecard.ts. `min` is the lower bound the scorecard scores
 *  against; 0 where the row has no threshold ("Growing", "Track"). */
export const WEEKLY_TARGETS = {
  calls: { target: '40 to 60', min: 40 },
  conversations: { target: '15 to 25', min: 15 },
  followups: { target: '30 to 50', min: 30 },
  'appts-set': { target: '1 to 2', min: 1 },
  'appts-held': { target: '1+', min: 1 },
  events: { target: '1 in the first 30 days, then up to 1 a week', min: 1 },
  'db-days': { target: '5', min: 5 },
  'new-contacts': { target: '15', min: 15 },
  content: { target: '2', min: 2 },
  'morning-blocks': { target: '4+', min: 4 },
  'pipeline-count': { target: 'Growing', min: 0 },
  'pipeline-value': { target: 'Growing', min: 0 },
  referrals: { target: 'Track', min: 0 },
} as const;

export type WeeklyTargetId = keyof typeof WEEKLY_TARGETS;
