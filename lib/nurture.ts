import { NURTURE_TOUCHES, type Touch } from '@/content/data/nurture';

// Ported from legacy/js/widgets.js (Ch. 5).
export const ZONE = { first: 5, last: 12 } as const;
export const STOP_TOUCH = 2;

export const NURTURE_FILTERS: { key: string; label: string; test: (t: Touch) => boolean }[] = [
  { key: 'all', label: 'All touches', test: () => true },
  { key: 'call', label: 'Calls', test: t => t.channels.includes('call') },
  { key: 'text', label: 'Texts', test: t => t.channels.includes('text') },
  { key: 'email', label: 'Emails', test: t => t.channels.includes('email') },
  { key: 'value', label: 'Value touches', test: t => t.value },
];

export const inZone = (t: Touch) => t.n >= ZONE.first && t.n <= ZONE.last;

export function touchNote(t: Touch): string {
  if (t.n === NURTURE_TOUCHES.length) return 'After touch 13 the lead rolls into the Quarterly Call Plan. Nobody leaves your database unless they ask to.';
  if (t.n <= STOP_TOUCH) return 'This is where most new agents stop. The handbook says most conversions happen between touches 5 and 12.';
  if (t.n < ZONE.first) return 'Early touches build familiarity. Keep going: the conversions come later in the plan.';
  return 'Inside touches 5 to 12, where the handbook says most conversions happen.';
}

export const touchLabel = (t: Touch) =>
  `Touch ${t.n}, day ${t.day}, ${t.label}${t.value ? ', value touch' : ''}${inZone(t) ? ', in the conversion zone' : ''}`;
