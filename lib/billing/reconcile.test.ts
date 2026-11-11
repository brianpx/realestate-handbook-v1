import { describe, expect, it, vi } from 'vitest';
import { entitlement } from '@/lib/access/entitlement';
import { MemoryAccessStore } from '@/lib/access/memory-store';
import { sendReadyLink } from '@/lib/auth/mail';
import { MemoryAuthStore } from '@/lib/auth/memory-store';
import { tokenExpiry } from '@/lib/auth/session';
import { hashSecret, newSecret } from '@/lib/auth/token';
import { MemoryUserStore } from '@/lib/users/store';
import { LemonSqueezyAdapter } from './adapters/lemonsqueezy';
import { MemoryBillingStore } from './memory-store';
import { bearerMatches, reconcileBilling, resyncUserRecords, type ReconcileDeps } from './reconcile';
import type { MirrorInput } from './types';

const NOW = new Date('2026-11-10T12:05:00.000Z');
const ORIGIN = 'https://handbook.example';

function order(attributes: Record<string, unknown> = {}) {
  return {
    meta: { event_name: 'order_created' },
    data: {
      type: 'orders',
      id: '99',
      attributes: {
        status: 'paid', user_email: 'buyer@e2e.test', customer_id: 55, total: 4321, currency: 'USD',
        refunded_amount: 0, identifier: 'pay_1', first_order_item: { variant_id: 2357693 },
        urls: { receipt: 'https://app.lemonsqueezy.com/my-orders/abc' },
        created_at: '2026-11-10T11:00:00.000Z', updated_at: NOW.toISOString(), role: 'admin',
        ...attributes,
      },
    },
  };
}

function pending(userId: string): MirrorInput {
  return {
    provider: 'lemonsqueezy', providerObjectId: '99', kind: 'purchase', tier: 'basic', productKey: 'handbook-v1',
    status: 'pending', providerStatus: 'pending', userId, customerId: '55', customerEmail: 'buyer@e2e.test',
    providerPaymentId: null, providerPriceId: '2357693', amountCents: 4321, currency: 'USD',
    paidAt: null, refundedAt: null, disputedAt: null, trialEndsAt: null, currentPeriodStart: null, currentPeriodEnd: null,
    cancelRequestedAt: null, cancelEffectiveAt: null, accessEndsAt: null, lastEventAt: NOW, notes: null,
    manageUrl: null, grant: 'none', revokeReason: null, actor: { kind: 'webhook', userId: null }, at: NOW,
  };
}

function harness(fetched: () => unknown) {
  const users = new MemoryUserStore();
  const auth = new MemoryAuthStore();
  const access = new MemoryAccessStore({ users, auth });
  const store = new MemoryBillingStore({ access, users, auth });
  const fetchImpl = vi.fn<typeof fetch>(async (url) => {
    if (String(url).includes('api.lemonsqueezy.com')) return new Response(JSON.stringify(fetched()), { status: 200 });
    if (String(url).endsWith('/api/v1/send')) return new Response('ok', { status: 200 });
    return new Response('no', { status: 404 });
  });
  const deps: ReconcileDeps = {
    store,
    adapter: new LemonSqueezyAdapter({ webhookSecret: 'secret', apiKey: 'key', apiBase: 'https://api.lemonsqueezy.com/v1', fixturePath: null }),
    now: () => NOW,
    origin: ORIGIN,
    mail: { provider: 'mailpit', url: 'http://localhost:8025', from: 'handbook@example.test', fromName: 'Handbook', mailingAddress: '' },
    fetchImpl,
    issueSignIn: async (email, at) => {
      const raw = newSecret();
      await auth.createToken({ tokenHash: hashSecret(raw), email, nextPath: '/handbook', termsVersion: 'v1', source: null, expiresAt: tokenExpiry(at), createdIpHash: null, createdAt: at });
      return raw;
    },
    sendReady: sendReadyLink,
  };
  const sends = () => fetchImpl.mock.calls.filter(call => String(call[0]).endsWith('/api/v1/send')).length;
  return { users, auth, access, store, deps, sends };
}

