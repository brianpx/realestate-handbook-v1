import { describe, expect, it } from 'vitest';
import type { UserStatus } from '@/lib/users/types';
import { coachOpen, entitlement, higherTier, pageOpen, toolOpen, type Entitlement } from './entitlement';
import type { AccessSnapshot, BillingAccess, Grant, Membership } from './types';

const NOW = new Date('2026-11-08T12:00:00Z');
const days = (n: number) => new Date(NOW.getTime() + n * 24 * 3600 * 1000);

const grant = (over: Partial<Grant> = {}): Grant => ({
  id: 'g1', userId: 'u1', kind: 'complimentary', tier: 'basic', startsAt: days(-10), endsAt: null, billingRecordId: null,
  grantedBy: 'admin', grantNote: null, revokedAt: null, revokedBy: null, revokeReason: null, createdAt: days(-10), ...over,
});
const membership = (over: Partial<Membership> = {}): Membership => ({
  userId: 'u1', status: 'none', tier: null, startedAt: null, endsAt: null, currentGrantId: null, complimentary: false,
  suspendedAt: null, suspendedBy: null, suspendReason: null, updatedAt: NOW, ...over,
});
const purchase = (status: Extract<BillingAccess, { kind: 'purchase' }>['status'], over: Partial<BillingAccess> = {}): BillingAccess =>
  ({ id: 'b1', kind: 'purchase', tier: 'basic', status, accessEndsAt: null, currentPeriodEnd: null, ...over } as BillingAccess);
const subscription = (status: Extract<BillingAccess, { kind: 'subscription' }>['status'], over: Partial<BillingAccess> = {}): BillingAccess =>
  ({ id: 'b2', kind: 'subscription', tier: 'pro', status, accessEndsAt: null, currentPeriodEnd: days(20), ...over } as BillingAccess);

const snapshot = (over: Partial<AccessSnapshot> = {}): AccessSnapshot => ({ grants: [], membership: null, billing: [], ...over });
const run = (status: UserStatus, over: Partial<AccessSnapshot> = {}) => entitlement({ status, snapshot: snapshot(over), now: NOW });

const PREVIEW: Entitlement = { level: 'preview', suspended: false };
const BASIC: Entitlement = { level: 'member', tier: 'basic' };
const PRO: Entitlement = { level: 'member', tier: 'pro' };

