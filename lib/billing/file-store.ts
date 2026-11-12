import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { BillingAccess, Grant, Membership, PaidTier } from '@/lib/access/types';
import type { Actor, AuditRow } from '@/lib/audit';
import { SESSION_CAP_SECONDS } from '@/lib/auth/config';
import type { User } from '@/lib/users/types';
import { planMirror } from './plan-mirror';
import type { BillingStore, ClaimResult, MirrorResult, ResendWrite } from './store';
import {
  NON_TERMINAL_STATUSES,
  UPGRADE_PRODUCT_KEY,
  isPurchaseStatus,
  isSubscriptionStatus,
  type BillingCustomer,
  type BillingEvent,
  type BillingRecord,
  type BillingStatus,
  type EventStatus,
  type MirrorInput,
  type MirrorPlan,
  type NewBillingEvent,
} from './types';

// Same lock directory as FileAuthStore (`${authFile}.lock`). The two stores must take turns or the e2e seed and
// the webhook will tear the auth file. This store mutates the parsed object in place so a key it does not know
// survives; rebuilding the auth file from its known fields would drop it, and FileAuthStore would drop a key
// this store invented on its next write. Full billing rows live in a separate file for that reason.
const LOCK_RETRY_MS = 10;
const LOCK_WAIT_MS = 5000;
const LOCK_STALE_MS = 5000;

type Disk = { customers: unknown[]; records: unknown[]; events: unknown[] };

