// Key points for each Checkpoint question, copied unchanged from legacy/js/widgets-practice.js.
// { reflect } marks a personal question that gets a tip instead of key points.
export type CheckpointAnswer = string[] | { reflect: string };

export const CHECKPOINT_ANSWERS: Record<string, CheckpointAnswer[]> = {
    ch1: [
        ['Leading indicators you control: conversations held, appointments set, follow-up tasks completed (contacts added counts too).',
            'None is a closing because closings lag. They do not respond for 60 to 120 days, and goals set only on closings discourage new agents.'],
        ['Work backward: goal ÷ average commission = closings, then × appointments per closing, × conversations per appointment, ÷ working weeks.',
            'With the book\'s example ($80,000 goal, $6,500 commission) that is about 16 conversations a week, or 3 to 4 a day. The calculator above does it with your numbers.'],
        ['Open your CRM first, every morning, and update it before you stop working.',
            'Chapter 4 adds what to look at first: new leads overnight, tasks due today and Opportunities that moved.']
    ],
    ch2: [
        ['Trust is already built, and the cost is only your time.', 'Sphere contacts convert at five to ten times the rate of a portal lead.',
            'Portal inquirers have no relationship with you and have often inquired with several agents at once.'],
        ['Do not buy online leads until your follow-up system is built and tested on your sphere. Speed and a long nurture are what make those leads pay off after that, and Chapter 3 has the test for turning ads on.'],
        ['Follow up with every visitor within 24 hours.', 'A text the same evening and a call the next morning is the standard.',
            'Put every visitor on a follow-up plan.']
    ],
    ch3: [
        ['You are the local expert.', 'You are the person who will take care of them.', 'Then check your own recent posts against both.'],
        ['Coming soon.', 'Just listed.', 'Open house.', 'Under contract.', 'Just sold (the best seller-lead post you can make).'],
        // Question changed after the static site shipped; key points are from the chapter's paid-leads section.
        ['Start small: run one source at a time for 90 days.', 'Track cost per appointment and cost per closed deal before scaling.',
            'Only add paid ads once the 9 p.m. test passes: an immediate automated reply, a call before 9 a.m., and a 90-day plan.']
    ],
    ch4: [
        // Added after the static site shipped: the page gained this question at the front, so the answers below it moved down one.
        ['First minute: the automated first touch goes out on its own (an email, and a text only if you have permission to text).',
            'First five minutes when possible: step out and make the live call. If you are with a client, the automated first touch buys you time.',
            'If you cannot call within the hour: send a personal voice note or, if you have permission to text them, a short text that names the property or area they asked about.',
            'Same day, always: the live call.'],
        ['Profile and Marketing Profile.', 'Import and tag contacts (deduplicate; tag by relationship and source).', 'Create or download follow-up plans.',
            'Set lead routing rules if you are on a team.', 'Customize the Opportunities pipeline.', 'Install the mobile app and turn on notifications.'],
        ['A lead you already have is worth more than one you have not met yet.'],
        ['An automated first touch (text and email) within one minute.', 'A live call within five minutes when possible, and always the same day.']
    ],
    ch5: [
        // Added after the static site shipped, so the answers below it moved down one.
        { reflect: 'Use Table 5.1 to match each source to a plan: the 13-touch new online lead plan for portal, website and ad inquiries, the 8x8 for fresh sphere contacts, and the Quarterly Call Plan for the sphere and past clients. Launch the plan the day the contact arrives.' },
        ['Front-loaded: seven touches in the first 14 days.', 'Mixed channel: calls, texts and emails in rotation.',
            'Value every third touch (touches 3, 6, 9 and 12).', 'Long: 13 touches over at least 90 days, then roll into the quarterly plan.'],
        ['Timeline: when do they want to move?', 'Motivation: why now?', 'Financing: pre-approved, cash, or need a lender introduction?',
            'Representation: is another agent already helping them?'],
        ['No real two-way conversation in 14 days and no scheduled next step.']
    ],
    ch6: [
        ['New lead by phone: a 10-minute conversation now, or a scheduled call today.', 'Voicemail: a callback, or your next scheduled touch.',
            'New lead by text: a time for a call.', 'Sphere announcement: a real conversation.', 'Open house greeting: their name, phone and email, and one concrete follow-up offer.',
            'Expired listing or FSBO: listen, then offer a short conversation.',
            'Sphere referral ask: a name and permission to reach out, or "I\'ll keep you in mind."', 'Buyer consultation opening: their agreement, then your questions.',
            'Seller consultation opening: their goals, then comparables, your marketing plan, then the listing agreement.',
            '"I\'m just looking": their email and a follow-up plan.', 'Post-close referral request: a name, or a review on your Agent Site.'],
        ['Say their name and the specific thing they asked about.', 'Ask one question at the end.', 'Stop talking after the question and wait.'],
        { reflect: 'Use the Practice button on the seller opening to hide the script and say it in your own words. Reading is not rehearsal.' }
    ],
    ch7: [
        { reflect: 'Use the self-score tool in this chapter. Your highest score is where to start, and the table names the chapter that fixes it.' },
        // Question changed after the static site shipped; key points are from the chapter's cycle and the four-part correction.
        ['Each error causes the next, so breaking any one link interrupts the loop at that point.',
            'A protected daily block interrupts unstructured days and slow follow-up, activity tracking interrupts discouragement, and a Friday review catches lost leads and a thin pipeline.',
            'The chapter still installs all four parts together, because the loop is hard to restart once every link is covered.'],
        ['Install your CRM and follow-up plans.', 'Protect a daily prospecting and follow-up block.', 'Track activity, not closings.', 'Review every Friday.']
    ],
    ch8: [
        ['Every contact, note and task lives in your CRM.', 'If a conversation happened and it is not logged, treat it as not having happened and log it now.'],
        ['The morning is the only time of day nobody else wants. Clients, lenders and inspectors will ask for afternoons.',
            'Putting it in the same place every day means it never depends on how you feel.'],
        ['The same rows as Appendix A and Table 8.2: calls 40 to 60, conversations 15 to 25, follow-ups 30 to 50, appointments set 1 to 2, appointments held 1 or more, one open house or event, database updated 5 days, 15 new contacts, 2 posts, morning blocks 4 or more days, pipeline count and value growing, referrals tracked.']
    ],
    ch9: [
        ['Frame, ask, listen, present, agree.', 'Asking and listening (steps 2 and 3) should take at least half the meeting.'],
        ['Acknowledge. Clarify. Respond. Check.'],
        ['The date, who was there, what was discussed, what was decided, and what happens next.']
    ],
    ch10: [
        ['Closing day: handwritten note and small gift; ask for the introduction.', '1 week: a call to catch problems early.',
            '30 days: a call or visit, and ask for a review.', 'Quarterly: a call with a reason.', 'Home anniversary: a card or call with an updated home value.',
            'Annually: a client appreciation event or personal gift.'],
        ['Would the person be glad to receive it if they were never going to move again?'],
        ['Send one useful piece of market information to everyone.', 'Call in small batches with a simple "thinking of you" and one question.',
            'Put everyone you reach back on the quarterly plan.']
    ],
    ch11: [
        ['Usually at first substantive contact, but your state sets the form and the timing.', 'Look both up in your first week and confirm with your broker.'],
        ['Race, color, religion, national origin, sex, familial status and disability.', 'Many states and cities add further protected classes. Ask your broker for yours.'],
        ['Give every client the same third-party sources on schools, crime statistics and amenities. Do not editorialize or describe who lives there. Confirm the wording with your broker.']
    ],
    ch12: [
        ['Day 30: CRM set up, contacts tagged, follow-up plans live, 50 sphere conversations, 1 open house, speed-to-lead tested.',
            'Day 60: morning block held 4 of 5 days, 15 to 25 conversations a week, first consultations held, buyer agreement signed.',
            'Day 90: 5 or more active opportunities, first contract written, post-close plan built, lead sources evaluated.'],
        ['Appendix A, and Table 8.2 is the same list: calls, conversations, follow-ups, appointments set and held, one event, database days, new contacts, posts, morning blocks, pipeline count, pipeline value and referrals.'],
        ['Which source produced the most appointments per hour spent?', 'Which follow-up plan got the most replies?', 'Where did leads stall in the pipeline?',
            'What one change will I make this month?']
    ]
};

export const CHECKPOINT_TOTAL = Object.values(CHECKPOINT_ANSWERS).reduce((n, list) => n + list.length, 0);
