import { timingSafeEqual } from 'node:crypto';
import type { Actor } from '@/lib/audit';
import { unchanged } from '@/lib/audit';
import { mirrorFromOrder, orderDates, sendReadyLinkTo, type ProcessDeps } from './process-event';
import { recordSnapshot, type BillingRecord } from './types';

/** A received row this old was never finished. The next delivery, or this pass, may claim it again. */
const STUCK_RECEIVED_MS = 10 * 60 * 1000;
/** Event payloads are nulled after this. The row stays, so a duplicate delivery is still recognised. */
const PAYLOAD_TTL_MS = 90 * 24 * 3600 * 1000;

export type ReconcileDeps = Pick<ProcessDeps, 'store' | 'adapter' | 'now' | 'mail' | 'fetchImpl' | 'issueSignIn' | 'sendReady'> & {
  origin: string;
};

export type ReconcileReport = {
  requeued: number;
  mirrored: number;
  mirrorFailures: number;
  readyEmails: number;
  payloadsNulled: number;
};

export function bearerMatches(header: string | null, secret: string | undefined): boolean {
  if (!header || !secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`, 'utf8');
  const got = Buffer.from(header, 'utf8');
  if (expected.length !== got.length) return false;
  return timingSafeEqual(expected, got);
}

/**
 * The daily pass: mark stuck `received` events `failed` so a later delivery can claim them, re-read every open
 * record from the provider, send ready emails the webhook did not, then drop old payloads and expired sign-in
 * rows. Mirrors that change something are audited
 * as `billing.event` with actor kind `system` or whatever actor the caller passes (an admin resync).
 */
export async function reconcileBilling(deps: ReconcileDeps, actor: Actor = { kind: 'system', userId: null }): Promise<ReconcileReport> {
  const now = deps.now();
  const requeued = await deps.store.requeueStuckReceived(new Date(now.getTime() - STUCK_RECEIVED_MS));
  const records = await deps.store.listNonTerminal();
  let mirrored = 0;
  let mirrorFailures = 0;
  for (const record of records) {
    // One order the provider will not return must not stop the rest of the pass, today or on every later run.
    try {
      if (await mirrorRecord(deps, record, actor, now)) mirrored += 1;
    } catch (err) {
      mirrorFailures += 1;
      console.error('billing: reconcile mirror failed', err instanceof Error && err.name ? err.name : 'error');
    }
  }
  const readyEmails = await sendMissingReadyEmails(deps, now);
  const payloadsNulled = await deps.store.nullPayloadsOlderThan(new Date(now.getTime() - PAYLOAD_TTL_MS));
  await deps.store.deleteExpiredAuth(now);
  return { requeued, mirrored, mirrorFailures, readyEmails, payloadsNulled };
}

/** Re-reads one user's records. `changed` is false when every fetched order already matches the row. */
export async function resyncUserRecords(deps: ReconcileDeps, userId: string, actor: Actor): Promise<{ changed: boolean }> {
  const now = deps.now();
  const records = await deps.store.listRecordsForUser(userId);
  let changed = false;
  for (const record of records) {
    const before = recordSnapshot(record);
    const after = await mirrorRecord(deps, record, actor, now);
    if (after && !unchanged(before, recordSnapshot(after))) changed = true;
  }
  return { changed };
}

export type ResendOutcome = 'sent' | 'not_paid' | 'missing' | 'not_sent';

/** Sends first. The flag and the `billing.resend_ready_email` row are written only when the send returns `sent`. */
export async function resendReadyForUser(deps: ReconcileDeps, userId: string, actor: Actor): Promise<ResendOutcome> {
  const records = await deps.store.listRecordsForUser(userId);
  if (records.length === 0) return 'missing';
  const paid = records.filter(record => record.status === 'paid');
  if (paid.length === 0) return 'not_paid';
  const user = await deps.store.findUserById(userId);
  if (!user) return 'missing';
  const now = deps.now();
  for (const record of paid) {
    const status = await sendReadyLinkTo(user.email, now, deps.origin, deps);
    if (status !== 'sent') return 'not_sent';
    const wrote = await deps.store.recordResend(record.id, now, actor);
    if (!wrote.ok) return wrote.reason;
  }
  return 'sent';
}

async function sendMissingReadyEmails(deps: ReconcileDeps, now: Date): Promise<number> {
  const waiting = await deps.store.listPaidMissingReadyEmail();
  let sent = 0;
  for (const record of waiting) {
    if (!record.userId) continue;
    const user = await deps.store.findUserById(record.userId);
    if (!user) continue;
    try {
      const status = await sendReadyLinkTo(user.email, now, deps.origin, deps);
      if (status !== 'sent') continue;
      await deps.store.markReadyEmailSent(record.id, now);
      sent += 1;
    } catch (err) {
      console.error('billing: ready email failed', err instanceof Error ? err.name : 'error');
    }
  }
  return sent;
}

/** Fetches the provider object and mirrors it. A failed or foreign object is left as it is: there is no `failed` status to store. */
async function mirrorRecord(deps: ReconcileDeps, record: BillingRecord, actor: Actor, now: Date): Promise<BillingRecord | null> {
  const type = record.kind === 'subscription' ? 'subscriptions' : 'orders';
  const mapped = await deps.adapter.fetch({ type, id: record.providerObjectId }, deps.fetchImpl);
  if (mapped.outcome !== 'order') return null;
  const order = mapped.order;
  const result = await deps.store.commitMirror(mirrorFromOrder(order, {
    at: now,
    lastEventAt: order.updatedAt ?? now,
    userId: record.userId,
    grant: order.grant,
    revokeReason: order.revokeReason,
    ...orderDates(order, record, now),
    actor,
  }));
  return result.applied ? result.record : null;
}