describe('entitlement', () => {
  it.each<[string, UserStatus, Partial<AccessSnapshot>, Entitlement]>([
    ['a signed-in reader with nothing on file', 'active', {}, PREVIEW],
    ['a disabled account, grant or not', 'disabled', { grants: [grant()] }, { level: 'none' }],
    ['a deleted account', 'deleted', { grants: [grant()] }, { level: 'none' }],
    ['a suspended member: the free set and the account page only', 'active', { grants: [grant()], membership: membership({ suspendedAt: days(-1), status: 'suspended' }) }, { level: 'preview', suspended: true }],
    ['a complimentary grant alone', 'active', { grants: [grant()] }, BASIC],
    ['a promo grant alone', 'active', { grants: [grant({ kind: 'promo' })] }, BASIC],
    ['a grant that has not started', 'active', { grants: [grant({ startsAt: days(1) })] }, PREVIEW],
    ['a grant that has ended', 'active', { grants: [grant({ endsAt: days(-1) })] }, PREVIEW],
    ['a grant ending later today', 'active', { grants: [grant({ endsAt: new Date(NOW.getTime() + 1) })] }, BASIC],
    ['a revoked grant', 'active', { grants: [grant({ revokedAt: days(-1), revokedBy: 'admin', revokeReason: 'admin' })] }, PREVIEW],
    ['the higher of two live grants', 'active', { grants: [grant(), grant({ id: 'g2', tier: 'pro' })] }, PRO],
    ['a revoked Pro grant beside a live Basic one', 'active', { grants: [grant(), grant({ id: 'g2', tier: 'pro', revokedAt: days(-1), revokedBy: 'a', revokeReason: 'abuse' })] }, BASIC],
    ['a paid purchase with no grant (the safety net)', 'active', { billing: [purchase('paid')] }, BASIC],
    ['a partially refunded purchase', 'active', { billing: [purchase('partially_refunded')] }, BASIC],
    ['a disputed purchase, until it is lost', 'active', { billing: [purchase('disputed')] }, BASIC],
    ['a lost chargeback', 'active', { billing: [purchase('chargeback_lost')] }, PREVIEW],
    ['a refund', 'active', { billing: [purchase('refunded')] }, PREVIEW],
    ['a pending purchase', 'active', { billing: [purchase('pending')] }, PREVIEW],
    ['a purchase whose access has ended', 'active', { billing: [purchase('paid', { accessEndsAt: days(-1) })] }, PREVIEW],
    ['an active subscription', 'active', { billing: [subscription('active')] }, PRO],
    ['a trial', 'active', { billing: [subscription('trialing')] }, PRO],
    ['past due inside the grace period', 'active', { billing: [subscription('past_due', { accessEndsAt: days(3) })] }, PRO],
    ['past due with the grace period over, and no cron needed', 'active', { billing: [subscription('past_due', { accessEndsAt: days(-1) })] }, PREVIEW],
    ['a subscription with no period end on file', 'active', { billing: [subscription('active', { currentPeriodEnd: null })] }, PREVIEW],
    ['a canceled subscription', 'active', { billing: [subscription('canceled')] }, PREVIEW],
    ['a grant beats canceled billing', 'active', { grants: [grant()], billing: [subscription('canceled')] }, BASIC],
    ['a revoked grant is not restored by its billing record', 'active', { grants: [grant({ kind: 'purchase', billingRecordId: 'b1', grantedBy: null, revokedAt: days(-1), revokedBy: 'a', revokeReason: 'refund' })], billing: [purchase('paid')] }, PREVIEW],
    ['a cached status of active grants nothing by itself', 'active', { membership: membership({ status: 'active', tier: 'pro' }) }, PREVIEW],
    ['a cached status of none beside a live grant removes nothing', 'active', { grants: [grant()], membership: membership({ status: 'none' }) }, BASIC],
    ['a cached status of lapsed beside a live grant removes nothing', 'active', { grants: [grant()], membership: membership({ status: 'lapsed' }) }, BASIC],
  ])('%s', (_, status, over, expected) => {
    expect(run(status, over)).toEqual(expected);
  });

  it('ignores role: an administrator without a grant is a preview reader', () => {
    // the function has no role input at all, which is the point; this pins that down
    expect(entitlement.length).toBe(1);
    expect(run('active')).toEqual(PREVIEW);
  });

  it('ranks tiers', () => {
    expect(higherTier(null, 'basic')).toBe('basic');
    expect(higherTier('basic', 'pro')).toBe('pro');
    expect(higherTier('pro', 'basic')).toBe('pro');
  });
});

describe('what each level opens', () => {
  it('pages: members open everything, preview readers the free set, nobody opens anything on none', () => {
    expect(pageOpen(PRO, 'ch2')).toBe(true);
    expect(pageOpen(BASIC, 'app-e')).toBe(true);
    expect(pageOpen(PREVIEW, 'ch1')).toBe(true);
    expect(pageOpen(PREVIEW, 'pref')).toBe(true);
    expect(pageOpen(PREVIEW, 'ch2')).toBe(false);
    expect(pageOpen({ level: 'preview', suspended: true }, 'ch7')).toBe(true);
    expect(pageOpen({ level: 'none' }, 'ch1')).toBe(false);
  });
  it('the coach is Pro only', () => {
    expect(coachOpen(PRO)).toBe(true);
    expect(coachOpen(BASIC)).toBe(false);
    expect(coachOpen(PREVIEW)).toBe(false);
  });
  it('tools: Basic gets the essential set on member pages and everything on free pages; Pro gets everything', () => {
    expect(toolOpen(BASIC, 'ch2', 'lead-sources')).toBe(false);
    expect(toolOpen(BASIC, 'ch2', 'speed-to-lead')).toBe(true);
    expect(toolOpen(BASIC, 'ch4', 'checkpoints')).toBe(true);
    expect(toolOpen(BASIC, 'ch7', 'pitfall-cycle')).toBe(true);
    expect(toolOpen(PRO, 'ch2', 'lead-sources')).toBe(true);
    expect(toolOpen(PREVIEW, 'ch1', 'goal-calculator')).toBe(true);
  });
});
