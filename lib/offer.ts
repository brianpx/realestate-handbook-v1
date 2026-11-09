// Everything the public site needs from the owner, in one place. A null is an open decision: the site then says
// so plainly instead of showing an invented value. Nothing here switches on payments by itself: each paid tier's
// `checkoutUrl` in lib/tiers.ts is a link to a hosted checkout the owner creates, and the site has no payment code.
// See docs/_archive/launch-handoff.md.
import { BOOK_TITLE } from './pages';
import { paidTiers, tierById, type PublishedWhen, type Tier, type TierId } from './tiers';

export const SITE_TITLE = `${BOOK_TITLE}: a 90-day handbook for new real estate agents`;
export const SITE_DESCRIPTION =
  'A practical 90-day handbook with interactive tools for new real estate agents: turn an income goal into a daily conversation target, set up your CRM and follow-up, practice your scripts and review your week.';

export type Author = { name: string; bio: string; /** Only facts the owner has confirmed; each line is shown as written. */ background?: readonly string[] };

export const OWNER: {
  author: Author | null;
  supportEmail: string | null;
  /** Legal name and postal address for the policy pages and, when email goes live, the CAN-SPAM footer. */
  businessName: string | null;
  postalAddress: string | null;
} = {
  author: null,
  supportEmail: 'support@findnurturekeep.com',
  businessName: null,
  postalAddress: null,
};

// Prices and checkout links live with their tiers in lib/tiers.ts.
export const OFFER: {
  /** One sentence on how long access lasts, for example "Access to this edition, with its updates." */
  accessTerm: string | null;
  /** One sentence on what updates are included. */
  updatesTerm: string | null;
} = {
  accessTerm: 'Lifetime access to edition 1.0 for one person, not transferable.',
  updatesTerm: 'Corrections and updates to edition 1.0 are included; a future edition is a separate purchase with a discount for existing buyers.',
};

// A policy page shows a "draft for owner review" notice until its status is changed to 'approved' here.
export type PolicyStatus = 'draft' | 'approved';
export const POLICY_STATUS: Record<'privacy' | 'terms' | 'refunds' | 'updates', PolicyStatus> = {
  privacy: 'draft',
  terms: 'draft',
  refunds: 'draft',
  updates: 'draft',
};

const checkoutLink = (url: string | null): string | null => (url && /^https:\/\//.test(url) ? url : null);

type Terms = Pick<typeof OFFER, 'accessTerm' | 'updatesTerm'>;
type Policies = Pick<typeof POLICY_STATUS, 'terms' | 'refunds' | 'updates'>;

/** The rule behind purchaseOpen(), with its inputs passed in so it can be tested against tiers other than the live ones. */
export const purchaseOpenFor = (paid: readonly Tier[], terms: Terms, policies: Policies): boolean =>
  paid.length > 0
  && paid.every(t => Boolean(t.priceDisplay) && checkoutLink(t.checkoutUrl) !== null)
  && Boolean(terms.accessTerm && terms.updatesTerm)
  && policies.terms === 'approved' && policies.refunds === 'approved' && policies.updates === 'approved';

/** True only when every paid tier has a price and a checkout link, the access and update terms exist, and the terms, refund and update policies are approved. */
export const purchaseOpen = (): boolean => purchaseOpenFor(paidTiers(), OFFER, POLICY_STATUS);

/** A paid tier's checkout link; null while purchase is closed and for the free tier. */
export const checkoutUrlFor = (id: TierId): string | null => (purchaseOpen() ? checkoutLink(tierById(id).checkoutUrl) : null);

/** Whether the owner has published the term a feature row's promise rests on (see `Feature.publishedWhen`). */
export const termPublished = (key: PublishedWhen): boolean => (key === 'supportEmail' ? Boolean(OWNER.supportEmail) : Boolean(OFFER.updatesTerm));

/** The one purchase-oriented action. Checkout happens from the pricing page, which also says where things stand until purchase is open. */
export function primaryAction(): { label: string; href: string } {
  return { label: 'See plans and pricing', href: '/pricing' };
}
