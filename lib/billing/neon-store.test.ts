import { describe, expect, it } from 'vitest';
import { fakeSql } from '@/lib/db/fake-sql';
import type { Row } from '@/lib/db/sql';
import { NeonBillingStore } from './neon-store';
import type { MirrorInput } from './types';

const NOW = new Date('2026-11-10T12:00:00.000Z');
const USER = '22222222-2222-4222-8222-222222222222';
const ACTOR = '33333333-3333-4333-8333-333333333333';

function recordRow(over: Row = {}): Row {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    kind: 'purchase',
    tier: 'basic',
    status: 'paid',
    provider: 'lemonsqueezy',
    provider_object_id: '99',
    product_key: 'handbook-v1',
    user_id: USER,
    amount_cents: 4321,
    currency: 'USD',
    created_at: NOW.toISOString(),
    updated_at: NOW.toISOString(),
    ...over,
  };
}

function mirror(over: Partial<MirrorInput> = {}): MirrorInput {
  return {
    provider: 'lemonsqueezy', providerObjectId: '99', kind: 'purchase', tier: 'basic', productKey: 'handbook-v1',
    status: 'paid', providerStatus: 'paid', userId: USER, customerId: '55', customerEmail: 'buyer@e2e.test',
    providerPaymentId: 'pay_1', providerPriceId: '2357693', amountCents: 4321, currency: 'USD',
    paidAt: NOW, refundedAt: null, disputedAt: null, trialEndsAt: null, currentPeriodStart: null, currentPeriodEnd: null,
    cancelRequestedAt: null, cancelEffectiveAt: null, accessEndsAt: null, lastEventAt: NOW, notes: null,
    manageUrl: 'https://pay.example/receipt', grant: 'grant', revokeReason: null,
    actor: { kind: 'webhook', userId: null }, at: NOW, ...over,
  };
}

describe('NeonBillingStore statements', () => {
  it('claims an event only when the stored row failed, and binds the payload', async () => {
    const { sql, calls } = fakeSql([]);
    const result = await new NeonBillingStore(sql).claimEvent({
      provider: 'lemonsqueezy', providerEventId: 'order_created:99:2026-11-10T12:00:00.000Z', eventType: 'order_created',
      objectId: '99', eventCreatedAt: NOW, payload: { event: 'order_created', objectId: '99' },
    }, NOW);
    expect(result).toEqual({ claimed: false });
    expect(calls[0]?.text).toContain('on conflict (provider, provider_event_id) do update');
    expect(calls[0]?.text).toContain("where billing_events.status = 'failed'");
    expect(calls[0]?.text).not.toContain('buyer@e2e.test');
    expect(calls[0]?.values).toContain('{"event":"order_created","objectId":"99"}');
  });

  it('mirrors a record, grant and audit in one statement, with the amount bound and no role write', async () => {
    const { sql, calls, transactions } = fakeSql([recordRow()]);
    const result = await new NeonBillingStore(sql).commitMirror(mirror());
    expect(result.applied).toBe(true);
    expect(transactions).toEqual([1]);
    const text = calls[0]?.text ?? '';
    expect(text).toContain('on conflict (provider, provider_object_id) do update');
    expect(text).toContain('billing_records.last_event_at is null or billing_records.last_event_at <= excluded.last_event_at');
    expect(text).toContain('not exists (select 1 from live_grant)');
    expect(text).toContain('suspended_at = memberships.suspended_at');
    expect(text).toContain("'billing.event'");
    expect(text).not.toContain('ready_email_sent_at =');
    expect(text).not.toContain('set role');
    expect(text).not.toContain('suspended_at = excluded');
    expect(text).not.toContain('buyer@e2e.test');
    expect(text).not.toContain('4321');
    expect(calls[0]?.values).toContain(4321);
    expect(calls[0]?.values).toContain('buyer@e2e.test');
    expect(calls[0]?.values).not.toContain('admin');
  });

  it('inserts a reader and does not update an existing user', async () => {
    const { sql, calls } = fakeSql([{
      id: USER, email: 'buyer@e2e.test', email_verified_at: null, role: 'reader', status: 'active',
      accepted_terms_version: null, accepted_terms_at: null, last_sign_in_at: null, created_at: NOW.toISOString(),
    }]);
    const user = await new NeonBillingStore(sql).createReader('buyer@e2e.test', NOW);
    expect(user).toMatchObject({ id: USER, role: 'reader', status: 'active', emailVerifiedAt: null });
    const text = calls[0]?.text ?? '';
    expect(text).toContain("values (?, 'reader', 'active'");
    expect(text).toContain('on conflict (email) do nothing');
    expect(text).not.toContain('do update');
    expect(text).not.toContain('set role');
    expect(calls[0]?.values).toEqual(['buyer@e2e.test', NOW.toISOString(), NOW.toISOString(), 'buyer@e2e.test']);
  });

  it('refuses to mark a resend on a row that is not paid', async () => {
    const { sql, calls } = fakeSql([{ status: 'partially_refunded', wrote: false }]);
    const result = await new NeonBillingStore(sql).recordResend(USER, NOW, { kind: 'admin', userId: ACTOR });
    expect(result).toEqual({ ok: false, reason: 'not_paid' });
    expect(calls[0]?.text).toContain("status = 'paid'");
    expect(calls[0]?.text).toContain("'billing.resend_ready_email'");
    expect(calls[0]?.text).not.toContain('set role');
    expect(calls[0]?.values).toContain('admin');
  });
});
