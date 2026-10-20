import { createHash } from 'node:crypto';
import { CONSENT_TEXTS, MAX_BODY_BYTES, RATE_LIMIT } from './config';
import { sendWelcome, type MailConfig } from './mail';
import type { LeadStore } from './store';
import { leadSchema } from './validate';

export type LeadRequest = { origin: string | null; ip: string; body: string };
export type LeadReply = { status: number; body: Record<string, unknown>; headers?: Record<string, string> };
export type LeadDeps = { store: LeadStore | null; mail: MailConfig; allowedOrigins: readonly string[]; ipSalt: string; now: () => Date; fetchImpl?: typeof fetch };

const reply = (status: number, error: string, extra: Record<string, unknown> = {}, headers?: Record<string, string>): LeadReply => ({ status, body: { ok: false, error, ...extra }, headers });
const OK: LeadReply = { status: 200, body: { ok: true } };

export const hashIp = (ip: string, salt: string): string => createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);

/**
 * The whole lead flow, with its parts passed in so it can be tested without a server.
 *
 * Duplicates and bots get the same answer as a new sign-up, so the form cannot be used to find out who is on the
 * list. The email is sent only for a new address, and a failed send never loses the lead.
 */
export async function handleLead(req: LeadRequest, deps: LeadDeps): Promise<LeadReply> {
  if (req.origin && !deps.allowedOrigins.includes(req.origin)) return reply(403, 'forbidden');
  if (!deps.store) return reply(503, 'unavailable');
  if (Buffer.byteLength(req.body) > MAX_BODY_BYTES) return reply(413, 'too_large');

  const now = deps.now();
  const ipHash = hashIp(req.ip, deps.ipSalt);
  try {
    await deps.store.recordAttempt(ipHash, now);
    const since = new Date(now.getTime() - RATE_LIMIT.windowSeconds * 1000);
    if ((await deps.store.countAttempts(ipHash, since)) > RATE_LIMIT.attempts) {
      return reply(429, 'rate_limited', { retryAfterSeconds: RATE_LIMIT.windowSeconds }, { 'Retry-After': String(RATE_LIMIT.windowSeconds) });
    }

    let json: unknown;
    try { json = JSON.parse(req.body); } catch { return reply(400, 'invalid_request'); }
    const parsed = leadSchema.safeParse(json);
    if (!parsed.success) {
      const emailProblem = parsed.error.issues.some(i => i.path[0] === 'email');
      return reply(400, emailProblem ? 'invalid_email' : 'invalid_request');
    }
    const { email, consentVersion, _gotcha } = parsed.data;
    if (_gotcha) return OK; // a bot filled the hidden field: look successful, store nothing

    const { created, id } = await deps.store.insert({ email, source: 'gate', consentVersion, consentText: CONSENT_TEXTS[consentVersion]!, at: now });
    if (created) await deps.store.setEmailStatus(id, await sendWelcome(deps.mail, email, deps.fetchImpl));
    return OK;
  } catch (err) {
    console.error('lead: storage failed', err instanceof Error ? err.name : 'error');
    return reply(503, 'unavailable');
  }
}
