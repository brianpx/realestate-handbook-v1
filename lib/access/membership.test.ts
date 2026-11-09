import { describe, expect, it } from 'vitest';
import { MemoryAccessStore } from './memory-store';
import { currentGrant, membershipStale, projectMembership, recomputeMembership } from './membership';
import type { Grant, Membership } from './types';

const NOW = new Date('2026-11-08T12:00:00Z');
const days = (n: number) => new Date(NOW.getTime() + n * 24 * 3600 * 1000);
const grant = (over: Partial<Grant> = {}): Grant => ({
  id: 'g1', userId: 'u1', kind: 'complimentary', tier: 'basic', startsAt: days(-10), endsAt: null, billingRecordId: null,
  grantedBy: 'admin', grantNote: null, revokedAt: null, revokedBy: null, revokeReason: null, createdAt: days(-10), ...over,
});
const suspended: Membership = {
  userId: 'u1', status: 'suspended', tier: 'basic', startedAt: days(-10), endsAt: null, currentGrantId: 'g1', complimentary: true,
  suspendedAt: days(-1), suspendedBy: 'admin', suspendReason: 'abuse', updatedAt: days(-1),
};

describe('projectMembership', () => {
  it('is none with no grants, lapsed with only dead ones, active with a live one', () => {
    expect(projectMembership('u1', [], null, NOW)).toMatchObject({ status: 'none', tier: null, currentGrantId: null, complimentary: false });
    expect(projectMembership('u1', [grant({ endsAt: days(-1) })], null, NOW)).toMatchObject({ status: 'lapsed', currentGrantId: null });
    expect(projectMembership('u1', [grant({ revokedAt: days(-1), revokedBy: 'a', revokeReason: 'admin' })], null, NOW)).toMatchObject({ status: 'lapsed' });
    expect(projectMembership('u1', [grant()], null, NOW)).toMatchObject({ status: 'active', tier: 'basic', startedAt: days(-10), endsAt: null, currentGrantId: 'g1', complimentary: true, updatedAt: NOW });
  });
  it('suspension wins and its fields are carried over whatever the grants say', () => {
    expect(projectMembership('u1', [grant()], suspended, NOW)).toMatchObject({ status: 'suspended', suspendedAt: days(-1), suspendedBy: 'admin', suspendReason: 'abuse', currentGrantId: 'g1' });
    expect(projectMembership('u1', [], suspended, NOW)).toMatchObject({ status: 'suspended', currentGrantId: null, tier: null });
  });
  it('shows a purchase ahead of a complimentary grant, then the one that runs longest', () => {
    const comp = grant({ id: 'comp', endsAt: null });
    const purchase = grant({ id: 'buy', kind: 'purchase', tier: 'pro', billingRecordId: 'b', grantedBy: null, endsAt: days(30) });
    const shortPromo = grant({ id: 'promo', kind: 'promo', endsAt: days(5) });
    expect(currentGrant([comp, purchase, shortPromo], NOW)?.id).toBe('buy');
    expect(currentGrant([shortPromo, comp], NOW)?.id).toBe('comp');
    expect(projectMembership('u1', [comp, purchase], null, NOW)).toMatchObject({ tier: 'pro', complimentary: false, endsAt: days(30) });
  });
  it('knows when the cached row has gone stale', () => {
    expect(membershipStale(null, NOW)).toBe(false);
    expect(membershipStale({ ...suspended, status: 'active', suspendedAt: null, endsAt: days(-1) }, NOW)).toBe(true);
    expect(membershipStale({ ...suspended, status: 'active', suspendedAt: null, endsAt: days(1) }, NOW)).toBe(false);
    expect(membershipStale({ ...suspended, status: 'active', suspendedAt: null, endsAt: null }, NOW)).toBe(false);
  });
});

describe('recomputeMembership', () => {
  it('writes the projection from the grants on file, keeping an existing suspension', async () => {
    const store = new MemoryAccessStore();
    store.grants.push(grant());
    expect(await recomputeMembership(store, 'u1', NOW)).toMatchObject({ status: 'active', currentGrantId: 'g1' });
    expect(store.memberships).toHaveLength(1);
    store.memberships[0] = { ...store.memberships[0]!, suspendedAt: NOW, suspendedBy: 'admin', suspendReason: 'abuse', status: 'suspended' };
    expect(await recomputeMembership(store, 'u1', days(1))).toMatchObject({ status: 'suspended', suspendedAt: NOW });
    expect(store.memberships).toHaveLength(1);
  });
});
