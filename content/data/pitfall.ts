// Copied unchanged from legacy/js/widgets-practice.js.
export type CycleNode = { name: string; text: string };
export type CycleTool = { name: string; breaks: number[]; why: string };
export const CYCLE_NODES: CycleNode[] = [
    { name: 'Slow follow-up', text: 'Leads answered the next day, plans never launched, "I\'ll call them later."' },
    { name: 'Lost leads', text: 'The leads that would have converted go to the agent who called first.' },
    { name: 'Empty pipeline', text: 'Few active opportunities, so there is little to work and the weeks feel empty.' },
    { name: 'Discouragement', text: 'No visible progress, so the wait feels pointless and activity drops.' },
    { name: 'Unstructured days', text: 'Busy all day with errands, social media and email, but no conversations.' }
];
export const CYCLE_TOOLS: CycleTool[] = [
    { name: 'CRM + follow-up plans', breaks: [0, 1], why: 'Follow-up becomes automatic, so leads are answered fast and nothing depends on memory.' },
    { name: 'Protected daily block', breaks: [4, 0], why: 'Structure replaces willpower: the block is on the calendar before the day fills up.' },
    { name: 'Activity tracking', breaks: [3], why: 'You see progress every week, so the 90-day wait is bearable.' },
    { name: 'Friday review', breaks: [1, 2], why: 'Quiet leads and a thin pipeline are caught while they are small drifts, not habits.' }
];
