import { VERIFY_PATH } from '@/lib/auth/config';
import type { MailConfig } from '@/lib/leads/mail';
import type { EmailStatus } from '@/lib/leads/store';
import type { Actor } from '@/lib/audit';
import type { User } from '@/lib/users/types';
import { providerEventId, withinEventWindow, type LemonSqueezyAdapter, type ParsedWebhook, type ProductOrder } from './adapters/lemonsqueezy';
import type { BillingStore } from './store';
import { BILLING_PROVIDER, PRODUCT_KEY, type GrantEffect, type MirrorInput } from './types';

/**
 * A Lemon Squeezy delivery is a signal. The signature and the five-minute window are decided before any store
 * call. The fetched order is what gets mirrored. The ready email sits outside that write: the flag is set only
 * after the send returns `sent`.
 *
 * A metadata user id that matches nobody is stored with a null user and no grant, and the event is `processed`,
 * so the purchase can be linked later. `unmatched` stays for a subscription, the wrong variant, or a failed
 * order. `billing_events` has no `ignored` status.
 */

export type WebhookInput = {
  raw: string;
  signature: string | null;
  eventName: string | null;
  /** Origin of the webhook request URL. The ready link is built from this, never from a client Origin header. */
  origin: string;
};

export type ProcessResult =
  | { status: 400; error: 'bad_signature' | 'bad_payload' | 'stale_timestamp' }
  | { status: 200; duplicate: true }
  | { status: 200; outcome: 'processed' | 'ignored_stale' | 'unmatched' }
  | { status: 500; error: string };

export type ReadySender = (cfg: MailConfig, to: string, link: string, fetchImpl?: typeof fetch) => Promise<EmailStatus>;

export type ProcessDeps = {
  store: BillingStore;
  adapter: LemonSqueezyAdapter;
  now: () => Date;
  mail: MailConfig;
  fetchImpl?: typeof fetch;
  /** Puts a one-time sign-in token on file and returns the raw token for the link. */
  issueSignIn: (email: string, at: Date) => Promise<string>;
  sendReady: ReadySender;
};

const ACTOR = { kind: 'webhook' as const, userId: null };
/** Longer than the webhook route's 60s limit, so a live attempt is not stolen. A retry after that reclaims a dead one. */
const ABANDON_RECEIVED_MS = 2 * 60 * 1000;

export async function processBillingWebhook(input: WebhookInput, deps: ProcessDeps): Promise<ProcessResult> {
  const { store, adapter } = deps;
  if (!adapter.verify(input.raw, input.signature)) return { status: 400, error: 'bad_signature' };
  const parsed = adapter.parse(input.raw, input.eventName);
  if (!parsed) return { status: 400, error: 'bad_payload' };
  const at = deps.now();
  if (!withinEventWindow(parsed.eventTime, at)) return { status: 400, error: 'stale_timestamp' };

  const event = {
    provider: BILLING_PROVIDER,
    providerEventId: providerEventId(parsed.eventName, parsed.objectId, parsed.eventTime),
    eventType: parsed.eventName,
    objectId: parsed.objectId,
    eventCreatedAt: parsed.eventTime,
    payload: { event: parsed.eventName, objectId: parsed.objectId },
  };
  let claim = await store.claimEvent(event, at);
  // A killed attempt leaves `received`. Saying 200 would stop the provider, and the order would never be fetched.
  if (!claim.claimed && claim.status === 'received' && claim.receivedAt && at.getTime() - claim.receivedAt.getTime() >= ABANDON_RECEIVED_MS) {
    await store.requeueStuckReceived(new Date(at.getTime() - ABANDON_RECEIVED_MS));
    claim = await store.claimEvent(event, at);
  }
  if (!claim.claimed) {
    // Only a finished row is a duplicate. An unknown status must not answer 200, or the provider stops retrying.
    if (claim.status === 'processed' || claim.status === 'ignored_stale' || claim.status === 'unmatched') return { status: 200, duplicate: true };
    return { status: 500, error: 'in_progress' };
  }

  try {
    return await finishClaimed(parsed, claim.id, at, input.origin, deps);
  } catch (err) {
    const name = err instanceof Error && err.name ? err.name : 'Error';
    try {
      await store.setEventStatus(claim.id, 'failed', name, deps.now());
    } catch (statusErr) {
      console.error('billing: event status failed', statusErr instanceof Error ? statusErr.name : 'error');
    }
    console.error('billing: webhook failed', name);
    return { status: 500, error: name };
  }
}

