import { randomUUID } from 'node:crypto';
import type { AuditEntry, AuditRow, AuditStub } from '@/lib/audit';
import type { MemoryAuthStore } from '@/lib/auth/memory-store';
import type { MemoryUserStore, Page } from '@/lib/users/store';
import type { Role } from '@/lib/users/types';
import { projectMembership } from './membership';
import type { AccessStore, Anonymisation, MembershipProjection, NewGrant, Revocation, Suspension } from './store';
import type { AccessSnapshot, BillingAccess, Grant, Membership } from './types';

/**
 * In-memory store for unit tests. Anonymisation reaches into the memory user and auth stores, as the database
 * statement reaches into their tables, so the handler tests see the same effects.
 */
export class MemoryAccessStore implements AccessStore {
  grants: Grant[] = [];
  memberships: Membership[] = [];
  billing: (BillingAccess & { userId: string | null })[] = [];
  audit: AuditRow[] = [];
  failWith: Error | null = null;
  constructor(private readonly linked: { users: MemoryUserStore; auth: MemoryAuthStore } | null = null) {}
  private check() { if (this.failWith) throw this.failWith; }
  private log(stub: AuditStub, subject: { table: string; id: string | null }, before: unknown, after: unknown) {
    this.audit.push({ ...stub, id: randomUUID(), subjectTable: subject.table, subjectId: subject.id, before, after });
  }

  async loadAccess(userId: string): Promise<AccessSnapshot> {
    this.check();
    return {
      grants: this.grants.filter(g => g.userId === userId),
      membership: this.memberships.find(m => m.userId === userId) ?? null,
      billing: this.billing.filter(b => b.userId === userId).map(({ userId: _, ...b }) => b),
    };
  }
  async listGrants(userId: string) { this.check(); return this.grants.filter(g => g.userId === userId); }
  async createGrant(input: NewGrant, audit: AuditStub) {
    this.check();
    const grant: Grant = { ...input, id: randomUUID(), revokedAt: null, revokedBy: null, revokeReason: null };
    this.grants.push(grant);
    this.log(audit, { table: 'access_grants', id: grant.id }, null, grant);
    return grant;
  }
  async revokeGrant(id: string, revocation: Revocation, audit: AuditStub) {
    this.check();
    const i = this.grants.findIndex(g => g.id === id && g.revokedAt === null);
    if (i < 0) return null;
    const before = this.grants[i]!;
    const after: Grant = { ...before, revokedAt: revocation.at, revokedBy: revocation.by, revokeReason: revocation.reason };
    this.grants[i] = after;
    this.log(audit, { table: 'access_grants', id }, before, after);
    return after;
  }
  async findMembership(userId: string) { this.check(); return this.memberships.find(m => m.userId === userId) ?? null; }
  private writeMembership(membership: Membership) {
    const i = this.memberships.findIndex(m => m.userId === membership.userId);
    if (i >= 0) this.memberships[i] = membership; else this.memberships.push(membership);
    return membership;
  }
  async saveMembership(projection: MembershipProjection): Promise<Membership> {
    this.check();
    const existing = this.memberships.find(m => m.userId === projection.userId);
    return this.writeMembership({
      ...projection,
      status: existing?.suspendedAt ? 'suspended' : projection.status,
      suspendedAt: existing?.suspendedAt ?? null,
      suspendedBy: existing?.suspendedBy ?? null,
      suspendReason: existing?.suspendReason ?? null,
    });
  }
  async anonymise({ userId, email }: Anonymisation, audit: AuditStub) {
    this.check();
    const user = this.linked?.users.users.find(u => u.id === userId);
    if (!user || user.status === 'deleted') return null;
    const avatarKey = user.avatarKey;
    const before = { status: user.status, role: user.role };
    user.status = 'deleted';
    user.role = 'reader';
    user.email = `deleted+${userId}@invalid.local`;
    user.displayName = null;
    user.avatarKey = null;
    user.avatarUpdatedAt = null;
    this.memberships = this.memberships.filter(m => m.userId !== userId);
    if (this.linked) {
      this.linked.auth.sessions = this.linked.auth.sessions.filter(s => s.userId !== userId);
      this.linked.auth.tokens = this.linked.auth.tokens.filter(t => t.email !== email);
    }
    this.log(audit, { table: 'users', id: userId }, before, { status: 'deleted', role: 'reader' });
    return { avatarKey };
  }
  async appendAudit(entry: AuditEntry) { this.check(); this.audit.push({ ...entry, id: randomUUID() }); }
  async listAudit(subjectTable: string, subjectId: string) { this.check(); return this.audit.filter(a => a.subjectTable === subjectTable && a.subjectId === subjectId); }
  async listAuditLog({ offset, limit }: Page) {
    this.check();
    // reversed before the (stable) sort, so rows written at the same instant come newest first too
    const rows = [...this.audit].reverse().sort((a, b) => b.at.getTime() - a.at.getTime());
    return { rows: rows.slice(offset, offset + limit), total: this.audit.length };
  }
  async accessSummaries(userIds: string[]) {
    this.check();
    return userIds.map(userId => ({ userId, membership: this.memberships.find(m => m.userId === userId) ?? null, billingRecords: this.billing.filter(b => b.userId === userId).length }));
  }