export class FileBillingStore implements BillingStore {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private readonly billingFile: string, private readonly authFile: string) {}

  claimEvent(event: NewBillingEvent, at: Date): Promise<ClaimResult> {
    return this.change(async () => {
      const disk = await this.readBilling();
      const events = disk.events.map(reviveEvent).filter((e): e is BillingEvent => e !== null);
      const existing = events.find(e => e.provider === event.provider && e.providerEventId === event.providerEventId);
      if (!existing) {
        const row: BillingEvent = {
          id: randomUUID(), provider: event.provider, providerEventId: event.providerEventId, eventType: event.eventType,
          objectId: event.objectId, eventCreatedAt: event.eventCreatedAt, receivedAt: at, processedAt: null,
          status: 'received', error: null, payload: event.payload,
        };
        disk.events.push(freezeEvent(row));
        await this.writeBilling(disk);
        return { claimed: true, id: row.id };
      }
      if (existing.status !== 'failed') return { claimed: false, status: existing.status, receivedAt: existing.receivedAt };
      existing.status = 'received';
      existing.error = null;
      existing.receivedAt = at;
      disk.events = events.map(freezeEvent);
      await this.writeBilling(disk);
      return { claimed: true, id: existing.id };
    });
  }

  setEventStatus(id: string, status: EventStatus, error: string | null, at: Date) {
    return this.change(async () => {
      const disk = await this.readBilling();
      const events = disk.events.map(reviveEvent).filter((e): e is BillingEvent => e !== null);
      const event = events.find(e => e.id === id);
      if (!event) return;
      event.status = status;
      event.error = error;
      if (status === 'processed' || status === 'ignored_stale' || status === 'unmatched') event.processedAt = at;
      disk.events = events.map(freezeEvent);
      await this.writeBilling(disk);
    });
  }

  findRecord(provider: string, providerObjectId: string) {
    return this.view(async () => {
      const records = await this.records();
      return records.find(r => r.provider === provider && r.providerObjectId === providerObjectId) ?? null;
    });
  }

  findRecordById(id: string) {
    return this.view(async () => (await this.records()).find(r => r.id === id) ?? null);
  }

  listRecordsForUser(userId: string) {
    return this.view(async () => (await this.records()).filter(r => r.userId === userId));
  }

  attachUser(recordId: string, userId: string) {
    return this.change(async () => {
      const disk = await this.readBilling();
      const records = disk.records.map(reviveRecord).filter((r): r is BillingRecord => r !== null);
      const record = records.find(r => r.id === recordId);
      if (!record || record.userId !== null) return;
      record.userId = userId;
      disk.records = records.map(freezeRecord);
      await this.writeBilling(disk);
    });
  }

  listNonTerminal() {
    return this.view(async () => (await this.records()).filter(r => (NON_TERMINAL_STATUSES as readonly string[]).includes(r.status)));
  }

  listPaidMissingReadyEmail() {
    return this.view(async () => (await this.records()).filter(r => r.status === 'paid' && r.readyEmailSentAt === null && r.userId !== null && r.productKey !== UPGRADE_PRODUCT_KEY));
  }

  commitMirror(input: MirrorInput): Promise<MirrorResult> {
    return this.change(async () => {
      const disk = await this.readBilling();
      const auth = await this.readAuth();
      const records = disk.records.map(reviveRecord).filter((r): r is BillingRecord => r !== null);
      const customers = disk.customers.map(reviveCustomer).filter((c): c is BillingCustomer => c !== null);
      const existing = records.find(r => r.provider === input.provider && r.providerObjectId === input.providerObjectId) ?? null;
      const keptUser = existing?.userId ?? input.userId;
      const grants = listOf(auth, 'grants').map(reviveGrant).filter((g): g is Grant => g !== null && g.userId === keptUser);
      const membership = listOf(auth, 'memberships').map(reviveMembership).find(m => m?.userId === keptUser) ?? null;
      const userRecords = keptUser ? records.filter(r => r.userId === keptUser) : [];
      const plan = planMirror({ record: existing, customers, userRecords, grants, membership }, input);
      if (!plan.applied) return { applied: false };

      const nextRecords = existing ? records.map(r => r.id === plan.record.id ? plan.record : r) : [...records, plan.record];
      const customer = plan.customer;
      const nextCustomers = customer
        ? customers.some(c => c.id === customer.id)
          ? customers.map(c => c.id === customer.id ? customer : c)
          : [...customers, customer]
        : customers;
      // An upgrade swept up by a refunded Basic stops being live on its own record too, so the account can buy another.
      const swept = new Map(plan.grantRevokes.filter(r => r.billingRecordId !== plan.record.id).map(r => [r.billingRecordId, r.at]));
      disk.records = nextRecords.map(r => freezeRecord(swept.has(r.id) ? { ...r, accessEndsAt: swept.get(r.id) ?? r.accessEndsAt } : r));
      disk.customers = nextCustomers.map(freezeCustomer);
      await this.writeBilling(disk);
      this.applyPlanToAuth(auth, plan);
      await this.writeAuth(auth);
      return { applied: true, record: plan.record };
    });
  }

  markReadyEmailSent(id: string, at: Date) {
    return this.change(async () => {
      const disk = await this.readBilling();
      const records = disk.records.map(reviveRecord).filter((r): r is BillingRecord => r !== null);
      const record = records.find(r => r.id === id);
      if (!record || record.readyEmailSentAt) return;
      record.readyEmailSentAt = at;
      disk.records = records.map(freezeRecord);
      await this.writeBilling(disk);
    });
  }

  recordResend(id: string, at: Date, actor: Actor): Promise<ResendWrite> {
    return this.change(async () => {
      const disk = await this.readBilling();
      const auth = await this.readAuth();
      const records = disk.records.map(reviveRecord).filter((r): r is BillingRecord => r !== null);
      const record = records.find(r => r.id === id);
      if (!record) return { ok: false, reason: 'missing' };
      if (record.status !== 'paid') return { ok: false, reason: 'not_paid' };
      const before = record.readyEmailSentAt?.toISOString() ?? null;
      record.readyEmailSentAt = at;
      disk.records = records.map(freezeRecord);
      await this.writeBilling(disk);
      if (before !== at.toISOString()) {
        listOf(auth, 'audit').push(freezeAudit({
          id: randomUUID(), at, actorUserId: actor.userId, actorKind: actor.kind, action: 'billing.resend_ready_email',
          subjectTable: 'billing_records', subjectId: id, before: { readyEmailSentAt: before }, after: { readyEmailSentAt: at.toISOString() },
          reason: null, ipHash: actor.ipHash ?? null,
        }));
        await this.writeAuth(auth);
      }
      return { ok: true };
    });
  }

  requeueStuckReceived(olderThan: Date) {
    return this.change(async () => {
      const disk = await this.readBilling();
      let n = 0;
      const events = disk.events.map(reviveEvent).filter((e): e is BillingEvent => e !== null).map(event => {
        if (event.status === 'received' && event.receivedAt < olderThan) {
          event.status = 'failed';
          event.error = 'StaleReceived';
          n += 1;
        }
        return event;
      });
      disk.events = events.map(freezeEvent);
      await this.writeBilling(disk);
      return n;
    });
  }

  nullPayloadsOlderThan(olderThan: Date) {
    return this.change(async () => {
      const disk = await this.readBilling();
      let n = 0;
      const events = disk.events.map(reviveEvent).filter((e): e is BillingEvent => e !== null).map(event => {
        if (event.payload !== null && event.receivedAt < olderThan) {
          event.payload = null;
          n += 1;
        }
        return event;
      });
      disk.events = events.map(freezeEvent);
      await this.writeBilling(disk);
      return n;
    });
  }

  deleteExpiredAuth(now: Date) {
    return this.change(async () => {
      const auth = await this.readAuth();
      const cap = now.getTime() - SESSION_CAP_SECONDS * 1000;
      auth.tokens = listOf(auth, 'tokens').filter(row => {
        const expires = dateOf(isRecord(row) ? row.expiresAt : null);
        return expires !== null && expires >= now;
      });
      auth.sessions = listOf(auth, 'sessions').filter(row => {
        if (!isRecord(row)) return false;
        const expires = dateOf(row.expiresAt);
        const created = dateOf(row.createdAt);
        return expires !== null && created !== null && expires >= now && created.getTime() >= cap;
      });
      await this.writeAuth(auth);
    });
  }

  findUserById(id: string) {
    return this.view(async () => this.users().then(rows => rows.find(u => u.id === id) ?? null));
  }

  findUserByEmail(email: string) {
    return this.view(async () => this.users().then(rows => rows.find(u => u.email === email) ?? null));
  }

  createReader(email: string, at: Date): Promise<User> {
    return this.change(async () => {
      const auth = await this.readAuth();
      const users = listOf(auth, 'users');
      const existing = users.map(reviveUser).find(u => u?.email === email);
      if (existing) return existing;
      const user: User = {
        id: randomUUID(), email, emailVerifiedAt: null, firstName: null, lastName: null, displayName: null, avatarKey: null, avatarUpdatedAt: null, role: 'reader', status: 'active',
        acceptedTermsVersion: null, acceptedTermsAt: null, lastSignInAt: null, createdAt: at,
      };
      users.push(freezeUser(user));
      await this.writeAuth(auth);
      return user;
    });
  }

  private applyPlanToAuth(auth: Record<string, unknown>, plan: Extract<MirrorPlan, { applied: true }>) {
    const grants = listOf(auth, 'grants');
    for (const revocation of plan.grantRevokes) {
      const grant = grants.find(row => isRecord(row) && row.billingRecordId === revocation.billingRecordId && (row.revokedAt === null || row.revokedAt === undefined));
      if (isRecord(grant)) {
        grant.revokedAt = revocation.at.toISOString();
        grant.revokedBy = null;
        grant.revokeReason = revocation.reason;
      }
    }
    if (plan.grantInsert) grants.push(freezeGrant(plan.grantInsert));
    const membership = plan.membership;
    if (membership) upsert(listOf(auth, 'memberships'), row => row.userId === membership.userId, freezeMembership(membership));
    const slice = plan.billing;
    if (slice) upsert(listOf(auth, 'billing'), row => row.id === slice.id, freezeSlice(slice));
    if (plan.audit) listOf(auth, 'audit').push(freezeAudit(plan.audit));
  }

  private async records(): Promise<BillingRecord[]> {
    return (await this.readBilling()).records.map(reviveRecord).filter((r): r is BillingRecord => r !== null);
  }

  private async users(): Promise<User[]> {
    return listOf(await this.readAuth(), 'users').map(reviveUser).filter((u): u is User => u !== null);
  }

  private change<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.queue.then(() => this.locked(fn));
    this.queue = run.catch(() => undefined);
    return run;
  }

  private view<T>(fn: () => Promise<T>): Promise<T> {
    return this.queue.then(fn, fn);
  }

  private async locked<T>(fn: () => Promise<T>): Promise<T> {
    const lock = `${this.authFile}.lock`;
    await mkdir(path.dirname(this.authFile), { recursive: true });
    for (let waited = 0; ; waited += LOCK_RETRY_MS) {
      try {
        await mkdir(lock);
        break;
      } catch (err) {
        if (!(err instanceof Error) || !('code' in err) || err.code !== 'EEXIST') throw err;
        const age = Date.now() - await stat(lock).then(s => s.mtimeMs, () => Date.now());
        if (age > LOCK_STALE_MS) { await rm(lock, { recursive: true, force: true }); continue; }
        if (waited > LOCK_WAIT_MS) throw named('BillingLockTimeout');
        await new Promise(resolve => setTimeout(resolve, LOCK_RETRY_MS));
      }
    }
    try {
      return await fn();
    } finally {
      await rm(lock, { recursive: true, force: true });
    }
  }

  private async readBilling(): Promise<Disk> {
    const parsed = await readObject(this.billingFile);
    return {
      customers: Array.isArray(parsed.customers) ? parsed.customers : [],
      records: Array.isArray(parsed.records) ? parsed.records : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  }

  private async writeBilling(disk: Disk) {
    const current = await readObject(this.billingFile);
    current.customers = disk.customers;
    current.records = disk.records;
    current.events = disk.events;
    await writeObject(this.billingFile, current);
  }

  private readAuth() { return readObject(this.authFile); }
  private writeAuth(data: Record<string, unknown>) { return writeObject(this.authFile, data); }
}

