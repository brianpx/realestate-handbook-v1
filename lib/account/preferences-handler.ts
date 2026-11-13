import { MAX_BODY_BYTES } from '@/lib/auth/config';
import type { AuthDeps, AuthReply, AuthRequest } from '@/lib/auth/handler';
import { signedInUser } from '@/lib/auth/request-user';
import { displayNameInputSchema } from '@/lib/users/display-name';

export type PreferencesDeps = Pick<AuthDeps, 'stores' | 'allowedOrigins' | 'now'>;

const reply = (status: number, error: string): AuthReply => ({ status, body: { ok: false, error } });
const originRefused = (req: AuthRequest, deps: PreferencesDeps) => !req.origin || !deps.allowedOrigins.includes(req.origin);

/**
 * PUT: saves the display name the reader chose. Same order as the profile save: Origin first, then the body size,
 * the session, and only then the body. The reader is the session cookie's user; the body names no account.
 * Nothing is written on a 400.
 */
export async function handleSavePreferences(req: AuthRequest, deps: PreferencesDeps): Promise<AuthReply> {
  if (originRefused(req, deps)) return reply(403, 'forbidden');
  if (!deps.stores) return reply(503, 'unavailable');
  if (Buffer.byteLength(req.body) > MAX_BODY_BYTES) return reply(413, 'too_large');
  try {
    const now = deps.now();
    const user = await signedInUser(req.sessionId, deps.stores, now);
    if (!user) return reply(401, 'unauthorized');
    let json: unknown;
    try { json = JSON.parse(req.body); } catch { return reply(400, 'invalid_request'); }
    const parsed = displayNameInputSchema.safeParse(json);
    if (!parsed.success) return reply(400, 'invalid_display_name');
    if (!(await deps.stores.users.setDisplayName(user.id, parsed.data.displayName, now))) return reply(401, 'unauthorized');
    return { status: 200, body: { ok: true, displayName: parsed.data.displayName } };
  } catch (err) {
    console.error('account: preferences save failed', err instanceof Error ? err.name : 'error');
    return reply(503, 'unavailable');
  }
}
