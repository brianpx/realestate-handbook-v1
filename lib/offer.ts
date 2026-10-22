// Everything the public site needs from the owner, in one place. A null is an open decision: the site then says
// so plainly instead of showing an invented value. Nothing here switches on payments by itself: `checkoutUrl` is a
// link to a hosted checkout the owner creates, and the site has no payment code. See docs/launch-handoff.md.
import { BOOK_TITLE } from './pages';

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
  supportEmail: null,
  businessName: null,
  postalAddress: null,
};

export const OFFER: {
  /** What the buyer sees, for example "$49". Not set: the owner has not chosen a price. */
  priceDisplay: string | null;
  /** A hosted-checkout link (https). Not set: nothing can be bought. */
  checkoutUrl: string | null;
  /** One sentence on how long access lasts, for example "Access to this edition, with its updates." */
  accessTerm: string | null;
  /** One sentence on what updates are included. */
  updatesTerm: string | null;
} = {
  priceDisplay: null,
  checkoutUrl: null,
  accessTerm: null,
  updatesTerm: null,
};

// A policy page shows a "draft for owner review" notice until its status is changed to 'approved' here.
export type PolicyStatus = 'draft' | 'approved';
export const POLICY_STATUS: Record<'privacy' | 'terms' | 'refunds' | 'updates', PolicyStatus> = {
  privacy: 'draft',
  terms: 'draft',
  refunds: 'draft',
  updates: 'draft',
};

const CHECKOUT = OFFER.checkoutUrl && /^https:\/\//.test(OFFER.checkoutUrl) ? OFFER.checkoutUrl : null;

/** True only when a price, a checkout link, the access and update terms and approved terms and refund policies all exist. */
export const purchaseOpen = (): boolean =>
  Boolean(OFFER.priceDisplay && CHECKOUT && OFFER.accessTerm && OFFER.updatesTerm)
  && POLICY_STATUS.terms === 'approved' && POLICY_STATUS.refunds === 'approved' && POLICY_STATUS.updates === 'approved';

export const checkoutUrl = (): string | null => (purchaseOpen() ? CHECKOUT : null);

/** The one purchase-oriented action. Until purchase is open it leads to the pricing page, which says where things stand. */
export function primaryAction(): { label: string; href: string; external: boolean } {
  const url = checkoutUrl();
  return url
    ? { label: `Get the handbook, ${OFFER.priceDisplay}`, href: url, external: true }
    : { label: 'See pricing and availability', href: '/pricing', external: false };
}
