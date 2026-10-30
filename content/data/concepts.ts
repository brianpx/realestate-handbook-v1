// One concept is one idea a question can test, small enough that "I know it" is a yes or no.
// Bump `version` when what the concept means changes materially; attempts on an older version stop counting.
// `anchor` is the heading id the review link will deep-link to. The pages have no heading ids yet, so these
// are the intended ids and must be added to the chapter HTML before any link uses them.
export type Concept = {
  id: string;
  chapter: string;
  title: string;
  summary: string;
  anchor: string;
  version: number;
};

export const CONCEPTS: Concept[] = [
  {
    id: 'ch4.crm-setup',
    chapter: 'ch4',
    title: 'The six-part CRM setup, in order, in week one',
    summary: 'Profile, contacts (deduplicated and tagged), follow-up plans, lead routing, a pipeline named for how you work, mobile app with notifications.',
    anchor: 'the-one-time-setup',
    version: 1,
  },
  {
    id: 'ch4.daily-rhythm',
    chapter: 'ch4',
    title: 'The daily rhythm: open and close in the CRM, follow-ups before prospecting',
    summary: 'Review the dashboard, clear follow-up tasks, then prospect, and end by logging the day; protect the first three blocks before taking appointments.',
    anchor: 'the-daily-rhythm',
    version: 1,
  },
  {
    id: 'ch4.speed-to-lead',
    chapter: 'ch4',
    title: 'Speed-to-lead: automated first touch in a minute, live call in minutes',
    summary: 'An automated reply within one minute, then a live call within five minutes when possible and always the same day; under five minutes is the highest-conversion window.',
    anchor: 'speed-to-lead',
    version: 1,
  },
  {
    id: 'ch4.text-permission',
    chapter: 'ch4',
    title: 'An inquiry is not permission for automated texts',
    summary: 'Email the moment a lead lands, text only with permission, honor quiet hours, and stop on the first opt-out.',
    anchor: 'speed-to-lead',
    version: 1,
  },
  {
    id: 'ch4.optional-tools',
    chapter: 'ch4',
    title: 'Add optional tools only when two conditions are true',
    summary: 'The basic CRM runs cleanly and lead volume makes the tool pay for itself.',
    anchor: 'optional-tools',
    version: 1,
  },
  {
    id: 'ch5.multi-touch',
    chapter: 'ch5',
    title: 'Most conversions come after several touches, not one',
    summary: 'Many trainers report most conversions between the fifth and twelfth contact; an unanswered lead stays in the plan until they say stop or buy.',
    anchor: 'why-one-call-is-never-enough',
    version: 1,
  },
  {
    id: 'ch5.plan-properties',
    chapter: 'ch5',
    title: 'A nurture plan is front-loaded, mixed-channel, valuable every third touch, and long',
    summary: 'Seven touches in the first 14 days, calls, texts and emails in rotation, something of value on touches 3, 6, 9 and 12, and at least 90 days.',
    anchor: 'designing-a-nurture-plan',
    version: 1,
  },
  {
    id: 'ch5.starter-library',
    chapter: 'ch5',
    title: 'Start with three plans: the 8x8, the Quarterly Call Plan and the 90-day new-lead plan',
    summary: 'Launch a plan on every contact the day they arrive and chain plans so nobody leaves the database unless they ask to.',
    anchor: 'starter-library',
    version: 1,
  },
  {
    id: 'ch5.qualify',
    chapter: 'ch5',
    title: 'Qualify early with four questions, then stage the lead',
    summary: 'Timeline, motivation, financing and representation, recorded the same day; a pre-approved buyer moving soon is active, a maybe-next-year lead is nurture.',
    anchor: 'qualify-early',
    version: 1,
  },
  {
    id: 'ch5.pipeline-review',
    chapter: 'ch5',
    title: 'The Friday pipeline review',
    summary: 'Ask three questions about every active contact; no conversation in 14 days and no scheduled next step earns a call on Monday.',
    anchor: 'the-weekly-pipeline-review',
    version: 1,
  },
  {
    id: 'ch12.phases',
    chapter: 'ch12',
    title: 'The first 90 days are three 30-day phases: install, build the rhythm, grow the pipeline',
    summary: 'Checkpoints at days 30, 60 and 90; do not worry about closings, which usually follow in the second 90 days.',
    anchor: 'days-1-to-30',
    version: 1,
  },
  {
    id: 'ch12.pipeline-milestone',
    chapter: 'ch12',
    title: 'By day 90: five active opportunities, a first contract, the post-close plan built',
    summary: 'Also count results by lead source and record conversion ratios so the next 90 days are planned from real numbers.',
    anchor: 'days-61-to-90',
    version: 1,
  },
  {
    id: 'ch12.scorecard',
    chapter: 'ch12',
    title: 'One weekly scorecard: Appendix A, the same rows as Table 8.2',
    summary: 'Fill it in every Friday, start with the five core numbers if the full list is too much, and name the one number to move next week.',
    anchor: 'measure-every-week',
    version: 1,
  },
  {
    id: 'ch12.monthly-review',
    chapter: 'ch12',
    title: 'The one-hour monthly review changes where your time goes',
    summary: 'Four questions on the first working day of the month, with the answers written in your CRM as a Monthly note.',
    anchor: 'review-every-month',
    version: 1,
  },
  {
    id: 'ch12.plan-assembly',
    chapter: 'ch12',
    title: 'Assemble the 90-Day Business Plan from the Try Its in Chapters 1 to 11',
    summary: 'Copy each chapter piece onto one page, put each milestone on a date, and share it with your broker or mentor.',
    anchor: 'assemble-your-plan',
    version: 1,
  },
  {
    id: 'ch2.sphere',
    chapter: 'ch2',
    title: 'Your sphere is the cheapest, best-converting source: list 150 or more names first',
    summary: 'Everyone who already knows you and would take your call; most people find 150 to 300 names, imported and tagged by relationship.',
    anchor: 'sphere-of-influence',
    version: 1,
  },
  {
    id: 'ch2.sphere-order',
    chapter: 'ch2',
    title: 'Work the sphere in order: announce, give, ask, repeat',
    summary: 'Announce personally, send something useful, ask for introductions after two or three helpful touches, then keep everyone on a touch plan.',
    anchor: 'sphere-of-influence',
    version: 1,
  },
  {
    id: 'ch2.online-leads',
    chapter: 'ch2',
    title: 'Online leads pay off only with speed and persistence',
    summary: 'Most are 6 to 18 months from a transaction; do not buy them until the 9 p.m. test passes.',
    anchor: 'online-leads',
    version: 1,
  },
  {
    id: 'ch2.open-house',
    chapter: 'ch2',
    title: 'An open house is a lead-generation event: before, during, after',
    summary: 'Preview the comps and invite neighbors, capture every visitor digitally, and follow up within 24 hours on a follow-up plan.',
    anchor: 'open-houses',
    version: 1,
  },
  {
    id: 'ch2.advanced-sources',
    chapter: 'ch2',
    title: 'Farming and expired listings are slower or advanced sources',
    summary: 'Farming takes six to twelve months; expired and for-sale-by-owner calls are respectful, persistent and postponed until the sphere and follow-up work.',
    anchor: 'geographic-farming',
    version: 1,
  },
  {
    id: 'ch2.track-sources',
    chapter: 'ch2',
    title: 'Tag every contact with a source and measure cost per closed deal',
    summary: 'Dollars spent plus your hours at a rate you choose, divided by closings.',
    anchor: 'track-every-source',
    version: 1,
  },
];