  // the admin state-setters; the user ones reach into the linked user store the way anonymise does
  async setUserRole(userId: string, role: Role, _at: Date, audit: AuditStub) {
    this.check();
    const user = this.linked?.users.users.find(u => u.id === userId);
    if (!user || user.status === 'deleted' || user.role === role) return false;
    const before = { role: user.role };
    user.role = role;
    this.log(audit, { table: 'users', id: userId }, before, { role });
    return true;
  }
  async disableUser(userId: string, _disablement: Suspension, audit: AuditStub) {
    this.check();
    const user = this.linked?.users.users.find(u => u.id === userId);
    if (!user || user.status !== 'active') return false;
    user.status = 'disabled';
    if (this.linked) this.linked.auth.sessions = this.linked.auth.sessions.filter(s => s.userId !== userId);
    this.log(audit, { table: 'users', id: userId }, { status: 'active' }, { status: 'disabled' });
    return true;
  }
  async enableUser(userId: string, _at: Date, audit: AuditStub) {
    this.check();
    const user = this.linked?.users.users.find(u => u.id === userId);
    if (!user || user.status !== 'disabled') return false;
    user.status = 'active';
    this.log(audit, { table: 'users', id: userId }, { status: 'disabled' }, { status: 'active' });
    return true;
  }
  async suspend(userId: string, { at, by, reason }: Suspension, audit: AuditStub) {
    this.check();
    const existing = this.memberships.find(m => m.userId === userId) ?? null;
    if (existing?.suspendedAt) return null;
    const base: Membership = existing ?? { userId, status: 'none', tier: null, startedAt: null, endsAt: null, currentGrantId: null, complimentary: false, suspendedAt: null, suspendedBy: null, suspendReason: null, updatedAt: at };
    const next = projectMembership(userId, this.grants.filter(g => g.userId === userId), { ...base, suspendedAt: at, suspendedBy: by, suspendReason: reason }, at);
    this.writeMembership(next);
    this.log(audit, { table: 'memberships', id: userId }, existing, next);
    return next;
  }
  async unsuspend(userId: string, at: Date, audit: AuditStub) {
    this.check();
    const existing = this.memberships.find(m => m.userId === userId);
    if (!existing?.suspendedAt) return null;
    const next = projectMembership(userId, this.grants.filter(g => g.userId === userId), { ...existing, suspendedAt: null, suspendedBy: null, suspendReason: null }, at);
    this.writeMembership(next);
    this.log(audit, { table: 'memberships', id: userId }, existing, next);
    return next;
  }
  async linkBilling(recordId: string, userId: string, _at: Date, audit: AuditStub) {
    this.check();
    const record = this.billing.find(b => b.id === recordId);
    if (!record) return null;
    if (record.userId === userId) return { changed: false };
    const before = { userId: record.userId };
    record.userId = userId;
    this.log(audit, { table: 'billing_records', id: recordId }, before, { userId });
    return { changed: true };
  }
}
