import { createHash } from 'node:crypto';
import { hashSecret, isSecretShape, newSecret } from '@/lib/auth/token';
import { CONFIRM_PATH, CONSENT_TEXTS, MAX_BODY_BYTES, RATE_LIMIT } from './config';
import { sendConfirmation, type MailConfig } from './mail';
import type { LeadStore } from './store';
import { leadSchema } from './validate';

export type LeadRequest = { origin: string | null; ip: string; body: string };
export type LeadReply = { status: number; body?: Record<string, unknown>; headers?: Record<string, string> };
export type LeadDeps = {
  store: LeadStore | null;
  mail: MailConfig;
  allowedOrigins: readonly string[];
  /** The public origin the confirmation link is built on; the form may post without an Origin header. */
  siteUrl: string;
  ipSalt: string;
  now: () => Date;
  fetchImpl?: typeof fetch;
};

const reply = (status: number, error: string, extra: Record<string, unknown> = {}, headers?: Record<string, string>): LeadReply => ({ status, body: { ok: false, error, ...extra }, headers });
const OK: LeadReply = { status: 200, body: { ok: true } };
const redirect = (location: string): LeadReply => ({ status: 303, headers: { Location: location } });
export const CONFIRMED = `${CONFIRM_PATH}?done=1`;
export const CONFIRM_FAILED = `${CONFIRM_PATH}?error=1`;

export const hashIp = (ip: string, salt: string): string => createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);

// Both routes count attempts per connection, successes and failures alike; over the limit is a 429 with Retry-After.
async function overLimit(store: LeadStore, req: LeadRequest, deps: LeadDeps, now: Date): Promise<LeadReply | null> {
  const since = new Date(now.getTime() - RATE_LIMIT.windowSeconds * 1000);
  if ((await store.recordAndCount(hashIp(req.ip, deps.ipSalt), now, since)) <= RATE_LIMIT.attempts) return null;
  return reply(429, 'rate_limited', { retryAfterSeconds: RATE_LIMIT.windowSeconds }, { 'Retry-After': String(RATE_LIMIT.windowSeconds) });
}

/**
 * The whole lead flow, with its parts passed in so it can be tested without a server.
 *
 * Duplicates and bots get the same answer as a new sign-up, so the form cannot be used to find out who is on the
 * list. The address is stored at once but is not subscribed: the email sent for a new address carries the link
 * that confirms it (handleConfirm). A failed send never loses the lead; a repeat address gets no second email.
 */
export async function handleLead(req: LeadRequest, deps: LeadDeps): Promise<LeadReply> {
  if (req.origin && !deps.allowedOrigins.includes(req.origin)) return reply(403, 'forbidden');
  if (!deps.store) return reply(503, 'unavailable');
  if (Buffer.byteLength(req.body) > MAX_BODY_BYTES) return reply(413, 'too_large');

  const now = deps.now();
  try {
    const limited = await overLimit(deps.store, req, deps, now);
    if (limited) return limited;

    let json: unknown;
    try { json = JSON.parse(req.body); } catch { return reply(400, 'invalid_request'); }
    const parsed = leadSchema.safeParse(json);
    if (!parsed.success) {
      const emailProblem = parsed.error.issues.some(i => i.path[0] === 'email');
      return reply(400, emailProblem ? 'invalid_email' : 'invalid_request');
    }
    const { email, consentVersion, source, _gotcha } = parsed.data;
    if (_gotcha) return OK; // a bot filled the hidden field: look successful, store nothing

    const raw = newSecret();
    const { created, id } = await deps.store.insert({ email, source, consentVersion, consentText: CONSENT_TEXTS[consentVersion], confirmTokenHash: hashSecret(raw), at: now });
    if (created) await deps.store.setEmailStatus(id, await sendConfirmation(deps.mail, email, `${deps.siteUrl}${CONFIRM_PATH}?token=${raw}`, deps.fetchImpl));
    return OK;
  } catch (err) {
    console.error('lead: storage failed', err instanceof Error ? err.name : 'error');
    return reply(503, 'unavailable');
  }
}

/**
 * Consumes a confirmation link (a form POST from the confirm page; `token` in the body), so a mail scanner that
 * fetches the link subscribes nobody. An unknown token and a malformed one end on the same failure state; a second
 * click on a good link lands on the same success state as the first.
 */
export async function handleConfirm(req: LeadRequest, deps: LeadDeps): Promise<LeadReply> {
  if (!req.origin || !deps.allowedOrigins.includes(req.origin)) return reply(403, 'forbidden');
  if (!deps.store) return reply(503, 'unavailable');
  if (Buffer.byteLength(req.body) > MAX_BODY_BYTES) return reply(413, 'too_large');

  const now = deps.now();
  try {
    const limited = await overLimit(deps.store, req, deps, now);
    if (limited) return limited;
    const raw = new URLSearchParams(req.body).get('token');
    if (!isSecretShape(raw)) return redirect(CONFIRM_FAILED);
    return redirect((await deps.store.confirm(hashSecret(raw), now)) ? CONFIRMED : CONFIRM_FAILED);
  } catch (err) {
    console.error('lead: confirmation failed', err instanceof Error ? err.name : 'error');
    return reply(503, 'unavailable');
  }
}
