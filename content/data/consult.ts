// Copied unchanged from legacy/js/widgets-practice.js.
export const CONSULT_STEPS = ['Frame', 'Ask', 'Listen', 'Present', 'Agree'];
export const CONSULT_DEFAULT = [5, 10, 5, 30, 10];
export type DrillItem = { tag?: string; prompt: string; options: string[]; answer: number; question?: string; explain: string };
export const CONSULT_CASES: DrillItem[] = [
    { tag: 'Buyer consultation', prompt: 'The agent opens by spreading out a stack of listings and explaining how offers work. She asks about budget around minute 40.',
        options: CONSULT_STEPS, answer: 1, question: 'Which step did the agent skip or rush?',
        explain: 'She went straight to presenting. The chapter warns that agents who skip the asking lose the client\'s trust before they have earned it. Timeline, motivation, financing and must-haves come first.' },
    { tag: 'Seller consultation', prompt: 'The agent asks about the sellers\' goals, nods, and moves straight to a price recommendation without saying anything back to them.',
        options: CONSULT_STEPS, answer: 2, question: 'Which step was missing?',
        explain: 'Listening means repeating back what you heard, such as "You need to be in the new city by August, and net proceeds matter more than top-line price." It shows you understood before you present.' },
    { tag: 'Buyer consultation', prompt: 'The meeting goes well. The agent ends with, "Think it over and call me if you have questions."',
        options: CONSULT_STEPS, answer: 4, question: 'Which step was missing?',
        explain: 'Agreeing means leaving with a next step: a buyer representation agreement, a lender introduction, a first showing date. "Call me" leaves the next move to the client.' },
    { tag: 'Seller consultation', prompt: 'The agent sits down and says, "Let me tell you why I\'m the best choice for your home." No agenda was mentioned.',
        options: CONSULT_STEPS, answer: 0, question: 'Which step was missing?',
        explain: 'Framing sets the agenda before anything else: say what you will cover and agree that it works for them (the opening scripts in Chapter 6).' }
];
