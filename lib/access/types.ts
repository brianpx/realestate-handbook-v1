import type { TierId } from '@/lib/tiers';

// Rows of `access_grants`, `memberships` and the slice of `billing_records` that entitlement reads
// (db/migrations/003_access_billing.sql). Paid tiers only: the free set is what a signed-in reader has without a row.
export type PaidTier = Exclude<TierId, 'free'>;
export const PAID_TIERS: readonly PaidTier[] = ['basic', 'pro'];

export type GrantKind = 'purchase' | 'subscription' | 'complimentary' | 'promo';
export type RevokeReason = 'refund' | 'chargeback' | 'abuse' | 'admin' | 'expired_promo';

export type Grant = {
  id: string;
  userId: string;
  kind: GrantKind;
  tier: PaidTier;
  startsAt: Date;
  endsAt: Date | null;
  billingRecordId: string | null;
  grantedBy: string | null;
  grantNote: string | null;
  revokedAt: Date | null;
  revokedBy: string | null;
  revokeReason: RevokeReason | null;
  createdAt: Date;
};

export type MembershipStatus = 'none' | 'active' | 'lapsed' | 'suspended';

export type Membership = {
  userId: string;
  status: MembershipStatus;
  tier: PaidTier | null;
  startedAt: Date | null;
  endsAt: Date | null;
  currentGrantId: string | null;
  complimentary: boolean;
  suspendedAt: Date | null;
  suspendedBy: string | null;
  suspendReason: string | null;
  updatedAt: Date;
};

export type PurchaseStatus = 'pending' | 'paid' | 'refunded' | 'partially_refunded' | 'disputed' | 'chargeback_lost';
export type SubscriptionStatus = 'incomplete' | 'trialing' | 'active' | 'past_due' | 'unpaid' | 'canceled' | 'paused';

/** The columns of a billing record that decide access (rule 5 of entitlement). The rest arrives with M7. */
export type BillingAccess =
  | { id: string; kind: 'purchase'; tier: PaidTier; status: PurchaseStatus; accessEndsAt: Date | null; currentPeriodEnd: null }
  | { id: string; kind: 'subscription'; tier: PaidTier; status: SubscriptionStatus; accessEndsAt: Date | null; currentPeriodEnd: Date | null };

/** Everything one gate read needs about a user, loaded in one go. */
export type AccessSnapshot = { grants: Grant[]; membership: Membership | null; billing: BillingAccess[] };
