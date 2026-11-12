import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { projectMembership } from '@/lib/access/membership';
import type { AccessStore, Anonymisation, MembershipProjection, NewGrant, Revocation, Suspension } from '@/lib/access/store';
import type { AccessSnapshot, BillingAccess, Grant, Membership } from '@/lib/access/types';
import type { AuditEntry, AuditRow, AuditStub } from '@/lib/audit';
import { fillVerified, newUser, type Page, type UserStore, type VerifiedSignIn } from '@/lib/users/store';
import type { Role, User } from '@/lib/users/types';
import { placementStatsFrom } from './placements';
import { sessionDueForRenewal, sessionExpiry, tokenUsable } from './session';
import type { AttemptScope, AuthStore, ConsumedToken, NewSession, NewToken } from './store';
import type { AuthToken, Session } from './types';

// Dates are kept as ISO strings in the file and turned back into Dates on the way out.
type Iso<T> = { [K in keyof T]: T[K] extends Date ? string : T[K] extends Date | null ? string | null : T[K] };
type Shape = {
  users: Iso<User>[];
  tokens: Iso<AuthToken>[];
  sessions: Iso<Session>[];
  attempts: { scope: AttemptScope; keyHash: string; at: string }[];
  sends: { windowStart: string; n: number }[];
  grants: Iso<Grant>[];
  memberships: Iso<Membership>[];
  billing: (Iso<BillingAccess> & { userId: string | null })[];
  audit: Iso<AuditRow>[];
};
const EMPTY: Shape = { users: [], tokens: [], sessions: [], attempts: [], sends: [], grants: [], memberships: [], billing: [], audit: [] };
const LOCK_RETRY_MS = 10;
const LOCK_WAIT_MS = 5000;
const LOCK_STALE_MS = 5000;

const iso = (d: Date | null): string | null => (d ? d.toISOString() : null);
const date = (s: string | null): Date | null => (s ? new Date(s) : null);
const userOut = (u: Iso<User>): User => ({ ...u, emailVerifiedAt: date(u.emailVerifiedAt), acceptedTermsAt: date(u.acceptedTermsAt), lastSignInAt: date(u.lastSignInAt), createdAt: new Date(u.createdAt) });
const userIn = (u: User): Iso<User> => ({ ...u, emailVerifiedAt: iso(u.emailVerifiedAt), acceptedTermsAt: iso(u.acceptedTermsAt), lastSignInAt: iso(u.lastSignInAt), createdAt: u.createdAt.toISOString() });
const tokenOut = (t: Iso<AuthToken>): AuthToken => ({ ...t, expiresAt: new Date(t.expiresAt), consumedAt: date(t.consumedAt), createdAt: new Date(t.createdAt) });
const sessionOut = (s: Iso<Session>): Session => ({ ...s, createdAt: new Date(s.createdAt), expiresAt: new Date(s.expiresAt), lastSeenAt: new Date(s.lastSeenAt), revokedAt: date(s.revokedAt) });
const grantOut = (g: Iso<Grant>): Grant => ({ ...g, startsAt: new Date(g.startsAt), endsAt: date(g.endsAt), revokedAt: date(g.revokedAt), createdAt: new Date(g.createdAt) });
const grantIn = (g: Grant): Iso<Grant> => ({ ...g, startsAt: g.startsAt.toISOString(), endsAt: iso(g.endsAt), revokedAt: iso(g.revokedAt), createdAt: g.createdAt.toISOString() });
const membershipOut = (m: Iso<Membership>): Membership => ({ ...m, startedAt: date(m.startedAt), endsAt: date(m.endsAt), suspendedAt: date(m.suspendedAt), updatedAt: new Date(m.updatedAt) });
const membershipIn = (m: Membership): Iso<Membership> => ({ ...m, startedAt: iso(m.startedAt), endsAt: iso(m.endsAt), suspendedAt: iso(m.suspendedAt), updatedAt: m.updatedAt.toISOString() });
const billingOut = ({ userId: _, ...b }: Iso<BillingAccess> & { userId: string | null }): BillingAccess =>
  (b.kind === 'purchase'
    ? { ...b, accessEndsAt: date(b.accessEndsAt), currentPeriodEnd: null }
    : { ...b, accessEndsAt: date(b.accessEndsAt), currentPeriodEnd: date(b.currentPeriodEnd) });
