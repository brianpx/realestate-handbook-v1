// Copied unchanged from legacy/js/widgets-practice.js.
export type FairHousingItem = { tag: string; prompt: string; answer: number; explain: string };
export const FAIR_HOUSING_ITEMS: FairHousingItem[] = [
    { tag: 'In marketing', prompt: '"Great for families"', answer: 0,
        explain: 'It describes the ideal buyer, not the property, and points at familial status. Describe what the home has instead.' },
    { tag: 'In marketing', prompt: '"Four bedrooms, fenced yard, two blocks from the park"', answer: 1,
        explain: 'It describes the property itself. This is the chapter\'s own example of acceptable wording.' },
    { tag: 'In marketing', prompt: '"Perfect for young professionals"', answer: 0,
        explain: 'Another ideal-buyer description. The chapter names it alongside "great for families" as a problem.' },
    { tag: 'In marketing', prompt: '"Ideal for empty-nesters"', answer: 0,
        explain: 'It names who the home is for. Say what the home offers, such as a main-floor bedroom or a low-maintenance yard, and let buyers decide.' },
    { tag: 'In marketing', prompt: '"Step-free entry, wide doorways and a roll-in shower"', answer: 1,
        explain: 'These are features of the property, so describing them is describing the home. As always, confirm wording with your broker.' },
    { tag: 'In marketing', prompt: '"A safe, exclusive neighborhood with people just like you"', answer: 0,
        explain: 'It characterizes the neighborhood by who lives there, which the chapter says not to do.' },
    { tag: 'In conversation', prompt: 'A client asks, "Is this a good area?" You answer: "Oh, it\'s mostly young families. Really nice crowd."', answer: 0,
        explain: 'That is your opinion of the people. Give every client the same third-party sources, and do not editorialize. Confirm the wording with your broker.' },
    { tag: 'In conversation', prompt: 'A client asks, "Is this a good area?" You answer: "I give every client the same third-party pages for schools, crime statistics and amenities, and I don\'t add my own take. Want me to pull them?"', answer: 1,
        explain: 'Same sources for every client, no editorializing. Confirm the wording with your broker.' },
    { tag: 'In service', prompt: 'You call back some inquiries within minutes with a full listing package, but send only an automated text to the ones you assume cannot afford much.', answer: 0,
        explain: 'Every inquiry should get the same response time, the same information and the same options.' }
];
