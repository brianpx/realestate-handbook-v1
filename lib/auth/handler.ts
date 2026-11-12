import { bootstrapOwnerGrant } from '@/lib/access/grants';
import { audit } from '@/lib/audit';
import type { MailConfig } from '@/lib/leads/mail';
import { SEND_CEILING_WINDOW_SECONDS, sendWindowStart } from '@/lib/send-ceiling';
import { DEFAULT_NEXT_PATH, MAX_BODY_BYTES, VERIFY_PATH, type AuthRateLimits } from './config';
import { clearedCookieHeaders, isSecureRequest, sessionCookieHeaders } from './cookie';
import { sendSignInLink, sendWelcome } from './mail';
import { sessionExpiry, tokenExpiry } from './session';
import type { AuthStores } from './store';
import { hashKey, hashSecret, isSecretShape, newSecret } from './token';
import { requestLinkSchema, safeNextPath } from './validate';

export type AuthRequest = {
  /** The request URL: decides the cookie's Secure attribute. */
  url: string;
  origin: string | null;
  ip: string;
  body: string;
  /** The raw session id from the cookie, if any (sign-out only). */
  sessionId?: string;
};
/** `headers` may carry several Set-Cookie values; toResponse (env.ts) appends each one. */
export type AuthReply = { status: number; body?: Record<string, unknown>; headers?: Record<string, string | string[]> };
export type AuthDeps = {
  stores: AuthStores | null;
  mail: MailConfig;
  allowedOrigins: readonly string[];
  ipSalt: string;
  /** Sign-in emails allowed per window over all callers (lib/send-ceiling.ts). */
  sendCeiling: number;
  /** Per-connection and per-address attempt windows (tight in production, high in development). */
  limits: AuthRateLimits;
  /** Addresses that become the first administrator on sign-in, only while no administrator exists. */
  bootstrapEmails: readonly string[];
  now: () => Date;
  fetchImpl?: typeof fetch;
};

const reply = (status: number, error: string, extra: Record<string, unknown> = {}, headers?: Record<string, string | string[]>): AuthReply => ({ status, body: { ok: false, error, ...extra }, headers });
const OK: AuthReply = { status: 200, body: { ok: true } };
const limited = (windowSeconds: number): AuthReply => reply(429, 'rate_limited', { retryAfterSeconds: windowSeconds }, { 'Retry-After': String(windowSeconds) });
const redirect = (location: string, headers: Record<string, string | string[]> = {}): AuthReply => ({ status: 303, headers: { Location: location, ...headers } });
const FAILED = `${VERIFY_PATH}?error=1`;

// Every state-changing POST needs an allow-listed Origin; a missing one is a 403 (stricter than the lead form).
const originRefused = (req: AuthRequest, deps: AuthDeps) => !req.origin || !deps.allowedOrigins.includes(req.origin);

/**
 * Sends a sign-in link. Known and unknown addresses get the same reply and the same email, and no user row is
 * created here, so typos and bots never become users and the form cannot be used to find out who has an account.
 * A failed send is a 503 for everyone alike: a reader waiting for a link that will never come is worse than an
 * honest error, and the error says nothing about the address.
 */
export async function handleRequestLink(req: AuthRequest, deps: AuthDeps): Promise<AuthReply> {
  const origin = req.origin;
  if (!origin || !deps.allowedOrigins.includes(origin)) return reply(403, 'forbidden');
  if (!deps.stores) return reply(503, 'unavailable');
  if (Buffer.byteLength(req.body) > MAX_BODY_BYTES) return reply(413, 'too_large');
  const { auth } = deps.stores;
  const now = deps.now();
  const ipHash = hashKey(req.ip, deps.ipSalt);
  try {
    const ipWindow = deps.limits.requestLink.ip;
    if ((await auth.recordAndCount('ip', ipHash, now, new Date(now.getTime() - ipWindow.windowSeconds * 1000))) > ipWindow.attempts) return limited(ipWindow.windowSeconds);

    let json: unknown;
    try { json = JSON.parse(req.body); } catch { return reply(400, 'invalid_request'); }
    const parsed = requestLinkSchema.safeParse(json);
    if (!parsed.success) return reply(400, parsed.error.issues.some(i => i.path[0] === 'email') ? 'invalid_email' : 'invalid_request');
    const { email, termsVersion, source, next, _gotcha } = parsed.data;
    if (_gotcha) return OK; // a bot filled the hidden field: look successful, store nothing

    const emailWindow = deps.limits.requestLink.email;
    const emailHash = hashKey(email, deps.ipSalt);
    if ((await auth.recordAndCount('email', emailHash, now, new Date(now.getTime() - emailWindow.windowSeconds * 1000))) > emailWindow.attempts) return limited(emailWindow.windowSeconds);
    // the ceiling over all callers: every request past this point sends one email
    if ((await auth.countSend(sendWindowStart(now))) > deps.sendCeiling) return limited(SEND_CEILING_WINDOW_SECONDS);

    const raw = newSecret();
    await auth.createToken({ tokenHash: hashSecret(raw), email, nextPath: safeNextPath(next), termsVersion, source, expiresAt: tokenExpiry(now), createdIpHash: ipHash, createdAt: now });
    // the link is built on the allow-listed Origin, never on the Host header, which a proxy may let a sender choose
    const link = `${origin}${VERIFY_PATH}?token=${raw}`;
    if ((await sendSignInLink(deps.mail, email, link, deps.fetchImpl)) !== 'sent') return reply(503, 'unavailable');
    return OK;
  } catch (err) {
    console.error('auth: request-link failed', err instanceof Error ? err.name : 'error');
    return reply(503, 'unavailable');
  }
}

