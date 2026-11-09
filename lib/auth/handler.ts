import type { MailConfig } from '@/lib/leads/mail';
import { DEFAULT_NEXT_PATH, MAX_BODY_BYTES, REQUEST_LINK_LIMITS, VERIFY_PATH, VERIFY_LIMIT } from './config';
import { clearedCookieHeader, isSecureRequest, sessionCookieHeader } from './cookie';
import { sendSignInLink } from './mail';
import { sessionExpiry, tokenExpiry } from './session';
import type { AuthStores } from './store';
import { hashKey, hashSecret, isSecretShape, newSecret } from './token';
import { requestLinkSchema, safeNextPath } from './validate';

export type AuthRequest = {
  /** The request URL: decides the cookie's Secure attribute and the origin of the emailed link. */
  url: string;
  origin: string | null;
  ip: string;
  body: string;
  /** The raw session id from the cookie, if any (sign-out only). */
  sessionId?: string;
};
export type AuthReply = { status: number; body?: Record<string, unknown>; headers?: Record<string, string> };
export type AuthDeps = {
  stores: AuthStores | null;
  mail: MailConfig;
  allowedOrigins: readonly string[];
  ipSalt: string;
  /** Addresses that become the first administrator on sign-in, only while no administrator exists. */
  bootstrapEmails: readonly string[];
  now: () => Date;
  fetchImpl?: typeof fetch;
};

const reply = (status: number, error: string, extra: Record<string, unknown> = {}, headers?: Record<string, string>): AuthReply => ({ status, body: { ok: false, error, ...extra }, headers });
const OK: AuthReply = { status: 200, body: { ok: true } };
const limited = (windowSeconds: number): AuthReply => reply(429, 'rate_limited', { retryAfterSeconds: windowSeconds }, { 'Retry-After': String(windowSeconds) });
const redirect = (location: string, headers: Record<string, string> = {}): AuthReply => ({ status: 303, headers: { Location: location, ...headers } });
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
  if (originRefused(req, deps)) return reply(403, 'forbidden');
  if (!deps.stores) return reply(503, 'unavailable');
  if (Buffer.byteLength(req.body) > MAX_BODY_BYTES) return reply(413, 'too_large');
  const { auth } = deps.stores;
  const now = deps.now();
  const ipHash = hashKey(req.ip, deps.ipSalt);
  try {
    const ipWindow = REQUEST_LINK_LIMITS.ip;
    if ((await auth.recordAndCount('ip', ipHash, now, new Date(now.getTime() - ipWindow.windowSeconds * 1000))) > ipWindow.attempts) return limited(ipWindow.windowSeconds);

    let json: unknown;
    try { json = JSON.parse(req.body); } catch { return reply(400, 'invalid_request'); }
    const parsed = requestLinkSchema.safeParse(json);
    if (!parsed.success) return reply(400, parsed.error.issues.some(i => i.path[0] === 'email') ? 'invalid_email' : 'invalid_request');
    const { email, termsVersion, source, next, _gotcha } = parsed.data;
    if (_gotcha) return OK; // a bot filled the hidden field: look successful, store nothing

    const emailWindow = REQUEST_LINK_LIMITS.email;
    const emailHash = hashKey(email, deps.ipSalt);
    if ((await auth.recordAndCount('email', emailHash, now, new Date(now.getTime() - emailWindow.windowSeconds * 1000))) > emailWindow.attempts) return limited(emailWindow.windowSeconds);

    const raw = newSecret();
    await auth.createToken({ tokenHash: hashSecret(raw), email, nextPath: safeNextPath(next), termsVersion, source, expiresAt: tokenExpiry(now), createdIpHash: ipHash, createdAt: now });
    const link = `${new URL(req.url).origin}${VERIFY_PATH}?token=${raw}`;
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
  if (originRefused(req, deps)) return reply(403, 'forbidden');
  if (!deps.stores) return reply(503, 'unavailable');
  if (Buffer.byteLength(req.body) > MAX_BODY_BYTES) return reply(413, 'too_large');
  const { auth, users } = deps.stores;
  const now = deps.now();
  try {
    if ((await auth.recordAndCount('ip', hashKey(req.ip, deps.ipSalt), now, new Date(now.getTime() - VERIFY_LIMIT.windowSeconds * 1000))) > VERIFY_LIMIT.attempts) return limited(VERIFY_LIMIT.windowSeconds);

    const raw = new URLSearchParams(req.body).get('token');
    if (!isSecretShape(raw)) return redirect(FAILED);
    const consumed = await auth.consumeToken(hashSecret(raw), now);
    if (!consumed) return redirect(FAILED);

    const existing = await users.findByEmail(consumed.email);
    if (existing && existing.status !== 'active') return redirect(FAILED);
    const { user } = await users.upsertVerified({ email: consumed.email, termsVersion: consumed.termsVersion, at: now });

    // The first administrator: only while none exists, so the list is inert once an admin is in place. The owner's
    // content grant and the audit row arrive with the access tables (Phase 2).
    if (user.role !== 'admin' && deps.bootstrapEmails.includes(user.email) && (await users.countAdmins()) === 0) await users.setRole(user.id, 'admin', now);

    const sessionId = newSecret();
    await auth.createSession({ idHash: hashSecret(sessionId), userId: user.id, createdAt: now, expiresAt: sessionExpiry(now) });
    await users.touchSignIn(user.id, now);
    return redirect(consumed.nextPath ?? DEFAULT_NEXT_PATH, { 'Set-Cookie': sessionCookieHeader(isSecureRequest(req.url), sessionId) });
  } catch (err) {
    console.error('auth: verify failed', err instanceof Error ? err.name : 'error');
    return reply(503, 'unavailable');
  }
}

/** Revokes this session and clears the cookie. A missing or malformed cookie still clears and redirects. */
export async function handleSignOut(req: AuthRequest, deps: AuthDeps): Promise<AuthReply> {
  if (originRefused(req, deps)) return reply(403, 'forbidden');
  const cleared = { 'Set-Cookie': clearedCookieHeader(isSecureRequest(req.url)) };
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
