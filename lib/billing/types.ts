import type { BillingAccess, Grant, Membership, PaidTier, PurchaseStatus, SubscriptionStatus } from '@/lib/access/types';
import type { Actor, AuditRow } from '@/lib/audit';

/** The provider string stored on billing rows. Lemon Squeezy is the only one this phase speaks. */
export const BILLING_PROVIDER = 'lemonsqueezy';
/** Edition 1.0. A later edition is a different key and does not ride these grants. */
export const PRODUCT_KEY = 'handbook-v1';

/**
 * Published one-time variants. Prices are not stored here: the amount on a grant comes from the fetched order.
 * 2357693 is Basic, 2357694 is Pro.
 */
export const VARIANT_TIER: Readonly<Record<string, PaidTier>> = {
  '2357693': 'basic',
  '2357694': 'pro',
};

export type BillingStatus = PurchaseStatus | SubscriptionStatus;
export type GrantEffect = 'grant' | 'revoke' | 'none';
export type EventStatus = 'received' | 'processed' | 'ignored_stale' | 'unmatched' | 'failed';

/** Rows the daily reconcile still has to mirror. Terminal rows are left as history. */
export const NON_TERMINAL_STATUSES: readonly BillingStatus[] = [
  'pending', 'paid', 'partially_refunded', 'disputed',
  'incomplete', 'trialing', 'active', 'past_due', 'paused',
];

export type BillingCustomer = {
  id: string;
  userId: string;
  provider: string;
  providerCustomerId: string;
  emailAtProvider: string | null;
};

/** A billing record. `manageUrl` is not a database column; file and memory stores keep it, Neon refetches it. */
export type BillingRecord = {
  id: string;
  kind: 'purchase' | 'subscription';
  billingCustomerId: string | null;
  userId: string | null;
  provider: string;
  providerObjectId: string;
  providerPaymentId: string | null;
  productKey: string;
  tier: PaidTier;
  providerPriceId: string | null;
  amountCents: number | null;
  currency: string | null;
  status: BillingStatus;
  providerStatus: string | null;
  paidAt: Date | null;
  refundedAt: Date | null;
  disputedAt: Date | null;
  trialEndsAt: Date | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelRequestedAt: Date | null;
  cancelEffectiveAt: Date | null;
  accessEndsAt: Date | null;
  lastEventAt: Date | null;
  readyEmailSentAt: Date | null;
  notes: string | null;
  manageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type BillingEvent = {
  id: string;
  provider: string;
  providerEventId: string;
  eventType: string;
  objectId: string | null;
  eventCreatedAt: Date | null;
  receivedAt: Date;
  processedAt: Date | null;
  status: EventStatus;
  error: string | null;
  payload: unknown;
};

/** What one verified event asks the store to mirror. Amounts are copied off the fetched order. */
export type MirrorInput = {
  provider: string;
  providerObjectId: string;
  kind: 'purchase' | 'subscription';
  tier: PaidTier;
  productKey: string;
  status: BillingStatus;
  providerStatus: string | null;
  userId: string | null;
  customerId: string | null;
  customerEmail: string | null;
  providerPaymentId: string | null;
  providerPriceId: string | null;
  amountCents: number | null;
  currency: string | null;
  paidAt: Date | null;
  refundedAt: Date | null;
  disputedAt: Date | null;
  trialEndsAt: Date | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelRequestedAt: Date | null;
  cancelEffectiveAt: Date | null;
  accessEndsAt: Date | null;
  lastEventAt: Date;
  notes: string | null;
  manageUrl: string | null;
  grant: GrantEffect;
  revokeReason: 'refund' | 'chargeback' | null;
  actor: Actor;
  at: Date;
};

export type NewBillingEvent = {
  provider: string;
  providerEventId: string;
  eventType: string;
  objectId: string | null;
  eventCreatedAt: Date;
  /** Redacted. Never the raw body: that carries the buyer's address. */
  payload: unknown;
};

/** The fields an audit row compares. Dates are ISO strings so a retry compares equal. */
export type RecordSnapshot = {
  status: string;
  tier: string;
  userId: string | null;
  accessEndsAt: string | null;
};

export const recordSnapshot = (r: Pick<BillingRecord, 'status' | 'tier' | 'userId' | 'accessEndsAt'>): RecordSnapshot => ({
  status: r.status,
  tier: r.tier,
  userId: r.userId,
  accessEndsAt: r.accessEndsAt ? r.accessEndsAt.toISOString() : null,
});

export type MirrorPlan = {
  applied: false;
} | {
  applied: true;
  record: BillingRecord;
  customer: BillingCustomer | null;
  grantInsert: Grant | null;
  grantRevoke: { billingRecordId: string; at: Date; reason: 'refund' | 'chargeback' } | null;
  membership: Membership | null;
  billing: (BillingAccess & { userId: string | null }) | null;
  audit: AuditRow | null;
};

const PURCHASE_STATUS: readonly PurchaseStatus[] = ['pending', 'paid', 'refunded', 'partially_refunded', 'disputed', 'chargeback_lost'];

const SUBSCRIPTION_STATUS: readonly SubscriptionStatus[] = ['incomplete', 'trialing', 'active', 'past_due', 'unpaid', 'canceled', 'paused'];

export const isPurchaseStatus = (status: string): status is PurchaseStatus =>
  (PURCHASE_STATUS as readonly string[]).includes(status);

export const isSubscriptionStatus = (status: string): status is SubscriptionStatus =>
  (SUBSCRIPTION_STATUS as readonly string[]).includes(status);

/** A step the memory store can fail after, so a retry test can prove the webhook converges. */
export type BillingThrowAfter = 'record' | 'grant' | 'audit' | 'ready';

export class BillingStepError extends Error {
  constructor(step: BillingThrowAfter) {
    super(step);
    this.name = 'BillingStepError';
  }
}
