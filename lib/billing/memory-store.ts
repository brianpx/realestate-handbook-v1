import { randomUUID } from 'node:crypto';
import type { MemoryAccessStore } from '@/lib/access/memory-store';
import type { Actor } from '@/lib/audit';
import { SESSION_CAP_SECONDS } from '@/lib/auth/config';
import type { MemoryAuthStore } from '@/lib/auth/memory-store';
import type { MemoryUserStore } from '@/lib/users/store';
import type { User } from '@/lib/users/types';
import { planMirror } from './plan-mirror';
import type { BillingStore, ClaimResult, MirrorResult, ResendWrite } from './store';
import {
  BillingStepError,
  NON_TERMINAL_STATUSES,
  UPGRADE_PRODUCT_KEY,
  type BillingCustomer,
  type BillingEvent,
  type BillingRecord,
  type BillingThrowAfter,
  type EventStatus,
  type MirrorInput,
  type NewBillingEvent,
} from './types';

type Linked = { access: MemoryAccessStore; users: MemoryUserStore; auth?: MemoryAuthStore };

/**
 * Unit-test store. `throwAfter` leaves the earlier writes in place so one retry can converge: the production
 * Neon mirror commits the record, grant, membership and audit as one statement, and this fake is the only place
 * those steps can be split.
 */
export class MemoryBillingStore implements BillingStore {
  records: BillingRecord[] = [];
  events: BillingEvent[] = [];
  customers: BillingCustomer[] = [];
  throwAfter: BillingThrowAfter | null = null;

  constructor(private readonly linked: Linked | null = null) {}

  async claimEvent(event: NewBillingEvent, at: Date): Promise<ClaimResult> {
    const existing = this.events.find(e => e.provider === event.provider && e.providerEventId === event.providerEventId);
    if (!existing) {
      const row: BillingEvent = {
        id: randomUUID(),
        provider: event.provider,
        providerEventId: event.providerEventId,
        eventType: event.eventType,
        objectId: event.objectId,
        eventCreatedAt: event.eventCreatedAt,
        receivedAt: at,
        processedAt: null,
        status: 'received',
        error: null,
        payload: event.payload,
      };
      this.events.push(row);
      return { claimed: true, id: row.id };
    }
    if (existing.status !== 'failed') return { claimed: false, status: existing.status, receivedAt: existing.receivedAt };
    existing.status = 'received';
    existing.error = null;
    existing.receivedAt = at;
    return { claimed: true, id: existing.id };
  }

  async setEventStatus(id: string, status: EventStatus, error: string | null, at: Date) {
    const event = this.events.find(e => e.id === id);
    if (!event) return;
    event.status = status;
    event.error = error;
    if (status === 'processed' || status === 'ignored_stale' || status === 'unmatched') event.processedAt = at;
  }

  async findRecord(provider: string, providerObjectId: string) {
    return this.records.find(r => r.provider === provider && r.providerObjectId === providerObjectId) ?? null;
  }

  async findRecordById(id: string) {
    return this.records.find(r => r.id === id) ?? null;
  }

  async listRecordsForUser(userId: string) {
    return this.records.filter(r => r.userId === userId);
  }

  async attachUser(recordId: string, userId: string) {
    const record = this.records.find(r => r.id === recordId);
    if (record && record.userId === null) record.userId = userId;
  }

  async listNonTerminal() {
    return this.records.filter(r => (NON_TERMINAL_STATUSES as readonly string[]).includes(r.status));
  }

  async listPaidMissingReadyEmail() {
    return this.records.filter(r => r.status === 'paid' && r.readyEmailSentAt === null && r.userId !== null && r.productKey !== UPGRADE_PRODUCT_KEY);
  }