async function finishClaimed(parsed: ParsedWebhook, eventId: string, at: Date, origin: string, deps: ProcessDeps): Promise<ProcessResult> {
  const { store, adapter } = deps;
  if (parsed.objectType !== 'orders' && parsed.objectType !== 'subscriptions') {
    await store.setEventStatus(eventId, 'unmatched', null, at);
    return { status: 200, outcome: 'unmatched' };
  }

  const mapped = await adapter.fetch({ type: parsed.objectType, id: parsed.objectId }, deps.fetchImpl);
  if (mapped.outcome === 'unmatched') {
    await store.setEventStatus(eventId, 'unmatched', null, at);
    return { status: 200, outcome: 'unmatched' };
  }

  const order = mapped.order;
  const existing = await store.findRecord(BILLING_PROVIDER, order.providerObjectId);
  if (existing?.lastEventAt && existing.lastEventAt > parsed.eventTime) {
    await store.setEventStatus(eventId, 'ignored_stale', null, at);
    return { status: 200, outcome: 'ignored_stale' };
  }

  const metadataUserId = parsed.metadataUserId ?? order.metadataUserId;
  const metaUser = metadataUserId ? await store.findUserById(metadataUserId) : null;
  // A named user who is not on file must not fall through to the checkout address.
  const metadataMiss = Boolean(metadataUserId) && !metaUser && !existing?.userId;
  const user = metadataMiss ? null : await resolveUser(store, metaUser, order.email, existing?.userId ?? null, at);
  const revoking = order.grant === 'revoke';
  // Only a refund has a refund date. An order the provider flagged gets a dispute date instead.
  const refunding = revoking && order.revokeReason === 'refund';
  const mirrored = await store.commitMirror(mirrorFromOrder(order, {
    at,
    lastEventAt: parsed.eventTime,
    userId: user?.id ?? null,
    grant: metadataMiss ? 'none' : order.grant,
    revokeReason: metadataMiss ? null : order.revokeReason,
    accessEndsAt: revoking ? at : order.accessEndsAt,
    refundedAt: refunding ? at : order.refundedAt,
    disputedAt: revoking && !refunding ? at : null,
    actor: ACTOR,
  }));

  if (!mirrored.applied) {
    await store.setEventStatus(eventId, 'ignored_stale', null, at);
    return { status: 200, outcome: 'ignored_stale' };
  }

  const record = mirrored.record;
  if (record.status === 'paid' && record.readyEmailSentAt === null && record.userId) {
    const recipient = await store.findUserById(record.userId);
    if (recipient) await sendReadyEmail(recipient.email, at, origin, record.id, deps);
  }
  await store.setEventStatus(eventId, 'processed', null, at);
  return { status: 200, outcome: 'processed' };
}

async function resolveUser(store: BillingStore, metaUser: User | null, email: string | null, existingUserId: string | null, at: Date): Promise<User | null> {
  if (metaUser) return metaUser;
  if (existingUserId) return store.findUserById(existingUserId);
  if (!email) return null;
  return (await store.findUserByEmail(email)) ?? store.createReader(email, at);
}

/** The fetched order, translated into the one mirror the stores know. The caller chooses the actor and the event time. */
export function mirrorFromOrder(order: ProductOrder, over: {
  at: Date;
  lastEventAt: Date;
  userId: string | null;
  grant: GrantEffect;
  revokeReason: 'refund' | 'chargeback' | null;
  accessEndsAt: Date | null;
  refundedAt: Date | null;
  disputedAt: Date | null;
  actor: Actor;
}): MirrorInput {
  return {
    provider: BILLING_PROVIDER,
    providerObjectId: order.providerObjectId,
    kind: 'purchase',
    tier: order.tier,
    productKey: PRODUCT_KEY,
    status: order.status,
    providerStatus: order.providerStatus,
    userId: over.userId,
    customerId: order.customerId,
    customerEmail: order.email,
    providerPaymentId: order.providerPaymentId,
    providerPriceId: order.providerPriceId,
    amountCents: order.amountCents,
    currency: order.currency,
    paidAt: order.paidAt,
    refundedAt: over.refundedAt,
    disputedAt: over.disputedAt,
    trialEndsAt: null,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelRequestedAt: null,
    cancelEffectiveAt: null,
    accessEndsAt: over.accessEndsAt,
    lastEventAt: over.lastEventAt,
    notes: null,
    manageUrl: order.manageUrl,
    grant: over.grant,
    revokeReason: over.revokeReason,
    actor: over.actor,
    at: over.at,
  };
}

/** Sends the ready link and does not touch the flag. Callers write the flag only after this returns `sent`. */
export async function sendReadyLinkTo(email: string, at: Date, origin: string, deps: Pick<ProcessDeps, 'issueSignIn' | 'sendReady' | 'mail' | 'fetchImpl'>): Promise<EmailStatus> {
  // No mailer means the link cannot be delivered. Minting a token would only leave a live secret nobody receives.
  if (deps.mail.provider === 'none') return 'skipped';
  const raw = await deps.issueSignIn(email, at);
  return deps.sendReady(deps.mail, email, `${origin}${VERIFY_PATH}?token=${raw}`, deps.fetchImpl);
}

async function sendReadyEmail(email: string, at: Date, origin: string, recordId: string, deps: ProcessDeps): Promise<void> {
  const status = await sendReadyLinkTo(email, at, origin, deps);
  if (status !== 'sent') {
    const error = new Error('ready email');
    error.name = 'ReadyEmailNotSent';
    throw error;
  }
  await deps.store.markReadyEmailSent(recordId, at);
}

export function billingWebhookResponse(result: ProcessResult): Response {
  const headers = { 'Cache-Control': 'no-store' };
  if (result.status === 200 && 'duplicate' in result) return Response.json({ ok: true, duplicate: true }, { status: 200, headers });
  if (result.status === 200) return Response.json({ ok: true, outcome: result.outcome }, { status: 200, headers });
  return Response.json({ ok: false, error: result.error }, { status: result.status, headers });
}
