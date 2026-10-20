// The chapter-check questions, moved into tagged form. The four per chapter that shipped keep their wording
// (version 1); `draft` marks questions written for the review bank that still need an accuracy review by
// someone who has worked as an agent. Every answer must come from the chapter text.
// Bump `version` on any edit to the prompt, options or answer.
export type QuestionBase = {
  id: string;
  version: number;
  /** Concept.id; one primary concept per question. */
  concept: string;
  explain: string;
  scenario?: true;
  draft?: true;
};
export type McqQuestion = QuestionBase & { kind: 'mcq'; prompt: string; options: string[]; answer: number };
export type BlankQuestion = QuestionBase & { kind: 'blank'; before: string; after: string; answer: string; accept: string[] };
export type Question = McqQuestion | BlankQuestion;

export const QUESTIONS: Question[] = [
  // ---- ch4.crm-setup
  {
    id: 'ch4.crm-setup.profile-first', version: 1, concept: 'ch4.crm-setup', kind: 'mcq', draft: true,
    prompt: 'What is the first of the six CRM setup steps?',
    options: ['Import your contacts', 'Complete your profile and Marketing Profile', 'Create your follow-up plans', 'Install the mobile app'],
    answer: 1,
    explain: 'Step one of the six is your profile and Marketing Profile. Everything your CRM generates for you pulls from there.',
  },
  {
    id: 'ch4.crm-setup.import', version: 1, concept: 'ch4.crm-setup', kind: 'mcq', draft: true,
    prompt: 'You have imported your contacts. What does the chapter say to do next with them?',
    options: [
      'Delete everyone who has no email address',
      'Sort them alphabetically and start calling',
      'Send all of them the new-lead plan',
      'Deduplicate, then tag each contact by relationship and by source',
    ],
    answer: 3,
    explain: 'Step two: import contacts, deduplicate, then tag each contact by relationship (sphere, past client, lead) and by source.',
  },
  {
    id: 'ch4.crm-setup.routing', version: 1, concept: 'ch4.crm-setup', kind: 'mcq', draft: true, scenario: true,
    prompt: 'You are on a team and want every online inquiry to reach the right person instantly. Which setup step covers that?',
    options: [
      'Setting lead routing rules',
      'Customizing your Opportunities pipeline',
      'Importing contacts',
      'Turning on mobile notifications',
    ],
    answer: 0,
    explain: 'Lead routing rules are step four, and the chapter says to set them if you are on a team.',
  },
  {
    id: 'ch4.crm-setup.pipeline-honest', version: 1, concept: 'ch4.crm-setup', kind: 'blank', draft: true,
    before: 'Rename your pipeline stages to match how you actually work so your pipeline view is', after: '.',
    answer: 'honest', accept: ['honest'],
    explain: 'For example: New, Contacted, Appointment set, Active, Under contract, Closed.',
  },

  // ---- ch4.daily-rhythm
  {
    id: 'ch4.daily-rhythm.followups-first', version: 1, concept: 'ch4.daily-rhythm', kind: 'mcq',
    prompt: 'In the daily rhythm, why do follow-ups come before prospecting?',
    options: [
      'Prospecting calls work better in the afternoon',
      'Follow-ups take longer, so they go first',
      'A lead you already have is worth more than one you have not met yet',
      'Your CRM will not let you prospect first',
    ],
    answer: 2,
    explain: 'The day opens and closes in your CRM, and the order matters because of this reason.',
  },
  {
    id: 'ch4.daily-rhythm.protect-blocks', version: 1, concept: 'ch4.daily-rhythm', kind: 'mcq', draft: true,
    prompt: 'Which blocks does Table 4.1 say to protect before you accept any appointment?',
    options: [
      'The first three: start-of-day review, follow-up tasks and prospecting',
      'Only the prospecting block',
      'The end-of-day update and client appointments',
      'None: appointments always come first',
    ],
    answer: 0,
    explain: 'Table 4.1: protect the first three blocks before you accept any appointment.',
  },
  {
    id: 'ch4.daily-rhythm.end-of-day', version: 1, concept: 'ch4.daily-rhythm', kind: 'mcq', draft: true, scenario: true,
    prompt: 'Your afternoon was all appointments. What does the rhythm still ask of you at the end of the day?',
    options: [
      'Nothing; appointments count as the day\'s work',
      'Start a second prospecting block',
      'Log every conversation, move Opportunities to the right stage and set tomorrow\'s top three',
      'Rebuild your follow-up plans from scratch',
    ],
    answer: 2,
    explain: 'The end-of-day block (about 15 minutes) is: log every conversation, move Opportunities to the right stage and set tomorrow\'s top three.',
  },
  {
    id: 'ch4.daily-rhythm.opens-closes', version: 1, concept: 'ch4.daily-rhythm', kind: 'blank', draft: true,
    before: 'The day opens and closes in your', after: '.',
    answer: 'CRM', accept: ['crm', 'your crm'],
    explain: 'Figure 3: start by reviewing the dashboard and tasks, end with the update in your CRM.',
  },

  // ---- ch4.speed-to-lead
  {
    id: 'ch4.speed-to-lead.two-layers', version: 1, concept: 'ch4.speed-to-lead', kind: 'mcq',
    prompt: 'What are the two layers of the speed-to-lead standard?',
    options: [
      'A live call within one minute and an email within a day',
      'An automated text and email within one minute, then a live call within five minutes when possible, and always the same day',
      'A voicemail within an hour and a text within a day',
      'A personal email within 30 minutes and a call within a week',
    ],
    answer: 1,
    explain: 'If you are with a client, the automated first touch buys you time and you call at the first break.',
  },
  {
    id: 'ch4.speed-to-lead.five-minutes', version: 1, concept: 'ch4.speed-to-lead', kind: 'blank',
    before: 'In the speed-to-lead window, conversion is highest when you respond in under', after: 'minutes.',
    answer: '5', accept: ['5', 'five'],
    explain: 'Figure 4: under five minutes is the highest conversion window, five to 30 minutes is still strong, and after 30 minutes there is a sharp drop-off.',
  },
  {
    id: 'ch4.speed-to-lead.showing', version: 1, concept: 'ch4.speed-to-lead', kind: 'mcq', draft: true, scenario: true,
    prompt: 'A new inquiry arrives while you are showing a house. What is the right plan?',
    options: [
      'Wait until the end of the day, then call every lead at once',
      'Reply with a long email explaining all your services',
      'Ignore it; showings always come first and leads can wait until tomorrow',
      'Let the automated first touch go out, then call at your first break',
    ],
    answer: 3,
    explain: 'The automated reply buys you time, and the live call still happens as soon as you can, always the same day.',
  },
  {
    id: 'ch4.speed-to-lead.no-call-in-hour', version: 1, concept: 'ch4.speed-to-lead', kind: 'mcq', draft: true,
    prompt: 'You cannot make a live call within the hour. What does the chapter suggest?',
    options: [
      'Send a personal voice note or, if you have permission to text them, a short text that names the property or area they asked about',
      'Wait and call tomorrow',
      'Send the same automated message a second time',
      'Add them to the quarterly call plan',
    ],
    answer: 0,
    explain: 'Specificity proves a human read the inquiry.',
  },
  {
    id: 'ch4.speed-to-lead.figure-4', version: 1, concept: 'ch4.speed-to-lead', kind: 'mcq', draft: true,
    prompt: 'How does the chapter describe the response-window shape in Figure 4?',
    options: [
      'Measured data from a national study',
      'A guarantee of conversion within five minutes',
      'An illustrative shape, not measured data',
      'The average response time of top producers',
    ],
    answer: 2,
    explain: 'The figure caption says it is illustrative: highest inside five minutes, strong within about half an hour, falling sharply after.',
  },

  // ---- ch4.text-permission
  {
    id: 'ch4.text-permission.inquiry', version: 1, concept: 'ch4.text-permission', kind: 'mcq', draft: true, scenario: true,
    prompt: 'A lead submits an online inquiry. What does the chapter say about starting an automated text sequence?',
    options: [
      'An inquiry is permission, so go ahead',
      'Texts are never allowed in the first week',
      'Text first and ask for permission in the third message',
      'An inquiry is not, by itself, permission for an automated text sequence; text only if you have permission',
    ],
    answer: 3,
    explain: 'The automated email goes out at once; a text is sent only if you have permission to text them.',
  },
  {
    id: 'ch4.text-permission.first-touch', version: 1, concept: 'ch4.text-permission', kind: 'mcq', draft: true,
    prompt: 'What should the automated first touch sound like, and what should it ask?',
    options: [
      'Like you, asking one easy question',
      'Formal, with your full price list and a request for their budget',
      'Short, with only a link to your website',
      'Like a form letter, asking them to call your office',
    ],
    answer: 0,
    explain: 'It should sound like you and ask one easy question.',
  },
  {
    id: 'ch4.text-permission.opt-out', version: 1, concept: 'ch4.text-permission', kind: 'blank', draft: true,
    before: 'Honor quiet hours and stop on the first', after: '.',
    answer: 'opt-out', accept: ['opt-out', 'opt out', 'optout'],
    explain: 'The automated first touch should honor quiet hours and stop on the first opt-out.',
  },

  // ---- ch4.optional-tools
  {
    id: 'ch4.optional-tools.when', version: 1, concept: 'ch4.optional-tools', kind: 'mcq',
    prompt: 'When should you add optional tools such as AI texting assistants or dialers?',
    options: [
      'In your first week',
      'As soon as a competitor has one',
      'Whenever a vendor offers a free trial',
      'When your basic CRM system runs cleanly and your lead volume means the tool pays for itself',
    ],
    answer: 3,
    explain: 'A tool you have not mastered is one more place for a lead to get lost.',
  },
  {
    id: 'ch4.optional-tools.second-crm', version: 1, concept: 'ch4.optional-tools', kind: 'mcq', draft: true, scenario: true,
    prompt: 'An agent has a working CRM setup and about 30 leads a month. Should they add a second CRM?',
    options: [
      'Yes, every agent needs two',
      'Yes, but only after a year',
      'No: with a working setup and that volume they do not need one',
      'Only if it is free',
    ],
    answer: 2,
    explain: 'The chapter\'s own example: a new agent with a working CRM setup and 30 leads a month does not need a second CRM.',
  },
  {
    id: 'ch4.optional-tools.lost', version: 1, concept: 'ch4.optional-tools', kind: 'blank', draft: true,
    before: 'A tool you have not mastered is one more place for a lead to get', after: '.',
    answer: 'lost', accept: ['lost'],
    explain: 'Master the basic CRM first; add tools when volume justifies them.',
  },
];
