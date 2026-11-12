import type { ProductOrder } from './adapters/lemonsqueezy';
import type { BillingStore } from './store';
import { UPGRADE_PRODUCT_KEY, type BillingRecord, type GrantEffect } from './types';

/** Stored on an upgrade order that was paid for but granted nothing, so whoever reviews it sees why. */
export const UPGRADE_HELD_NOTE = 'Upgrade order needs review: no live Basic purchase on this account, already Pro, or its access already ended. Refund it or review it by hand.';

const LIVE_STATUSES: readonly string[] = ['paid', 'partially_refunded', 'disputed'];

const isLive = (r: BillingRecord, now: Date): boolean =>
  r.kind === 'purchase' && LIVE_STATUSES.includes(r.status) && (r.accessEndsAt === null || r.accessEndsAt > now);

/**
 * Whether a user may take the Basic-to-Pro upgrade: a live Basic purchase of their own, and nothing at Pro yet.
 * `others` is every billing record of the user except the order being decided, so re-reading an upgrade that was
 * already granted stays eligible and a second upgrade is not.
 */
export function upgradeEligible(others: readonly BillingRecord[], now: Date): boolean {
  const live = others.filter(r => isLive(r, now));
  return live.some(r => r.tier === 'basic' && r.productKey !== UPGRADE_PRODUCT_KEY) && !live.some(r => r.tier === 'pro');
}

/**
 * What an order that asks for a grant may actually get. Only an upgrade is ever held back, and only when the user
 * is known: with no user there is nothing to decide yet, and the decision is made on the mirror that finds one.
 * A held order is stored with a note and no grant. An upgrade whose access has already ended (held at first sight, or
 * swept up by a refunded Basic) stays ended: buying another Basic later must not bring it back to life with no grant.
 */
export async function decideGrant(
  store: Pick<BillingStore, 'listRecordsForUser'>,
  order: Pick<ProductOrder, 'productKey' | 'providerObjectId'>,
  userId: string | null,
  grant: GrantEffect,
  at: Date,
): Promise<{ grant: GrantEffect; held: boolean }> {
  if (order.productKey !== UPGRADE_PRODUCT_KEY || grant !== 'grant' || !userId) return { grant, held: false };
  const records = await store.listRecordsForUser(userId);
  const own = records.find(r => r.providerObjectId === order.providerObjectId);
  if (own?.accessEndsAt && own.accessEndsAt <= at) return { grant: 'none', held: true };
  const others = records.filter(r => r.providerObjectId !== order.providerObjectId);
  return upgradeEligible(others, at) ? { grant, held: false } : { grant: 'none', held: true };
}
