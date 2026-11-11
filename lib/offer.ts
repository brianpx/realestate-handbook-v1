// Everything the public site needs from the owner, in one place. A null is an open decision: the site then says
// so plainly instead of showing an invented value. Nothing here switches purchase on by itself. `checkoutUrl` in
// lib/tiers.ts stays empty while purchase is closed; a signed-in checkout link is built from BILLING_CHECKOUT_URL_*
// and stays null until that variable is set. See docs/_archive/launch-handoff.md.
import type { Entitlement } from './access/entitlement';
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
  businessName: 'Brian Pitts',
  // Stand-in until a PO box, virtual mailbox, or registered-agent address replaces it.
  // It is shown on the site and in local notes mail. SendGrid still requires LEAD_MAILING_ADDRESS.
  postalAddress: 'synthetic temp address',
};

/**
 * Days after a purchase in which it can be refunded in full, for any reason (owner decision, 11 November 2026).
 * Each purchase has its own window, counted from its own payment date.
 */
export const REFUND_DAYS = 14;

// What each paid plan gets after edition 1.0 ships (owner decision, 11 November 2026). "Addition" means a new chapter,
// tool or script; "edition" means a re-write of the book under a new edition number.
const BASIC_UPDATES = 'Corrections and improvements to the chapters and essential tools of edition 1.0 are included; a future edition is a separate purchase at a discount for existing buyers.';
const PRO_UPDATES = 'Everything in Basic, plus every new chapter, tool and script added to the handbook and every future edition, at no further charge, for as long as the handbook is published.';

// Prices and checkout links live with their tiers in lib/tiers.ts.
export const OFFER: {
  /** One sentence on how long access lasts (OD-23), shown on the pricing and updates pages. */
  accessTerm: string | null;
  /** What updates are included for both plans in one line (OD-20), shown beside it. */
  updatesTerm: string | null;
  /** The same terms by plan, for the pages that set them out one under the other. */
  updatesByPlan: { basic: string; pro: string };
} = {
  accessTerm: 'Lifetime access to edition 1.0 for one person, on their own devices; not transferable. Pro also covers later editions.',
  updatesTerm: `Basic: ${BASIC_UPDATES} Pro: ${PRO_UPDATES}`,
  updatesByPlan: { basic: BASIC_UPDATES, pro: PRO_UPDATES },
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

/** A paid tier's public checkout link; null while purchase is closed and for the free tier. */
export function checkoutUrlFor(id: TierId): string | null;
/**
 * The signed-in buyer's link. Brackets stay literal: URLSearchParams would encode them and Lemon Squeezy would
 * not read the custom field. This does not consult purchaseOpen(); it returns null while the env URL is unset
 * or not https, and the public pricing button keeps using the tier-id form above.
 */
export function checkoutUrlFor(buyer: { tierId: TierId; userId: string; email: string }): string | null;
export function checkoutUrlFor(idOrBuyer: TierId | { tierId: TierId; userId: string; email: string }): string | null {
  if (typeof idOrBuyer !== 'string') return signedInCheckoutUrl(idOrBuyer);
  return purchaseOpen() ? checkoutLink(tierById(idOrBuyer).checkoutUrl) : null;
}

function signedInCheckoutUrl({ tierId, userId, email }: { tierId: TierId; userId: string; email: string }): string | null {
  if (tierId === 'free') return null;
  const configured = process.env[tierId === 'basic' ? 'BILLING_CHECKOUT_URL_BASIC' : 'BILLING_CHECKOUT_URL_PRO'];
  const base = checkoutLink(configured ?? null);
  return base ? withBuyer(base, userId, email) : null;
}

function withBuyer(base: string, userId: string, email: string): string {
  const join = base.includes('?') ? '&' : '?';
  return `${base}${join}checkout[email]=${encodeURIComponent(email)}&checkout[custom][user_id]=${encodeURIComponent(userId)}`;
}

const priceCents = (display: string | null): number | null => {
  const m = display?.match(/^\$(\d+)(?:\.(\d{2}))?$/);
  return m ? Number(m[1]) * 100 + Number(m[2] ?? 0) : null;
};

/** The upgrade price as a buyer sees it, always Pro minus Basic ("$50"); null while either price is unset or not a plain dollar amount. */
export function upgradePriceDisplay(paid: readonly Tier[] = paidTiers()): string | null {
  const basic = priceCents(paid.find(t => t.id === 'basic')?.priceDisplay ?? null);
  const pro = priceCents(paid.find(t => t.id === 'pro')?.priceDisplay ?? null);
  if (basic === null || pro === null || pro <= basic) return null;
  const diff = pro - basic;
  return diff % 100 === 0 ? `$${diff / 100}` : `$${(diff / 100).toFixed(2)}`;
}

type UpgradeOffer = { open: boolean; price: string | null; base: string | null };
const currentUpgradeOffer = (): UpgradeOffer => ({ open: purchaseOpen(), price: upgradePriceDisplay(), base: checkoutLink(process.env.BILLING_CHECKOUT_URL_UPGRADE ?? null) });

/** Whether the Basic-to-Pro upgrade is on sale: purchase is open, the price can be derived, and its checkout link is set. */
export const upgradeOffered = (offer: UpgradeOffer = currentUpgradeOffer()): boolean => offer.open && offer.price !== null && offer.base !== null;

/**
 * The upgrade a signed-in reader may be shown: only a Basic member, only while it is on sale. The link carries the
 * reader's id and address like the other signed-in links, but it is only a convenience: the webhook decides from the
 * database whether the order upgrades anyone (lib/billing/upgrade.ts).
 */
export function upgradeFor(entitlement: Entitlement, user: { id: string; email: string }, offer: UpgradeOffer = currentUpgradeOffer()): { href: string; price: string } | null {
  if (entitlement.level !== 'member' || entitlement.tier !== 'basic' || !offer.open || !offer.price || !offer.base) return null;
  return { href: withBuyer(offer.base, user.id, user.email), price: offer.price };
}

/** Whether the owner has published the term a feature row's promise rests on (see `Feature.publishedWhen`). */
export const termPublished = (key: PublishedWhen): boolean => (key === 'supportEmail' ? Boolean(OWNER.supportEmail) : Boolean(OFFER.updatesTerm));

/** The one purchase-oriented action. Checkout happens from the pricing page, which also says where things stand until purchase is open. */
export function primaryAction(): { label: string; href: string } {
  return { label: 'See plans and pricing', href: '/pricing' };
}