describe('bearerMatches', () => {
  it('accepts only the full bearer secret and does not throw on a short header', () => {
    expect(bearerMatches('Bearer cron-secret', 'cron-secret')).toBe(true);
    expect(bearerMatches('Bearer wrong', 'cron-secret')).toBe(false);
    expect(bearerMatches('Bearer cron-secret-extra', 'cron-secret')).toBe(false);
    expect(bearerMatches('nope', 'cron-secret')).toBe(false);
    expect(bearerMatches(null, 'cron-secret')).toBe(false);
    expect(bearerMatches('Bearer cron-secret', undefined)).toBe(false);
  });
});

describe('reconcileBilling', () => {
  it('re-queues a received row older than ten minutes and leaves a fresh one', async () => {
    const h = harness(() => order());
    const stuck = await h.store.claimEvent({
      provider: 'lemonsqueezy', providerEventId: 'order_created:1:old', eventType: 'order_created',
      objectId: '1', eventCreatedAt: NOW, payload: { event: 'order_created', objectId: '1' },
    }, NOW);
    const fresh = await h.store.claimEvent({
      provider: 'lemonsqueezy', providerEventId: 'order_created:2:new', eventType: 'order_created',
      objectId: '2', eventCreatedAt: NOW, payload: { event: 'order_created', objectId: '2' },
    }, NOW);
    if (!stuck.claimed || !fresh.claimed) throw new Error('expected claims');
    const old = h.store.events.find(event => event.id === stuck.id);
    if (!old) throw new Error('expected the stuck row');
    old.receivedAt = new Date(NOW.getTime() - 11 * 60 * 1000);
    const report = await reconcileBilling(h.deps);
    expect(report.requeued).toBe(1);
    expect(h.store.events.find(event => event.id === stuck.id)).toMatchObject({ status: 'failed', error: 'StaleReceived' });
    expect(h.store.events.find(event => event.id === fresh.id)?.status).toBe('received');
  });

  it('mirrors a pending row to paid, sends the ready email once, and a later refund returns preview', async () => {
    let body = order();
    const h = harness(() => body);
    const user = await h.store.createReader('buyer@e2e.test', NOW);
    await h.store.commitMirror(pending(user.id));
    const first = await reconcileBilling(h.deps);
    expect(first.mirrored).toBe(1);
    expect(first.readyEmails).toBe(1);
    expect(h.store.records[0]).toMatchObject({ status: 'paid', amountCents: 4321, readyEmailSentAt: NOW });
    expect(h.access.grants).toHaveLength(1);
    expect(h.sends()).toBe(1);
    expect(h.access.audit.filter(row => row.actorKind === 'system' && row.action === 'billing.event')).toHaveLength(1);
    expect(user.role).toBe('reader');
    expect(entitlement({ status: user.status, snapshot: await h.access.loadAccess(user.id), now: NOW })).toEqual({ level: 'member', tier: 'basic' });

    const second = await reconcileBilling(h.deps);
    expect(second.readyEmails).toBe(0);
    expect(h.sends()).toBe(1);
    expect(h.access.grants).toHaveLength(1);

    body = order({ status: 'refunded', refunded: true, refunded_amount: 4321, updated_at: '2026-11-10T12:06:00.000Z' });
    await reconcileBilling(h.deps);
    expect(user.role).toBe('reader');
    expect(h.access.grants[0]?.revokeReason).toBe('refund');
    expect(entitlement({ status: user.status, snapshot: await h.access.loadAccess(user.id), now: NOW }).level).toBe('preview');
    expect(h.sends()).toBe(1);
  });

  it('carries on past an order the provider will not return, and counts it', async () => {
    const h = harness(() => order());
    const user = await h.store.createReader('buyer@e2e.test', NOW);
    await h.store.commitMirror({ ...pending(user.id), providerObjectId: '98' });
    await h.store.commitMirror(pending(user.id));
    const fetchImpl = vi.fn<typeof fetch>(async (url) => {
      const href = String(url);
      if (href.endsWith('/orders/98')) return new Response('gone', { status: 404 });
      if (href.includes('api.lemonsqueezy.com')) return new Response(JSON.stringify(order()), { status: 200 });
      return new Response('ok', { status: 200 });
    });
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    const report = await reconcileBilling({ ...h.deps, fetchImpl });
    expect(logged).toHaveBeenCalledWith('billing: reconcile mirror failed', 'BillingFetchFailed');
    logged.mockRestore();
    expect(report).toMatchObject({ mirrored: 1, mirrorFailures: 1, readyEmails: 1 });
    expect(h.store.records.find(record => record.providerObjectId === '98')?.status).toBe('pending');
    expect(h.store.records.find(record => record.providerObjectId === '99')?.status).toBe('paid');
  });

  it('re-reads a refunded record without moving its dates or writing another audit row', async () => {
    let body = order();
    const h = harness(() => body);
    const user = await h.store.createReader('buyer@e2e.test', NOW);
    await h.store.commitMirror(pending(user.id));
    await reconcileBilling(h.deps);
    body = order({ status: 'refunded', refunded: true, refunded_amount: 4321, updated_at: '2026-11-10T12:06:00.000Z' });
    const admin = { kind: 'admin' as const, userId: null };
    const at = (minutes: number): ReconcileDeps => ({ ...h.deps, now: () => new Date(NOW.getTime() + minutes * 60_000) });
    expect(await resyncUserRecords(at(60), user.id, admin)).toEqual({ changed: true });
    const refundedAt = h.store.records[0]?.refundedAt;
    expect(refundedAt).toEqual(new Date(NOW.getTime() + 60 * 60_000));
    const audits = h.access.audit.length;
    expect(await resyncUserRecords(at(120), user.id, admin)).toEqual({ changed: false });
    expect(h.store.records[0]?.refundedAt).toEqual(refundedAt);
    expect(h.store.records[0]?.accessEndsAt).toEqual(refundedAt);
    expect(h.access.audit).toHaveLength(audits);
  });

  it('nulls payloads older than 90 days and deletes expired auth rows', async () => {
    const h = harness(() => order());
    const kept = await h.store.claimEvent({
      provider: 'lemonsqueezy', providerEventId: 'order_created:9:new', eventType: 'order_created',
      objectId: '9', eventCreatedAt: NOW, payload: { event: 'order_created', objectId: '9' },
    }, NOW);
    const aged = await h.store.claimEvent({
      provider: 'lemonsqueezy', providerEventId: 'order_created:8:old', eventType: 'order_created',
      objectId: '8', eventCreatedAt: NOW, payload: { event: 'order_created', objectId: '8' },
    }, NOW);
    if (!kept.claimed || !aged.claimed) throw new Error('expected claims');
    const old = h.store.events.find(event => event.id === aged.id);
    if (!old) throw new Error('expected the old row');
    old.receivedAt = new Date(NOW.getTime() - 91 * 24 * 3600 * 1000);
    h.auth.tokens.push({ tokenHash: 'expired', email: 'a@e2e.test', nextPath: '/handbook', termsVersion: 'v1', source: null, expiresAt: new Date(NOW.getTime() - 1000), consumedAt: null, createdIpHash: null, createdAt: NOW });
    h.auth.tokens.push({ tokenHash: 'live', email: 'a@e2e.test', nextPath: '/handbook', termsVersion: 'v1', source: null, expiresAt: new Date(NOW.getTime() + 60_000), consumedAt: null, createdIpHash: null, createdAt: NOW });
    h.auth.sessions.push({ idHash: 'expired-session', userId: 'u', createdAt: NOW, expiresAt: new Date(NOW.getTime() - 1000), lastSeenAt: NOW, revokedAt: null });
    const report = await reconcileBilling(h.deps);
    expect(report.payloadsNulled).toBe(1);
    expect(h.store.events.find(event => event.id === aged.id)?.payload).toBeNull();
    expect(h.store.events.find(event => event.id === kept.id)?.payload).toEqual({ event: 'order_created', objectId: '9' });
    expect(h.auth.tokens.map(token => token.tokenHash)).toEqual(['live']);
    expect(h.auth.sessions).toHaveLength(0);
  });
});
