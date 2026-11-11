import { randomUUID } from 'node:crypto';
import { projectMembership } from '@/lib/access/membership';
import type { BillingAccess, Grant, Membership } from '@/lib/access/types';
import { unchanged } from '@/lib/audit';
import {
  isPurchaseStatus,
  isSubscriptionStatus,
  recordSnapshot,
  UPGRADE_PRODUCT_KEY,
  type BillingCustomer,
  type BillingRecord,
  type MirrorGrantRevoke,
  type MirrorInput,
  type MirrorPlan,
} from './types';

type PlanState = {
  record: BillingRecord | null;
  customers: readonly BillingCustomer[];
  /** The kept user's other billing records, so a refunded Basic purchase can find the upgrade that rests on it. */
  userRecords: readonly BillingRecord[];
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
  const grantRevokes = planGrantRevokes(state, record, existing, input);

  let membership: Membership | null = null;
  if (userId) {
    const grants = state.grants.map(g => {
      const revoke = g.revokedAt === null ? grantRevokes.find(r => r.billingRecordId === g.billingRecordId) : undefined;
      return revoke ? { ...g, revokedAt: revoke.at, revokedBy: null, revokeReason: revoke.reason } : g;
    });
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

  return { applied: true, record, customer, grantInsert, grantRevokes, membership, billing, audit };
}

const SETTLED_REFUND: readonly string[] = ['refunded', 'chargeback_lost'];

/**
 * The record's own live grant, and, when this mirror is the one that refunds a Basic purchase, the live grant of
 * any upgrade bought on top of it: the upgrade is worth nothing without the Basic it was priced against
 * (docs/plans/OFFER-PLAN.md, 2.1). A re-read of an already refunded Basic must not do it again, or it would take
 * away an upgrade bought later on a new Basic.
 */
function planGrantRevokes(state: PlanState, record: BillingRecord, existing: BillingRecord | null, input: MirrorInput): MirrorGrantRevoke[] {
  if (input.grant !== 'revoke' || !input.revokeReason) return [];
  const reason = input.revokeReason;
  const live = (billingRecordId: string) => state.grants.some(g => g.billingRecordId === billingRecordId && g.revokedAt === null);
  const targets = [record.id];
  const firstRefundOfBasic = record.tier === 'basic' && record.productKey !== UPGRADE_PRODUCT_KEY && !(existing && SETTLED_REFUND.includes(existing.status));
  if (firstRefundOfBasic) {
    for (const r of state.userRecords) if (r.productKey === UPGRADE_PRODUCT_KEY && r.id !== record.id) targets.push(r.id);
  }
  return targets.filter(live).map(billingRecordId => ({ billingRecordId, at: input.at, reason }));
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