function named(name: string): Error {
  const error = new Error(name);
  error.name = name;
  return error;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function listOf(data: Record<string, unknown>, key: string): unknown[] {
  const current = data[key];
  if (Array.isArray(current)) return current;
  const created: unknown[] = [];
  data[key] = created;
  return created;
}

function upsert(list: unknown[], match: (row: Record<string, unknown>) => boolean, fields: Record<string, unknown>) {
  const found = list.find(row => isRecord(row) && match(row));
  if (isRecord(found)) Object.assign(found, fields);
  else list.push(fields);
}

async function readObject(file: string): Promise<Record<string, unknown>> {
  try {
    const parsed: unknown = JSON.parse(await readFile(file, 'utf8'));
    if (!isRecord(parsed)) throw named('BillingFileError');
    return parsed;
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === 'ENOENT') return {};
    throw err;
  }
}

async function writeObject(file: string, value: unknown) {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(value));
  await rename(tmp, file);
}

const iso = (d: Date | null): string | null => (d ? d.toISOString() : null);
const text = (value: unknown): string | null => (typeof value === 'string' ? value : null);
function dateOf(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
function requiredDate(value: unknown): Date | null {
  return dateOf(value);
}

function tierOf(value: unknown): PaidTier | null {
  return value === 'basic' || value === 'pro' ? value : null;
}

function statusOf(value: unknown): BillingStatus | null {
  return typeof value === 'string' && (isPurchaseStatus(value) || isSubscriptionStatus(value)) ? value : null;
}

function reviveRecord(value: unknown): BillingRecord | null {
  if (!isRecord(value)) return null;
  const kind = value.kind === 'purchase' || value.kind === 'subscription' ? value.kind : null;
  const tier = tierOf(value.tier);
  const status = statusOf(value.status);
  const id = text(value.id);
  const createdAt = requiredDate(value.createdAt);
  const updatedAt = requiredDate(value.updatedAt);
  if (!kind || !tier || !status || !id || !createdAt || !updatedAt) return null;
  return {
    id, kind, tier, status, createdAt, updatedAt,
    billingCustomerId: text(value.billingCustomerId),
    userId: text(value.userId),
    provider: text(value.provider) ?? '',
    providerObjectId: text(value.providerObjectId) ?? '',
    providerPaymentId: text(value.providerPaymentId),
    productKey: text(value.productKey) ?? '',
    providerPriceId: text(value.providerPriceId),
    amountCents: typeof value.amountCents === 'number' ? value.amountCents : null,
    currency: text(value.currency),
    providerStatus: text(value.providerStatus),
    paidAt: dateOf(value.paidAt),
    refundedAt: dateOf(value.refundedAt),
    disputedAt: dateOf(value.disputedAt),
    trialEndsAt: dateOf(value.trialEndsAt),
    currentPeriodStart: dateOf(value.currentPeriodStart),
    currentPeriodEnd: dateOf(value.currentPeriodEnd),
    cancelRequestedAt: dateOf(value.cancelRequestedAt),
    cancelEffectiveAt: dateOf(value.cancelEffectiveAt),
    accessEndsAt: dateOf(value.accessEndsAt),
    lastEventAt: dateOf(value.lastEventAt),
    readyEmailSentAt: dateOf(value.readyEmailSentAt),
    notes: text(value.notes),
    manageUrl: text(value.manageUrl),
  };
}

function freezeRecord(r: BillingRecord): Record<string, unknown> {
  return {
    ...r,
    paidAt: iso(r.paidAt), refundedAt: iso(r.refundedAt), disputedAt: iso(r.disputedAt),
    trialEndsAt: iso(r.trialEndsAt), currentPeriodStart: iso(r.currentPeriodStart), currentPeriodEnd: iso(r.currentPeriodEnd),
    cancelRequestedAt: iso(r.cancelRequestedAt), cancelEffectiveAt: iso(r.cancelEffectiveAt),
    accessEndsAt: iso(r.accessEndsAt), lastEventAt: iso(r.lastEventAt), readyEmailSentAt: iso(r.readyEmailSentAt),
    createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString(),
  };
}

function reviveCustomer(value: unknown): BillingCustomer | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.userId !== 'string') return null;
  if (typeof value.provider !== 'string' || typeof value.providerCustomerId !== 'string') return null;
  return { id: value.id, userId: value.userId, provider: value.provider, providerCustomerId: value.providerCustomerId, emailAtProvider: text(value.emailAtProvider) };
}

