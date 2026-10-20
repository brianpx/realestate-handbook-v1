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
];
