import type { Actor } from '@/lib/audit';
import type { User } from '@/lib/users/types';
import type { BillingRecord, EventStatus, MirrorInput, NewBillingEvent } from './types';

export type ClaimResult = { claimed: true; id: string } | { claimed: false };
export type MirrorResult = { applied: false } | { applied: true; record: BillingRecord };
export type ResendWrite = { ok: true } | { ok: false; reason: 'missing' | 'not_paid' };

/**
 * The billing tables plus the user lookup the webhook needs. User creation inserts a reader and never updates
 * `users.role` or `users.status`. Grant writes go through the mirror, not AccessStore.createGrant, so the only
 * audit action on this path is `billing.event`.
 */
export interface BillingStore {
  claimEvent(event: NewBillingEvent, at: Date): Promise<ClaimResult>;
  setEventStatus(id: string, status: EventStatus, error: string | null, at: Date): Promise<void>;
  findRecord(provider: string, providerObjectId: string): Promise<BillingRecord | null>;
  findRecordById(id: string): Promise<BillingRecord | null>;
  listRecordsForUser(userId: string): Promise<BillingRecord[]>;
  listNonTerminal(): Promise<BillingRecord[]>;
  /** Paid rows still waiting for the ready email. Partial refunds are not in this list. */
  listPaidMissingReadyEmail(): Promise<BillingRecord[]>;
  commitMirror(input: MirrorInput): Promise<MirrorResult>;
  /** Sets the flag only while it is null. The ready email itself is sent outside the store. */
  markReadyEmailSent(id: string, at: Date): Promise<void>;
  /** Admin resend: the flag and one `billing.resend_ready_email` row. Refuses anything that is not paid. */
  recordResend(id: string, at: Date, actor: Actor): Promise<ResendWrite>;
  requeueStuckReceived(olderThan: Date): Promise<number>;
  nullPayloadsOlderThan(olderThan: Date): Promise<number>;
  deleteExpiredAuth(now: Date): Promise<void>;
  findUserById(id: string): Promise<User | null>;
  findUserByEmail(email: string): Promise<User | null>;
  /** Inserts `role = reader`, `status = active`, `email_verified_at` null. An existing row is returned unchanged. */
  createReader(email: string, at: Date): Promise<User>;
}
