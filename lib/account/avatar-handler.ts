import type { AuthDeps, AuthReply } from '@/lib/auth/handler';
import { signedInUser } from '@/lib/auth/request-user';
import { AVATAR_TYPE, avatarUrlFor, MAX_AVATAR_BYTES, newAvatarKey } from '@/lib/users/avatar';
import { processAvatar } from '@/lib/users/avatar-image';
import type { AvatarStorage } from '@/lib/users/avatar-storage';

export type AvatarDeps = Pick<AuthDeps, 'stores' | 'allowedOrigins' | 'now'> & { avatars: AvatarStorage | null };

/** The request as these handlers see it; the body is read only when a handler asks, and never beyond the cap. */
export type AvatarRequest = {
  origin: string | null;
  sessionId: string | undefined;
  /** The declared body length, or null when the client did not send one. */
  contentLength: number | null;
  form: () => Promise<FormData>;
};

// Room for the multipart boundary and the part headers around a file at the size cap.
const OVERHEAD_BYTES = 16 * 1024;
export const MAX_REQUEST_BYTES = MAX_AVATAR_BYTES + OVERHEAD_BYTES;

/** What a request's `form` throws when the body runs past the cap; the handler answers it 413. */
export class BodyTooLarge extends Error {}

const reply = (status: number, error: string): AuthReply => ({ status, body: { ok: false, error } });
const originRefused = (req: AvatarRequest, deps: AvatarDeps) => !req.origin || !deps.allowedOrigins.includes(req.origin);
const nothing = (status: number, extra: Record<string, string> = {}) => new Response(null, { status, headers: { 'Cache-Control': 'no-store', ...extra } });

/**
 * POST: replaces the reader's picture. Same order as the other account writes: Origin, then storage, the declared
 * size, the session, and only then the body. The file's type comes from its bytes, never from what the client says.
 * Order of the writes: the new blob, then the row, then the old blob; a failure after the first deletes the new blob,
 * and a failure of the last leaves one unreferenced blob rather than a missing picture. Nothing is written on a 4xx.
 */
export async function handleUploadAvatar(req: AvatarRequest, deps: AvatarDeps): Promise<AuthReply> {
  if (originRefused(req, deps)) return reply(403, 'forbidden');
  if (!deps.stores) return reply(503, 'unavailable');
  if (!deps.avatars) return reply(503, 'storage_unavailable');
  if (req.contentLength === null) return reply(411, 'length_required');
  if (req.contentLength > MAX_REQUEST_BYTES) return reply(413, 'too_large');
  let stored: string | null = null;
  try {
    const now = deps.now();
    const user = await signedInUser(req.sessionId, deps.stores, now);
    if (!user) return reply(401, 'unauthorized');
    let form: FormData;
    try {
      form = await req.form();
    } catch (err) {
      return err instanceof BodyTooLarge ? reply(413, 'too_large') : reply(400, 'invalid_request');
    }
    const file = form.get('file');
    if (!(file instanceof File)) return reply(400, 'missing_file');
    if (file.size > MAX_AVATAR_BYTES) return reply(413, 'too_large');
    const processed = await processAvatar(new Uint8Array(await file.arrayBuffer()));
    if (!processed.ok) {
      if (processed.reason === 'too_large') return reply(413, 'too_large');
      return processed.reason === 'unsupported_type' ? reply(415, 'unsupported_type') : reply(422, 'unreadable_image');
    }

    const key = newAvatarKey(user.id);
    await deps.avatars.put(key, processed.webp);
    stored = key;
    const saved = await deps.stores.users.setAvatar(user.id, key, now);
    if (!saved) {
      await discard(deps.avatars, key);
      return reply(401, 'unauthorized');
    }
    stored = null;
    if (saved.previousKey) await discard(deps.avatars, saved.previousKey);
    return { status: 200, body: { ok: true, avatarUrl: avatarUrlFor({ avatarKey: key, avatarUpdatedAt: now }) } };
  } catch (err) {
    if (stored) await discard(deps.avatars, stored);
    console.error('account: avatar upload failed', err instanceof Error ? err.name : 'error');
    return reply(503, 'unavailable');
  }
}

/** DELETE: removes the reader's picture. Removing one that is not there answers the same 200. */
export async function handleDeleteAvatar(req: AvatarRequest, deps: AvatarDeps): Promise<AuthReply> {
  if (originRefused(req, deps)) return reply(403, 'forbidden');
  if (!deps.stores) return reply(503, 'unavailable');
  try {
    const now = deps.now();
    const user = await signedInUser(req.sessionId, deps.stores, now);
    if (!user) return reply(401, 'unauthorized');
    const saved = await deps.stores.users.setAvatar(user.id, null, now);
    if (!saved) return reply(401, 'unauthorized');
    if (saved.previousKey && deps.avatars) await discard(deps.avatars, saved.previousKey);
    return { status: 200, body: { ok: true, avatarUrl: null } };
  } catch (err) {
    console.error('account: avatar removal failed', err instanceof Error ? err.name : 'error');
    return reply(503, 'unavailable');
  }
}

/**
 * GET: the signed-in reader's own picture, and nobody else's: the key comes from the session user's row, so the
 * request names nothing. Not cached by shared caches or kept by the browser, because it differs per reader.
 */
export async function handleReadAvatar(req: Pick<AvatarRequest, 'sessionId'>, deps: Pick<AvatarDeps, 'stores' | 'avatars' | 'now'>): Promise<Response> {
  if (!deps.stores || !deps.avatars) return nothing(503);
  try {
    const user = await signedInUser(req.sessionId, deps.stores, deps.now());
    if (!user) return nothing(401);
    if (!user.avatarKey) return nothing(404);
    const found = await deps.avatars.get(user.avatarKey);
    if (!found) return nothing(404);
    return new Response(found.stream, { status: 200, headers: { 'Content-Type': found.contentType || AVATAR_TYPE, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store' } });
  } catch (err) {
    console.error('account: avatar read failed', err instanceof Error ? err.name : 'error');
    return nothing(503);
  }
}

// Best effort: a blob that cannot be removed now is only an unreferenced file, and must not fail the reader's request.
async function discard(avatars: AvatarStorage, key: string): Promise<void> {
  try {
    await avatars.delete(key);
  } catch (err) {
    console.error('account: avatar cleanup failed', err instanceof Error ? err.name : 'error');
  }
}