const auditOut = (a: Iso<AuditRow>): AuditRow => ({ ...a, at: new Date(a.at) });
const auditIn = (a: AuditRow): Iso<AuditRow> => ({ ...a, at: a.at.toISOString() });

/**
 * Users, tokens, sessions, counters, grants, memberships and the audit log in one JSON file, for local development
 * and the e2e suite: a sign-in needs a user and a session written together, and the suite seeds a user, a session
 * and a grant before the first request. Same discipline as FileLeadStore: one change at a time, written to a temp
 * file then renamed, read fresh on every call. Never for a hosted deployment (authStoresFromEnv refuses it there).
 */
export class FileAuthStore implements UserStore, AuthStore, AccessStore {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private readonly file: string) {}

  private async read(): Promise<Shape> {
    let data: Partial<Shape> | null;
    try {
      data = JSON.parse(await readFile(this.file, 'utf8')) as Partial<Shape> | null;
    } catch {
      return { ...EMPTY };
    }
    // a hand-edited or truncated file must not break every later request: a missing or non-array field starts empty
    const list = <K extends keyof Shape>(key: K): Shape[K] => (Array.isArray(data?.[key]) ? (data[key] as Shape[K]) : []);
    return { users: list('users'), tokens: list('tokens'), sessions: list('sessions'), attempts: list('attempts'), sends: list('sends'), grants: list('grants'), memberships: list('memberships'), billing: list('billing'), audit: list('audit') };
  }

  // The queue serialises this process's writes; the lock directory serialises them against another process writing
  // the same file (the e2e suite seeds readers from the test runner while the server handles requests). mkdir is
  // atomic, so whoever creates the directory holds the lock; a lock older than LOCK_STALE_MS is a crashed holder's.
  private async locked<T>(fn: () => Promise<T>): Promise<T> {
    const lock = `${this.file}.lock`;
    await mkdir(path.dirname(this.file), { recursive: true });
    for (let waited = 0; ; waited += LOCK_RETRY_MS) {
      try {
        await mkdir(lock);
        break;
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err;
        const age = Date.now() - (await stat(lock).then(s => s.mtimeMs, () => Date.now()));
        if (age > LOCK_STALE_MS) { await rm(lock, { recursive: true, force: true }); continue; }
        if (waited > LOCK_WAIT_MS) throw new Error(`${lock}: still held after ${LOCK_WAIT_MS}ms`);
        await new Promise(resolve => setTimeout(resolve, LOCK_RETRY_MS));
      }
    }
    try {
      return await fn();
    } finally {
      await rm(lock, { recursive: true, force: true });
    }
  }

  private change<T>(fn: (data: Shape) => T): Promise<T> {
    const run = this.queue.then(() => this.locked(async () => {
      const data = await this.read();
      const result = fn(data);
      const tmp = `${this.file}.${process.pid}.tmp`;
      await writeFile(tmp, JSON.stringify(data));
      await rename(tmp, this.file);
      return result;
    }));
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async view<T>(fn: (data: Shape) => T): Promise<T> {
    await this.queue;
    return fn(await this.read());
  }

  private static log(data: Shape, stub: AuditStub, subject: { table: string; id: string | null }, before: unknown, after: unknown) {
    data.audit.push(auditIn({ ...stub, id: randomUUID(), subjectTable: subject.table, subjectId: subject.id, before, after }));
  }

  // users
  findByEmail(email: string) { return this.view(d => { const u = d.users.find(x => x.email === email); return u ? userOut(u) : null; }); }
  findById(id: string) { return this.view(d => { const u = d.users.find(x => x.id === id); return u ? userOut(u) : null; }); }
  upsertVerified(input: VerifiedSignIn) {
    return this.change(d => {
      const i = d.users.findIndex(u => u.email === input.email);
      if (i >= 0) {
        const user = fillVerified(userOut(d.users[i]!), input);
        d.users[i] = userIn(user);
        return { user, created: false };
      }
      const user = newUser(input);
      d.users.push(userIn(user));
      return { user, created: true };
    });
  }
  countAdmins() { return this.view(d => d.users.filter(u => u.role === 'admin').length); }
  setRole(id: string, role: Role) { return this.change(d => { const u = d.users.find(x => x.id === id); if (u) u.role = role; }); }
  touchSignIn(id: string, at: Date) { return this.change(d => { const u = d.users.find(x => x.id === id); if (u) u.lastSignInAt = at.toISOString(); }); }
  list({ offset, limit }: Page) {
    return this.view(d => {
      const sorted = [...d.users].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      return { users: sorted.slice(offset, offset + limit).map(userOut), total: d.users.length };
    });
  }
  findByIds(ids: string[]) { return this.view(d => d.users.filter(u => ids.includes(u.id)).map(userOut)); }

  // tokens
  createToken(t: NewToken) {
    return this.change(d => { d.tokens.push({ ...t, expiresAt: t.expiresAt.toISOString(), createdAt: t.createdAt.toISOString(), consumedAt: null }); });
  }
  peekToken(tokenHash: string) { return this.view(d => { const t = d.tokens.find(x => x.tokenHash === tokenHash); return t ? tokenOut(t) : null; }); }
  placementStats() { return this.view(d => placementStatsFrom(d.tokens)); }
  consumeToken(tokenHash: string, now: Date): Promise<ConsumedToken | null> {
    return this.change(d => {
      const t = d.tokens.find(x => x.tokenHash === tokenHash);
      if (!t || !tokenUsable(tokenOut(t), now)) return null;
      t.consumedAt = now.toISOString();
      return { email: t.email, nextPath: t.nextPath, termsVersion: t.termsVersion, source: t.source };
    });
  }

  // sessions
  createSession(s: NewSession) {
    return this.change(d => { d.sessions.push({ idHash: s.idHash, userId: s.userId, createdAt: s.createdAt.toISOString(), expiresAt: s.expiresAt.toISOString(), lastSeenAt: s.createdAt.toISOString(), revokedAt: null }); });
  }
  findSession(idHash: string) { return this.view(d => { const s = d.sessions.find(x => x.idHash === idHash); return s ? sessionOut(s) : null; }); }
  listSessions(userId: string) { return this.view(d => d.sessions.filter(s => s.userId === userId).map(sessionOut)); }
  renewSession(idHash: string, now: Date) {
    return this.change(d => {
      const s = d.sessions.find(x => x.idHash === idHash);
      if (!s || !sessionDueForRenewal(sessionOut(s), now)) return false;
      s.expiresAt = sessionExpiry(now).toISOString();
      s.lastSeenAt = now.toISOString();
      return true;
    });
  }
  revokeSession(idHash: string, now: Date) { return this.change(d => { const s = d.sessions.find(x => x.idHash === idHash); if (s && s.revokedAt === null) s.revokedAt = now.toISOString(); }); }
  revokeAllForUser(userId: string, now: Date) {
    return this.change(d => {
      let n = 0;
      for (const s of d.sessions) if (s.userId === userId && s.revokedAt === null) { s.revokedAt = now.toISOString(); n++; }
      return n;
    });
  }

  // counters
  recordAndCount(scope: AttemptScope, keyHash: string, at: Date, since: Date) {
    return this.change(d => {
      const cutoff = at.getTime() - 24 * 3600 * 1000;
      d.attempts = d.attempts.filter(a => Date.parse(a.at) >= cutoff); // keep the file small
      d.attempts.push({ scope, keyHash, at: at.toISOString() });
      return d.attempts.filter(a => a.scope === scope && a.keyHash === keyHash && Date.parse(a.at) >= since.getTime()).length;
    });
  }

  countSend(windowStart: Date) {
    return this.change(d => {
      const cutoff = windowStart.getTime() - 24 * 3600 * 1000;
      d.sends = d.sends.filter(s => Date.parse(s.windowStart) >= cutoff); // keep the file small
      const key = windowStart.toISOString();
      let row = d.sends.find(s => s.windowStart === key);
      if (!row) d.sends.push((row = { windowStart: key, n: 0 }));
      return ++row.n;
    });
  }

  // access
  loadAccess(userId: string): Promise<AccessSnapshot> {
    return this.view(d => ({
      grants: d.grants.filter(g => g.userId === userId).map(grantOut),
      membership: (m => (m ? membershipOut(m) : null))(d.memberships.find(x => x.userId === userId)),
      billing: d.billing.filter(b => b.userId === userId).map(billingOut),
    }));
  }
  listGrants(userId: string) { return this.view(d => d.grants.filter(g => g.userId === userId).map(grantOut)); }
  createGrant(input: NewGrant, audit: AuditStub) {
    return this.change(d => {
      const grant: Grant = { ...input, id: randomUUID(), revokedAt: null, revokedBy: null, revokeReason: null };
      d.grants.push(grantIn(grant));
      FileAuthStore.log(d, audit, { table: 'access_grants', id: grant.id }, null, grant);
      return grant;
    });
  }
  revokeGrant(id: string, r: Revocation, audit: AuditStub) {
    return this.change(d => {
      const i = d.grants.findIndex(g => g.id === id && g.revokedAt === null);
      if (i < 0) return null;
      const before = grantOut(d.grants[i]!);
      const after: Grant = { ...before, revokedAt: r.at, revokedBy: r.by, revokeReason: r.reason };
      d.grants[i] = grantIn(after);
      FileAuthStore.log(d, audit, { table: 'access_grants', id }, before, after);
      return after;
    });
  }
  findMembership(userId: string) { return this.view(d => { const m = d.memberships.find(x => x.userId === userId); return m ? membershipOut(m) : null; }); }
  saveMembership(projection: MembershipProjection): Promise<Membership> {
    return this.change(d => {
      const i = d.memberships.findIndex(x => x.userId === projection.userId);
      const existing = i >= 0 ? membershipOut(d.memberships[i]!) : null;
      const next: Membership = {
        ...projection,
        status: existing?.suspendedAt ? 'suspended' : projection.status,
        suspendedAt: existing?.suspendedAt ?? null,
        suspendedBy: existing?.suspendedBy ?? null,
        suspendReason: existing?.suspendReason ?? null,
      };
      if (i >= 0) d.memberships[i] = membershipIn(next); else d.memberships.push(membershipIn(next));
      return next;
    });
  }
  anonymise({ userId, email }: Anonymisation, audit: AuditStub) {
    return this.change(d => {
      const user = d.users.find(u => u.id === userId);
      if (!user || user.status === 'deleted') return false;
      const before = { status: user.status, role: user.role };
      user.status = 'deleted';
      user.role = 'reader';
      user.email = `deleted+${userId}@invalid.local`;
      d.memberships = d.memberships.filter(m => m.userId !== userId);
      d.sessions = d.sessions.filter(s => s.userId !== userId);
      d.tokens = d.tokens.filter(t => t.email !== email);
      FileAuthStore.log(d, audit, { table: 'users', id: userId }, before, { status: 'deleted', role: 'reader' });
      return true;
    });
  }
  appendAudit(entry: AuditEntry) { return this.change(d => { d.audit.push(auditIn({ ...entry, id: randomUUID() })); }); }
  listAudit(subjectTable: string, subjectId: string) { return this.view(d => d.audit.filter(a => a.subjectTable === subjectTable && a.subjectId === subjectId).map(auditOut)); }
  listAuditLog({ offset, limit }: Page) {
    return this.view(d => {
      // reversed before the (stable) sort, so rows written at the same instant come newest first too
      const rows = [...d.audit].reverse().sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
      return { rows: rows.slice(offset, offset + limit).map(auditOut), total: d.audit.length };
    });
  }
  accessSummaries(userIds: string[]) {
    return this.view(d => userIds.map(userId => ({
      userId,
      membership: (m => (m ? membershipOut(m) : null))(d.memberships.find(x => x.userId === userId)),
      billingRecords: d.billing.filter(b => b.userId === userId).length,
    })));
  }

  // the admin state-setters, each one change of the file (the row and its audit entry land together or not at all)
  setUserRole(userId: string, role: Role, _at: Date, audit: AuditStub) {
    return this.change(d => {
      const user = d.users.find(u => u.id === userId);
      if (!user || user.status === 'deleted' || user.role === role) return false;
      const before = { role: user.role };
      user.role = role;
      FileAuthStore.log(d, audit, { table: 'users', id: userId }, before, { role });
      return true;
    });
  }
  disableUser(userId: string, _disablement: Suspension, audit: AuditStub) {
    return this.change(d => {
      const user = d.users.find(u => u.id === userId);
      if (!user || user.status !== 'active') return false;
      user.status = 'disabled';
      d.sessions = d.sessions.filter(s => s.userId !== userId);
      FileAuthStore.log(d, audit, { table: 'users', id: userId }, { status: 'active' }, { status: 'disabled' });
      return true;
    });
  }
  enableUser(userId: string, _at: Date, audit: AuditStub) {
    return this.change(d => {
      const user = d.users.find(u => u.id === userId);
      if (!user || user.status !== 'disabled') return false;
      user.status = 'active';
      FileAuthStore.log(d, audit, { table: 'users', id: userId }, { status: 'disabled' }, { status: 'active' });
      return true;
    });
  }
  suspend(userId: string, { at, by, reason }: Suspension, audit: AuditStub) {
    return this.change(d => {
      const i = d.memberships.findIndex(m => m.userId === userId);
      const existing = i >= 0 ? membershipOut(d.memberships[i]!) : null;
      if (existing?.suspendedAt) return null;
      const base: Membership = existing ?? { userId, status: 'none', tier: null, startedAt: null, endsAt: null, currentGrantId: null, complimentary: false, suspendedAt: null, suspendedBy: null, suspendReason: null, updatedAt: at };
      const next = projectMembership(userId, d.grants.filter(g => g.userId === userId).map(grantOut), { ...base, suspendedAt: at, suspendedBy: by, suspendReason: reason }, at);
      if (i >= 0) d.memberships[i] = membershipIn(next); else d.memberships.push(membershipIn(next));
      FileAuthStore.log(d, audit, { table: 'memberships', id: userId }, existing, next);
      return next;
    });
  }
  unsuspend(userId: string, at: Date, audit: AuditStub) {
    return this.change(d => {
      const i = d.memberships.findIndex(m => m.userId === userId);
      const existing = i >= 0 ? membershipOut(d.memberships[i]!) : null;
      if (!existing?.suspendedAt) return null;
      const next = projectMembership(userId, d.grants.filter(g => g.userId === userId).map(grantOut), { ...existing, suspendedAt: null, suspendedBy: null, suspendReason: null }, at);
      d.memberships[i] = membershipIn(next);
      FileAuthStore.log(d, audit, { table: 'memberships', id: userId }, existing, next);
      return next;
    });
  }
  linkBilling(recordId: string, userId: string, _at: Date, audit: AuditStub) {
    return this.change(d => {
      const record = d.billing.find(b => b.id === recordId);
      if (!record) return null;
      if (record.userId === userId) return { changed: false };
      const before = { userId: record.userId };
      record.userId = userId;
      FileAuthStore.log(d, audit, { table: 'billing_records', id: recordId }, before, { userId });
      return { changed: true };
    });
  }
}
