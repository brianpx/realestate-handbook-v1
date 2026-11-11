import { describe, expect, it } from 'vitest';
import { decideGrant, upgradeEligible } from './upgrade';
import type { BillingRecord } from './types';

const NOW = new Date('2026-11-10T12:00:00.000Z');

const record = (over: Partial<BillingRecord> = {}): BillingRecord => ({
  id: 'r1', kind: 'purchase', billingCustomerId: null, userId: 'u1', provider: 'lemonsqueezy', providerObjectId: '99',
  providerPaymentId: null, productKey: 'handbook-v1', tier: 'basic', providerPriceId: '2357693', amountCents: 7900,
  currency: 'USD', status: 'paid', providerStatus: 'paid', paidAt: NOW, refundedAt: null, disputedAt: null,
  trialEndsAt: null, currentPeriodStart: null, currentPeriodEnd: null, cancelRequestedAt: null, cancelEffectiveAt: null,
  accessEndsAt: null, lastEventAt: NOW, readyEmailSentAt: null, notes: null, manageUrl: null, createdAt: NOW, updatedAt: NOW, ...over,
});

describe('upgradeEligible', () => {
  it('needs a live Basic purchase and nothing at Pro', () => {
    expect(upgradeEligible([record()], NOW)).toBe(true);
    expect(upgradeEligible([], NOW)).toBe(false);
    expect(upgradeEligible([record({ status: 'refunded' })], NOW)).toBe(false);
    expect(upgradeEligible([record({ status: 'pending' })], NOW)).toBe(false);
    expect(upgradeEligible([record({ accessEndsAt: new Date(NOW.getTime() - 1) })], NOW)).toBe(false);
    expect(upgradeEligible([record(), record({ id: 'r2', providerObjectId: '100', tier: 'pro' })], NOW)).toBe(false);
  });
  it('does not count an upgrade as the Basic it rests on', () => {
    expect(upgradeEligible([record({ productKey: 'handbook-v1-upgrade', tier: 'pro' })], NOW)).toBe(false);
  });
  it('counts a partly refunded or disputed Basic as live, as entitlement does', () => {
    expect(upgradeEligible([record({ status: 'partially_refunded' })], NOW)).toBe(true);
    expect(upgradeEligible([record({ status: 'disputed' })], NOW)).toBe(true);
  });
  it('lets a Pro whose access has ended be upgraded from a live Basic', () => {
    expect(upgradeEligible([record(), record({ id: 'r2', providerObjectId: '100', tier: 'pro', accessEndsAt: NOW })], NOW)).toBe(true);
  });
});

describe('decideGrant', () => {
  const store = (records: BillingRecord[]) => ({ listRecordsForUser: async () => records });
  const upgrade = { productKey: 'handbook-v1-upgrade', providerObjectId: '101' };

  it('never holds back anything but an upgrade that asks for a grant for a known user', async () => {
    expect(await decideGrant(store([]), { productKey: 'handbook-v1', providerObjectId: '1' }, 'u1', 'grant', NOW)).toEqual({ grant: 'grant', held: false });
    expect(await decideGrant(store([]), upgrade, 'u1', 'revoke', NOW)).toEqual({ grant: 'revoke', held: false });
    expect(await decideGrant(store([]), upgrade, 'u1', 'none', NOW)).toEqual({ grant: 'none', held: false });
    expect(await decideGrant(store([]), upgrade, null, 'grant', NOW)).toEqual({ grant: 'grant', held: false });
  });
  it('holds an upgrade with no live Basic and lets one with a Basic through', async () => {
    expect(await decideGrant(store([]), upgrade, 'u1', 'grant', NOW)).toEqual({ grant: 'none', held: true });
    expect(await decideGrant(store([record()]), upgrade, 'u1', 'grant', NOW)).toEqual({ grant: 'grant', held: false });
  });
  it('leaves the order being decided out of the check, so a re-read of a granted upgrade stays granted', async () => {
    const own = record({ id: 'r3', providerObjectId: '101', productKey: 'handbook-v1-upgrade', tier: 'pro' });
    expect(await decideGrant(store([record(), own]), upgrade, 'u1', 'grant', NOW)).toEqual({ grant: 'grant', held: false });
  });
});
