import { describe, expect, it } from 'vitest';
import { entitlement } from '@/lib/access/entitlement';
import { MemoryAccessStore } from '@/lib/access/memory-store';
import { MemoryAuthStore } from '@/lib/auth/memory-store';
import { MemoryUserStore } from '@/lib/users/store';
import { MemoryBillingStore } from './memory-store';
import type { MirrorInput } from './types';

const NOW = new Date('2026-11-10T12:00:00.000Z');
const LATER = new Date('2026-11-10T13:00:00.000Z');

function setup() {
  const users = new MemoryUserStore();
  const auth = new MemoryAuthStore();
  const access = new MemoryAccessStore({ users, auth });
  const billing = new MemoryBillingStore({ access, users, auth });
  return { users, auth, access, billing };
}

function paid(userId: string, over: Partial<MirrorInput> = {}): MirrorInput {
  return {
    provider: 'lemonsqueezy', providerObjectId: '99', kind: 'purchase', tier: 'pro', productKey: 'handbook-v1',
    status: 'paid', providerStatus: 'paid', userId, customerId: '55', customerEmail: 'buyer@e2e.test',
    providerPaymentId: null, providerPriceId: '2357694', amountCents: 4321, currency: 'USD',
    paidAt: NOW, refundedAt: null, disputedAt: null, trialEndsAt: null, currentPeriodStart: null, currentPeriodEnd: null,
    cancelRequestedAt: null, cancelEffectiveAt: null, accessEndsAt: null, lastEventAt: NOW, notes: null,
    manageUrl: 'https://pay.example/receipt', grant: 'grant', revokeReason: null,
    actor: { kind: 'webhook', userId: null }, at: NOW, ...over,
  };
}

describe('MemoryBillingStore', () => {
  it('creates an unverified reader and leaves an existing role alone', async () => {
    const { billing, users } = setup();
    const created = await billing.createReader('buyer@e2e.test', NOW);
    expect(created).toMatchObject({ role: 'reader', status: 'active', emailVerifiedAt: null, email: 'buyer@e2e.test' });
    created.role = 'admin';
    const again = await billing.createReader('buyer@e2e.test', LATER);
    expect(again.role).toBe('admin');
    expect(again.id).toBe(created.id);
    expect(users.users).toHaveLength(1);
  });

  it('grants once from the order amount, then a refund returns the reader to preview without touching role', async () => {
    const { billing, access, users } = setup();
    const user = await billing.createReader('buyer@e2e.test', NOW);
    user.role = 'reader';
    const first = await billing.commitMirror(paid(user.id));
    expect(first.applied).toBe(true);
    expect(billing.records).toHaveLength(1);
    expect(billing.records[0]?.amountCents).toBe(4321);
    expect(access.grants).toHaveLength(1);
    expect(access.grants[0]).toMatchObject({ tier: 'pro', endsAt: null, revokedAt: null, billingRecordId: billing.records[0]?.id });
    expect(access.audit.map(a => a.action)).toEqual(['billing.event']);
    expect(entitlement({ status: user.status, snapshot: await access.loadAccess(user.id), now: NOW })).toEqual({ level: 'member', tier: 'pro' });

    await billing.commitMirror(paid(user.id, {
      status: 'refunded', providerStatus: 'refunded', grant: 'revoke', revokeReason: 'refund',
      accessEndsAt: LATER, refundedAt: LATER, lastEventAt: LATER, at: LATER,
    }));
    expect(access.grants).toHaveLength(1);
    expect(access.grants[0]?.revokeReason).toBe('refund');
    expect(user.role).toBe('reader');
    expect(user.status).toBe('active');
    expect(entitlement({ status: user.status, snapshot: await access.loadAccess(user.id), now: LATER }).level).toBe('preview');
    expect(users.users.filter(u => u.role === 'admin')).toHaveLength(0);
  });

  it('ignores an older event and does not audit a retry that changes nothing', async () => {
    const { billing, access } = setup();
    const user = await billing.createReader('buyer@e2e.test', NOW);
    await billing.commitMirror(paid(user.id));
    const stale = await billing.commitMirror(paid(user.id, { lastEventAt: new Date(NOW.getTime() - 1000), at: new Date(NOW.getTime() - 1000) }));
    expect(stale.applied).toBe(false);
    const retry = await billing.commitMirror(paid(user.id));
    expect(retry.applied).toBe(true);
    expect(access.grants).toHaveLength(1);
    expect(access.audit).toHaveLength(1);
  });

  it('keeps the record when the grant write throws, and one retry finishes the grant', async () => {
    const { billing, access } = setup();
    const user = await billing.createReader('buyer@e2e.test', NOW);
    billing.throwAfter = 'record';
    await expect(billing.commitMirror(paid(user.id))).rejects.toMatchObject({ name: 'BillingStepError' });
    expect(billing.records).toHaveLength(1);
    expect(access.grants).toHaveLength(0);
    billing.throwAfter = 'grant';
    await expect(billing.commitMirror(paid(user.id))).rejects.toMatchObject({ name: 'BillingStepError' });
    expect(access.grants).toHaveLength(1);
    billing.throwAfter = null;
    await billing.commitMirror(paid(user.id));
    expect(access.grants).toHaveLength(1);
    expect(billing.records).toHaveLength(1);
  });

  it('claims a failed event again and leaves a processed one as a duplicate', async () => {
    const { billing } = setup();
    const event = {
      provider: 'lemonsqueezy', providerEventId: 'order_created:99:t', eventType: 'order_created',
      objectId: '99', eventCreatedAt: NOW, payload: { event: 'order_created', objectId: '99' },
    };
    const first = await billing.claimEvent(event, NOW);
    expect(first.claimed).toBe(true);
    if (!first.claimed) return;
    expect(await billing.claimEvent(event, LATER)).toEqual({ claimed: false });
    await billing.setEventStatus(first.id, 'failed', 'BillingFetchFailed', LATER);
    const retry = await billing.claimEvent(event, LATER);
    expect(retry).toEqual({ claimed: true, id: first.id });
  });

  it('records a ready-email resend only for a paid row', async () => {
    const { billing, access } = setup();
    const user = await billing.createReader('buyer@e2e.test', NOW);
    const mirrored = await billing.commitMirror(paid(user.id));
    if (!mirrored.applied) throw new Error('expected a record');
    expect(await billing.recordResend(mirrored.record.id, LATER, { kind: 'admin', userId: user.id })).toEqual({ ok: true });
    expect(billing.records[0]?.readyEmailSentAt).toEqual(LATER);
    expect(access.audit.filter(a => a.action === 'billing.resend_ready_email')).toHaveLength(1);
    await billing.commitMirror(paid(user.id, { status: 'pending', grant: 'none', lastEventAt: LATER, at: LATER, providerObjectId: '100' }));
    const pending = billing.records.find(r => r.providerObjectId === '100');
    expect(await billing.recordResend(pending!.id, LATER, { kind: 'admin', userId: user.id })).toEqual({ ok: false, reason: 'not_paid' });
  });
});
