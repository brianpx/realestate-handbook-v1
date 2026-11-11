import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { entitlement } from '@/lib/access/entitlement';
import { MemoryAccessStore } from '@/lib/access/memory-store';
import { MemoryAuthStore } from '@/lib/auth/memory-store';
import { sendReadyLink } from '@/lib/auth/mail';
import type { MailConfig } from '@/lib/leads/mail';
import { tokenExpiry } from '@/lib/auth/session';
import { hashSecret, newSecret } from '@/lib/auth/token';
import { MemoryUserStore } from '@/lib/users/store';
import { LemonSqueezyAdapter, providerEventId } from './adapters/lemonsqueezy';
import { MemoryBillingStore } from './memory-store';
import { processBillingWebhook, type ProcessDeps, type ProcessResult, type WebhookInput } from './process-event';
import type { BillingThrowAfter } from './types';

const NOW = new Date('2026-11-10T12:05:00.000Z');
const SECRET = 'test-webhook-secret';
const ORIGIN = 'https://handbook.example';

function order(attributes: Record<string, unknown> = {}, meta: Record<string, unknown> = {}) {
  return {
    meta: { event_name: 'order_created', custom_data: { user_id: '22222222-2222-2222-2222-222222222222' }, ...meta },
    data: {
      type: 'orders',
      id: '99',
      attributes: {
        status: 'paid',
        user_email: 'Buyer@E2E.test',
        customer_id: 55,
        total: 4321,
        currency: 'USD',
        refunded_amount: 0,
        identifier: 'pay_1',
        first_order_item: { variant_id: 2357693 },
        urls: { receipt: 'https://app.lemonsqueezy.com/my-orders/abc' },
        created_at: '2026-11-10T11:00:00.000000Z',
        updated_at: '2026-11-10T12:05:00.000000Z',
        ...attributes,
      },
    },
  };
}

function sign(body: unknown, eventName = 'order_created'): WebhookInput {
  const raw = JSON.stringify(body);
  return { raw, eventName, origin: ORIGIN, signature: createHmac('sha256', SECRET).update(raw).digest('hex') };
}

type MailSend = { to: string; subject: string; text: string };

function isMail(value: unknown): value is { To: { Email?: string }[]; Subject?: string; Text?: string } {
  return value !== null && typeof value === 'object';
}

function harness(fetched: () => unknown = () => order({ }, { custom_data: undefined }), mail: MailConfig = { provider: 'mailpit', url: 'http://localhost:8025', from: 'handbook@example.test', fromName: 'Handbook', mailingAddress: '' }) {
  const users = new MemoryUserStore();
  const auth = new MemoryAuthStore();
  const access = new MemoryAccessStore({ users, auth });
  const store = new MemoryBillingStore({ access, users, auth });
  const adapter = new LemonSqueezyAdapter({ webhookSecret: SECRET, apiKey: 'test-key', apiBase: 'https://api.lemonsqueezy.com/v1', fixturePath: null });
  const fetchImpl = vi.fn<typeof fetch>(async (url) => {
    const href = String(url);
    if (href.includes('api.lemonsqueezy.com')) return new Response(JSON.stringify(fetched()), { status: 200 });
    if (href.endsWith('/api/v1/send')) return new Response('ok', { status: 200 });
    return new Response('no', { status: 404 });
  });
  const deps: ProcessDeps = {
    store,
    adapter,
    now: () => NOW,
    mail,
    fetchImpl,
    issueSignIn: async (email, at) => {
      const raw = newSecret();
      await auth.createToken({ tokenHash: hashSecret(raw), email, nextPath: '/handbook', termsVersion: 'v1', source: null, expiresAt: tokenExpiry(at), createdIpHash: null, createdAt: at });
      return raw;
    },
    sendReady: sendReadyLink,
  };
  const sends = (): MailSend[] => fetchImpl.mock.calls.flatMap(call => {
    if (!String(call[0]).endsWith('/api/v1/send')) return [];
    const raw = call[1]?.body;
    if (typeof raw !== 'string') return [];
    const parsed: unknown = JSON.parse(raw);
    if (!isMail(parsed) || !parsed.To[0]?.Email || !parsed.Subject || !parsed.Text) return [];
    return [{ to: parsed.To[0].Email, subject: parsed.Subject, text: parsed.Text }];
  });
  const process = (input: WebhookInput): Promise<ProcessResult> => processBillingWebhook(input, deps);
  return { users, auth, access, store, fetchImpl, sends, process };
}

