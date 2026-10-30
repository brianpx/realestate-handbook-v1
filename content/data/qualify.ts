// Copied unchanged from legacy/js/widgets-practice.js.
export const QUALIFY_FIELDS = ['Timeline', 'Motivation', 'Financing', 'Representation'];
export type QualifyScenario = { quote: string; answered: string[]; stage: 'active' | 'nurture'; why: string };
export const QUALIFY_SCENARIOS: QualifyScenario[] = [
    { quote: '“We\'re pre-approved already. Our lease ends in about 60 days, so we need to be in somewhere by then.”',
        answered: ['Timeline', 'Motivation', 'Financing'], stage: 'active',
        why: 'Pre-approved and moving in 60 days is an active opportunity, and active opportunities get calls this week. Whether another agent is already helping them is still unknown, so ask that next.' },
    { quote: '“Probably sometime next year, no rush. We haven\'t talked to a lender yet, and we\'re not working with anyone.”',
        answered: ['Timeline', 'Financing', 'Representation'], stage: 'nurture',
        why: 'A "maybe next year" lead belongs on a nurture plan. It is still valuable; it just needs different attention this week. You do not yet know why they are thinking about moving, so ask that next.' },
    { quote: '“I\'m relocating for a job that starts in six weeks, and I\'m paying cash. I don\'t have an agent yet.”',
        answered: ['Timeline', 'Motivation', 'Financing', 'Representation'], stage: 'active',
        why: 'All four answers are in: a short timeline, funds ready and no competing agent. Nothing is left to ask. Call and offer a consultation.' },
    { quote: '“I requested a home value report out of curiosity. We might sell in a couple of years, but nothing is definite.”',
        answered: ['Timeline'], stage: 'nurture',
        why: 'A potential seller a couple of years out is a long-term nurture contact (Seller Long-Term Nurture in Table 5.1). Start with motivation, then fill in the rest naturally over later conversations.' }
];