  async commitMirror(input: MirrorInput): Promise<MirrorResult> {
    const existing = await this.findRecord(input.provider, input.providerObjectId);
    const keptUser = existing?.userId ?? input.userId;
    const access = this.linked?.access;
    const plan = planMirror({
      record: existing,
      customers: this.customers,
      userRecords: keptUser ? this.records.filter(r => r.userId === keptUser) : [],
      grants: keptUser && access ? access.grants.filter(g => g.userId === keptUser) : [],
      membership: keptUser && access ? access.memberships.find(m => m.userId === keptUser) ?? null : null,
    }, input);
    if (!plan.applied) return { applied: false };

    const recordIndex = this.records.findIndex(r => r.id === plan.record.id);
    if (recordIndex >= 0) this.records[recordIndex] = plan.record;
    else this.records.push(plan.record);
    const customer = plan.customer;
    if (customer) {
      const i = this.customers.findIndex(c => c.id === customer.id);
      if (i >= 0) this.customers[i] = customer;
      else this.customers.push(customer);
    }
    if (this.throwAfter === 'record') throw new BillingStepError('record');

    if (access && plan.grantInsert) access.grants.push(plan.grantInsert);
    for (const revocation of plan.grantRevokes) {
      // An upgrade swept up by a refunded Basic stops being live on its own record too, so the account can buy another.
      const swept = this.records.find(r => r.id === revocation.billingRecordId && r.id !== plan.record.id);
      if (swept) swept.accessEndsAt = revocation.at;
      const grant = access?.grants.find(g => g.billingRecordId === revocation.billingRecordId && g.revokedAt === null);
      if (grant) {
        grant.revokedAt = revocation.at;
        grant.revokedBy = null;
        grant.revokeReason = revocation.reason;
      }
    }
    if (this.throwAfter === 'grant') throw new BillingStepError('grant');

    const membership = plan.membership;
    if (access && membership) {
      const i = access.memberships.findIndex(m => m.userId === membership.userId);
      if (i >= 0) access.memberships[i] = membership;
      else access.memberships.push(membership);
    }
    const slice = plan.billing;
    if (access && slice) {
      const i = access.billing.findIndex(b => b.id === slice.id);
      if (i >= 0) access.billing[i] = slice;
      else access.billing.push(slice);
    }
    if (access && plan.audit) access.audit.push(plan.audit);
    if (this.throwAfter === 'audit') throw new BillingStepError('audit');
    return { applied: true, record: plan.record };
  }

  async markReadyEmailSent(id: string, at: Date) {
    if (this.throwAfter === 'ready') throw new BillingStepError('ready');
    const record = this.records.find(r => r.id === id);
    if (!record || record.readyEmailSentAt) return;
    record.readyEmailSentAt = at;
  }

  async recordResend(id: string, at: Date, actor: Actor): Promise<ResendWrite> {
    const record = this.records.find(r => r.id === id);
    if (!record) return { ok: false, reason: 'missing' };
    if (record.status !== 'paid') return { ok: false, reason: 'not_paid' };
    const before = record.readyEmailSentAt?.toISOString() ?? null;
    record.readyEmailSentAt = at;
    const after = at.toISOString();
    if (before !== after && this.linked) {
      this.linked.access.audit.push({
        id: randomUUID(),
        at,
        actorUserId: actor.userId,
        actorKind: actor.kind,
        action: 'billing.resend_ready_email',
        subjectTable: 'billing_records',
        subjectId: id,
        before: { readyEmailSentAt: before },
        after: { readyEmailSentAt: after },
        reason: null,
        ipHash: actor.ipHash ?? null,
      });
    }
    return { ok: true };
  }

  async requeueStuckReceived(olderThan: Date) {
    let n = 0;
    for (const event of this.events) {
      if (event.status === 'received' && event.receivedAt < olderThan) {
        event.status = 'failed';
        event.error = 'StaleReceived';
        n += 1;
      }
    }
    return n;
  }

  async nullPayloadsOlderThan(olderThan: Date) {
    let n = 0;
    for (const event of this.events) {
      if (event.payload !== null && event.receivedAt < olderThan) {
        event.payload = null;
        n += 1;
      }
    }
    return n;
  }

  async deleteExpiredAuth(now: Date) {
    const auth = this.linked?.auth;
    if (!auth) return;
    const cap = now.getTime() - SESSION_CAP_SECONDS * 1000;
    auth.tokens = auth.tokens.filter(t => t.expiresAt >= now);
    auth.sessions = auth.sessions.filter(s => s.expiresAt >= now && s.createdAt.getTime() >= cap);
  }

  async findUserById(id: string) {
    return this.users().findById(id);
  }

  async findUserByEmail(email: string) {
    return this.users().findByEmail(email);
  }

  async createReader(email: string, at: Date): Promise<User> {
    const users = this.users();
    const existing = await users.findByEmail(email);
    if (existing) return existing;
    const user: User = {
      id: randomUUID(),
      email,
      emailVerifiedAt: null,
      firstName: null,
      lastName: null,
      displayName: null,
      role: 'reader',
      status: 'active',
      acceptedTermsVersion: null,
      acceptedTermsAt: null,
      lastSignInAt: null,
      createdAt: at,
    };
    users.users.push(user);
    return user;
  }

  private users(): MemoryUserStore {
    if (!this.linked) {
      const error = new Error('users');
      error.name = 'NoUserStore';
      throw error;
    }
    return this.linked.users;
  }
}