function freezeCustomer(c: BillingCustomer): Record<string, unknown> {
  return { ...c };
}

function reviveEvent(value: unknown): BillingEvent | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.provider !== 'string' || typeof value.providerEventId !== 'string') return null;
  const status = value.status;
  if (status !== 'received' && status !== 'processed' && status !== 'ignored_stale' && status !== 'unmatched' && status !== 'failed') return null;
  const receivedAt = dateOf(value.receivedAt);
  if (!receivedAt) return null;
  return {
    id: value.id, provider: value.provider, providerEventId: value.providerEventId, eventType: text(value.eventType) ?? '',
    objectId: text(value.objectId), eventCreatedAt: dateOf(value.eventCreatedAt), receivedAt, processedAt: dateOf(value.processedAt),
    status, error: text(value.error), payload: value.payload ?? null,
  };
}

function freezeEvent(e: BillingEvent): Record<string, unknown> {
  return { ...e, eventCreatedAt: iso(e.eventCreatedAt), receivedAt: e.receivedAt.toISOString(), processedAt: iso(e.processedAt) };
}

function reviveUser(value: unknown): User | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.email !== 'string') return null;
  if (value.role !== 'reader' && value.role !== 'admin') return null;
  if (value.status !== 'active' && value.status !== 'disabled' && value.status !== 'deleted') return null;
  const createdAt = dateOf(value.createdAt);
  if (!createdAt) return null;
  return {
    id: value.id, email: value.email, role: value.role, status: value.status, createdAt,
    emailVerifiedAt: dateOf(value.emailVerifiedAt), firstName: text(value.firstName), lastName: text(value.lastName), displayName: text(value.displayName), avatarKey: text(value.avatarKey), avatarUpdatedAt: dateOf(value.avatarUpdatedAt),
    acceptedTermsVersion: text(value.acceptedTermsVersion),
    acceptedTermsAt: dateOf(value.acceptedTermsAt), lastSignInAt: dateOf(value.lastSignInAt),
  };
}

