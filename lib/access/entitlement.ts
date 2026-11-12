import { isFreePage, type PageId } from '@/lib/pages';
import { PRO_ONLY_WIDGETS } from '@/lib/tools';
import type { UserStatus } from '@/lib/users/types';
import type { AccessSnapshot, BillingAccess, Grant, PaidTier } from './types';

/**
 * What a signed-in reader may open right now. `none` is an account that is not active (it cannot sign in, so it
 * is only ever seen when a session outlives a status change); `preview` is the free set and the account page,
 * with `suspended` saying why a paying reader is there; `member` is the whole handbook at a tier.
 */
export type Entitlement =
  | { level: 'none' }
  | { level: 'preview'; suspended: boolean }
  | { level: 'member'; tier: PaidTier };

const RANK: Record<PaidTier, number> = { basic: 1, pro: 2 };
/** The more generous of two tiers; Pro includes everything in Basic. */
export const higherTier = (a: PaidTier | null, b: PaidTier): PaidTier => (a !== null && RANK[a] >= RANK[b] ? a : b);

/** A grant that counts right now: not revoked, started, and not ended. Its kind does not matter. */
export const grantLive = (g: Grant, now: Date): boolean => g.revokedAt === null && g.startsAt <= now && (g.endsAt === null || g.endsAt > now);

const PURCHASE_LIVE = new Set(['paid', 'partially_refunded', 'disputed']);
const SUBSCRIPTION_LIVE = new Set(['trialing', 'active', 'past_due']);

/** Rule 5: a billing record that should have produced a grant. The safety net for a webhook that got half way. */
export function billingLive(r: BillingAccess, now: Date): boolean {
  if (r.kind === 'purchase') return PURCHASE_LIVE.has(r.status) && (r.accessEndsAt === null || r.accessEndsAt > now);
  const until = r.accessEndsAt ?? r.currentPeriodEnd;
  return SUBSCRIPTION_LIVE.has(r.status) && until !== null && until > now;
}

/**
 * The pure rule from the user-database plan, section 8. Role plays no part: an administrator reads through a
 * grant like everyone else. `memberships` is read for one field, `suspendedAt`; its cached status can neither
 * grant nor remove anything. Nothing is written as time passes: expiry is a matter of comparing dates here.
 */
export function entitlement({ status, snapshot, now }: { status: UserStatus; snapshot: AccessSnapshot; now: Date }): Entitlement {
  if (status !== 'active') return { level: 'none' };
  if (snapshot.membership?.suspendedAt) return { level: 'preview', suspended: true };
  let tier: PaidTier | null = null;
  for (const g of snapshot.grants) if (grantLive(g, now)) tier = higherTier(tier, g.tier);
  if (tier === null) {
    // a revoked grant was an explicit decision about its billing record: that record alone does not restore access
    const revokedRecords = new Set(snapshot.grants.filter(g => g.revokedAt !== null && g.billingRecordId !== null).map(g => g.billingRecordId));
    for (const r of snapshot.billing) if (!revokedRecords.has(r.id) && billingLive(r, now)) tier = higherTier(tier, r.tier);
  }
  return tier === null ? { level: 'preview', suspended: false } : { level: 'member', tier };
}

/** Whether a handbook page opens, or shows the upsell card instead. */
export const pageOpen = (e: Entitlement, id: PageId): boolean => e.level === 'member' || (e.level === 'preview' && isFreePage(id));

/** Pro members only: Basic is a paid plan, but it does not include everything Pro does. */
export const isPro = (e: Entitlement): boolean => e.level === 'member' && e.tier === 'pro';

/** Whether a listed media file is served: the page it belongs to opens, and the plan meets the file's tier if it has one. */
export const mediaOpen = (e: Entitlement, media: { page: PageId; tier?: PaidTier }): boolean =>
  pageOpen(e, media.page) && (media.tier === undefined || (e.level === 'member' && RANK[e.tier] >= RANK[media.tier]));

/** The reading-plan coach (plan and review) is a Pro feature (OD-31). */
export const coachOpen = (e: Entitlement): boolean => e.level === 'member' && e.tier === 'pro';

/** Whether a tool is built on a page the reader can open; on member pages Basic gets the essential set only. */
export const toolOpen = (e: Entitlement, page: PageId, widget: string): boolean =>
  isFreePage(page) || e.level !== 'member' || e.tier === 'pro' || !PRO_ONLY_WIDGETS.includes(widget);
