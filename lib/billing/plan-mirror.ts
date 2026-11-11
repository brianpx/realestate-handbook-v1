import { randomUUID } from 'node:crypto';
import { projectMembership } from '@/lib/access/membership';
import type { BillingAccess, Grant, Membership } from '@/lib/access/types';
import { unchanged } from '@/lib/audit';
import {
  isPurchaseStatus,
  isSubscriptionStatus,
  recordSnapshot,
  type BillingCustomer,
  type BillingRecord,
  type MirrorInput,
  type MirrorPlan,
} from './types';

type PlanState = {
  record: BillingRecord | null;
  customers: readonly BillingCustomer[];
  /** Grants already on file for the user this mirror will keep. */
  grants: readonly Grant[];
  membership: Membership | null;
};

/**
 * Decides the writes for one mirror without touching a store. A retry with the same fetched order plans no audit
 * once the record matches, and never a second grant for the same billing record. The user already on the record
 * stays: linking a different person is the admin action, not a later webhook.
 */
export function planMirror(state: PlanState, input: MirrorInput): MirrorPlan {
  const existing = state.record;
  if (existing?.lastEventAt && existing.lastEventAt > input.lastEventAt) return { applied: false };

  const userId = existing?.userId ?? input.userId;
  const before = existing ? recordSnapshot(existing) : null;
  const customer = planCustomer(state.customers, input, userId);
  const record: BillingRecord = {
    id: existing?.id ?? randomUUID(),
    kind: input.kind,
    billingCustomerId: customer?.id ?? existing?.billingCustomerId ?? null,
    userId,
    provider: input.provider,
    providerObjectId: input.providerObjectId,
    providerPaymentId: input.providerPaymentId,
    productKey: input.productKey,
    tier: input.tier,
    providerPriceId: input.providerPriceId,
    amountCents: input.amountCents,
    currency: input.currency,
    status: input.status,
    providerStatus: input.providerStatus,
    paidAt: existing?.paidAt ?? input.paidAt,
    refundedAt: input.refundedAt,
    disputedAt: input.disputedAt,
    trialEndsAt: input.trialEndsAt,
    currentPeriodStart: input.currentPeriodStart,
    currentPeriodEnd: input.currentPeriodEnd,
    cancelRequestedAt: input.cancelRequestedAt,
    cancelEffectiveAt: input.cancelEffectiveAt,
    accessEndsAt: input.accessEndsAt,
    lastEventAt: input.lastEventAt,
    readyEmailSentAt: existing?.readyEmailSentAt ?? null,
    notes: input.notes,
    manageUrl: input.manageUrl ?? existing?.manageUrl ?? null,
    createdAt: existing?.createdAt ?? input.at,
    updatedAt: input.at,
  };

  const grantInsert = planGrantInsert(state.grants, record, input);
  const grantRevoke = input.grant === 'revoke' && input.revokeReason && state.grants.some(g => g.billingRecordId === record.id && g.revokedAt === null)
    ? { billingRecordId: record.id, at: input.at, reason: input.revokeReason }
    : null;

  let membership: Membership | null = null;
  if (userId) {
    const grants = state.grants.map(g => (grantRevoke && g.billingRecordId === record.id && g.revokedAt === null
      ? { ...g, revokedAt: grantRevoke.at, revokedBy: null, revokeReason: grantRevoke.reason }
      : g));
    if (grantInsert) grants.push(grantInsert);
    membership = projectMembership(userId, grants, state.membership, input.at);
  }
  // Written even when there is no user, so linkBilling can find the order. A null user inserts no grant.
  const billing = billingSlice(record);

  const after = recordSnapshot(record);
  const audit = unchanged(before, after) ? null : {
    id: randomUUID(),
    at: input.at,
    actorUserId: input.actor.userId,
    actorKind: input.actor.kind,
    action: 'billing.event' as const,
    subjectTable: 'billing_records',
    subjectId: record.id,
    before,
    after,
    reason: null,
    ipHash: input.actor.ipHash ?? null,
  };

  return { applied: true, record, customer, grantInsert, grantRevoke, membership, billing, audit };
}

function planCustomer(customers: readonly BillingCustomer[], input: MirrorInput, userId: string | null): BillingCustomer | null {
  if (!userId || !input.customerId) return null;
  const same = customers.find(c => c.provider === input.provider && c.providerCustomerId === input.customerId);
  if (same) {
    // A customer already tied to someone else is not moved. linkBillingToUser is the audited way across people.
    if (same.userId !== userId) return null;
    return { ...same, emailAtProvider: input.customerEmail };
  }
  if (customers.some(c => c.provider === input.provider && c.userId === userId)) return null;
  return {
    id: randomUUID(),
    userId,
    provider: input.provider,
    providerCustomerId: input.customerId,
    emailAtProvider: input.customerEmail,
  };
}

function planGrantInsert(grants: readonly Grant[], record: BillingRecord, input: MirrorInput): Grant | null {
  if (input.grant !== 'grant' || !record.userId) return null;
  if (grants.some(g => g.billingRecordId === record.id && g.revokedAt === null)) return null;
  // A revoked grant stays revoked: a later paid-looking delivery must not undo an explicit revoke.
  if (grants.some(g => g.billingRecordId === record.id && g.revokedAt !== null)) return null;
  return {
    id: randomUUID(),
    userId: record.userId,
    kind: input.kind,
    tier: record.tier,
    startsAt: input.at,
    endsAt: null,
    billingRecordId: record.id,
    grantedBy: null,
    grantNote: null,
    revokedAt: null,
    revokedBy: null,
    revokeReason: null,
    createdAt: input.at,
  };
}

function billingSlice(record: BillingRecord): (BillingAccess & { userId: string | null }) | null {
  const base = { id: record.id, userId: record.userId, tier: record.tier, accessEndsAt: record.accessEndsAt };
  if (record.kind === 'purchase' && isPurchaseStatus(record.status)) {
    return { ...base, kind: 'purchase', status: record.status, currentPeriodEnd: null };
  }
  if (record.kind === 'subscription' && isSubscriptionStatus(record.status)) {
    return { ...base, kind: 'subscription', status: record.status, currentPeriodEnd: record.currentPeriodEnd };
  }
  return null;
}
