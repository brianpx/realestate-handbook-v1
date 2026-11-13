import type { AuditEntry, AuditRow, AuditStub } from '@/lib/audit';
import type { Page } from '@/lib/users/store';
import type { Role } from '@/lib/users/types';
import type { AccessSnapshot, Grant, Membership, RevokeReason } from './types';

export type NewGrant = Pick<Grant, 'userId' | 'kind' | 'tier' | 'startsAt' | 'endsAt' | 'billingRecordId' | 'grantedBy' | 'grantNote'> & { createdAt: Date };
export type Revocation = { at: Date; by: string | null; reason: RevokeReason };
/** The address is needed to delete its tokens; its hash replaces the copy a billing provider was given. */
export type Anonymisation = { userId: string; email: string; emailHash: string; at: Date };
/** An administrator pausing paid content (memberships) or sign-in itself (users): who, when and why, all three required by the schema. */
export type Suspension = { at: Date; by: string; reason: string };
/** What the admin user list shows beside each row: the cached projection and how many billing records exist. */
export type AccessSummary = { userId: string; membership: Membership | null; billingRecords: number };
/** Derived grant fields only; suspension belongs exclusively to the explicit admin state-setters. */
export type MembershipProjection = Omit<Membership, 'status' | 'suspendedAt' | 'suspendedBy' | 'suspendReason'> & { status: 'active' | 'lapsed' | 'none' };

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
  /** Saves derived grant fields while preserving the current suspension atomically; returns the stored row. */
  saveMembership(membership: MembershipProjection): Promise<Membership>;
  /**
   * Account deletion (user-database plan, section 12.4), one batch: the user row is anonymised and marked deleted,
   * its sessions and tokens go, billing rows stay with the provider address hashed. Null when already deleted;
   * otherwise the avatar key the statement itself cleared, so a picture uploaded after the caller's read is not orphaned.
   */
  anonymise(input: Anonymisation, audit: AuditStub): Promise<{ avatarKey: string | null } | null>;
  appendAudit(entry: AuditEntry): Promise<void>;
  listAudit(subjectTable: string, subjectId: string): Promise<AuditRow[]>;
  /** The whole log newest first, paged, for the admin audit list. */
  listAuditLog(page: Page): Promise<{ rows: AuditRow[]; total: number }>;
  accessSummaries(userIds: string[]): Promise<AccessSummary[]>;
  // The admin state-setters (user-database plan, section 9): each is one conditional write that matches no row
  // when the state is already what was asked for, so a repeat changes nothing and writes no audit row. The
  // handler has already refused a self-change and loaded the user; the store only has to be exact.
  /** False when the role was already that, or the account is deleted (its role is fixed at reader). */
  setUserRole(userId: string, role: Role, at: Date, audit: AuditStub): Promise<boolean>;
  /** active -> disabled (plan 7.1): the disabled triple, every session gone; false unless the account was active. */
  disableUser(userId: string, disablement: Suspension, audit: AuditStub): Promise<boolean>;
  /** disabled -> active: the triple cleared; false unless the account was disabled. */
  enableUser(userId: string, at: Date, audit: AuditStub): Promise<boolean>;
  /** Pauses paid content: the suspension triple and status on the projection; null when already suspended. */
  suspend(userId: string, suspension: Suspension, audit: AuditStub): Promise<Membership | null>;
  /** Clears the suspension; the status goes back to what the grants say. Null when not suspended. */
  unsuspend(userId: string, at: Date, audit: AuditStub): Promise<Membership | null>;
  /** Points a billing record at a user (plan 10.2). Null when the record is unknown; `changed` false when it already was. */
  linkBilling(recordId: string, userId: string, at: Date, audit: AuditStub): Promise<{ changed: boolean } | null>;
}
