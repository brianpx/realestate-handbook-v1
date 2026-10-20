// Three multiple-choice questions and one fill-in-the-blank per chapter, copied unchanged from
// legacy/js/widgets-practice.js. Every answer comes from the chapter text.
export type Mcq = { q: string; options: string[]; answer: number; explain: string };
export type Blank = { before: string; after: string; answer: string; accept: string[]; explain: string };

export const KNOWLEDGE_CHECKS: Record<string, { mcq: Mcq[]; blank: Blank }> = {
    ch1: {
        mcq: [
            { q: 'Which of these is a leading indicator?',
                options: ['Closings this quarter', 'Commission income', 'Follow-up tasks completed this week', 'Number of listings you hold'], answer: 2,
                explain: 'Closings, commission income and listings held are lagging: they report work that is already weeks or months old. Follow-up tasks are an activity you control today.' },
            { q: 'Using the chapter\'s example ($80,000 income goal, $6,500 average commission per closed side), how many closings do you need?',
                options: ['13', '39', '48', '780'], answer: 0,
                explain: '$80,000 ÷ $6,500 is about 12.3, so plan for 13 closings. The 39 is appointments, the 48 is working weeks and the 780 is conversations.' },
            { q: 'What counts as a "conversation" in Table 1.1?',
                options: ['Any voicemail you leave', 'A real two-way exchange about real estate with someone who could buy, sell or refer',
                    'Every email you send to your database', 'A like or comment on a social post'], answer: 1,
                explain: 'The table says a conversation is a real two-way exchange with a person who could buy, sell or refer, "not a voicemail".' }
        ],
        blank: {
            before: 'Set your goals on', after: 'indicators, review them weekly, and let the closings arrive on their own schedule.',
            answer: 'leading', accept: ['leading', 'leading indicators'],
            explain: 'Closings do not respond for 60 to 120 days, so goals set only on closings discourage new agents.'
        }
    },
    ch2: {
        mcq: [
            { q: 'How much better do sphere contacts convert than portal leads?',
                options: ['About the same', 'Two to three times', 'Five to ten times', 'Fifty times'], answer: 2,
                explain: 'Trust is already built with your sphere and the cost is only time, so the chapter puts their conversion at five to ten times a portal lead.' },
            { q: 'What is the right order for working your sphere?',
                options: ['Ask, give, announce, repeat', 'Give, ask, announce, repeat', 'Announce, ask, give, repeat', 'Announce, give, ask, repeat'], answer: 3,
                explain: 'Announce that you are in real estate, give something useful, ask for introductions after two or three helpful touches, then repeat so nobody hears from you only when you want something.' },
            { q: 'What is the follow-up standard after an open house?',
                options: ['Within 24 hours: a text that evening and a call the next morning', 'Within a week, by mailed postcard', 'Only for visitors who ask you to', 'Within a month, once you have a listing to offer'], answer: 0,
                explain: 'Follow up with every visitor within 24 hours, and put every visitor on a follow-up plan. The visitor who was "just looking" is often the buyer in four months.' }
        ],
        blank: {
            before: 'For each lead source, the number you want is cost per closed', after: ', which includes your time at a rate you choose.',
            answer: 'deal', accept: ['deal', 'a deal'],
            explain: 'Count contacts added, appointments held, closings and dollars spent by source each month. After six months you will know which sources deserve more of your week.'
        }
    },
    ch3: {
        mcq: [
            { q: 'Which two things should your marketing make people feel?',
                options: ['You are the cheapest agent, and you are always available', 'You are the local expert, and you are the person who will take care of them',
                    'You are everywhere, and you are famous', 'You are creative, and you are different'], answer: 1,
                explain: 'The chapter opens with these two feelings. Consistency beats perfection.' },
            { q: 'Which listing post does the chapter call the single best seller-lead post you can make?',
                options: ['Coming soon', 'Just listed', 'Open house', 'Just sold'], answer: 3,
                explain: 'A "just sold" update with a line about how many showings or offers the home received shows neighbors what you can do for them.' },
            { q: 'What should happen if a new lead arrives at 9 p.m. before you start paying for ads?',
                options: ['It waits in a portal queue until Monday', 'You reply by hand and then forget it until next week',
                    'They get an immediate automated reply, a call before 9 a.m., and a 90-day plan', 'You raise the ad budget to attract more leads'], answer: 2,
                explain: 'If your system cannot do that without you having to remember, "buying leads is buying a leak."' }
        ],
        blank: {
            before: 'Paid ads amplify a', after: '. They cannot replace one.',
            answer: 'system', accept: ['system', 'a system'],
            explain: 'Ads are worth it only when your follow-up system is already catching and nurturing leads reliably.'
        }
    },
    ch4: {
        mcq: [
            { q: 'In the daily rhythm, why do follow-ups come before prospecting?',
                options: ['Prospecting calls work better in the afternoon', 'Follow-ups take longer, so they go first',
                    'A lead you already have is worth more than one you have not met yet', 'Your CRM will not let you prospect first'], answer: 2,
                explain: 'The day opens and closes in your CRM, and the order matters because of this reason.' },
            { q: 'What are the two layers of the speed-to-lead standard?',
                options: ['A live call within one minute and an email within a day',
                    'An automated text and email within one minute, then a live call within five minutes when possible, and always the same day',
                    'A voicemail within an hour and a text within a day', 'A personal email within 30 minutes and a call within a week'], answer: 1,
                explain: 'If you are with a client, the automated text buys you time and you call at the first break.' },
            { q: 'When should you add optional tools such as AI texting assistants or dialers?',
                options: ['In your first week', 'As soon as a competitor has one', 'Whenever a vendor offers a free trial',
                    'When your basic CRM system runs cleanly and your lead volume means the tool pays for itself'], answer: 3,
                explain: 'A tool you have not mastered is one more place for a lead to get lost.' }
        ],
        blank: {
            before: 'In the speed-to-lead window, conversion is highest when you respond in under', after: 'minutes.',
            answer: '5', accept: ['5', 'five'],
            explain: 'Figure 4: under five minutes is the highest conversion window, five to 30 minutes is still strong, and after 30 minutes there is a sharp drop-off.'
        }
    },
    ch5: {
        mcq: [
            { q: 'Industry follow-up data says most conversions happen between which contacts?',
                options: ['The first and second', 'The third and fourth', 'The fifth and twelfth', 'The fifteenth and twentieth'], answer: 2,
                explain: 'Most new agents stop after one or two attempts, so they abandon the leads that would have closed for the agent who kept going.' },
            { q: 'Which are the four qualifying questions?',
                options: ['Budget, bedrooms, schools, commute', 'Name, phone, email, address', 'Price, location, size, age', 'Timeline, motivation, financing, representation'], answer: 3,
                explain: 'Work them naturally into your first real conversation and record the answers in your CRM the same day.' },
            { q: 'What earns a lead a Monday call after the Friday pipeline review?',
                options: ['Being in the database for more than a month', 'No real two-way conversation in 14 days and no scheduled next step',
                    'Not having replied to your last email', 'Not having a lender yet'], answer: 1,
                explain: 'This 30-minute habit is the difference between a pipeline and a list of names.' }
        ],
        blank: {
            before: 'A good nurture plan gives something of value every', after: 'touch instead of always asking for something.',
            answer: 'third', accept: ['third', '3rd', '3'],
            explain: 'The four properties are front-loaded, mixed channel, value every third touch (3, 6, 9 and 12), and long (13 touches over at least 90 days).'
        }
    },
    ch6: {
        mcq: [
            { q: 'Which is one of the three rules for any script?',
                options: ['Avoid mentioning what they asked about', 'Ask one question at the end', 'Keep talking until they interrupt', 'Never use their name'], answer: 1,
                explain: 'The three rules: say their name and the specific thing they asked about, ask one question at the end, then stop talking. A message with no question gets no reply.' },
            { q: 'What counts as a win on the sphere referral ask?',
                options: ['A signed listing agreement', 'A five-star review', 'A name and permission to reach out, or "I\'ll keep you in mind"', 'A promise to call you next month'], answer: 2,
                explain: 'Either outcome is a win. Thank them and move on.' },
            { q: 'According to the chapter, when has a script worked?',
                options: ['When you said every word as written', 'When the call lasted at least ten minutes', 'When the person thanked you',
                    'When it reached its next step, even if you said none of the exact words'], answer: 3,
                explain: 'Scripts are starting points, not lines to recite. Read it, rewrite it in your own words, then say it out loud.' }
        ],
        blank: {
            before: 'The third rule for any script is to stop', after: '. After the question, wait.',
            answer: 'talking', accept: ['talking', 'talk'],
            explain: 'Silence is where the other person decides to engage.'
        }
    },
    ch7: {
        mcq: [
            { q: 'How do the six new-agent errors relate to each other?',
                options: ['They are unrelated, so fix them one by one', 'They reinforce one another in a cycle', 'Only the first one matters', 'They only happen in the first month'], answer: 1,
                explain: 'Slow follow-up loses leads, an empty pipeline is discouraging, discouragement makes days unstructured, and unstructured days produce slow follow-up. That is why a bad month can become a bad year.' },
            { q: 'Which error starts the pitfall cycle in Figure 6?',
                options: ['Under-documenting', 'Unstructured days', 'Relying only on portal leads', 'Slow or inconsistent follow-up'], answer: 3,
                explain: 'Installing a simple system breaks the loop at its first link: follow-up becomes automatic.' },
            { q: 'What does the chapter say you need instead of willpower?',
                options: ['A system that makes the errors hard to commit', 'More leads', 'A bigger marketing budget', 'A second CRM'], answer: 0,
                explain: 'Your CRM and follow-up plans, a protected daily block, activity tracking and a Friday review. The system does the remembering.' }
        ],
        blank: {
            before: 'Track activity, not', after: '. You can see progress every week, so the 90-day wait is bearable.',
            answer: 'closings', accept: ['closings', 'closing'],
            explain: 'This is one of the four parts of the one correction.'
        }
    },
    ch8: {
        mcq: [
            { q: 'Why does the chapter call the morning block sacred?',
                options: ['Clients prefer to meet in the morning', 'It is the only time of day nobody else wants', 'Lenders only answer calls before noon', 'Mornings are when leads arrive'], answer: 1,
                explain: 'Clients, lenders and inspectors will all ask for afternoons. Give them afternoons.' },
            { q: 'What is the weekly target for conversations in Table 8.2?',
                options: ['1 to 2', '40 to 60', '15 to 25', '30 to 50'], answer: 2,
                explain: 'Conversations are actual two-way talks. 40 to 60 is outbound calls, 30 to 50 is follow-ups completed, and 1 to 2 is appointments set.' },
            { q: 'A conversation happened but is not in your CRM. What do you do?',
                options: ['Nothing; you will remember it', 'Write it in a notebook', 'Mention it at the Friday review', 'Treat it as not having happened and log it now'], answer: 3,
                explain: 'The moment you keep a second list, you have two places to check and one of them will be wrong.' }
        ],
        blank: {
            before: 'Each Friday, compare this week to last week, decide one thing to do differently, then stop working on it until', after: '.',
            answer: 'Monday', accept: ['monday'],
            explain: 'The Friday review is one of three habits that protect motivation, along with celebrating small wins and staying close to the office.'
        }
    },
    ch9: {
        mcq: [
            { q: 'What is the five-step consultation sequence?',
                options: ['Frame, ask, listen, present, agree', 'Present, ask, frame, listen, agree', 'Ask, present, listen, frame, agree', 'Frame, present, ask, agree, listen'], answer: 0,
                explain: 'Agents who skip the asking and go straight to presenting lose the client\'s trust before they have earned it.' },
            { q: 'What are the four steps for handling an objection?',
                options: ['Defend, discount, close, repeat', 'Agree, apologize, offer, close', 'Acknowledge, clarify, respond, check', 'Wait, repeat, persuade, close'], answer: 2,
                explain: 'Acknowledge that you heard, clarify the real concern, respond with facts, a story or a demonstration, then check that it addressed the concern and stop talking.' },
            { q: '"Your fee is too high" usually means what?',
                options: ['The client will not hire anyone', 'Show me what I get for it', 'Cut your fee right now', 'They want a different agent'], answer: 1,
                explain: 'Most objections are requests for more information or reassurance. Shift from fee to outcome, and confirm the compensation conversation with your broker.' }
        ],
        blank: {
            before: 'Steps 2 and 3, asking and listening, should take at least', after: 'of the meeting.',
            answer: 'half', accept: ['half', '50%', '1/2', 'one half'],
            explain: 'Table 9.1 says steps 2 and 3 should take at least half the meeting.'
        }
    },
    ch10: {
        mcq: [
            { q: 'How soon does the average homeowner move again, according to the chapter?',
                options: ['Within one to two years', 'Within three to four years', 'Within seven to ten years', 'After more than twenty years'], answer: 2,
                explain: 'They also know several people who will move before then. Being remembered is a schedule, not an accident.' },
            { q: 'What is the test for every touch you send a past client?',
                options: ['Does it mention a listing?', 'Is it free to send?', 'Does it include your phone number?', 'Would they be glad to receive it if they were never going to move again?'], answer: 3,
                explain: 'A furnace-filter reminder or a contractor list passes. "Thinking of selling?" every month does not.' },
            { q: 'When does a closed client go on the post-close plan?',
                options: ['The day of closing', 'After the 30-day call', 'When they mention moving', 'One year after closing'], answer: 0,
                explain: 'Build the plan once as a follow-up plan and apply it at every closing. Closing day is the handwritten note, the gift and the ask for the introduction.' }
        ],
        blank: {
            before: 'Once a year, unprompted, send each past client a home', after: 'update. Sellers come from this.',
            answer: 'value', accept: ['value'],
            explain: 'Home anniversaries and value updates are where seller conversations begin. Homeowners love knowing.'
        }
    },
    ch11: {
        mcq: [
            { q: 'When does agency disclosure usually need to happen?',
                options: ['At closing', 'At first substantive contact, though your state sets the form and timing', 'Only if the client asks', 'After the first showing'], answer: 1,
                explain: 'Learn your state\'s form and timing in your first week, and keep the signed copy in your transaction system.' },
            { q: 'Which phrase in a listing is a Fair Housing problem?',
                options: ['Four bedrooms, fenced yard, two blocks from the park', 'Corner lot with a new roof', 'Perfect for young professionals', 'Walkable to the park'], answer: 2,
                explain: 'Describe the property, not the ideal buyer. "Great for families" and "perfect for young professionals" are both problems.' },
            { q: 'A client asks, "Is this a good area?" What do you do?',
                options: ['Give every client the same third-party sources, without editorializing', 'Describe who lives there', 'Tell them what you would do', 'Change the subject'], answer: 0,
                explain: 'Same sources for every client. Do not describe who lives there, and confirm the wording with your broker.' }
        ],
        blank: {
            before: 'Describe the property, never', after: '. Treat every inquiry identically.',
            answer: 'people', accept: ['people'],
            explain: 'This is the chapter\'s Fair Housing takeaway. Your speed-to-lead automation helps because it treats everyone identically.'
        }
    },
    ch12: {
        mcq: [
            { q: 'What are the three 30-day phases of the first 90 days?',
                options: ['Learn, wait, close', 'Plan, advertise, close', 'Study, practice, perform', 'Install the system, build the rhythm, grow the pipeline'], answer: 3,
                explain: 'Days 1 to 30 install the system, 31 to 60 build the rhythm, and 61 to 90 grow the pipeline.' },
            { q: 'By days 61 to 90, how many active opportunities should your pipeline review show?',
                options: ['1', '3', '5 or more', '20'], answer: 2,
                explain: 'Also by day 90: your first contract written, the post-close plan built and lead sources evaluated with data.' },
            { q: 'Which list is the weekly scorecard?',
                options: ['Closings, commission, listings and referrals', 'Appendix A, the same rows as Table 8.2', 'Calls, emails, posts and mailers', 'Showings, offers, contracts and closings'], answer: 1,
                explain: 'Fill in Appendix A every Friday. Table 8.2 is that same list, not a shorter one.' }
        ],
        blank: {
            before: 'Closings usually follow in the', after: '90 days.',
            answer: 'second', accept: ['second', '2nd'],
            explain: 'The first 90 days are for installing the system and building a pipeline, so do not worry about closings yet.'
        }
    },
    ch13: {
        mcq: [
            { q: 'Which two habits does the chapter say matter most?',
                options: ['A custom website and branded car magnets', 'Daily social posts and monthly mailers', 'Speed-to-lead and multi-touch follow-up', 'Open houses and farming'], answer: 2,
                explain: 'Respond in minutes, not hours, and stay in touch for 90 days and then forever. Everything else in the book exists to make them easy.' },
            { q: 'How many times does the one-card summary say to follow up with a new lead over 90 days?',
                options: ['2 to 3', '13', '30 to 40', 'Once a week, forever'], answer: 1,
                explain: 'Respond to new leads in minutes, then follow up 13 times over 90 days.' },
            { q: 'Who do you ask about anything legal, contractual or unusual, and when?',
                options: ['Your lender, after you act', 'A friend in the business, if time allows', 'Nobody; use your judgment', 'Your broker, before you act'], answer: 3,
                explain: 'The chapter says: "Before, not after."' }
        ],
        blank: {
            before: 'Your CRM is the only list. Open it', after: ', update it last.',
            answer: 'first', accept: ['first'],
            explain: 'This is the third line of the whole-handbook card.'
        }
    }
};