function freezeUser(u: User): Record<string, unknown> {
  return {
    ...u, emailVerifiedAt: iso(u.emailVerifiedAt), acceptedTermsAt: iso(u.acceptedTermsAt),
    lastSignInAt: iso(u.lastSignInAt), createdAt: u.createdAt.toISOString(),
  };
}

function reviveGrant(value: unknown): Grant | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.userId !== 'string') return null;
  const tier = tierOf(value.tier);
  const startsAt = dateOf(value.startsAt);
  const createdAt = dateOf(value.createdAt);
  if (!tier || !startsAt || !createdAt) return null;
  if (value.kind !== 'purchase' && value.kind !== 'subscription' && value.kind !== 'complimentary' && value.kind !== 'promo') return null;
  const revokeReason = value.revokeReason;
  return {
    id: value.id, userId: value.userId, kind: value.kind, tier, startsAt, createdAt,
    endsAt: dateOf(value.endsAt), billingRecordId: text(value.billingRecordId), grantedBy: text(value.grantedBy),
    grantNote: text(value.grantNote), revokedAt: dateOf(value.revokedAt), revokedBy: text(value.revokedBy),
    revokeReason: revokeReason === 'refund' || revokeReason === 'chargeback' || revokeReason === 'abuse' || revokeReason === 'admin' || revokeReason === 'expired_promo' ? revokeReason : null,
  };
}