describe('billing webhooks', () => {
  it('rejects a bad signature or a stale timestamp before writing anything', async () => {
    const h = harness();
    expect(await h.process({ raw: '{"ok":true}', signature: 'ab', eventName: 'order_created', origin: ORIGIN })).toEqual({ status: 400, error: 'bad_signature' });
    const stale = sign(order({ updated_at: '2026-11-10T11:00:00.000Z' }, { custom_data: undefined }));
    expect(await h.process(stale)).toEqual({ status: 400, error: 'stale_timestamp' });
    const raw = 'not-json';
    expect(await h.process({ raw, signature: createHmac('sha256', SECRET).update(raw).digest('hex'), eventName: 'order_created', origin: ORIGIN })).toEqual({ status: 400, error: 'bad_payload' });
    expect(h.store.events).toHaveLength(0);
    expect(h.store.records).toHaveLength(0);
    expect(h.fetchImpl).not.toHaveBeenCalled();
    expect(h.users.users).toHaveLength(0);
  });

  it('creates a reader from an unknown checkout email and sends one ready email', async () => {
    const h = harness();
    const body = order({ role: 'admin' }, { custom_data: undefined });
    expect(await h.process(sign(body))).toEqual({ status: 200, outcome: 'processed' });
    expect(h.users.users).toHaveLength(1);
    expect(h.users.users[0]).toMatchObject({ email: 'buyer@e2e.test', role: 'reader', status: 'active', emailVerifiedAt: null });
    expect(h.store.records[0]).toMatchObject({ status: 'paid', tier: 'basic', amountCents: 4321, userId: h.users.users[0]?.id });
    expect(h.access.grants).toHaveLength(1);
    expect(h.access.grants[0]).toMatchObject({ tier: 'basic', endsAt: null, revokedAt: null });
    expect(h.access.audit.map(a => a.action)).toEqual(['billing.event']);
    expect(JSON.stringify(h.store.events[0]?.payload)).not.toContain('buyer@e2e.test');
    expect(JSON.stringify(h.access.audit)).not.toContain('@');
    const sent = h.sends();
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ to: 'buyer@e2e.test', subject: 'Your handbook is ready' });
    expect(sent[0]?.text).toContain(`${ORIGIN}/auth/verify?token=`);
    expect(sent[0]?.text).not.toMatch(/\$79|\$149/);
    expect(h.auth.tokens[0]).toMatchObject({ email: 'buyer@e2e.test', nextPath: '/handbook', termsVersion: 'v1', source: null });
    const token = sent[0]?.text.match(/token=([^\s]+)/)?.[1];
    expect(token).toBeTruthy();
    if (token) expect(h.auth.tokens[0]?.tokenHash).toBe(hashSecret(token));
    const user = h.users.users[0];
    if (!user) throw new Error('expected a user');
    expect(entitlement({ status: user.status, snapshot: await h.access.loadAccess(user.id), now: NOW })).toEqual({ level: 'member', tier: 'basic' });

    expect(await h.process(sign(body))).toEqual({ status: 200, duplicate: true });
    expect(h.sends()).toHaveLength(1);
    expect(h.access.grants).toHaveLength(1);
    expect(h.users.users[0]?.role).toBe('reader');
  });

  it('lets a metadata user id win over a different checkout email', async () => {
    let fetched: unknown = order();
    const h = harness(() => fetched);
    const owner = await h.store.createReader('owner@e2e.test', NOW);
    fetched = order({}, { custom_data: { user_id: owner.id } });
    expect(await h.process(sign(fetched))).toEqual({ status: 200, outcome: 'processed' });
    expect(h.users.users.map(u => u.email)).toEqual(['owner@e2e.test']);
    expect(h.store.records[0]?.userId).toBe(owner.id);
    expect(h.access.grants[0]?.userId).toBe(owner.id);
    expect(h.sends().map(s => s.to)).toEqual(['owner@e2e.test']);
  });

  it('keeps a missing metadata user off the checkout email and still stores the order', async () => {
    const missing = '33333333-3333-3333-3333-333333333333';
    const body = order({}, { custom_data: { user_id: missing } });
    const live = harness(() => body);
    expect(await live.process(sign(body))).toEqual({ status: 200, outcome: 'processed' });
    expect(live.users.users).toHaveLength(0);
    expect(live.access.grants).toHaveLength(0);
    expect(live.sends()).toHaveLength(0);
    expect(live.store.records[0]).toMatchObject({ userId: null, status: 'paid', amountCents: 4321 });
    expect(live.store.events[0]?.status).toBe('processed');
    expect(live.access.billing).toMatchObject([{ userId: null, status: 'paid' }]);
    expect(live.access.grants).toHaveLength(0);
    const reader = await live.store.createReader('owner@e2e.test', NOW);
    const recordId = live.store.records[0]?.id;
    if (!recordId) throw new Error('expected a record');
    expect(await live.access.linkBilling(recordId, reader.id, NOW, {
      at: NOW, actorUserId: null, actorKind: 'admin', action: 'billing.link_user', reason: null, ipHash: null,
    })).toEqual({ changed: true });
    await live.store.attachUser(recordId, reader.id);
    expect(await live.store.listRecordsForUser(reader.id)).toHaveLength(1);
    expect(live.access.grants).toHaveLength(0);
    const snapshot = await live.access.loadAccess(reader.id);
    expect(entitlement({ status: reader.status, snapshot, now: NOW }).level).toBe('member');

    const numeric = harness(() => order({}, { custom_data: { user_id: 42 } }));
    expect(await numeric.process(sign(order({}, { custom_data: { user_id: 42 } })))).toEqual({ status: 200, outcome: 'processed' });
    expect(numeric.users.users).toHaveLength(0);
    expect(numeric.store.records[0]?.userId).toBeNull();
  });

  it('stores an order with no usable email and no metadata, and does not invent a user', async () => {
    const body = order({ user_email: 'not-an-email' }, { custom_data: undefined });
    const h = harness(() => body);
    expect(await h.process(sign(body))).toEqual({ status: 200, outcome: 'processed' });
    expect(h.users.users).toHaveLength(0);
    expect(h.access.grants).toHaveLength(0);
    expect(h.store.records[0]?.userId).toBeNull();
    expect(h.sends()).toHaveLength(0);
  });

  it('ignores an older event that arrives second', async () => {
    const first = order({}, { custom_data: undefined });
    const older = order({ updated_at: '2026-11-10T12:04:00.000Z' }, { custom_data: undefined });
    let current = first;
    const h = harness(() => current);
    expect(await h.process(sign(first))).toEqual({ status: 200, outcome: 'processed' });
    current = older;
    expect(await h.process(sign(older))).toEqual({ status: 200, outcome: 'ignored_stale' });
    expect(h.store.events.map(e => e.status)).toEqual(['processed', 'ignored_stale']);
    expect(h.access.grants).toHaveLength(1);
    expect(h.sends()).toHaveLength(1);
    expect(h.store.records[0]?.status).toBe('paid');
  });

  it('leaves a non-order unmatched and grants nothing', async () => {
    const sub = { meta: { event_name: 'subscription_created' }, data: { type: 'subscriptions', id: '5', attributes: { status: 'active', updated_at: NOW.toISOString(), created_at: NOW.toISOString() } } };
    const h = harness(() => sub);
    expect(await h.process(sign(sub, 'subscription_created'))).toEqual({ status: 200, outcome: 'unmatched' });
    expect(h.store.records).toHaveLength(0);
    expect(h.users.users).toHaveLength(0);
    expect(h.sends()).toHaveLength(0);
    const other = { meta: { event_name: 'license_key_created' }, data: { type: 'license-keys', id: '1', attributes: { updated_at: NOW.toISOString() } } };
    expect(await h.process(sign(other, 'license_key_created'))).toEqual({ status: 200, outcome: 'unmatched' });
    expect(h.fetchImpl.mock.calls.filter(c => String(c[0]).includes('lemonsqueezy'))).toHaveLength(1);
  });

  it('revokes on a refund and does not change the user role', async () => {
    const paid = order({}, { custom_data: undefined });
    const refunded = order({
      status: 'refunded', refunded: true, refunded_amount: 4321, updated_at: '2026-11-10T12:06:00.000Z', role: 'admin',
    }, { custom_data: undefined });
    let current: unknown = paid;
    const h = harness(() => current);
    expect(await h.process(sign(paid))).toEqual({ status: 200, outcome: 'processed' });
    const user = h.users.users[0];
    if (!user) throw new Error('expected a user');
    current = refunded;
    expect(await h.process(sign(refunded, 'order_refunded'))).toEqual({ status: 200, outcome: 'processed' });
    expect(user.role).toBe('reader');
    expect(user.status).toBe('active');
    expect(h.access.grants).toHaveLength(1);
    expect(h.access.grants[0]?.revokeReason).toBe('refund');
    expect(h.store.records[0]).toMatchObject({ status: 'refunded', accessEndsAt: NOW });
    expect(entitlement({ status: user.status, snapshot: await h.access.loadAccess(user.id), now: NOW }).level).toBe('preview');
    expect(h.sends()).toHaveLength(1);
  });

  it('does not set the ready flag when the send fails, and a retry then sends once', async () => {
    const body = order({}, { custom_data: undefined });
    const h = harness(() => body);
    h.fetchImpl.mockImplementation(async (url) => {
      if (String(url).includes('api.lemonsqueezy.com')) return new Response(JSON.stringify(body), { status: 200 });
      return new Response('no', { status: 500 });
    });
    expect(await h.process(sign(body))).toEqual({ status: 500, error: 'ReadyEmailNotSent' });
    expect(h.store.records[0]?.readyEmailSentAt).toBeNull();
    expect(h.store.events[0]).toMatchObject({ status: 'failed', error: 'ReadyEmailNotSent' });
    h.fetchImpl.mockImplementation(async (url) => {
      if (String(url).includes('api.lemonsqueezy.com')) return new Response(JSON.stringify(body), { status: 200 });
      return new Response('ok', { status: 200 });
    });
    expect(await h.process(sign(body))).toEqual({ status: 200, outcome: 'processed' });
    expect(h.store.records[0]?.readyEmailSentAt).toEqual(NOW);
    expect(h.sends()).toHaveLength(2);
    expect(h.access.grants).toHaveLength(1);
  });

  it('converges after a crash between the record, the grant, the audit and the ready email', async () => {
    const steps: BillingThrowAfter[] = ['record', 'grant', 'audit', 'ready'];
    for (const step of steps) {
      const body = order({}, { custom_data: undefined });
      const h = harness(() => body);
      h.store.throwAfter = step;
      expect(await h.process(sign(body))).toEqual({ status: 500, error: 'BillingStepError' });
      expect(h.store.events[0]).toMatchObject({ status: 'failed', error: 'BillingStepError' });
      h.store.throwAfter = null;
      expect(await h.process(sign(body))).toEqual({ status: 200, outcome: 'processed' });
      expect(h.store.records).toHaveLength(1);
      expect(h.access.grants).toHaveLength(1);
      expect(h.store.events[0]?.status).toBe('processed');
      expect(h.sends()).toHaveLength(step === 'ready' ? 2 : 1);
      expect(h.users.users[0]?.role).toBe('reader');
    }
  });

  it('answers 500, not a duplicate, when the claim comes back with no status', async () => {
    const body = order({}, { custom_data: undefined });
    const h = harness(() => body);
    h.store.claimEvent = async () => ({ claimed: false });
    expect(await h.process(sign(body))).toEqual({ status: 500, error: 'in_progress' });
    expect(h.store.records).toHaveLength(0);
    expect(h.fetchImpl).not.toHaveBeenCalled();
  });

  it('answers 500 while a delivery is still received, and reclaims it after the attempt is dead', async () => {
    const body = order({}, { custom_data: undefined });
    const h = harness(() => body);
    const signed = sign(body);
    await h.store.claimEvent({
      provider: 'lemonsqueezy',
      providerEventId: providerEventId('order_created', '99', NOW),
      eventType: 'order_created',
      objectId: '99',
      eventCreatedAt: NOW,
      payload: { event: 'order_created', objectId: '99' },
    }, new Date(NOW.getTime() - 30_000));
    expect(await h.process(signed)).toEqual({ status: 500, error: 'in_progress' });
    expect(h.store.records).toHaveLength(0);
    expect(h.auth.tokens).toHaveLength(0);
    const stuck = h.store.events[0];
    if (!stuck) throw new Error('expected the event');
    stuck.receivedAt = new Date(NOW.getTime() - 3 * 60 * 1000);
    expect(await h.process(signed)).toEqual({ status: 200, outcome: 'processed' });
    expect(h.store.records).toHaveLength(1);
    expect(h.sends()).toHaveLength(1);
    expect(h.auth.tokens).toHaveLength(1);
  });

  it('does not mint a sign-in token when no mailer is configured', async () => {
    const body = order({}, { custom_data: undefined });
    const h = harness(() => body, { provider: 'none' });
    expect(await h.process(sign(body))).toEqual({ status: 500, error: 'ReadyEmailNotSent' });
    expect(h.auth.tokens).toHaveLength(0);
    expect(h.store.records).toHaveLength(1);
    expect(h.store.events[0]?.status).toBe('failed');
  });
});
