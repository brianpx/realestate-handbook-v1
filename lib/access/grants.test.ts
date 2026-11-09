import { describe, expect, it } from 'vitest';
import { bootstrapOwnerGrant, grantAccess, revokeAccess } from './grants';
import { MemoryAccessStore } from './memory-store';
import { grantInputSchema, revokeInputSchema } from './validate';

const NOW = new Date('2026-11-08T12:00:00Z');
const LATER = new Date('2026-11-09T12:00:00Z');
const USER = '11111111-1111-4111-8111-111111111111';
const ADMIN = '22222222-2222-4222-8222-222222222222';
const actor = { kind: 'admin' as const, userId: ADMIN, ipHash: 'ip' };

describe('grantAccess and revokeAccess', () => {
  it('writes the grant, one audit row with the actor, and the membership projection', async () => {
    const store = new MemoryAccessStore();
    const grant = await grantAccess(store, { userId: USER, kind: 'complimentary', tier: 'basic', grantedBy: ADMIN, grantNote: 'Beta reader' }, actor, NOW);
    expect(grant).toMatchObject({ userId: USER, kind: 'complimentary', tier: 'basic', startsAt: NOW, endsAt: null, grantedBy: ADMIN, grantNote: 'Beta reader', revokedAt: null });
    expect(store.audit).toHaveLength(1);
    expect(store.audit[0]).toMatchObject({ action: 'grant.create', actorKind: 'admin', actorUserId: ADMIN, ipHash: 'ip', subjectTable: 'access_grants', subjectId: grant.id, before: null, reason: 'Beta reader' });
    expect(store.audit[0]!.after).toMatchObject({ id: grant.id, tier: 'basic' });
    expect(store.memberships[0]).toMatchObject({ userId: USER, status: 'active', tier: 'basic', currentGrantId: grant.id, complimentary: true });
  });
  it('revokes once: the second attempt changes nothing and writes no second audit row', async () => {
    const store = new MemoryAccessStore();
    const grant = await grantAccess(store, { userId: USER, kind: 'complimentary', tier: 'pro', grantedBy: ADMIN }, actor, NOW);
    const revoked = await revokeAccess(store, { grantId: grant.id, reason: 'abuse' }, actor, LATER);
    expect(revoked).toMatchObject({ id: grant.id, revokedAt: LATER, revokedBy: ADMIN, revokeReason: 'abuse' });
    expect(store.audit.map(a => a.action)).toEqual(['grant.create', 'grant.revoke']);
    expect(store.audit[1]).toMatchObject({ reason: 'abuse', before: expect.objectContaining({ revokedAt: null }), after: expect.objectContaining({ revokedAt: LATER }) });
    expect(store.memberships[0]).toMatchObject({ status: 'lapsed', currentGrantId: null, tier: null });

    expect(await revokeAccess(store, { grantId: grant.id, reason: 'admin' }, actor, LATER)).toBeNull();
    expect(await revokeAccess(store, { grantId: '33333333-3333-4333-8333-333333333333', reason: 'admin' }, actor, LATER)).toBeNull();
    expect(store.audit).toHaveLength(2);
  });
  it('gives the first administrator a complimentary Pro grant by the system', async () => {
    const store = new MemoryAccessStore();
    const grant = await bootstrapOwnerGrant(store, ADMIN, NOW);
    expect(grant).toMatchObject({ userId: ADMIN, kind: 'complimentary', tier: 'pro', endsAt: null, grantedBy: ADMIN });
    expect(store.audit[0]).toMatchObject({ action: 'grant.create', actorKind: 'system', actorUserId: null });
  });
});

describe('the input schemas', () => {
  it('ties the kind to who or what made the grant', () => {
    expect(grantInputSchema.safeParse({ userId: USER, kind: 'complimentary', tier: 'basic' }).success).toBe(false);
    expect(grantInputSchema.safeParse({ userId: USER, kind: 'complimentary', tier: 'basic', grantedBy: ADMIN }).success).toBe(true);
    expect(grantInputSchema.safeParse({ userId: USER, kind: 'purchase', tier: 'basic', grantedBy: ADMIN }).success).toBe(false);
    expect(grantInputSchema.safeParse({ userId: USER, kind: 'purchase', tier: 'basic', billingRecordId: ADMIN }).success).toBe(true);
    expect(grantInputSchema.safeParse({ userId: USER, kind: 'promo', tier: 'gold', grantedBy: ADMIN }).success).toBe(false);
    expect(grantInputSchema.safeParse({ userId: 'not-a-uuid', kind: 'promo', tier: 'basic', grantedBy: ADMIN }).success).toBe(false);
    expect(grantInputSchema.safeParse({ userId: USER, kind: 'promo', tier: 'basic', grantedBy: ADMIN, startsAt: LATER, endsAt: NOW }).success).toBe(false);
    expect(grantInputSchema.safeParse({ userId: USER, kind: 'promo', tier: 'basic', grantedBy: ADMIN, grantNote: 'x'.repeat(501) }).success).toBe(false);
  });
  it('accepts only the known revoke reasons', () => {
    expect(revokeInputSchema.safeParse({ grantId: USER, reason: 'refund' }).success).toBe(true);
    expect(revokeInputSchema.safeParse({ grantId: USER, reason: 'because' }).success).toBe(false);
  });
});