function freezeGrant(g: Grant): Record<string, unknown> {
  return {
    ...g, startsAt: g.startsAt.toISOString(), endsAt: iso(g.endsAt), revokedAt: iso(g.revokedAt), createdAt: g.createdAt.toISOString(),
  };
}

function reviveMembership(value: unknown): Membership | null {
  if (!isRecord(value) || typeof value.userId !== 'string') return null;
  if (value.status !== 'none' && value.status !== 'active' && value.status !== 'lapsed' && value.status !== 'suspended') return null;
  const updatedAt = dateOf(value.updatedAt);
  if (!updatedAt || typeof value.complimentary !== 'boolean') return null;
  return {
    userId: value.userId, status: value.status, tier: tierOf(value.tier), startedAt: dateOf(value.startedAt), endsAt: dateOf(value.endsAt),
    currentGrantId: text(value.currentGrantId), complimentary: value.complimentary, suspendedAt: dateOf(value.suspendedAt),
    suspendedBy: text(value.suspendedBy), suspendReason: text(value.suspendReason), updatedAt,
  };
}

function freezeMembership(m: Membership): Record<string, unknown> {
  return {
    ...m, startedAt: iso(m.startedAt), endsAt: iso(m.endsAt), suspendedAt: iso(m.suspendedAt), updatedAt: m.updatedAt.toISOString(),
  };
}

function freezeSlice(b: BillingAccess & { userId: string | null }): Record<string, unknown> {
  return b.kind === 'purchase'
    ? { ...b, accessEndsAt: iso(b.accessEndsAt), currentPeriodEnd: null }
    : { ...b, accessEndsAt: iso(b.accessEndsAt), currentPeriodEnd: iso(b.currentPeriodEnd) };
}

function freezeAudit(a: AuditRow): Record<string, unknown> {
  return { ...a, at: a.at.toISOString() };
}