/**
 * Consumes a link (a form POST from the verify page; `token` in the body). One atomic statement marks the token
 * used, so a second click, an expired link and an unknown token all end on the same failure card. A disabled or
 * deleted account fails the same way. Success writes the user, a session and the cookie, then redirects to the
 * path stored with the token.
 */
export async function handleVerify(req: AuthRequest, deps: AuthDeps): Promise<AuthReply> {
  const origin = req.origin;
  if (originRefused(req, deps) || origin === null) return reply(403, 'forbidden');
  if (!deps.stores) return reply(503, 'unavailable');
  if (Buffer.byteLength(req.body) > MAX_BODY_BYTES) return reply(413, 'too_large');
  const { auth, users, access } = deps.stores;
  const now = deps.now();
  try {
    const verifyWindow = deps.limits.verify;
    if ((await auth.recordAndCount('ip', hashKey(req.ip, deps.ipSalt), now, new Date(now.getTime() - verifyWindow.windowSeconds * 1000))) > verifyWindow.attempts) return limited(verifyWindow.windowSeconds);

    const raw = new URLSearchParams(req.body).get('token');
    if (!isSecretShape(raw)) return redirect(FAILED);
    const consumed = await auth.consumeToken(hashSecret(raw), now);
    if (!consumed) return redirect(FAILED);

    const existing = await users.findByEmail(consumed.email);
    if (existing && existing.status !== 'active') return redirect(FAILED);
    const { user, created } = await users.upsertVerified({ email: consumed.email, termsVersion: consumed.termsVersion, at: now });

    // The first administrator: only while none exists, so the list is inert once an admin is in place. The role
    // change is audited and the owner gets a content grant, because the admin role opens nothing by itself (OD-13).
    if (user.role !== 'admin' && deps.bootstrapEmails.includes(user.email) && (await users.countAdmins()) === 0) {
      const before = { role: user.role };
      await users.setRole(user.id, 'admin', now);
      await access.appendAudit(audit({ kind: 'system', userId: null }, 'bootstrap_admin', { table: 'users', id: user.id }, { before, after: { role: 'admin' } }, now));
      await bootstrapOwnerGrant(access, user.id, now);
    }

    const sessionId = newSecret();
    await auth.createSession({ idHash: hashSecret(sessionId), userId: user.id, createdAt: now, expiresAt: sessionExpiry(now) });
    await users.touchSignIn(user.id, now);
    // The welcome is the one extra account email, and only for a brand-new row. A failed send must not
    // turn a finished sign-in into an error: the session is already stored, and the reader is waiting to land.
    if (created) {
      try {
        if ((await sendWelcome(deps.mail, user.email, origin, deps.fetchImpl)) === 'failed') console.error('auth: welcome email failed');
      } catch (err) {
        console.error('auth: welcome email failed', err instanceof Error ? err.name : 'error');
      }
    }
    return redirect(consumed.nextPath ?? DEFAULT_NEXT_PATH, { 'Set-Cookie': sessionCookieHeaders(isSecureRequest(req.url), sessionId) });
  } catch (err) {
    console.error('auth: verify failed', err instanceof Error ? err.name : 'error');
    return reply(503, 'unavailable');
  }
}

/** Revokes this session and clears the cookie. A missing or malformed cookie still clears and redirects. */
export async function handleSignOut(req: AuthRequest, deps: AuthDeps): Promise<AuthReply> {
  if (originRefused(req, deps)) return reply(403, 'forbidden');
  const cleared = { 'Set-Cookie': clearedCookieHeaders(isSecureRequest(req.url)) };
  if (deps.stores && isSecretShape(req.sessionId)) {
    try {
      await deps.stores.auth.revokeSession(hashSecret(req.sessionId), deps.now());
    } catch (err) {
      console.error('auth: sign-out failed', err instanceof Error ? err.name : 'error');
      return reply(503, 'unavailable', {}, cleared);
    }
  }
  return redirect('/', cleared);
}
