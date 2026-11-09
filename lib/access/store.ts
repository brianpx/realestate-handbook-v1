import type { AuditEntry, AuditRow, AuditStub } from '@/lib/audit';
import type { AccessSnapshot, Grant, Membership, RevokeReason } from './types';

export type NewGrant = Pick<Grant, 'userId' | 'kind' | 'tier' | 'startsAt' | 'endsAt' | 'billingRecordId' | 'grantedBy' | 'grantNote'> & { createdAt: Date };
export type Revocation = { at: Date; by: string | null; reason: RevokeReason };
/** The address is needed to delete its tokens; its hash replaces the copy a billing provider was given. */
export type Anonymisation = { userId: string; email: string; emailHash: string; at: Date };

/**
 * Where grants, the membership projection, the billing slice entitlement reads, and the audit log live. The
 * production store is Postgres on Neon; the memory store is for unit tests and the file store
 * (lib/auth/file-store.ts) for local development and e2e. Each mutation writes its audit row in the same
 * statement, filling in the subject and the before and after from the row it changes, and writes neither when
 * nothing changed, so the log and the tables cannot disagree.
 */
export interface AccessStore {
  /** Grants, the membership row and the billing slice for one gate read. */
  loadAccess(userId: string): Promise<AccessSnapshot>;
  listGrants(userId: string): Promise<Grant[]>;
  createGrant(grant: NewGrant, audit: AuditStub): Promise<Grant>;
  /** One conditional update: null when the grant is unknown or already revoked, and then no audit row either. */
  revokeGrant(id: string, revocation: Revocation, audit: AuditStub): Promise<Grant | null>;
  findMembership(userId: string): Promise<Membership | null>;
  /** Rewrites the projection whole (recomputeMembership builds it, suspension fields included). */
  saveMembership(membership: Membership): Promise<void>;
  /**
   * Account deletion (user-database plan, section 12.4), one batch: the user row is anonymised and marked deleted,
   * its sessions and tokens go, billing rows stay with the provider address hashed. False when already deleted.
   */
  anonymise(input: Anonymisation, audit: AuditStub): Promise<boolean>;
  appendAudit(entry: AuditEntry): Promise<void>;
  listAudit(subjectTable: string, subjectId: string): Promise<AuditRow[]>;
}
