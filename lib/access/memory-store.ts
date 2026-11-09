import { randomUUID } from 'node:crypto';
import type { AuditEntry, AuditRow, AuditStub } from '@/lib/audit';
import type { MemoryAuthStore } from '@/lib/auth/memory-store';
import type { MemoryUserStore } from '@/lib/users/store';
import type { AccessStore, Anonymisation, NewGrant, Revocation } from './store';
import type { AccessSnapshot, BillingAccess, Grant, Membership } from './types';

/**
 * In-memory store for unit tests. Anonymisation reaches into the memory user and auth stores, as the database
 * statement reaches into their tables, so the handler tests see the same effects.
 */
export class MemoryAccessStore implements AccessStore {
  grants: Grant[] = [];
  memberships: Membership[] = [];
  billing: (BillingAccess & { userId: string })[] = [];
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
  async saveMembership(membership: Membership) {
    this.check();
    const i = this.memberships.findIndex(m => m.userId === membership.userId);
    if (i >= 0) this.memberships[i] = membership; else this.memberships.push(membership);
  }
  async anonymise({ userId, email }: Anonymisation, audit: AuditStub) {
    this.check();
    const user = this.linked?.users.users.find(u => u.id === userId);
    if (!user || user.status === 'deleted') return false;
    const before = { status: user.status, role: user.role };
    user.status = 'deleted';
    user.role = 'reader';
    user.email = `deleted+${userId}@invalid.local`;
    this.memberships = this.memberships.filter(m => m.userId !== userId);
    if (this.linked) {
      this.linked.auth.sessions = this.linked.auth.sessions.filter(s => s.userId !== userId);
      this.linked.auth.tokens = this.linked.auth.tokens.filter(t => t.email !== email);
    }
    this.log(audit, { table: 'users', id: userId }, before, { status: 'deleted', role: 'reader' });
    return true;
  }
  async appendAudit(entry: AuditEntry) { this.check(); this.audit.push({ ...entry, id: randomUUID() }); }
  async listAudit(subjectTable: string, subjectId: string) { this.check(); return this.audit.filter(a => a.subjectTable === subjectTable && a.subjectId === subjectId); }
}
