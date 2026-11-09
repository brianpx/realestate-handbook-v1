// The three plans the pricing page compares. Prices and checkout links are the owner's to fill in: a null keeps
// purchase closed (purchaseOpen() in lib/offer.ts) and the pricing page says so plainly instead of inventing a value.
export type TierId = 'free' | 'basic' | 'pro';

export type Tier = {
  id: TierId;
  name: string;
  tagline: string;
  /** What the buyer sees, for example "$49". The free tier has none. */
  priceDisplay: string | null;
  /** A hosted-checkout link (https) the owner creates. The free tier has none. */
  checkoutUrl: string | null;
  highlighted?: true;
};

export const TIERS: readonly Tier[] = [
  { id: 'free', name: 'Free', tagline: 'The free set', priceDisplay: null, checkoutUrl: null },
  { id: 'basic', name: 'Basic', tagline: 'The whole handbook and the essential tools', priceDisplay: null, checkoutUrl: null, highlighted: true },
  { id: 'pro', name: 'Pro', tagline: 'Everything in Basic, plus every tool, the coach and the PDF', priceDisplay: null, checkoutUrl: null },
];

export type FeatureValue = string | boolean;
/** Which owner-supplied term a row's promise rests on; until it is published the paid cells say so instead. */
export type PublishedWhen = 'updatesTerm' | 'supportEmail';
export type Feature = { label: string; values: Record<TierId, FeatureValue>; publishedWhen?: PublishedWhen };

// A string is shown as written; true and false become the included and not-included marks. The free column is the
// signed-in free set (overview, Chapters 1 and 7); the glossary appendix and the pop-ups are not in it.
export const FEATURES: readonly Feature[] = [
  { label: 'Chapters', values: { free: 'Overview, Chapter 1, Chapter 7', basic: 'All 13 chapters', pro: 'All 13 chapters' } },
  { label: 'Appendices', values: { free: false, basic: 'All six', pro: 'All six' } },
  { label: 'Checkpoints and quizzes', values: { free: 'In the free chapters', basic: 'Every chapter', pro: 'Every chapter' } },
  { label: 'Scripts with practice mode', values: { free: 'One Chapter 6 script', basic: '20+ scripts', pro: '20+ scripts' } },
  { label: 'Interactive tools', values: { free: 'Goal calculator, pitfall explorer, self-score, weekly planner', basic: 'The five essential tools', pro: 'Every tool' } },
  { label: 'Reading-plan coach (plan and review)', values: { free: false, basic: false, pro: true } },
  { label: 'Search and glossary pop-ups', values: { free: false, basic: true, pro: true } },
  { label: 'Print-friendly pages', values: { free: false, basic: true, pro: true } },
  { label: 'Progress saved on this device, with a backup file', values: { free: true, basic: true, pro: true } },
  { label: 'PDF edition', values: { free: false, basic: false, pro: true } },
  { label: 'Updates', values: { free: false, basic: 'Corrections and updates to this edition', pro: 'Corrections and updates to this edition' }, publishedWhen: 'updatesTerm' },
  { label: 'Email support', values: { free: false, basic: true, pro: true }, publishedWhen: 'supportEmail' },
];

export const paidTiers = (): Tier[] => TIERS.filter(t => t.id !== 'free');

export function tierById(id: TierId): Tier {
  const tier = TIERS.find(t => t.id === id);
  if (!tier) throw new Error(`No tier "${id}"`);
  return tier;
}
