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
  // ch1
  // ---- ch1.business-owner
  {
    id: 'ch1.business-owner.three-ways', version: 1, concept: 'ch1.business-owner', kind: 'mcq', draft: true,
    prompt: 'According to Chapter 1, what three things does your company need?',
    options: [
      'A way to find, stay in touch with and keep customers',
      'An office, a recognizable brand and a full-time assistant',
      'A license, a sponsoring broker and a polished website',
      'Listings, buyers who are ready to move and a lender',
    ],
    answer: 0,
    explain: 'A company needs a way to find customers, a way to stay in touch with them, and a way to keep them. That is the whole structure of the book.',
  },
  {
    id: 'ch1.business-owner.one-product', version: 1, concept: 'ch1.business-owner', kind: 'mcq', draft: true,
    prompt: 'The agents who last think of themselves as owners of a small company with one product. What is that product?',
    options: [
      'Listings marketed to as many buyers as possible',
      'Access to homes before they reach the market',
      'The lowest commission in the neighborhood',
      'Guidance through a large financial decision',
    ],
    answer: 3,
    explain: 'The chapter names the one product as trusted guidance through a large financial decision.',
  },
  {
    id: 'ch1.business-owner.costs-first', version: 1, concept: 'ch1.business-owner', kind: 'mcq', draft: true,
    prompt: 'Why does the chapter tell you to plan for several months of expenses before your first check?',
    options: [
      'Brokers hold back your first few checks',
      'Your first closing is guaranteed by month two',
      'A commission business pays only at closing',
      'New agents cannot take listings at first',
    ],
    answer: 2,
    explain: 'In your first month you will likely pay fees, MLS access, a CRM and some marketing, and a commission business pays only at closing. Ask your broker for a realistic list of month-one costs.',
  },

  // ---- ch1.work-is-the-win
  {
    id: 'ch1.work-is-the-win.one-twentieth', version: 1, concept: 'ch1.work-is-the-win', kind: 'mcq', draft: true,
    prompt: 'If it takes about 20 conversations to book one appointment, what is each "no"?',
    options: [
      'A sign your script needs changing',
      'One-twentieth of an appointment',
      'A contact to remove from your list',
      'A rejection to recover from first',
    ],
    answer: 1,
    explain: 'Think in ratios: each "no" is one-twentieth of an appointment, not a rejection. Hit the daily number and the results follow on their own schedule.',
  },
  {
    id: 'ch1.work-is-the-win.control', version: 1, concept: 'ch1.work-is-the-win', kind: 'blank', draft: true,
    before: 'You cannot control who says yes. You can control how many real', after: 'you have today.',
    answer: 'conversations', accept: ['conversations', 'conversation', 'real conversations'],
    explain: 'The number of real conversations is yours to control, and a "no" still counts toward it.',
  },
  {
    id: 'ch1.work-is-the-win.no-counts', version: 1, concept: 'ch1.work-is-the-win', kind: 'mcq', draft: true, scenario: true,
    prompt: 'A homeowner you call has a real two-way talk with you about selling, then says "no". Does that count toward today\'s conversation number?',
    options: [
      'No, only conversations that book an appointment count',
      'Only once you have scheduled a follow-up with them',
      'Yes, a "no" still counts toward that number',
      'Only if they agree to stay on your follow-up plan',
    ],
    answer: 2,
    explain: 'You control how many real conversations you have today, and a "no" still counts toward that number.',
  },

  // ---- ch1.leading-lagging
  {
    id: 'ch1.leading-lagging.lagging', version: 1, concept: 'ch1.leading-lagging', kind: 'mcq', draft: true,
    prompt: 'Which of these is a lagging indicator?',
    options: ['Appointments set', 'Contacts added to your database', 'Commission income', 'Conversations held'],
    answer: 2,
    explain: 'A lagging indicator tells you what already happened: closings, commission income and listings held. The other three are activities you control today.',
  },
  {
    id: 'ch1.leading-lagging.start-with', version: 1, concept: 'ch1.leading-lagging', kind: 'mcq', draft: true,
    prompt: 'Which three weekly numbers does the chapter tell you to start tracking?',
    options: [
      'Closings, listings held, commission income',
      'Conversations, appointments set, follow-ups completed',
      'Calls dialed, emails sent, social posts published',
      'Open houses held, mailers sent, ads run',
    ],
    answer: 1,
    explain: 'Your three weekly numbers to start: conversations, appointments set and follow-ups completed. All three are leading indicators.',
  },
  {
    id: 'ch1.leading-lagging.flat-closings', version: 1, concept: 'ch1.leading-lagging', kind: 'mcq', draft: true, scenario: true,
    prompt: 'Your conversations have been up for three weeks running, but no new closings have come in. What does the chapter say to do?',
    options: [
      'Reset your goals on closings so you notice the gap',
      'Drop your lead sources and start over with new ones',
      'Cut back on activity until the market turns',
      'Keep goals on activity; closings lag 60 to 120 days',
    ],
    answer: 3,
    explain: 'Closings do not respond for 60 to 120 days. Set your goals on activity, review them weekly, and let the closings arrive on their own schedule.',
  },

  // ---- ch1.goal-ladder
  {
    id: 'ch1.goal-ladder.conversations-year', version: 1, concept: 'ch1.goal-ladder', kind: 'mcq', draft: true,
    prompt: 'In Table 1.1\'s example, 13 closings at about 3 appointments per closing and about 20 conversations per appointment need about how many conversations in the year?',
    options: ['39', '260', '780', '1,560'],
    answer: 2,
    explain: '13 closings x 3 = 39 appointments, and 39 x 20 = about 780 conversations: about 16 a week over 48 working weeks, or 3 to 4 a day.',
  },
  {
    id: 'ch1.goal-ladder.own-ratio', version: 1, concept: 'ch1.goal-ladder', kind: 'mcq', draft: true, scenario: true,
    prompt: 'After your first year, your own tracking shows about eight conversations per appointment, not the example\'s 20. What does the chapter say?',
    options: [
      'Build your daily plan from your own ratio',
      'Keep using 20 until your first year is up',
      'Raise your income goal to match the ratio',
      'Drop the daily target and track closings',
    ],
    answer: 0,
    explain: 'Use your own local numbers and track your own ratios. If your ratio turns out to be eight conversations per appointment, your daily plan writes itself from that number.',
  },
  {
    id: 'ch1.goal-ladder.worst-day', version: 1, concept: 'ch1.goal-ladder', kind: 'blank', draft: true,
    before: 'Work backward from income to a daily conversation target you can hit on your', after: 'day.',
    answer: 'worst', accept: ['worst', 'bad', 'worst day', 'bad day'],
    explain: 'A daily target you can hit on a bad day is worth more than a heroic target you hit twice and abandon.',
  },

  // ---- ch1.runway
  {
    id: 'ch1.runway.formula', version: 1, concept: 'ch1.runway', kind: 'mcq', draft: true,
    prompt: 'How does Table 1.2 work out the runway you need?',
    options: [
      'Monthly business costs times twelve months',
      'Living costs divided by your average commission',
      'Your first commission minus a year of costs',
      '(Business + living costs) x months to first check',
    ],
    answer: 3,
    explain: 'Runway needed is (business costs + living costs) x months to first check. Savings, a working partner or part-time income has to cover it.',
  },
  {
    id: 'ch1.runway.check-order', version: 1, concept: 'ch1.runway', kind: 'mcq', draft: true,
    prompt: 'In what order does the chapter say to divide each commission check?',
    options: [
      'Pay yourself, then taxes, then the business',
      'Taxes first, a tenth to the business, then you',
      'The business, then pay yourself, then taxes',
      'Pay and taxes evenly, the business from the rest',
    ],
    answer: 1,
    explain: 'Set aside a share for taxes first (a tax professional sets the share), then a tenth for the business, then pay yourself.',
  },
  {
    id: 'ch1.runway.example', version: 1, concept: 'ch1.runway', kind: 'mcq', draft: true, scenario: true,
    prompt: 'Your business costs are $600 a month, your living costs $3,400 a month, and you plan on 5 months to your first check. What runway does Table 1.2 say you need?',
    options: ['$3,000', '$4,000', '$17,000', '$20,000'],
    answer: 3,
    explain: '($600 + $3,400) x 5 = $20,000. Months to first check is planned at four to six, because closings lag activity and a contract takes another 30 to 45 days to close.',
  },

  // ---- ch1.crm-headquarters
  {
    id: 'ch1.crm-headquarters.first-three', version: 1, concept: 'ch1.crm-headquarters', kind: 'mcq', draft: true,
    prompt: 'Which are the first three things to check in your CRM each morning?',
    options: [
      'Your inbox, social notifications and the MLS',
      'Last month\'s closings, commission and listings',
      'Your calendar, your weekly scorecard and your marketing',
      'Overnight leads, tasks due today, moved Opportunities',
    ],
    answer: 3,
    explain: 'The first three things to check are the new leads that arrived overnight, the tasks due today, and the Opportunities that moved. Chapter 4 builds the full daily rhythm around them.',
  },
  {
    id: 'ch1.crm-headquarters.first-90-days', version: 1, concept: 'ch1.crm-headquarters', kind: 'blank', draft: true,
    before: 'The habit that matters most in your first', after: 'days is opening your CRM first thing every morning and updating it before you stop working.',
    answer: '90', accept: ['90', 'ninety'],
    explain: 'The habit that matters most in your first 90 days is simple: open your CRM first thing every morning and update it before you stop working.',
  },
  {
    id: 'ch1.crm-headquarters.sticky-notes', version: 1, concept: 'ch1.crm-headquarters', kind: 'mcq', draft: true, scenario: true,
    prompt: 'A new agent keeps contacts in their phone, on sticky notes and in their inbox instead of the CRM. What does the chapter predict?',
    options: [
      'They will forget contacts and fall behind within a quarter',
      'It works fine until the database passes a few hundred names',
      'Nothing, as long as they back up their phone each week',
      'They will be slower, but no leads will actually be lost',
    ],
    answer: 0,
    explain: 'Contacts that live in your phone, sticky notes and inbox are contacts you will forget. Without the CRM habit you fall behind within a quarter, and the leads you lose are hard to win back.',
  },
  // end ch1
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
  // ch6
  // ---- ch6.next-step
  {
    id: 'ch6.next-step.worked', version: 1, concept: 'ch6.next-step', kind: 'mcq', draft: true,
    prompt: 'How do you know a script worked?',
    options: [
      'You said every word exactly as it is written',
      'The conversation reached the script\'s next step',
      'You got through the whole script without a pause',
      'The other person stayed on the line to the end',
    ],
    answer: 1,
    explain: 'Each script has a purpose and a next step. If you reach the next step, the script worked, even if you said none of the exact words.',
  },
  {
    id: 'ch6.next-step.keep-in-mind', version: 1, concept: 'ch6.next-step', kind: 'mcq', draft: true, scenario: true,
    prompt: 'You use the sphere referral ask on a friend, who answers "I\'ll keep you in mind" but gives no name. How did the script do?',
    options: [
      'It failed, because the purpose was a name',
      'It failed, so ask again until you get a name',
      'It worked only if you also booked a coffee',
      'It worked: that reply is one of its next steps',
    ],
    answer: 3,
    explain: 'The referral ask\'s next step is a name and permission to reach out, or "I\'ll keep you in mind." Either is a win. Thank them and keep in touch.',
  },

  // ---- ch6.rehearsal
  {
    id: 'ch6.rehearsal.record', version: 1, concept: 'ch6.rehearsal', kind: 'mcq', draft: true,
    prompt: 'Why does the chapter have you record yourself saying a script and listen back?',
    options: [
      'To send your broker proof that you practiced',
      'To save one voicemail you can reuse for every lead',
      'You will hear every place where you rush or apologize',
      'To learn the script word for word before using it',
    ],
    answer: 2,
    explain: 'Record yourself on your phone and listen back; you will hear every place where you rush or apologize.',
  },
  {
    id: 'ch6.rehearsal.read-five-times', version: 1, concept: 'ch6.rehearsal', kind: 'mcq', draft: true, scenario: true,
    prompt: 'You have read the new-lead script five times and feel ready to call. What does the chapter say is still missing?',
    options: [
      'Nothing: five careful reads are enough to know it',
      'Memorizing it until you can recite each word exactly',
      'A printed copy to read from while you are on the call',
      'Saying it aloud in your own words and recording it',
    ],
    answer: 3,
    explain: 'Practice out loud and on recording. Reading is not rehearsal. The loop is read, rewrite, say aloud, record, listen, repeat.',
  },
  {
    id: 'ch6.rehearsal.no-paper', version: 1, concept: 'ch6.rehearsal', kind: 'blank', draft: true,
    before: 'Read a script, rewrite it in your own words, then say it out loud until you do not need the', after: '.',
    answer: 'paper', accept: ['paper', 'the paper', 'page', 'the page'],
    explain: 'The aim is to say it in your own words, not to read it: the checkpoint asks whether you can deliver the seller consultation opening without looking at the page.',
  },

  // ---- ch6.three-rules
  {
    id: 'ch6.three-rules.which', version: 1, concept: 'ch6.three-rules', kind: 'mcq', draft: true,
    prompt: 'Which three rules does the chapter say to read every script by?',
    options: [
      'Be specific, ask one question, stop talking',
      'Be brief, be friendly, be persistent',
      'Open warmly, state your value, close firmly',
      'Ask permission, give value, ask for business',
    ],
    answer: 0,
    explain: 'Every script follows them: name, specific detail, one question, then silence.',
  },
  {
    id: 'ch6.three-rules.one-question', version: 1, concept: 'ch6.three-rules', kind: 'mcq', draft: true,
    prompt: 'Why should every message you write end on one question?',
    options: [
      'Several questions in a row make you look unprepared',
      'A message with no question rarely gets a reply',
      'A question lets you skip their name and the detail',
      'A question keeps the call short enough to be polite',
    ],
    answer: 1,
    explain: 'Ask one question at the end. A message with no question rarely gets a reply.',
  },
  {
    id: 'ch6.three-rules.silence', version: 1, concept: 'ch6.three-rules', kind: 'blank', draft: true,
    before: 'After you ask your one question, stop talking and wait.', after: 'is where the other person decides to engage.',
    answer: 'Silence', accept: ['silence'],
    explain: 'The third rule is to stop talking: after the question, wait.',
  },

  // ---- ch6.new-lead-openers
  {
    id: 'ch6.new-lead-openers.late-call', version: 1, concept: 'ch6.new-lead-openers', kind: 'mcq', draft: true, scenario: true,
    prompt: 'You are calling a new lead two days after the inquiry came in. What does the chapter say to change in the phone script?',
    options: [
      'Drop the address and ask about their budget instead',
      'Switch to an automated text, since the call is late',
      'Say "following up on your inquiry" instead of "I just saw"',
      'Apologize for the delay before you give your name',
    ],
    answer: 2,
    explain: 'If you are calling later than the same day, say "following up on your inquiry" instead of "I just saw".',
  },
  {
    id: 'ch6.new-lead-openers.voicemail-length', version: 1, concept: 'ch6.new-lead-openers', kind: 'mcq', draft: true,
    prompt: 'How long should a no-answer voicemail to a new lead be?',
    options: [
      'About a minute, so you can cover your services',
      'As long as it takes to name three listings',
      'No voicemail at all: hang up and text instead',
      'Under 20 seconds, so it stays easy to answer',
    ],
    answer: 3,
    explain: 'Purpose: be specific and easy to answer. Next step: a callback, or your next scheduled touch. Keep it under 20 seconds.',
  },
  {
    id: 'ch6.new-lead-openers.name-the-property', version: 1, concept: 'ch6.new-lead-openers', kind: 'mcq', draft: true,
    prompt: 'The new-lead call, voicemail and text all name the address or area the lead asked about. Why?',
    options: [
      'It proves you read their inquiry',
      'It shows how many listings you have',
      'It replaces the need to ask a question',
      'It is what makes a text legal to send',
    ],
    answer: 0,
    explain: 'Say their name and the specific thing they asked about. Specificity proves you read the inquiry.',
  },

  // ---- ch6.give-before-asking
  {
    id: 'ch6.give-before-asking.announcement', version: 1, concept: 'ch6.give-before-asking', kind: 'mcq', draft: true,
    prompt: 'What is the purpose of the sphere announcement?',
    options: [
      'Ask each person for the name of someone buying now',
      'Book a listing appointment with anyone thinking of selling',
      'Collect an email address for your monthly newsletter',
      'Tell people warmly, without asking for business',
    ],
    answer: 3,
    explain: 'Purpose: tell people, warmly, without asking for business. Next step: a real conversation, logged as a conversation, not a pitch.',
  },
  {
    id: 'ch6.give-before-asking.when-to-ask', version: 1, concept: 'ch6.give-before-asking', kind: 'mcq', draft: true, scenario: true,
    prompt: 'Someone on your sphere list has just heard your announcement. When does the chapter say to use the referral ask with them?',
    options: [
      'In the same conversation, while you have their attention',
      'After you have given them two or three helpful touches',
      'Only once they have bought or sold a home with you',
      'Before you send them anything, so they know your goal',
    ],
    answer: 1,
    explain: 'Use the sphere referral ask after you have given two or three helpful touches (Chapter 2).',
  },
  {
    id: 'ch6.give-before-asking.referral-fees', version: 1, concept: 'ch6.give-before-asking', kind: 'blank', draft: true,
    before: 'Before any money or favors change hands with a lender or attorney you refer clients to, ask your', after: 'about referral-fee rules.',
    answer: 'broker', accept: ['broker', 'your broker'],
    explain: 'The referral partner introduction opens a two-way relationship by giving first; the money side is a question for your broker.',
  },

  // ---- ch6.after-the-sale
  {
    id: 'ch6.after-the-sale.one-week-next-step', version: 1, concept: 'ch6.after-the-sale', kind: 'mcq', draft: true,
    prompt: 'What next step does the one-week call after closing aim for?',
    options: [
      'A review on your Agent Site while the move is still fresh',
      'The name of a friend who might be thinking of moving',
      'An introduction from your vendor list, or "all good"',
      'A signed agreement to list their next home with you',
    ],
    answer: 2,
    explain: 'Purpose: catch problems while you can still help. Next step: an introduction from your vendor list, or "all good" and the 30-day call stays on the calendar. Ask for nothing on this call.',
  },
  {
    id: 'ch6.after-the-sale.thirty-day-next-step', version: 1, concept: 'ch6.after-the-sale', kind: 'mcq', draft: true,
    prompt: 'What next step does the 30-day review request aim for?',
    options: [
      'A review posted within a week, or a named reason why not',
      'A listing appointment for the home they just moved out of',
      'A review you write for them to approve and post as theirs',
      'A sign-up for your monthly market newsletter by email',
    ],
    answer: 0,
    explain: 'Purpose: turn a happy client into public proof. Next step: a review posted within a week, or a named reason why not. Ask only clients you served, and never write or trade reviews.',
  },
  {
    id: 'ch6.after-the-sale.quarterly', version: 1, concept: 'ch6.after-the-sale', kind: 'blank', draft: true,
    before: 'The quarterly call to your whole database has one reason, one fact and one', after: '.',
    answer: 'question', accept: ['question'],
    explain: 'Stay useful to the whole database four times a year, with a reason each time. Next step: a life change you log in your CRM, or next quarter\'s call stays scheduled.',
  },
  // end ch6
  // ch7
  {
    id: 'ch7.six-errors.scattered', version: 1, concept: 'ch7.six-errors', kind: 'mcq', draft: true,
    prompt: 'Your contacts are in your phone, your notes are in email and your tasks are in your head. Which of the six errors is that?',
    options: ['Under-documenting', 'Unstructured days', 'No system or database hygiene', 'Slow or inconsistent follow-up'],
    answer: 2,
    explain: 'It costs lost leads, missed anniversaries and no way to measure. The fix is everything in your CRM, every day (Chapter 4).',
  },
  {
    id: 'ch7.six-errors.fee-in-writing', version: 1, concept: 'ch7.six-errors', kind: 'mcq', draft: true, scenario: true,
    prompt: 'A client says "you told me the fee was negotiable," and you have nothing in writing. Which error caught up with you?',
    options: ['Expecting results too fast', 'Under-documenting', 'Slow or inconsistent follow-up', 'Unstructured days'],
    answer: 1,
    explain: 'Under-documenting costs risk, disputes and forgotten details that lose trust. The fix is notes in your CRM after every conversation (Chapter 11).',
  },
  {
    id: 'ch7.six-errors.quitting-cost', version: 1, concept: 'ch7.six-errors', kind: 'blank', draft: true,
    before: 'Expecting results too fast costs you this: quitting at the exact point the', after: 'would have paid.',
    answer: 'pipeline', accept: ['pipeline', 'the pipeline', 'your pipeline'],
    explain: 'It looks like being discouraged after 30 days with no closing, so activity drops. The fix is tracking leading indicators, reviewing weekly and a 90-day horizon.',
  },

  {
    id: 'ch7.belief-not-habit.different', version: 1, concept: 'ch7.belief-not-habit', kind: 'mcq', draft: true,
    prompt: 'Five of the six errors are habits. What makes "expecting results too fast" different?',
    options: [
      'It only affects agents who buy online leads',
      'It is a habit that only willpower can fix',
      'It is a belief, and information is what fixes it',
      'It fixes itself once the first closing arrives',
    ],
    answer: 2,
    explain: 'A system fixes habits. This one is a belief, and what fixes it is information: the 90-day timeline in Chapter 12.',
  },
  {
    id: 'ch7.belief-not-habit.system-fixes', version: 1, concept: 'ch7.belief-not-habit', kind: 'blank', draft: true,
    before: 'Five of the six errors are habits, and a', after: 'fixes habits.',
    answer: 'system', accept: ['system'],
    explain: 'The correction works not because you become a different person, but because the system does the remembering.',
  },
  {
    id: 'ch7.belief-not-habit.information', version: 1, concept: 'ch7.belief-not-habit', kind: 'mcq', draft: true, scenario: true,
    prompt: 'You are 30 days in with no closing and starting to think this is not working. What does the chapter say fixes that belief?',
    options: [
      'Buying more leads so a closing comes sooner',
      'The 90-day timeline in Chapter 12',
      'Working longer days until a contract arrives',
      'Switching to a different CRM',
    ],
    answer: 1,
    explain: 'Expecting results too fast is a belief, not a habit, and what fixes it is information, namely the 90-day timeline in Chapter 12.',
  },

  {
    id: 'ch7.pitfall-cycle.order', version: 1, concept: 'ch7.pitfall-cycle', kind: 'mcq', draft: true,
    prompt: 'Which sequence matches the loop the chapter describes?',
    options: [
      'Unstructured days, then paying for leads, then under-documenting, then slow follow-up',
      'Lost leads, then under-documenting, then paying for leads, then discouragement',
      'Slow follow-up, then lost leads, then an empty pipeline, then discouragement',
      'Discouragement, then paying for leads, then slow follow-up, then an empty pipeline',
    ],
    answer: 2,
    explain: 'Slow follow-up loses leads, lost leads mean an empty pipeline, an empty pipeline is discouraging, discouragement makes the day unstructured, and an unstructured day produces slow follow-up.',
  },
  {
    id: 'ch7.pitfall-cycle.bad-year', version: 1, concept: 'ch7.pitfall-cycle', kind: 'mcq', draft: true,
    prompt: 'Why can a bad month turn into a bad year, according to the chapter?',
    options: [
      'Each error takes about a year to unlearn',
      'Leads from a slow month stay cold for a year',
      'Brokers stop helping agents who start slowly',
      'The errors reinforce one another in a loop',
    ],
    answer: 3,
    explain: 'New agents fall into the same six traps and they reinforce one another. The loop runs on its own once it starts.',
  },
  {
    id: 'ch7.pitfall-cycle.closes-loop', version: 1, concept: 'ch7.pitfall-cycle', kind: 'blank', draft: true,
    before: 'Discouragement makes the day unstructured, and an unstructured day produces slow', after: ', which starts the loop again.',
    answer: 'follow-up', accept: ['follow-up', 'follow up', 'followup', 'follow-ups', 'follow ups'],
    explain: 'These are not six separate problems. The loop runs on its own once it starts, which is why installing a simple system breaks it at its first link.',
  },

  {
    id: 'ch7.one-correction.not-a-part', version: 1, concept: 'ch7.one-correction', kind: 'mcq', draft: true,
    prompt: 'Which of these is not one of the four parts of the one correction?',
    options: [
      'Buy a larger batch of online leads',
      'Install your CRM and follow-up plans',
      'Protect a daily prospecting and follow-up block',
      'Review every Friday',
    ],
    answer: 0,
    explain: 'The four parts: install your CRM and follow-up plans, protect a daily prospecting and follow-up block, track activity not closings, and review every Friday.',
  },
  {
    id: 'ch7.one-correction.structure', version: 1, concept: 'ch7.one-correction', kind: 'mcq', draft: true,
    prompt: 'Why does a protected daily prospecting and follow-up block help, according to the chapter?',
    options: [
      'It adds hours to your working day',
      'Structure replaces willpower',
      'Clients stop calling during that time',
      'It lets you skip the Friday review',
    ],
    answer: 1,
    explain: 'You do not need willpower. You need a system that makes the errors hard to commit, and a protected block is part of it.',
  },
  {
    id: 'ch7.one-correction.track-activity', version: 1, concept: 'ch7.one-correction', kind: 'mcq', draft: true,
    prompt: 'What does tracking activity instead of closings give you while you wait for results?',
    options: [
      'A guarantee of at least one closing within 30 days',
      'A reason to skip the daily block when busy',
      'Proof for your broker that you need more leads',
      'Weekly progress you can see, so the wait is bearable',
    ],
    answer: 3,
    explain: 'Track activity, not closings. You can see progress every week, so the 90-day wait is bearable.',
  },

  {
    id: 'ch7.diagnose-week.logo', version: 1, concept: 'ch7.diagnose-week', kind: 'mcq', draft: true, scenario: true,
    prompt: 'Sam spent Tuesday morning on a logo. Which of the six errors is that closest to?',
    options: ['Under-documenting', 'No system or database hygiene', 'Unstructured days', 'Paying for leads too early'],
    answer: 2,
    explain: 'The chapter leaves Sam\'s week for you to diagnose. A morning on a logo is busy work, not conversations, which matches "Unstructured days" in Table 7.1: busy all day with errands, social media and email; zero conversations. The fix is a time-blocked daily rhythm (Chapter 8).',
  },
  {
    id: 'ch7.diagnose-week.friday', version: 1, concept: 'ch7.diagnose-week', kind: 'mcq', draft: true, scenario: true,
    prompt: 'Sam skipped the pipeline review on Friday. Which part of the one correction is missing?',
    options: [
      'Review every Friday',
      'Install your CRM and follow-up plans',
      'Track activity, not closings',
      'Protect a daily prospecting and follow-up block',
    ],
    answer: 0,
    explain: 'Review every Friday: small drifts get corrected before they become habits.',
  },
  {
    id: 'ch7.diagnose-week.thirty-days', version: 1, concept: 'ch7.diagnose-week', kind: 'mcq', draft: true, scenario: true,
    prompt: 'Sam has closed nothing in 30 days, had no appointment on Thursday and felt low. Which error is Sam at risk of?',
    options: ['Under-documenting', 'Paying for leads too early', 'No system or database hygiene', 'Expecting results too fast'],
    answer: 3,
    explain: 'The chapter leaves Sam\'s week for you to diagnose. No closing in the first 30 days and feeling low matches "Expecting results too fast" in Table 7.1: discouraged after 30 days with no closing; activity drops.',
  },

  {
    id: 'ch7.self-score.how', version: 1, concept: 'ch7.self-score', kind: 'mcq', draft: true,
    prompt: 'How does the chapter\'s Try It ask you to score yourself on the six errors?',
    options: [
      'Pass or fail on each error over the last year',
      '1 (never) to 5 (every day) over the last two weeks',
      '1 to 10 on how you feel about this week',
      'By counting your closings in the last 30 days',
    ],
    answer: 1,
    explain: 'Score yourself honestly on each of the six errors from 1 (never) to 5 (every day), using the last two weeks, and write one example beside each score.',
  },
  {
    id: 'ch7.self-score.highest', version: 1, concept: 'ch7.self-score', kind: 'mcq', draft: true,
    prompt: 'You have scored yourself. What does the chapter say to do with your highest score?',
    options: [
      'Do the exercise in the chapter its Fix column names',
      'Work on all six errors at once, starting this week',
      'Wait for your first closing, then come back to it',
      'Leave it unless your broker gives you the same score',
    ],
    answer: 0,
    explain: 'If the fix points ahead in the book, do its Try It now and return to the chapter later. Then ask your broker, a mentor or an accountability partner to score you too, and compare.',
  },
  // end ch7
  // ch8
  // ---- ch8.one-source-of-truth
  {
    id: 'ch8.one-source-of-truth.second-list', version: 1, concept: 'ch8.one-source-of-truth', kind: 'mcq', draft: true,
    prompt: 'Why does the chapter warn against keeping a second contact list next to your CRM?',
    options: [
      'Your broker\'s data rules forbid any list outside the CRM',
      'You have two places to check, and one will be wrong',
      'Your CRM deletes contacts it finds elsewhere',
      'A paper list cannot hold notes or tasks',
    ],
    answer: 1,
    explain: 'The moment you keep a second list, you have two places to check and one of them will be wrong.',
  },
  {
    id: 'ch8.one-source-of-truth.what-lives', version: 1, concept: 'ch8.one-source-of-truth', kind: 'mcq', draft: true,
    prompt: 'Which of these belongs in your CRM?',
    options: [
      'Only active clients and your hottest leads',
      'Contacts, with tasks kept in a planner',
      'The important contacts and your notes on them',
      'Every contact, note, task and opportunity',
    ],
    answer: 3,
    explain: 'Every contact, note, task and opportunity lives in your CRM. Not some of them. Not the important ones. All of them.',
  },

  // ---- ch8.morning-block
  {
    id: 'ch8.morning-block.same-place', version: 1, concept: 'ch8.morning-block', kind: 'mcq', draft: true,
    prompt: 'Why does the weekly time block put lead generation in the same place every day?',
    options: [
      'So it never depends on how you feel',
      'So clients know when to book showings',
      'Because most new leads arrive in the morning',
      'So your broker can check on your calls',
    ],
    answer: 0,
    explain: 'Table 8.1: lead generation sits in the same place every day so it never depends on how you feel.',
  },
  {
    id: 'ch8.morning-block.tell-people', version: 1, concept: 'ch8.morning-block', kind: 'mcq', draft: true, scenario: true,
    prompt: 'Your lender asks to talk at 10:00, in the middle of your prospecting block. What does the chapter suggest?',
    options: [
      'Take the call, since lenders are often hard to reach later',
      'Skip the block today and make it up on Friday',
      'Say you are with clients until 11:00 and offer 1:00',
      'Let it ring and call back at the end of the day',
    ],
    answer: 2,
    explain: 'Protect the block by telling people about it. "I\'m with clients until 11:00, can we talk at 1?" trains your sphere, your lender and your family to expect it.',
  },
  {
    id: 'ch8.morning-block.blocks-held', version: 1, concept: 'ch8.morning-block', kind: 'blank', draft: true,
    before: 'Table 8.2 asks you to hold the 90-minute prospecting block, before 11:00, on at least', after: 'of the five weekdays.',
    answer: 'four', accept: ['four', '4'],
    explain: 'The weekly target for morning blocks held (out of 5) is 4+.',
  },

  // ---- ch8.weekly-targets
  {
    id: 'ch8.weekly-targets.first-30-days', version: 1, concept: 'ch8.weekly-targets', kind: 'mcq', draft: true,
    prompt: 'In your first 30 days, where in each Table 8.2 range should you aim?',
    options: [
      'At the top of every range, from the first week',
      'Wherever you like, as long as closings are on track',
      'Below every range until your first closing arrives',
      'At the lower end, raising it as confidence grows',
    ],
    answer: 3,
    explain: 'Start at the lower end of each range in your first 30 days while the habit and the system settle in, then raise them as your confidence grows.',
  },
  {
    id: 'ch8.weekly-targets.not-core', version: 1, concept: 'ch8.weekly-targets', kind: 'mcq', draft: true,
    prompt: 'Which of these is not one of the five core numbers the chapter suggests tracking when thirteen rows is too many?',
    options: ['Conversations', 'Outbound calls', 'Morning blocks held', 'New contacts added'],
    answer: 1,
    explain: 'The five core numbers are conversations, appointments set, follow-ups completed, new contacts added and morning blocks held. Outbound calls stay on the Appendix A scorecard for when the habit is steady.',
  },
  {
    id: 'ch8.weekly-targets.new-contacts', version: 1, concept: 'ch8.weekly-targets', kind: 'blank', draft: true,
    before: 'Table 8.2 sets a weekly target of', after: 'new contacts added, each one tagged with a source.',
    answer: '15', accept: ['15', 'fifteen'],
    explain: 'New contacts added is one of the five core numbers; review it with the rest every Friday.',
  },

  // ---- ch8.appointment-ratio
  {
    id: 'ch8.appointment-ratio.why-one-or-two', version: 1, concept: 'ch8.appointment-ratio', kind: 'mcq', draft: true,
    prompt: 'Why is the weekly target for appointments set only 1 to 2?',
    options: [
      'About 20 conversations per appointment gives roughly one a week',
      'New agents should never take on more than two clients at a time',
      'Brokers cap appointments for agents in their first year',
      'More appointments would crowd out the morning block',
    ],
    answer: 0,
    explain: 'At about 20 conversations per appointment, 15 to 25 conversations a week produce roughly one appointment a week, so a new agent should aim for one or two, not a handful.',
  },
  {
    id: 'ch8.appointment-ratio.twenty', version: 1, concept: 'ch8.appointment-ratio', kind: 'blank', draft: true,
    before: 'Unless your own ratio is better, the chapter works from about', after: 'conversations per appointment.',
    answer: '20', accept: ['20', 'twenty'],
    explain: 'The appointment target comes from the same method as Chapter 1.',
  },

  // ---- ch8.leading-indicators
  {
    id: 'ch8.leading-indicators.closings-fail', version: 1, concept: 'ch8.leading-indicators', kind: 'mcq', draft: true,
    prompt: 'Why does a scoreboard of closings alone wear down a new agent\'s motivation?',
    options: [
      'Closings are hard to count accurately',
      'Your broker already tracks closings, so yours adds nothing',
      'Closings depend only on the market, not on you',
      'Closings can sit at zero for months while you work',
    ],
    answer: 3,
    explain: 'Motivation fails when you measure the wrong thing. Leading indicators move every day you do the work.',
  },
  {
    id: 'ch8.leading-indicators.friday-review', version: 1, concept: 'ch8.leading-indicators', kind: 'mcq', draft: true,
    prompt: 'What does the Friday review end with?',
    options: [
      'Plan every call for next week, then keep working through Saturday',
      'Email your numbers to your broker for sign-off',
      'Decide one thing to do differently, then stop until Monday',
      'Count closings and compare them with the office',
    ],
    answer: 2,
    explain: 'Compare this week\'s numbers to last week\'s. Decide one thing to do differently. Then stop working on it until Monday.',
  },
  {
    id: 'ch8.leading-indicators.habits', version: 1, concept: 'ch8.leading-indicators', kind: 'mcq', draft: true,
    prompt: 'Which is one of the three habits the chapter says protect motivation?',
    options: [
      'Work through the weekend after a slow week',
      'Check your closings total every morning',
      'Celebrate small wins, like a booked appointment',
      'Keep a private list of your very best leads outside the CRM',
    ],
    answer: 2,
    explain: 'The three habits: celebrate small wins, review every Friday, and stay close to the office.',
  },

  // ---- ch8.quiet-days
  {
    id: 'ch8.quiet-days.first-action', version: 1, concept: 'ch8.quiet-days', kind: 'mcq', draft: true, scenario: true,
    prompt: 'It is a day with no conversations. What does the chapter say to start with?',
    options: [
      'Fifty cold calls in a row, to force at least one conversation',
      'A text, not a call: the lowest-barrier task',
      'Rewriting your bio and website copy',
      'Waiting until the afternoon to try again',
    ],
    answer: 1,
    explain: 'Start with the lowest-barrier task: a text, not a call. One reply is enough to restart the day.',
  },
  {
    id: 'ch8.quiet-days.colleague', version: 1, concept: 'ch8.quiet-days', kind: 'mcq', draft: true, scenario: true,
    prompt: 'On Friday you hear that a colleague closed first. What should you compare their result to?',
    options: ['Your closings so far', 'Their lead sources', 'The office average for new agents', 'Your leading indicators'],
    answer: 3,
    explain: 'Their closing is the product of work they did months ago. Yours is on the way.',
  },
  {
    id: 'ch8.quiet-days.pitfall', version: 1, concept: 'ch8.quiet-days', kind: 'mcq', draft: true,
    prompt: 'What mistake turns a slow week into a slow month?',
    options: [
      'Waiting for things to pick up on their own',
      'Calling too many people in a single day',
      'Telling your broker about the slow week',
      'Taking the weekend off after the Friday review',
    ],
    answer: 0,
    explain: 'Nothing picks up on its own. Go back to the morning block and the daily number; the market usually responds to activity.',
  },
  // end ch8
  // ch9
  // ---- ch9.consultation-steps
  {
    id: 'ch9.consultation-steps.order', version: 1, concept: 'ch9.consultation-steps', kind: 'mcq', draft: true,
    prompt: 'In what order do the five steps of a buyer or seller consultation run?',
    options: ['Frame, present, ask, listen, agree', 'Frame, ask, listen, present, agree', 'Ask, listen, frame, agree, present', 'Present, frame, ask, agree, listen'],
    answer: 1,
    explain: 'Both buyer and seller consultations follow the same shape: set the frame, ask, listen, present, agree on next steps.',
  },
  {
    id: 'ch9.consultation-steps.seller-present', version: 1, concept: 'ch9.consultation-steps', kind: 'mcq', draft: true, scenario: true,
    prompt: 'In a seller consultation, you walk through comparable sales, your pricing recommendation and the reasoning, and your marketing plan. Which step is that?',
    options: ['Frame', 'Ask', 'Agree', 'Present'],
    answer: 3,
    explain: 'In a seller consultation, Present covers comparable sales, your pricing recommendation and the reasoning, your marketing plan and what happens week by week.',
  },
  {
    id: 'ch9.consultation-steps.buyer-agree', version: 1, concept: 'ch9.consultation-steps', kind: 'blank', draft: true,
    before: 'A buyer consultation ends at the Agree step with a buyer representation agreement, a lender introduction and a first', after: 'date.',
    answer: 'showing', accept: ['showing'],
    explain: 'Agree for a buyer: buyer representation agreement, lender introduction, first showing date. For a seller: listing agreement, price, photography date, go-live date.',
  },

  // ---- ch9.ask-before-presenting
  {
    id: 'ch9.ask-before-presenting.half', version: 1, concept: 'ch9.ask-before-presenting', kind: 'mcq', draft: true,
    prompt: 'How much of a consultation should the Ask and Listen steps take?',
    options: ['A few minutes before you present', 'Whatever time is left after presenting', 'At least half the meeting', 'Only the last few minutes'],
    answer: 2,
    explain: 'Steps 2 and 3, Ask and Listen, should take at least half the meeting.',
  },
  {
    id: 'ch9.ask-before-presenting.skip', version: 1, concept: 'ch9.ask-before-presenting', kind: 'mcq', draft: true,
    prompt: 'What does the chapter say happens to agents who skip the asking and go straight to presenting?',
    options: [
      'They lose the client\'s trust before earning it',
      'They win the client by showing expertise early',
      'They save time for a longer agreement step',
      'Nothing, if the presentation is thorough enough',
    ],
    answer: 0,
    explain: 'Agents who skip the asking and go straight to presenting lose the client\'s trust before they have earned it. A consultation is a conversation, not a pitch.',
  },
  {
    id: 'ch9.ask-before-presenting.repeat-back', version: 1, concept: 'ch9.ask-before-presenting', kind: 'mcq', draft: true, scenario: true,
    prompt: 'A buyer says the school district is the priority and a yard matters more than square footage. What does the Listen step ask you to do next?',
    options: ['Book showings that fit those needs', 'Repeat back what you heard', 'Explain how offers work in this market', 'Ask them to sign the agreement'],
    answer: 1,
    explain: 'Listen means repeating back what you heard: "So the priority is the school district, and a yard matters more than square footage."',
  },

  // ---- ch9.objection-pattern
  {
    id: 'ch9.objection-pattern.steps', version: 1, concept: 'ch9.objection-pattern', kind: 'mcq', draft: true,
    prompt: 'What are the four steps for answering an objection, in order?',
    options: ['Clarify, defend, respond, close', 'Acknowledge, respond, agree, stop', 'Acknowledge, clarify, respond, check', 'Respond, clarify, acknowledge, check'],
    answer: 2,
    explain: 'Acknowledge ("That makes sense"), clarify ("Can I ask what\'s behind that?"), respond to the real concern, and check ("Does that address it?").',
  },
  {
    id: 'ch9.objection-pattern.which-step', version: 1, concept: 'ch9.objection-pattern', kind: 'mcq', draft: true, scenario: true,
    prompt: 'A client says your fee is too high. You reply, "Can I ask what you\'re comparing it to?" Which step is that line?',
    options: ['Acknowledge', 'Clarify', 'Respond', 'Check'],
    answer: 1,
    explain: 'Clarify finds the real concern: another agent\'s quote, a net figure, or a general worry. You respond only once you know which it is.',
  },
  {
    id: 'ch9.objection-pattern.stop', version: 1, concept: 'ch9.objection-pattern', kind: 'blank', draft: true,
    before: 'The last step is to check: "Does that address it?" Then stop', after: '.',
    answer: 'talking', accept: ['talking'],
    explain: 'Most objections are requests for more information or reassurance. Once you have answered the real concern and checked, let the client respond.',
  },

  // ---- ch9.objection-responses
  {
    id: 'ch9.objection-responses.buyer-agreement', version: 1, concept: 'ch9.objection-responses', kind: 'mcq', draft: true, scenario: true,
    prompt: 'A buyer asks, "Why do I have to sign an agreement before you show me homes?" What is the goal of your response?',
    options: [
      'Show a few homes first, then raise the agreement',
      'Call it a formality and move on to scheduling',
      'Offer to skip the agreement for the first showings',
      'Make it a clear expectation and sign before touring',
    ],
    answer: 3,
    explain: 'Explain the rule and what they get: the agreement spells out what you will do and how you are paid. Turn a requirement into a clear expectation, and sign before the first showing. Chapter 11 has the rule; your broker has the form and the timing.',
  },
  {
    id: 'ch9.objection-responses.fee', version: 1, concept: 'ch9.objection-responses', kind: 'mcq', draft: true,
    prompt: 'What does the response framework for "Your fee is too high" focus on?',
    options: [
      'Value and net proceeds, confirmed with your broker',
      'Matching the lowest quote the client has heard',
      'The rate printed on your old listing form',
      'Defending your rate as the standard in your market',
    ],
    answer: 0,
    explain: 'Compensation is something you agree in writing before you start. Show how you work and what they would net, and confirm the structure with your broker: shift from fee to outcome, and do not quote an old listing form.',
  },
  {
    id: 'ch9.objection-responses.think-about-it', version: 1, concept: 'ch9.objection-responses', kind: 'mcq', draft: true,
    prompt: 'A client says, "I need to think about it." What is the goal of the response?',
    options: ['Set a deadline for their decision', 'Agree and wait for them to call', 'Uncover the real objection', 'Offer a lower fee to close now'],
    answer: 2,
    explain: 'Clarify the real concern: "Of course. What specifically would you like to think through? I\'m happy to answer any questions that would help."',
  },

  // ---- ch9.conversation-note
  {
    id: 'ch9.conversation-note.contents', version: 1, concept: 'ch9.conversation-note', kind: 'mcq', draft: true,
    prompt: 'What goes in the CRM note you write after a client conversation?',
    options: [
      'A word-for-word record of everything that was said',
      'Only the numbers: budget, price and fee discussed',
      'The client\'s name and your opinion of the meeting',
      'Date, who, what was discussed, decided, what\'s next',
    ],
    answer: 3,
    explain: 'Date, who, what was discussed, what was decided, what happens next. Write it after every consultation, offer discussion, price change or disclosure conversation.',
  },
  {
    id: 'ch9.conversation-note.length', version: 1, concept: 'ch9.conversation-note', kind: 'blank', draft: true,
    before: 'A good conversation note is', after: 'lines or fewer.',
    answer: '5', accept: ['5', 'five'],
    explain: 'Two minutes of typing is enough, and every conversation gets its note in your CRM the same day.',
  },
  {
    id: 'ch9.conversation-note.why', version: 1, concept: 'ch9.conversation-note', kind: 'mcq', draft: true,
    prompt: 'Why does the chapter say the two minutes spent writing a note are worth it?',
    options: [
      'They protect you from "but you said" and make follow-up specific',
      'They are how your broker decides your commission split each year',
      'They replace the need to send the client anything else in writing',
      'They let you skip the weekly client update while under contract',
    ],
    answer: 0,
    explain: 'Two minutes of typing protects you from "but you said" months later and makes your follow-up specific. Chapter 11 covers what to document for legal protection.',
  },

  // ---- ch9.keep-informed
  {
    id: 'ch9.keep-informed.under-contract', version: 1, concept: 'ch9.keep-informed', kind: 'mcq', draft: true,
    prompt: 'Between the signed agreement and the closing table, what does every client get from you?',
    options: [
      'A call whenever there is news, and quiet otherwise',
      'Updates from whoever on the team is free that week',
      'You as one contact, weekly updates, deadline calls',
      'One summary email sent the week before closing day',
    ],
    answer: 2,
    explain: 'One named point of contact (you), a short update every week even when nothing has changed, and a call before every deadline, each logged in your CRM. A client who is well informed becomes a past client who refers.',
  },
  {
    id: 'ch9.keep-informed.weekly', version: 1, concept: 'ch9.keep-informed', kind: 'blank', draft: true,
    before: 'Between the signed agreement and closing, send every client a short update once a', after: ', even when nothing has changed.',
    answer: 'week', accept: ['week'],
    explain: 'Give every client a short update every week even when nothing has changed, and log it in your CRM.',
  },
  {
    id: 'ch9.keep-informed.closing-table', version: 1, concept: 'ch9.keep-informed', kind: 'mcq', draft: true,
    prompt: 'The after-closing habit starts at the closing table. What three things do you do there?',
    options: [
      'Hand over the keys, ask for a review, then close out the file',
      'Thank them, ask for a new listing, send your fee invoice',
      'Ask for an online review, give a gift, archive the contact',
      'Thank them, ask for the introduction, say you\'ll be in touch',
    ],
    answer: 3,
    explain: 'Thank them, ask for the introduction, and tell them to expect to hear from you. Chapter 10 shows the post-close plan that follows.',
  },
  // end ch9
];
