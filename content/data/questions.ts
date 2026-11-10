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
      'An automated text and email within one minute, then a live call within five minutes when you can, and always the same day',
      'A voicemail within an hour and a text within a day',
      'A personal email within 30 minutes and a call within a week',
    ],
    answer: 1,
    explain: 'If you are with a client, the automated first touch buys you time and you call at the first break.',
  },
  {
    id: 'ch4.speed-to-lead.five-minutes', version: 1, concept: 'ch4.speed-to-lead', kind: 'blank',
    before: 'The speed-to-lead standard: an automated first touch within one minute, then a live call within', after: 'minutes when you can, and always the same day.',
    answer: '5', accept: ['5', 'five'],
    explain: 'The two layers: the automated first touch goes out on its own within a minute, and the live call follows within five minutes when you can, and always the same day. Figure 4 is an illustrative shape, not measured data.',
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
    before: 'Honor quiet hours and stop at the first', after: '.',
    answer: 'opt-out', accept: ['opt-out', 'opt out', 'optout'],
    explain: 'The automated first touch should honor quiet hours and stop at the first opt-out.',
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

  // ---- ch5.multi-touch
  {
    id: 'ch5.multi-touch.fifth-to-twelfth', version: 1, concept: 'ch5.multi-touch', kind: 'mcq',
    prompt: 'Many agents and industry trainers report that most conversions happen between which contacts?',
    options: ['The first and second', 'The third and fourth', 'The fifth and twelfth', 'The fifteenth and twentieth'],
    answer: 2,
    explain: 'Most new agents stop after one or two attempts, so they abandon the leads that would have closed for the agent who kept going.',
  },

  // ---- ch5.plan-properties
  {
    id: 'ch5.plan-properties.value-every-third', version: 1, concept: 'ch5.plan-properties', kind: 'blank',
    before: 'A good nurture plan gives something of value every', after: 'touch instead of always asking for something.',
    answer: 'third', accept: ['third', '3rd', '3'],
    explain: 'The four properties are front-loaded, mixed channel, value every third touch (3, 6, 9 and 12), and long (13 touches over at least 90 days).',
  },

  // ---- ch5.qualify
  {
    id: 'ch5.qualify.four-questions', version: 1, concept: 'ch5.qualify', kind: 'mcq',
    prompt: 'Which are the four qualifying questions?',
    options: ['Budget, bedrooms, schools, commute', 'Name, phone, email, address', 'Price, location, size, age', 'Timeline, motivation, financing, representation'],
    answer: 3,
    explain: 'Work them naturally into your first real conversation and record the answers in your CRM the same day.',
  },

  // ---- ch5.pipeline-review
  {
    id: 'ch5.pipeline-review.monday-call', version: 1, concept: 'ch5.pipeline-review', kind: 'mcq',
    prompt: 'What earns a lead a Monday call after the Friday pipeline review?',
    options: [
      'Being in the database for more than a month',
      'No real two-way conversation in 14 days and no scheduled next step',
      'Not having replied to your last email',
      'Not having a lender yet',
    ],
    answer: 1,
    explain: 'This 30-minute habit is the difference between a pipeline and a list of names.',
  },

  // ---- ch5 drafts: second questions per concept, awaiting accuracy review
  {
    id: 'ch5.multi-touch.no-answer', version: 1, concept: 'ch5.multi-touch', kind: 'mcq', draft: true, scenario: true,
    prompt: 'A lead has not replied to your first three touches. What does the chapter say to do?',
    options: [
      'Move them to the quarterly plan',
      'Keep the plan going until they say stop or until they buy',
      'Pause for six months, then restart',
      'Delete them from the database',
    ],
    answer: 1,
    explain: 'Unanswered calls are normal. A lead who has not replied to three touches is still a lead.',
  },
  {
    id: 'ch5.plan-properties.front-loaded', version: 1, concept: 'ch5.plan-properties', kind: 'mcq', draft: true,
    prompt: 'A front-loaded nurture plan puts how many touches in the first 14 days?',
    options: ['Two', 'Four', 'Seven', 'Thirteen'],
    answer: 2,
    explain: 'Seven touches in the first 14 days, while interest is highest.',
  },
  {
    id: 'ch5.starter-library.first-three', version: 1, concept: 'ch5.starter-library', kind: 'mcq', draft: true,
    prompt: 'Which three plans does the chapter say to start with?',
    options: [
      'The 8x8, the Quarterly Call Plan and the 90-day new-lead plan',
      'Home Anniversary, Post-Close and the Quarterly Call Plan',
      'Buyer Long-Term Nurture, Seller Long-Term Nurture and the 8x8',
      'Monthly Neighborhood Nurture, the 8x8 and Home Anniversary',
    ],
    answer: 0,
    explain: 'Between them they cover the highest-impact activities. Add the neighborhood and long-term nurture plans once the first three are running consistently.',
  },
  {
    id: 'ch5.starter-library.nobody-leaves', version: 1, concept: 'ch5.starter-library', kind: 'blank', draft: true,
    before: 'Chain plans so that nobody leaves the database unless they', after: '.',
    answer: 'ask to', accept: ['ask to', 'ask', 'ask you to'],
    explain: 'Instant Response rolls into a long-term nurture, which rolls into the Quarterly Call Plan.',
  },
  {
    id: 'ch5.qualify.jordan', version: 1, concept: 'ch5.qualify', kind: 'mcq', draft: true, scenario: true,
    prompt: 'On the day-7 call a lead says they want to move by next summer, have not spoken to a lender, and are not working with an agent. What stage and next step does the chapter give for this lead?',
    options: [
      'Active, with a showing this week',
      'Drop them until they get pre-approved',
      'Nurture, with a lender introduction as your next step',
      'Send them to another agent',
    ],
    answer: 2,
    explain: 'In the chapter\'s example of Jordan, this is a nurture lead with a lender introduction as the next step.',
  },
  {
    id: 'ch5.pipeline-review.three-questions', version: 1, concept: 'ch5.pipeline-review', kind: 'mcq', draft: true,
    prompt: 'Which is one of the three Friday pipeline review questions?',
    options: [
      'Is this person in the right stage?',
      'How many open houses did I hold this month?',
      'What is their price range?',
      'Have they referred anyone yet?',
    ],
    answer: 0,
    explain: 'The three: when did I last have a real two-way conversation, what is the next step and is it scheduled, and is this person in the right stage.',
  },

  // ---- ch12.phases
  {
    id: 'ch12.phases.three-phases', version: 1, concept: 'ch12.phases', kind: 'mcq',
    prompt: 'What are the three 30-day phases of the first 90 days?',
    options: ['Learn, wait, close', 'Plan, advertise, close', 'Study, practice, perform', 'Install the system, build the rhythm, grow the pipeline'],
    answer: 3,
    explain: 'Days 1 to 30 install the system, 31 to 60 build the rhythm, and 61 to 90 grow the pipeline.',
  },
  {
    id: 'ch12.phases.closings-follow', version: 1, concept: 'ch12.phases', kind: 'blank',
    before: 'Closings usually follow in the', after: '90 days.',
    answer: 'second', accept: ['second', '2nd'],
    explain: 'The first 90 days are for installing the system and building a pipeline, so do not worry about closings yet.',
  },
  {
    id: 'ch12.phases.fifty-conversations', version: 1, concept: 'ch12.phases', kind: 'mcq', draft: true,
    prompt: 'In days 1 to 30, at least how many real conversations should you have with your sphere?',
    options: ['10', '25', '50', '200'],
    answer: 2,
    explain: 'About 12 a week, the lower end of the Chapter 8 range.',
  },

  // ---- ch12.pipeline-milestone
  {
    id: 'ch12.pipeline-milestone.five-active', version: 1, concept: 'ch12.pipeline-milestone', kind: 'mcq',
    prompt: 'By days 61 to 90, how many active opportunities should your pipeline review show?',
    options: ['1', '3', '5 or more', '20'],
    answer: 2,
    explain: 'Also by day 90: your first contract written, the post-close plan built and lead sources evaluated with data.',
  },
  {
    id: 'ch12.pipeline-milestone.by-day-90', version: 1, concept: 'ch12.pipeline-milestone', kind: 'mcq', draft: true,
    prompt: 'Which of these belongs to days 61 to 90?',
    options: [
      'Write your first contract',
      'Finish your CRM setup',
      'Hold your first open house or networking event',
      'Get the content calendar running on its own',
    ],
    answer: 0,
    explain: 'The other three belong to days 1 to 30 and 31 to 60.',
  },

  // ---- ch12.scorecard
  {
    id: 'ch12.scorecard.which-list', version: 1, concept: 'ch12.scorecard', kind: 'mcq',
    prompt: 'Which list is the weekly scorecard?',
    options: ['Closings, commission, listings and referrals', 'Appendix A, the same rows as Table 8.2', 'Calls, emails, posts and mailers', 'Showings, offers, contracts and closings'],
    answer: 1,
    explain: 'Fill in Appendix A every Friday. Table 8.2 is that same list, not a shorter one.',
  },
  {
    id: 'ch12.scorecard.core-numbers', version: 1, concept: 'ch12.scorecard', kind: 'blank', draft: true,
    before: 'If the full scorecard is too much at first, start with the', after: 'core numbers from Chapter 8.',
    answer: 'five', accept: ['five', '5'],
    explain: 'Conversations, appointments set, follow-ups completed, new contacts added and morning blocks held. Then name the one number you will move next week.',
  },

  // ---- ch12.monthly-review
  {
    id: 'ch12.monthly-review.questions', version: 1, concept: 'ch12.monthly-review', kind: 'mcq', draft: true,
    prompt: 'Which is one of the four questions in the monthly review?',
    options: [
      'How many contacts are in my database?',
      'Which brokerage pays the best split?',
      'Where did leads stall in the pipeline?',
      'How many hours did I work this month?',
    ],
    answer: 2,
    explain: 'The four: which source produced the most appointments per hour spent, which follow-up plan got the most replies, where leads stalled, and what one change you will make this month.',
  },
  {
    id: 'ch12.monthly-review.where-recorded', version: 1, concept: 'ch12.monthly-review', kind: 'mcq', draft: true,
    prompt: 'Where does the chapter say to write the answers to your monthly review?',
    options: [
      'On a paper planner',
      'In an email to your broker',
      'In a spreadsheet separate from your CRM',
      'In your CRM, as a note titled "Monthly note"',
    ],
    answer: 3,
    explain: 'So next month\'s review can find and check them.',
  },

  // ---- ch12.plan-assembly
  {
    id: 'ch12.plan-assembly.post-close', version: 1, concept: 'ch12.plan-assembly', kind: 'mcq', draft: true,
    prompt: 'Which chapter\'s Try It gives you the post-close plan for your 90-Day Business Plan?',
    options: ['Chapter 5', 'Chapter 10', 'Chapter 11', 'Chapter 12'],
    answer: 1,
    explain: 'The list runs from Chapter 1 to Chapter 11; the post-close plan is item 10.',
  },
  {
    id: 'ch12.plan-assembly.compliance-card', version: 1, concept: 'ch12.plan-assembly', kind: 'mcq', draft: true,
    prompt: 'What goes on the compliance card in your plan?',
    options: [
      'Disclosure timing, the consent rule and three "ask first" situations',
      'Your license number and your broker\'s phone number',
      'A list of every form you might need',
      'The dates of your continuing education classes',
    ],
    answer: 0,
    explain: 'The compliance card comes from Chapter 11.',
  },

  // ---- ch2.sphere
  // The knowledge check's old "five to ten times" question was not in the chapter text (it says "often converts far
  // better") and was retired in M4 step 3; these two cover the concept instead.
  {
    id: 'ch2.sphere.why-best', version: 1, concept: 'ch2.sphere', kind: 'mcq', draft: true,
    prompt: 'Why is your sphere of influence, for most agents, the highest-return lead source?',
    options: [
      'Referral fees make every contact profitable',
      'Trust is already built and the cost is only time',
      'Sphere contacts always respond to a mass message',
      'It needs no follow-up once you have announced yourself',
    ],
    answer: 1,
    explain: 'Your sphere often converts far better than a portal lead, and the awkwardness of calling fades after the tenth call.',
  },
  {
    id: 'ch2.sphere.list-size', version: 1, concept: 'ch2.sphere', kind: 'mcq', draft: true,
    prompt: 'When you build your sphere list from your phone, social media, email and holiday cards, how many names do most people find?',
    options: ['25 to 50', '60 to 100', '150 to 300', '500 to 1,000'],
    answer: 2,
    explain: 'Import every one into your CRM and tag them by relationship so you can sort later.',
  },

  // ---- ch2.sphere-order
  {
    id: 'ch2.sphere-order.order', version: 1, concept: 'ch2.sphere-order', kind: 'mcq',
    prompt: 'What is the right order for working your sphere?',
    options: ['Ask, give, announce, repeat', 'Give, ask, announce, repeat', 'Announce, ask, give, repeat', 'Announce, give, ask, repeat'],
    answer: 3,
    explain: 'Announce that you are in real estate, give something useful, ask for introductions after two or three helpful touches, then repeat so nobody hears from you only when you want something.',
  },
  {
    id: 'ch2.sphere-order.announce-how', version: 1, concept: 'ch2.sphere-order', kind: 'mcq', draft: true,
    prompt: 'How should you send the announcement that you are in real estate?',
    options: [
      'As a mass email blast to your whole database',
      'Through an automated text tool, to save time',
      'As a social media post only',
      'As a personal call or text, after checking your broker\'s outreach rules',
    ],
    answer: 3,
    explain: 'One message, personal, not a mass blast. Chapter 11 covers your broker\'s outreach rules.',
  },

  // ---- ch2.online-leads
  {
    id: 'ch2.online-leads.two-things', version: 1, concept: 'ch2.online-leads', kind: 'mcq', draft: true,
    prompt: 'Which two things decide whether online leads pay off?',
    options: ['Speed and persistence', 'Price and location', 'Photos and listing descriptions', 'Exclusivity and brand'],
    answer: 0,
    explain: 'The first agent to make real contact usually wins the conversation, and most online leads need a long nurture plan.',
  },
  {
    id: 'ch2.online-leads.months-away', version: 1, concept: 'ch2.online-leads', kind: 'mcq', draft: true,
    prompt: 'Most online leads are how far from a transaction?',
    options: ['A few days', '6 to 18 months', 'About 3 years', 'They are ready to sign now'],
    answer: 1,
    explain: 'Without a long nurture plan you are paying to warm up a lead for someone else.',
  },

  // ---- ch2.open-house
  {
    id: 'ch2.open-house.follow-up', version: 1, concept: 'ch2.open-house', kind: 'mcq',
    prompt: 'What is the follow-up standard after an open house?',
    options: ['Within 24 hours: a text that evening and a call the next morning', 'Within a week, by mailed postcard', 'Only for visitors who ask you to', 'Within a month, once you have a listing to offer'],
    answer: 0,
    explain: 'Follow up with every visitor within 24 hours, and put every visitor on a follow-up plan. The visitor who was "just looking" is often the buyer in four months.',
  },
  {
    id: 'ch2.open-house.during', version: 1, concept: 'ch2.open-house', kind: 'mcq', draft: true,
    prompt: 'During an open house, what is the goal?',
    options: [
      'Sell the house to the first serious visitor',
      'Capture people (name, phone and email), not sell to them',
      'Hand out your price list and leave the rest to the listing agent',
      'Collect paper sign-in sheets for next week',
    ],
    answer: 1,
    explain: 'Greet every visitor, ask one open question about their search, and offer a concrete next step.',
  },

  // ---- ch2.advanced-sources
  {
    id: 'ch2.advanced-sources.farm-wait', version: 1, concept: 'ch2.advanced-sources', kind: 'mcq', draft: true, scenario: true,
    prompt: 'You start farming a neighborhood this month. When does the chapter say listings usually begin to appear?',
    options: ['Within two weeks', 'After about a month', 'After six to twelve months', 'Only after the second year'],
    answer: 2,
    explain: 'Farm only if you can afford the wait.',
  },
  {
    id: 'ch2.advanced-sources.expired-opener', version: 1, concept: 'ch2.advanced-sources', kind: 'mcq', draft: true,
    prompt: 'How should you open a call to an owner whose listing expired?',
    options: [
      'Lead with curiosity about what they want to do next',
      'Point out what their last agent did wrong',
      'Tell them their price was too high',
      'Offer to cut your commission',
    ],
    answer: 0,
    explain: 'The chapter\'s opener: "I saw your home came off the market. What would you like to happen next?"',
  },

  // ---- ch2.track-sources
  {
    id: 'ch2.track-sources.cost-per-deal', version: 1, concept: 'ch2.track-sources', kind: 'blank',
    before: 'For each lead source, the number you want is cost per closed', after: ', which includes your time at a rate you choose.',
    answer: 'deal', accept: ['deal', 'a deal'],
    explain: 'Count contacts added, appointments held, closings and dollars spent by source each month. After six months you will know which sources deserve more of your week.',
  },
  {
    id: 'ch2.track-sources.worked-example', version: 1, concept: 'ch2.track-sources', kind: 'mcq', draft: true, scenario: true,
    prompt: 'An open house source costs $120 in materials plus 24 hours at $25 an hour and produces one closing. What is the cost per closed deal?',
    options: ['$120', '$600', '$720', '$3,000'],
    answer: 2,
    explain: '$120 + (24 x $25) = $720, and $720 divided by 1 closing is $720.',
  },
  // ch3
  // ---- ch3.home-base
  {
    id: 'ch3.home-base.links', version: 1, concept: 'ch3.home-base', kind: 'mcq', draft: true,
    prompt: 'Where should every link on your social profiles and email signature point?',
    options: [
      'Your brokerage\'s main home page',
      'Your Agent Site, your home base',
      'Whichever listing you posted last',
      'A different page for each platform',
    ],
    answer: 1,
    explain: 'Your Agent Site and Client App are the places you send everyone, so check that every social and signature link points to your Agent Site.',
  },
  {
    id: 'ch3.home-base.reviews', version: 1, concept: 'ch3.home-base', kind: 'mcq', draft: true, scenario: true,
    prompt: 'Another new agent offers to write you a glowing review if you write one for them. What does the chapter say?',
    options: [
      'Accept: any review helps a new agent',
      'Accept, but post it only on Google',
      'Decline: never write or trade reviews',
      'Accept, as long as you reply to it',
    ],
    answer: 2,
    explain: 'Ask only people you have actually served, never write or trade reviews, and reply to every one.',
  },
  {
    id: 'ch3.home-base.not-write', version: 1, concept: 'ch3.home-base', kind: 'blank', draft: true,
    before: 'Reviews are marketing you do not', after: '.',
    answer: 'write', accept: ['write'],
    explain: 'An online lead reads them before deciding whether to answer your call, and three honest reviews make a new agent look established.',
  },

  // ---- ch3.brand-promise
  {
    id: 'ch3.brand-promise.definition', version: 1, concept: 'ch3.brand-promise', kind: 'mcq', draft: true,
    prompt: 'For a new agent, what does the chapter say a brand is?',
    options: [
      'A promise stated in one sentence, plus proof',
      'A logo, a color scheme and a tagline',
      'A custom website and printed business cards',
      'A large following on two social platforms',
    ],
    answer: 0,
    explain: 'Fill in "I help [who] [do what] in [where]" and use that sentence in your bio, your profile and your first post.',
  },
  {
    id: 'ch3.brand-promise.no-sales', version: 1, concept: 'ch3.brand-promise', kind: 'mcq', draft: true, scenario: true,
    prompt: 'You have no sold homes of your own yet. Where does the chapter suggest you find proof for your promise?',
    options: [
      'Stock photos of homes that sold in the region',
      'Nowhere: hold off posting until your first closing',
      'Your brokerage\'s total sales, presented as yours',
      'A colleague\'s sale (with permission) or a local place',
    ],
    answer: 3,
    explain: 'Until you have your own, borrow a colleague\'s with their permission, or profile a local business, a school or a park. Credibility starts with knowing the place.',
  },
  {
    id: 'ch3.brand-promise.proof', version: 1, concept: 'ch3.brand-promise', kind: 'blank', draft: true,
    before: 'Once your one-sentence promise is in your bio, profile and first post, every post after that is', after: 'of the sentence.',
    answer: 'proof', accept: ['proof'],
    explain: 'A brand is a promise stated in one sentence, plus proof.',
  },

  // ---- ch3.content-calendar
  {
    id: 'ch3.content-calendar.busy-week', version: 1, concept: 'ch3.content-calendar', kind: 'mcq', draft: true,
    prompt: 'How does the chapter say to choose your content schedule?',
    options: [
      'Post every day for a month to build momentum',
      'Post only when you have something polished',
      'Pick one you can keep on a busy week, then keep it',
      'Copy the schedule of the top agent in your market',
    ],
    answer: 2,
    explain: 'People hire the agent they remember. A modest, consistent content schedule beats bursts of brilliance.',
  },
  {
    id: 'ch3.content-calendar.market-numbers', version: 1, concept: 'ch3.content-calendar', kind: 'mcq', draft: true,
    prompt: 'Which three numbers go in the monthly market update?',
    options: [
      'Listings taken, homes closed and commission earned',
      'Median price, days on market and months of inventory',
      'Mortgage rates, price per square foot and new builds',
      'Showings, offers received and price reductions',
    ],
    answer: 1,
    explain: 'The monthly market update goes out as an email newsletter via your CRM and as a mailer to your farm.',
  },
  {
    id: 'ch3.content-calendar.batch', version: 1, concept: 'ch3.content-calendar', kind: 'blank', draft: true,
    before: 'Batch-create a', after: 'of posts in one sitting.',
    answer: 'month', accept: ['month', 'a month'],
    explain: 'The Try It asks for next month\'s eight posts, two a week for four weeks, written in one sitting and scheduled.',
  },

  // ---- ch3.listing-marketing
  {
    id: 'ch3.listing-marketing.two-leads', version: 1, concept: 'ch3.listing-marketing', kind: 'mcq', draft: true,
    prompt: 'Besides selling the house, what does good listing marketing generate?',
    options: [
      'A higher commission on the sale',
      'Free placement from the portals',
      'Referrals from other agents',
      'Buyers who call and neighbor sellers',
    ],
    answer: 3,
    explain: 'It generates buyers (who call about it) and sellers (neighbors who see you working). Every listing should produce buyers and future sellers, not only a closing.',
  },
  {
    id: 'ch3.listing-marketing.nearest-homes', version: 1, concept: 'ch3.listing-marketing', kind: 'mcq', draft: true,
    prompt: 'Before the open house, mailers or door-knocks should reach how many of the nearest homes?',
    options: ['10', '25', '50', '200'],
    answer: 2,
    explain: 'The minimum for every listing includes mailers or door-knocks to the 50 nearest homes before the open house.',
  },
  {
    id: 'ch3.listing-marketing.post-order', version: 1, concept: 'ch3.listing-marketing', kind: 'mcq', draft: true,
    prompt: 'In what order do the five posts for one listing go out?',
    options: [
      'Coming soon, just listed, open house, under contract, just sold',
      'Just listed, coming soon, open house, just sold, under contract',
      'Open house, coming soon, just listed, under contract, just sold',
      'Coming soon, open house, just listed, just sold, under contract',
    ],
    answer: 0,
    explain: 'The "just sold" update, with a line about how many showings or offers it received, is the single best seller-lead post you can make.',
  },

  // ---- ch3.paid-ads
  {
    id: 'ch3.paid-ads.nine-pm', version: 1, concept: 'ch3.paid-ads', kind: 'mcq', draft: true, scenario: true,
    prompt: 'A 9 p.m. lead gets an instant automated reply, but there is no 90-day plan and the morning call depends on your memory. Are you ready to pay for leads?',
    options: [
      'Yes: the immediate automated reply is what counts',
      'No: all three must happen without you remembering',
      'Yes, as long as you make the call sometime that week',
      'Only for portal placements, not for social media ads',
    ],
    answer: 1,
    explain: 'The 9 p.m. test needs an immediate automated reply, a call by the next morning and a 90-day plan, all without you having to remember. You build all three in Chapters 4 and 5.',
  },
  {
    id: 'ch3.paid-ads.start-small', version: 1, concept: 'ch3.paid-ads', kind: 'mcq', draft: true,
    prompt: 'Once your system passes the test, how does the chapter say to start paid advertising?',
    options: [
      'Run every source at once and keep whichever wins',
      'Spend the full budget in the first month for speed',
      'Copy the ads a top agent in your market is running',
      'Start small, one source at a time for 90 days',
    ],
    answer: 3,
    explain: 'Track cost per appointment and cost per closed deal before scaling.',
  },
  {
    id: 'ch3.paid-ads.leak', version: 1, concept: 'ch3.paid-ads', kind: 'blank', draft: true,
    before: 'Buying leads before your follow-up system can catch and nurture them is buying a', after: '.',
    answer: 'leak', accept: ['leak', 'a leak'],
    explain: 'Paid ads amplify a system. They cannot replace one.',
  },

  // ---- ch3.calendar-budget
  {
    id: 'ch3.calendar-budget.pitfall', version: 1, concept: 'ch3.calendar-budget', kind: 'mcq', draft: true,
    prompt: 'Which spending does the chapter\'s pitfall warn against?',
    options: [
      'Branding before spending time on conversations',
      'Professional photography for every listing',
      'Mailers to the homes nearest your listing',
      'A small, tracked test of one paid source',
    ],
    answer: 0,
    explain: 'Logos, car magnets and a custom website produce nothing on their own.',
  },
  {
    id: 'ch3.calendar-budget.calendar', version: 1, concept: 'ch3.calendar-budget', kind: 'blank', draft: true,
    before: 'Your first marketing budget is your', after: '.',
    answer: 'calendar', accept: ['calendar'],
    explain: 'Be easy to find, easy to remember and easy to trust without spending money you do not yet need to spend.',
  },
  // end ch3
];
