import { createHmac } from 'node:crypto';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  LemonSqueezyAdapter,
  appendCheckoutIdentity,
  fixtureAllowed,
  lemonSqueezyFromEnv,
  mapResource,
  parseWebhook,
  providerEventId,
  verifySignature,
  withinEventWindow,
} from './lemonsqueezy';

const NOW = new Date('2026-11-10T12:05:00.000Z');
const SECRET = 'test-webhook-secret';

function authorization(init: RequestInit | undefined): string {
  const headers = init?.headers;
  if (!headers || headers instanceof Headers || Array.isArray(headers)) return '';
  const value = headers.Authorization ?? headers.authorization;
  return typeof value === 'string' ? value : '';
}

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

describe('Lemon Squeezy signatures', () => {
  it('accepts the hex digest and rejects a mismatch without throwing on a short header', () => {
    const raw = JSON.stringify(order());
    const signature = createHmac('sha256', SECRET).update(raw).digest('hex');
    expect(verifySignature(raw, signature, SECRET)).toBe(true);
    expect(verifySignature(raw, 'ab', SECRET)).toBe(false);
    expect(verifySignature(raw, signature.slice(0, -1), SECRET)).toBe(false);
    expect(verifySignature(raw, null, SECRET)).toBe(false);
    const flipped = signature.slice(0, -1) + (signature.endsWith('a') ? 'b' : 'a');
    expect(verifySignature(raw, flipped, SECRET)).toBe(false);
  });

  it('keeps a five-minute window around the verified event time, in either direction', () => {
    expect(withinEventWindow(new Date(NOW.getTime() - 5 * 60 * 1000), NOW)).toBe(true);
    expect(withinEventWindow(new Date(NOW.getTime() + 5 * 60 * 1000), NOW)).toBe(true);
    expect(withinEventWindow(new Date(NOW.getTime() - 5 * 60 * 1000 - 1), NOW)).toBe(false);
    expect(withinEventWindow(new Date(NOW.getTime() + 5 * 60 * 1000 + 1), NOW)).toBe(false);
  });
});

describe('Lemon Squeezy orders', () => {
  it('reads the event time from updated_at so a refund of an older order is not stale', () => {
    const raw = JSON.stringify(order());
    const parsed = parseWebhook(raw, 'order_refunded');
    expect(parsed?.eventName).toBe('order_refunded');
    expect(parsed?.eventTime.toISOString()).toBe('2026-11-10T12:05:00.000Z');
    expect(parsed?.objectType).toBe('orders');
    expect(parsed?.metadataUserId).toBe('22222222-2222-2222-2222-222222222222');
    if (!parsed) throw new Error('expected a webhook');
    expect(providerEventId(parsed.eventName, parsed.objectId, parsed.eventTime)).toBe('order_refunded:99:2026-11-10T12:05:00.000Z');
  });

  it('falls back to created_at and rejects a body that is not the resource', () => {
    const body = order();
    delete (body.data.attributes as { updated_at?: string }).updated_at;
    const parsed = parseWebhook(JSON.stringify(body), null);
    expect(parsed?.eventTime.toISOString()).toBe('2026-11-10T11:00:00.000Z');
    expect(parseWebhook('not json', 'order_created')).toBeNull();
    expect(parseWebhook('{"data":{}}', 'order_created')).toBeNull();
  });

  it('maps a paid order from the payload, including the amount, and not from a price table', () => {
    const mapped = mapResource(order(), NOW);
    expect(mapped.outcome).toBe('order');
    if (mapped.outcome !== 'order') return;
    expect(mapped.order.tier).toBe('basic');
    expect(mapped.order.status).toBe('paid');
    expect(mapped.order.amountCents).toBe(4321);
    expect(mapped.order.currency).toBe('USD');
    expect(mapped.order.email).toBe('buyer@e2e.test');
    expect(mapped.order.providerPriceId).toBe('2357693');
    expect(mapped.order.grant).toBe('grant');
    expect(mapped.order.accessEndsAt).toBeNull();
    expect(mapped.order.manageUrl).toBe('https://app.lemonsqueezy.com/my-orders/abc');
    expect(mapped.order.customerId).toBe('55');
  });

  it('revokes a refunded order even when the refunded amount is short', () => {
    const mapped = mapResource(order({ status: 'refunded', refunded_amount: 100 }), NOW);
    if (mapped.outcome !== 'order') throw new Error('expected an order');
    expect(mapped.order.status).toBe('refunded');
    expect(mapped.order.grant).toBe('revoke');
    expect(mapped.order.accessEndsAt).toEqual(NOW);
  });

  it('keeps access when a paid order is only partly refunded', () => {
    const mapped = mapResource(order({ status: 'paid', refunded: true, refunded_amount: 100 }), NOW);
    if (mapped.outcome !== 'order') throw new Error('expected an order');
    expect(mapped.order.status).toBe('partially_refunded');
    expect(mapped.order.grant).toBe('grant');
    expect(mapped.order.accessEndsAt).toBeNull();
  });

  it('treats a paid order with a smaller refunded_amount as a partial refund that keeps access', () => {
    const mapped = mapResource(order({ refunded_amount: 100, status: 'paid' }), NOW);
    if (mapped.outcome !== 'order') throw new Error('expected an order');
    expect(mapped.order.status).toBe('partially_refunded');
    expect(mapped.order.grant).toBe('grant');
    expect(mapped.order.accessEndsAt).toBeNull();
  });

  it('revokes on a full refund and leaves a failed or foreign order unmatched', () => {
    const refunded = mapResource(order({ status: 'refunded', refunded: true, refunded_amount: 4321 }), NOW);
    if (refunded.outcome !== 'order') throw new Error('expected an order');
    expect(refunded.order.status).toBe('refunded');
    expect(refunded.order.grant).toBe('revoke');
    expect(refunded.order.revokeReason).toBe('refund');
    expect(refunded.order.accessEndsAt).toEqual(NOW);

    expect(mapResource(order({ status: 'failed' }), NOW)).toEqual({ outcome: 'unmatched', reason: 'failed' });
    expect(mapResource(order({ first_order_item: { variant_id: 1 } }), NOW)).toEqual({ outcome: 'unmatched', reason: 'unknown_variant' });
    expect(mapResource({ data: { type: 'subscriptions', id: '5', attributes: { status: 'active' } } }, NOW)).toEqual({ outcome: 'unmatched', reason: 'not_order' });
    expect(mapResource(order({ status: 'mystery' }), NOW)).toEqual({ outcome: 'unmatched', reason: 'unknown_status' });
  });

  it('builds the share-link query with literal brackets', () => {
    expect(appendCheckoutIdentity('https://pay.example/buy/abc', 'user 1', 'a@b.co')).toBe(
      'https://pay.example/buy/abc?checkout[email]=a%40b.co&checkout[custom][user_id]=user%201',
    );
    expect(appendCheckoutIdentity('https://pay.example/buy/abc?x=1', 'u', 'a@b.co')).toBe(
      'https://pay.example/buy/abc?x=1&checkout[email]=a%40b.co&checkout[custom][user_id]=u',
    );
  });
});

