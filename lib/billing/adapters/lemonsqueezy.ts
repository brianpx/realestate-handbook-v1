import { createHmac, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import type { PaidTier, PurchaseStatus } from '@/lib/access/types';
import { emailSchema } from '@/lib/validate/email';
import { BILLING_PROVIDER, UPGRADE_PRODUCT_KEY, VARIANT_PRODUCTS, type GrantEffect, type VariantProduct } from '@/lib/billing/types';

/**
 * Lemon Squeezy signs the raw body with HMAC-SHA256 and sends the hex digest in `X-Signature`. The current
 * docs have no signed timestamp, so the five-minute window is applied to `data.attributes.updated_at` on the
 * verified body (falling back to `created_at`), not to an invented header. A refund of an older order still
 * passes, because the refund moves `updated_at`.
 *
 * Order statuses there are pending, failed, paid, refunded, partial_refund and fraudulent. A partial refund
 * (status `partial_refund`, or `refunded_amount` below `total` in cents) keeps access. Status `refunded` revokes
 * even when that amount is short. There is no dispute status: a chargeback Lemon Squeezy settles by
 * refunding arrives as a refund and revokes access. `failed` is not a `billing_records.status`, so that order
 * is left unmatched and grants nothing. `fraudulent` is unmatched as well, so it changes nothing either way
 * until the owner decides what it should do. Subscription events are not a product; they are unmatched too.
 * `billing_events.status` has no `ignored`, so those non-product events are stored as `unmatched`.
 */

export const EVENT_WINDOW_MS = 5 * 60 * 1000;
const API_BASE_DEFAULT = 'https://api.lemonsqueezy.com/v1';

export type ParsedWebhook = {
  eventName: string;
  objectId: string;
  objectType: 'orders' | 'subscriptions' | 'other';
  eventTime: Date;
  metadataUserId: string | null;
};

export type UnmatchedReason = 'not_order' | 'unknown_variant' | 'failed' | 'unknown_status';

/** A fetched order that is one of our one-time variants, already translated into our status words. */
export type ProductOrder = {
  providerObjectId: string;
  tier: PaidTier;
  productKey: string;
  providerStatus: string;
  status: PurchaseStatus;
  email: string | null;
  customerId: string | null;
  metadataUserId: string | null;
  amountCents: number | null;
  currency: string | null;
  providerPriceId: string;
  providerPaymentId: string | null;
  paidAt: Date | null;
  refundedAt: Date | null;
  accessEndsAt: Date | null;
  updatedAt: Date | null;
  manageUrl: string | null;
  grant: GrantEffect;
  revokeReason: 'refund' | 'chargeback' | null;
};

export type MappedObject =
  | { outcome: 'unmatched'; reason: UnmatchedReason }
  | { outcome: 'order'; order: ProductOrder };

export type LemonSqueezyConfig = {
  webhookSecret: string;
  apiKey: string | null;
  apiBase: string;
  /** Set only when the process is not hosted. Production never reads a fixture file. */
  fixturePath: string | null;
  /** The variant id of the Basic-to-Pro upgrade product; null until the owner creates it. */
  upgradeVariantId?: string | null;
};

export type Fetchable = { type: 'orders' | 'subscriptions'; id: string };

type Env = Record<string, string | undefined>;

/** The fixture file is an e2e stand-in for api.lemonsqueezy.com. A hosted deploy cannot turn it on. */
export const fixtureAllowed = (env: Env): boolean =>
  !env.VERCEL_ENV && env.AUTH_STORE === 'file' && Boolean(env.BILLING_ORDER_FIXTURE);

export function lemonSqueezyFromEnv(env: Env): LemonSqueezyAdapter | null {
  if (env.BILLING_PROVIDER !== BILLING_PROVIDER) return null;
  const webhookSecret = env.BILLING_WEBHOOK_SECRET;
  if (!webhookSecret) return null;
  return new LemonSqueezyAdapter({
    webhookSecret,
    apiKey: env.BILLING_API_KEY ?? null,
    apiBase: (env.BILLING_API_BASE || API_BASE_DEFAULT).replace(/\/$/, ''),
    fixturePath: fixtureAllowed(env) ? env.BILLING_ORDER_FIXTURE ?? null : null,
    upgradeVariantId: env.BILLING_VARIANT_UPGRADE?.trim() || null,
  });
}

export class LemonSqueezyAdapter {
  constructor(private readonly config: LemonSqueezyConfig) {}

  verify(raw: string, signature: string | null): boolean {
    return verifySignature(raw, signature, this.config.webhookSecret);
  }

  parse(raw: string, eventNameHeader: string | null): ParsedWebhook | null {
    return parseWebhook(raw, eventNameHeader);
  }

  async fetch(object: Fetchable, fetchImpl: typeof fetch = fetch): Promise<MappedObject> {
    const body = this.config.fixturePath
      ? await readFixture(this.config.fixturePath, object)
      : await fetchResource(this.config, object, fetchImpl);
    return mapResource(body, new Date(), this.config.upgradeVariantId ?? null);
  }

  /** Brackets stay literal. URLSearchParams would encode them, and the share link would drop the custom field. */
  checkoutParams(base: string, userId: string, email: string): string {
    return appendCheckoutIdentity(base, userId, email);
  }
}

export function verifySignature(raw: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  const digest = createHmac('sha256', secret).update(raw).digest('hex');
  const left = Buffer.from(digest, 'utf8');
  const right = Buffer.from(signature, 'utf8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function withinEventWindow(eventTime: Date, now: Date): boolean {
  return Math.abs(now.getTime() - eventTime.getTime()) <= EVENT_WINDOW_MS;
}

/** No delivery id is documented, so the id is the event name, the object and its update time. A retry of the same body collides; order_created and order_refunded do not. */
export function providerEventId(eventName: string, objectId: string, eventTime: Date): string {
  return `${eventName}:${objectId}:${eventTime.toISOString()}`;
}

export function appendCheckoutIdentity(base: string, userId: string, email: string): string {
  const join = base.includes('?') ? '&' : '?';
  return `${base}${join}checkout[email]=${encodeURIComponent(email)}&checkout[custom][user_id]=${encodeURIComponent(userId)}`;
}

export function parseWebhook(raw: string, eventNameHeader: string | null): ParsedWebhook | null {
  const resource = readResource(parseJson(raw));
  if (!resource) return null;
  // The body is signed and the header is not, so the header only fills in when the body names no event.
  const eventName = stringOrNull(record(resource.meta)?.event_name) ?? stringOrNull(eventNameHeader);
  const eventTime = parseTime(resource.attributes.updated_at) ?? parseTime(resource.attributes.created_at);
  if (!eventName || !eventTime) return null;
  return {
    eventName,
    objectId: resource.id,
    objectType: objectType(resource.type),
    eventTime,
    metadataUserId: metadataUserId(resource.meta),
  };
}

/** `now` is the refund's access end. Amounts are taken from the resource, never from a price table. */
export function mapResource(body: unknown, now: Date, upgradeVariantId: string | null = null): MappedObject {
  const resource = readResource(body);
  if (!resource) {
    const error = new Error('unreadable');
    error.name = 'BillingFetchFailed';
    throw error;
  }
  if (resource.type !== 'orders') return { outcome: 'unmatched', reason: 'not_order' };
  const variant = variantId(resource.attributes);
  const product = variant ? productForVariant(variant, upgradeVariantId) : undefined;
  if (!variant || !product) return { outcome: 'unmatched', reason: 'unknown_variant' };

  const providerStatus = stringOrNull(resource.attributes.status) ?? '';
  const total = cents(resource.attributes.total);
  const refundedAmount = cents(resource.attributes.refunded_amount);
  const effect = effectFor(providerStatus, resource.attributes.refunded === true, total, refundedAmount, now);
  if (effect.outcome === 'unmatched') return effect;

  const createdAt = parseTime(resource.attributes.created_at);
  const email = normalizeEmail(resource.attributes.user_email);
  return {
    outcome: 'order',
    order: {
      providerObjectId: resource.id,
      tier: product.tier,
      productKey: product.productKey,
      providerStatus,
      status: effect.status,
      email,
      customerId: idString(resource.attributes.customer_id),
      metadataUserId: metadataUserId(resource.meta),
      amountCents: total,
      currency: stringOrNull(resource.attributes.currency),
      providerPriceId: variant,
      providerPaymentId: stringOrNull(resource.attributes.identifier),
      paidAt: effect.status === 'pending' ? null : createdAt,
      refundedAt: effect.status === 'refunded' || effect.status === 'partially_refunded'
        ? parseTime(resource.attributes.refunded_at) ?? now
        : null,
      accessEndsAt: effect.accessEndsAt,
      updatedAt: parseTime(resource.attributes.updated_at) ?? createdAt,
      manageUrl: manageUrl(resource.attributes.urls),
      grant: effect.grant,
      revokeReason: effect.revokeReason,
    },
  };
}

function productForVariant(variant: string, upgradeVariantId: string | null): VariantProduct | undefined {
  if (upgradeVariantId && variant === upgradeVariantId) return { tier: 'pro', productKey: UPGRADE_PRODUCT_KEY };
  return VARIANT_PRODUCTS[variant];
}

type Effect =
  | { outcome: 'unmatched'; reason: 'failed' | 'unknown_status' }
  | { outcome: 'mirror'; status: PurchaseStatus; grant: GrantEffect; revokeReason: 'refund' | 'chargeback' | null; accessEndsAt: Date | null };

function effectFor(status: string, refundedFlag: boolean, total: number | null, refundedAmount: number | null, now: Date): Effect {
  if (status === 'failed') return { outcome: 'unmatched', reason: 'failed' };
  const partial = refundedAmount !== null && total !== null && refundedAmount > 0 && refundedAmount < total;
  const fullByAmount = refundedAmount !== null && total !== null && total > 0 && refundedAmount >= total;
  // Status `refunded` is a full refund even when the amount is short. A partial keeps access only while status stays `paid`.
  if (status === 'refunded' || fullByAmount || (refundedFlag && !partial)) {
    return { outcome: 'mirror', status: 'refunded', grant: 'revoke', revokeReason: 'refund', accessEndsAt: now };
  }
  if (partial || status === 'partial_refund') return { outcome: 'mirror', status: 'partially_refunded', grant: 'grant', revokeReason: null, accessEndsAt: null };
  if (status === 'paid') return { outcome: 'mirror', status: 'paid', grant: 'grant', revokeReason: null, accessEndsAt: null };
  if (status === 'pending') return { outcome: 'mirror', status: 'pending', grant: 'none', revokeReason: null, accessEndsAt: null };
  return { outcome: 'unmatched', reason: 'unknown_status' };
}

type Resource = { type: string; id: string; attributes: Record<string, unknown>; meta: unknown };

function readResource(body: unknown): Resource | null {
  const root = record(body);
  if (!root) return null;
  const data = record(root.data);
  if (!data) return null;
  const type = stringOrNull(data.type);
  const id = idString(data.id);
  const attributes = record(data.attributes);
  if (!type || !id || !attributes) return null;
  return { type, id, attributes, meta: root.meta };
}

function objectType(type: string): ParsedWebhook['objectType'] {
  if (type === 'orders' || type === 'subscriptions') return type;
  return 'other';
}

function variantId(attributes: Record<string, unknown>): string | null {
  const item = record(attributes.first_order_item);
  return item ? idString(item.variant_id) : null;
}

function manageUrl(value: unknown): string | null {
  const urls = record(value);
  if (!urls) return null;
  return httpsUrl(urls.receipt) ?? httpsUrl(urls.customer_portal);
}

function metadataUserId(meta: unknown): string | null {
  const custom = record(record(meta)?.custom_data);
  return custom ? idString(custom.user_id) : null;
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const parsed = emailSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function httpsUrl(value: unknown): string | null {
  return typeof value === 'string' && value.startsWith('https://') ? value : null;
}

function cents(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value);
  if (typeof value === 'string' && /^-?\d+$/.test(value)) return Number(value);
  return null;
}

function idString(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'string' && value.trim()) return value.trim();
  return null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function record(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}

function parseJson(raw: string): unknown {
  try {
    const value: unknown = JSON.parse(raw);
    return value;
  } catch {
    return null;
  }
}

/** Lemon Squeezy sends six-digit fractions. Keep the instant stable to the millisecond the event id uses. */
function parseTime(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const date = new Date(value.replace(/(\.\d{3})\d+/, '$1'));
  return Number.isNaN(date.getTime()) ? null : date;
}

async function readFixture(path: string, object: Fetchable): Promise<unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(path, 'utf8'));
  } catch (err) {
    const error = new Error('fixture');
    error.name = err instanceof Error ? err.name : 'BillingFetchFailed';
    throw error;
  }
  const bucket = record(record(parsed)?.[object.type]);
  const hit = bucket?.[object.id];
  if (!hit) {
    const error = new Error('missing');
    error.name = 'OrderNotFound';
    throw error;
  }
  return hit;
}

async function fetchResource(config: LemonSqueezyConfig, object: Fetchable, fetchImpl: typeof fetch): Promise<unknown> {
  if (!config.apiKey) {
    const error = new Error('no key');
    error.name = 'BillingFetchFailed';
    throw error;
  }
  const response = await fetchImpl(`${config.apiBase}/${object.type}/${object.id}`, {
    headers: { Accept: 'application/vnd.api+json', Authorization: `Bearer ${config.apiKey}` },
  });
  if (!response.ok) {
    const error = new Error('status');
    error.name = 'BillingFetchFailed';
    throw error;
  }
  const body: unknown = await response.json();
  return body;
}
