import { MAX_BODY_BYTES } from '@/lib/auth/config';
import type { AuthDeps, AuthReply, AuthRequest } from '@/lib/auth/handler';
import { EMPTY_PROFILE, profileFields, profileInputSchema, type Profile } from '@/lib/users/profile';
import type { ProfileStore } from '@/lib/users/profile-store';
import { signedInUser } from './handler';

export type ProfileDeps = Pick<AuthDeps, 'stores' | 'allowedOrigins' | 'now'> & { profiles: ProfileStore | null };

const reply = (status: number, error: string, extra: Record<string, unknown> = {}): AuthReply => ({ status, body: { ok: false, error, ...extra } });
const originRefused = (req: AuthRequest, deps: ProfileDeps) => !req.origin || !deps.allowedOrigins.includes(req.origin);

/** What both routes answer: the editable fields (empty for a user with no row) and when they were last saved. */
const shown = (profile: Profile | null): AuthReply => ({ status: 200, body: { ok: true, profile: profile ? profileFields(profile) : EMPTY_PROFILE, updatedAt: profile?.updatedAt.toISOString() ?? null } });

// The profile routes answer JSON to the account page's form. The reader is the session cookie's user, read here
// like the other account routes do (signedInUser); a route handler never trusts an id from the request body.

/** GET: the signed-in reader's own profile; a reader with no row gets empty fields, which is the normal case. */
export async function handleReadProfile(req: AuthRequest, deps: ProfileDeps): Promise<AuthReply> {
  if (!deps.stores || !deps.profiles) return reply(503, 'unavailable');
  try {
    const user = await signedInUser(req, deps, deps.now());
    if (!user) return reply(401, 'unauthorized');
    return shown(await deps.profiles.find(user.id));
  } catch (err) {
    console.error('account: profile read failed', err instanceof Error ? err.name : 'error');
    return reply(503, 'unavailable');
  }
}

/**
 * PUT: saves the whole form as the reader's profile with `profile_source = 'user'`. The Origin check comes first,
 * as on every state-changing account route; then every field is checked at the boundary, and a bad one names
 * itself in `fields` so the form can point at it. Nothing is written on a 400.
 */
export async function handleSaveProfile(req: AuthRequest, deps: ProfileDeps): Promise<AuthReply> {
  if (originRefused(req, deps)) return reply(403, 'forbidden');
  if (!deps.stores || !deps.profiles) return reply(503, 'unavailable');
  if (Buffer.byteLength(req.body) > MAX_BODY_BYTES) return reply(413, 'too_large');
  try {
    const now = deps.now();
    const user = await signedInUser(req, deps, now);
    if (!user) return reply(401, 'unauthorized');
    let json: unknown;
    try { json = JSON.parse(req.body); } catch { return reply(400, 'invalid_request'); }
    const parsed = profileInputSchema(now).safeParse(json);
    if (!parsed.success) return reply(400, 'invalid_profile', { fields: [...new Set(parsed.error.issues.map(i => String(i.path[0] ?? '')))].filter(Boolean) });
    return shown(await deps.profiles.save(user.id, parsed.data, 'user', now));
  } catch (err) {
    console.error('account: profile save failed', err instanceof Error ? err.name : 'error');
    return reply(503, 'unavailable');
  }
}