describe('Lemon Squeezy fetch', () => {
  it('refuses the order fixture on a hosted deploy and reads it only for a local file store', async () => {
    expect(fixtureAllowed({ VERCEL_ENV: 'production', AUTH_STORE: 'file', BILLING_ORDER_FIXTURE: '/tmp/orders.json' })).toBe(false);
    expect(fixtureAllowed({ AUTH_STORE: 'database', BILLING_ORDER_FIXTURE: '/tmp/orders.json' })).toBe(false);
    expect(fixtureAllowed({ AUTH_STORE: 'file', BILLING_ORDER_FIXTURE: '/tmp/orders.json' })).toBe(true);

    const fetchImpl = vi.fn<typeof fetch>(async () => new Response('no', { status: 404 }));
    const hosted = lemonSqueezyFromEnv({
      BILLING_PROVIDER: 'lemonsqueezy', BILLING_WEBHOOK_SECRET: SECRET, BILLING_API_KEY: 'test-key',
      VERCEL_ENV: 'production', AUTH_STORE: 'file', BILLING_ORDER_FIXTURE: '/tmp/does-not-exist.json',
    });
    await expect(hosted?.fetch({ type: 'orders', id: '99' }, fetchImpl)).rejects.toMatchObject({ name: 'BillingFetchFailed' });
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe('https://api.lemonsqueezy.com/v1/orders/99');
    expect(authorization(fetchImpl.mock.calls[0]?.[1])).toBe('Bearer test-key');
  });

  it('reads a local fixture instead of calling the API', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'reh-ls-'));
    const fixture = path.join(dir, 'orders.json');
    await writeFile(fixture, JSON.stringify({ orders: { '99': order({ first_order_item: { variant_id: 2357694 } }) } }));
    const fetchImpl = vi.fn<typeof fetch>();
    const adapter = lemonSqueezyFromEnv({
      BILLING_PROVIDER: 'lemonsqueezy', BILLING_WEBHOOK_SECRET: SECRET, BILLING_API_KEY: 'test-key',
      AUTH_STORE: 'file', BILLING_ORDER_FIXTURE: fixture,
    });
    if (!adapter) throw new Error('expected an adapter');
    const mapped = await adapter.fetch({ type: 'orders', id: '99' }, fetchImpl);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(mapped.outcome === 'order' && mapped.order.tier).toBe('pro');
  });

  it('is absent until the provider and the webhook secret are set', () => {
    expect(lemonSqueezyFromEnv({})).toBeNull();
    expect(lemonSqueezyFromEnv({ BILLING_PROVIDER: 'lemonsqueezy' })).toBeNull();
    expect(lemonSqueezyFromEnv({ BILLING_PROVIDER: 'lemonsqueezy', BILLING_WEBHOOK_SECRET: SECRET })).toBeInstanceOf(LemonSqueezyAdapter);
  });
});
