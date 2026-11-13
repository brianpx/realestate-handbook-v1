import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';
import { MemoryAccessStore } from '@/lib/access/memory-store';
import { MemoryAuthStore } from '@/lib/auth/memory-store';
import { sessionExpiry } from '@/lib/auth/session';
import { hashSecret, newSecret } from '@/lib/auth/token';
import { MAX_AVATAR_BYTES } from '@/lib/users/avatar';
import { gif, hugePng, jpeg, png, svg, textRenamedAsPng } from '@/lib/users/avatar-fixtures';
import { MemoryAvatarStorage } from '@/lib/users/avatar-storage';
import { MemoryUserStore } from '@/lib/users/store';
import { BodyTooLarge, handleDeleteAvatar, handleReadAvatar, handleUploadAvatar, MAX_REQUEST_BYTES, type AvatarDeps, type AvatarRequest } from './avatar-handler';
import { avatarRequestFrom } from './avatar-request';

const NOW = new Date('2026-11-08T12:00:00Z');
const LATER = new Date('2026-11-08T13:00:00Z');
const ORIGIN = 'https://handbook.example';

async function setup() {
  const users = new MemoryUserStore();
  const auth = new MemoryAuthStore();
  const access = new MemoryAccessStore({ users, auth });
  const avatars = new MemoryAvatarStorage();
  let now = NOW;
  const deps: AvatarDeps = { stores: { users, auth, access }, allowedOrigins: [ORIGIN], now: () => now, avatars };
  const { user } = await users.upsertVerified({ email: 'reader@example.com', termsVersion: 'v1', at: NOW });
  const { user: other } = await users.upsertVerified({ email: 'other@example.com', termsVersion: 'v1', at: NOW });
  const session = newSecret();
  const otherSession = newSecret();
  await auth.createSession({ idHash: hashSecret(session), userId: user.id, createdAt: NOW, expiresAt: sessionExpiry(NOW) });
  await auth.createSession({ idHash: hashSecret(otherSession), userId: other.id, createdAt: NOW, expiresAt: sessionExpiry(NOW) });
  const upload = (file: BlobPart | null, extra: { origin?: string | null; sessionId?: string; contentLength?: number | null; form?: () => Promise<FormData> } = {}): AvatarRequest => {
    const data = new FormData();
    if (file !== null) data.append('file', new File([file], 'whatever.png', { type: 'image/png' }));
    return {
      origin: extra.origin === undefined ? ORIGIN : extra.origin,
      sessionId: 'sessionId' in extra ? extra.sessionId : session,
      contentLength: extra.contentLength === undefined ? 1000 : extra.contentLength,
      form: extra.form ?? (async () => data),
    };
  };
  return { users, auth, avatars, deps, user, other, session, otherSession, upload, setNow: (d: Date) => { now = d; } };
}

describe('uploading an avatar', () => {
  it('stores a 256 x 256 WebP under a server-chosen key, records it for the session user only and answers the versioned address', async () => {
    const { users, avatars, deps, user, other, upload } = await setup();
    const res = await handleUploadAvatar(upload(await png(500, 300)), deps);
    expect(res).toEqual({ status: 200, body: { ok: true, avatarUrl: `/api/account/avatar?v=${NOW.getTime()}` } });
    const stored = (await users.findById(user.id))!;
    expect(stored.avatarKey).toMatch(new RegExp(`^avatars/${user.id}/[0-9a-f]{32}\\.webp$`));
    expect(stored.avatarUpdatedAt).toEqual(NOW);
    expect((await users.findById(other.id))?.avatarKey).toBeNull();
    expect([...avatars.objects.keys()]).toEqual([stored.avatarKey]);
    expect(await sharp(avatars.objects.get(stored.avatarKey!)!).metadata()).toMatchObject({ format: 'webp', width: 256, height: 256 });
  });
  it('replaces the picture with a new key and a new version, and deletes the old blob', async () => {
    const { users, avatars, deps, user, upload, setNow } = await setup();
    await handleUploadAvatar(upload(await png()), deps);
    const first = (await users.findById(user.id))!.avatarKey!;
    setNow(LATER);
    const res = await handleUploadAvatar(upload(await jpeg()), deps);
    expect(res.body).toEqual({ ok: true, avatarUrl: `/api/account/avatar?v=${LATER.getTime()}` });
    const second = (await users.findById(user.id))!.avatarKey!;
    expect(second).not.toBe(first);
    expect([...avatars.objects.keys()]).toEqual([second]);
  });
  it('checks Origin, then storage, then the declared size, then the session, in that order, and writes nothing', async () => {
    const { users, avatars, deps, upload } = await setup();
    const body = await png();
    expect(await handleUploadAvatar(upload(body, { origin: null, contentLength: 1e9, sessionId: undefined }), { ...deps, avatars: null })).toEqual({ status: 403, body: { ok: false, error: 'forbidden' } });
    expect((await handleUploadAvatar(upload(body, { origin: 'https://evil.example' }), deps)).status).toBe(403);
    expect(await handleUploadAvatar(upload(body, { contentLength: 1e9, sessionId: undefined }), { ...deps, stores: null })).toEqual({ status: 503, body: { ok: false, error: 'unavailable' } });
    expect(await handleUploadAvatar(upload(body, { contentLength: 1e9, sessionId: undefined }), { ...deps, avatars: null })).toEqual({ status: 503, body: { ok: false, error: 'storage_unavailable' } });
    expect(await handleUploadAvatar(upload(body, { contentLength: null }), deps)).toEqual({ status: 411, body: { ok: false, error: 'length_required' } });
    expect(await handleUploadAvatar(upload(body, { contentLength: MAX_REQUEST_BYTES + 1, sessionId: undefined }), deps)).toEqual({ status: 413, body: { ok: false, error: 'too_large' } });
    expect(await handleUploadAvatar(upload(body, { sessionId: undefined }), deps)).toEqual({ status: 401, body: { ok: false, error: 'unauthorized' } });
    expect(await handleUploadAvatar(upload(body, { sessionId: newSecret() }), deps)).toEqual({ status: 401, body: { ok: false, error: 'unauthorized' } });
    expect(avatars.objects.size).toBe(0);
    expect(users.users.every(u => u.avatarKey === null)).toBe(true);
  });
  it('answers 400 for a body that is not multipart or has no file, and for a field that is text', async () => {
    const { avatars, deps, upload } = await setup();
    expect(await handleUploadAvatar(upload(null), deps)).toEqual({ status: 400, body: { ok: false, error: 'missing_file' } });
    const text = new FormData();
    text.append('file', 'not a file');
    expect((await handleUploadAvatar(upload(null, { form: async () => text }), deps)).body).toEqual({ ok: false, error: 'missing_file' });
    expect(await handleUploadAvatar(upload(null, { form: async () => { throw new TypeError('bad body'); } }), deps)).toEqual({ status: 400, body: { ok: false, error: 'invalid_request' } });
    expect(avatars.objects.size).toBe(0);
  });
  it('refuses by the bytes in the file, never by its name or type: SVG, GIF and text called .png', async () => {
    const { avatars, deps, upload } = await setup();
    for (const bad of [svg, await gif(), textRenamedAsPng]) {
      expect(await handleUploadAvatar(upload(bad), deps)).toEqual({ status: 415, body: { ok: false, error: 'unsupported_type' } });
    }
    expect(await handleUploadAvatar(upload(Buffer.concat([(await png()).subarray(0, 30)])), deps)).toEqual({ status: 422, body: { ok: false, error: 'unreadable_image' } });
    expect(await handleUploadAvatar(upload(await hugePng()), deps)).toEqual({ status: 422, body: { ok: false, error: 'unreadable_image' } });
    expect(avatars.objects.size).toBe(0);
  });
  it('refuses a file over 2 MB by its actual size even when the declared length was small, and an oversized body while reading it', async () => {
    const { avatars, deps, upload } = await setup();
    const big = Buffer.concat([await png(), Buffer.alloc(MAX_AVATAR_BYTES)]);
    expect(await handleUploadAvatar(upload(big, { contentLength: 500 }), deps)).toEqual({ status: 413, body: { ok: false, error: 'too_large' } });
    expect(await handleUploadAvatar(upload(null, { form: async () => { throw new BodyTooLarge(); } }), deps)).toEqual({ status: 413, body: { ok: false, error: 'too_large' } });
    expect(avatars.objects.size).toBe(0);
  });
  it('removes the new blob when the row cannot be written, keeps the old picture, and answers 503', async () => {
    const { users, avatars, deps, user, upload } = await setup();
    await handleUploadAvatar(upload(await png()), deps);
    const before = (await users.findById(user.id))!.avatarKey;
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      vi.spyOn(users, 'setAvatar').mockRejectedValueOnce(new Error('db down'));
      expect(await handleUploadAvatar(upload(await jpeg()), deps)).toEqual({ status: 503, body: { ok: false, error: 'unavailable' } });
      expect([...avatars.objects.keys()]).toEqual([before]);
      expect((await users.findById(user.id))!.avatarKey).toBe(before);
    } finally {
      spy.mockRestore();
    }
  });
  it('answers 503 and leaves nothing when the storage fails, and still succeeds when only the old blob cannot be deleted', async () => {
    const { users, avatars, deps, user, upload } = await setup();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      avatars.failWith = new Error('blob down');
      expect(await handleUploadAvatar(upload(await png()), deps)).toEqual({ status: 503, body: { ok: false, error: 'unavailable' } });
      expect((await users.findById(user.id))!.avatarKey).toBeNull();
      avatars.failWith = null;
      await handleUploadAvatar(upload(await png()), deps);
      vi.spyOn(avatars, 'delete').mockRejectedValueOnce(new Error('blob down'));
      expect((await handleUploadAvatar(upload(await jpeg()), deps)).status).toBe(200);
      expect(spy).toHaveBeenCalledWith('account: avatar cleanup failed', 'Error');
    } finally {
      spy.mockRestore();
    }
  });
  it('removes the new blob and answers 401 when the account was deleted between the session check and the write', async () => {
    const { users, avatars, deps, upload } = await setup();
    vi.spyOn(users, 'setAvatar').mockResolvedValueOnce(null);
    expect((await handleUploadAvatar(upload(await png()), deps)).status).toBe(401);
    expect(avatars.objects.size).toBe(0);
  });
  it('logs nothing from the file or the key when something fails', async () => {
    const { avatars, deps, upload } = await setup();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      avatars.failWith = new Error('secret-key-name avatars/x');
      await handleUploadAvatar(upload(await png()), deps);
      expect(JSON.stringify(spy.mock.calls)).not.toContain('secret-key-name');
    } finally {
      spy.mockRestore();
    }
  });
});

describe('avatarRequestFrom', () => {
  const multipart = async (bytes: Uint8Array, headers: Record<string, string> = {}) => {
    const data = new FormData();
    data.append('file', new File([bytes as BlobPart], 'a.png', { type: 'image/png' }));
    const probe = new Request('https://handbook.example/api/account/avatar', { method: 'POST', body: data });
    const body = new Uint8Array(await probe.arrayBuffer());
    return new Request('https://handbook.example/api/account/avatar', { method: 'POST', body, headers: { 'Content-Type': probe.headers.get('content-type')!, 'Content-Length': String(body.byteLength), Origin: ORIGIN, ...headers } });
  };
  it('reads the origin, the declared length and the session cookie, and parses the multipart body', async () => {
    const sid = newSecret();
    const req = avatarRequestFrom(await multipart(await png(), { Cookie: `__Host-hb_session=${sid}` }));
    expect(req.origin).toBe(ORIGIN);
    expect(req.sessionId).toBe(sid);
    expect(req.contentLength).toBeGreaterThan(50);
    const file = (await req.form()).get('file');
    expect(file).toBeInstanceOf(File);
    expect((file as File).size).toBe((await png()).byteLength);
  });
  it('treats a missing or malformed Content-Length as none', async () => {
    expect(avatarRequestFrom(new Request('https://handbook.example/x', { method: 'DELETE' })).contentLength).toBeNull();
    expect(avatarRequestFrom(new Request('https://handbook.example/x', { method: 'POST', headers: { 'Content-Length': '12abc' }, body: 'x' })).contentLength).toBeNull();
  });
  it('stops reading a body that runs past the cap, whatever Content-Length claimed', async () => {
    const { avatars, deps, session } = await setup();
    const req = avatarRequestFrom(await multipart(new Uint8Array(MAX_REQUEST_BYTES + 10), { 'Content-Length': '500', Cookie: `__Host-hb_session=${session}` }));
    expect(req.contentLength).toBe(500);
    expect(await handleUploadAvatar(req, deps)).toEqual({ status: 413, body: { ok: false, error: 'too_large' } });
    expect(avatars.objects.size).toBe(0);
  });
});

describe('removing an avatar', () => {
  it('clears the row and deletes the blob, and answers the same for a reader with none', async () => {
    const { users, avatars, deps, user, upload } = await setup();
    await handleUploadAvatar(upload(await png()), deps);
    const req = { ...upload(null), contentLength: null };
    expect(await handleDeleteAvatar(req, deps)).toEqual({ status: 200, body: { ok: true, avatarUrl: null } });
    expect(await users.findById(user.id)).toMatchObject({ avatarKey: null, avatarUpdatedAt: null });
    expect(avatars.objects.size).toBe(0);
    expect(await handleDeleteAvatar(req, deps)).toEqual({ status: 200, body: { ok: true, avatarUrl: null } });
  });
  it('checks Origin, then the session, and works with no storage configured', async () => {
    const { users, deps, user, upload } = await setup();
    await users.setAvatar(user.id, 'avatars/x/y.webp', NOW);
    expect((await handleDeleteAvatar(upload(null, { origin: 'https://evil.example' }), deps)).status).toBe(403);
    expect((await handleDeleteAvatar(upload(null, { sessionId: undefined }), deps)).status).toBe(401);
    expect((await handleDeleteAvatar(upload(null), { ...deps, stores: null })).status).toBe(503);
    expect((await users.findById(user.id))!.avatarKey).toBe('avatars/x/y.webp');
    expect((await handleDeleteAvatar(upload(null), { ...deps, avatars: null })).status).toBe(200);
    expect((await users.findById(user.id))!.avatarKey).toBeNull();
  });
  it('answers 503 when the row cannot be written', async () => {
    const { users, deps, upload } = await setup();
    users.failWith = new Error('db down');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect((await handleDeleteAvatar(upload(null), deps)).status).toBe(503);
    } finally {
      spy.mockRestore();
    }
  });
});

describe('reading an avatar', () => {
  it('streams the signed-in reader\'s own picture, never another reader\'s, with private no-store caching and no sniffing', async () => {
    const { avatars, deps, session, otherSession, upload } = await setup();
    await handleUploadAvatar(upload(await png()), deps);
    const own = await handleReadAvatar({ sessionId: session }, deps);
    expect(own.status).toBe(200);
    expect(own.headers.get('Content-Type')).toBe('image/webp');
    expect(own.headers.get('Cache-Control')).toBe('private, no-store');
    expect(own.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(await sharp(new Uint8Array(await own.arrayBuffer())).metadata()).toMatchObject({ format: 'webp', width: 256 });
    expect((await handleReadAvatar({ sessionId: otherSession }, deps)).status).toBe(404);
    expect(avatars.objects.size).toBe(1);
  });
  it('answers 401 without a session, 404 when there is no picture or its blob is gone, and 503 when it cannot look', async () => {
    const { users, avatars, deps, session, upload } = await setup();
    expect((await handleReadAvatar({ sessionId: undefined }, deps)).status).toBe(401);
    expect((await handleReadAvatar({ sessionId: session }, deps)).status).toBe(404);
    await handleUploadAvatar(upload(await png()), deps);
    avatars.objects.clear();
    expect((await handleReadAvatar({ sessionId: session }, deps)).status).toBe(404);
    expect((await handleReadAvatar({ sessionId: session }, { ...deps, avatars: null })).status).toBe(503);
    expect((await handleReadAvatar({ sessionId: session }, { ...deps, stores: null })).status).toBe(503);
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      users.failWith = new Error('db down');
      expect((await handleReadAvatar({ sessionId: session }, deps)).status).toBe(503);
    } finally {
      spy.mockRestore();
    }
  });
  it('sends no cache headers a shared cache could use on any answer', async () => {
    const { deps } = await setup();
    expect((await handleReadAvatar({ sessionId: undefined }, deps)).headers.get('Cache-Control')).toBe('no-store');
  });
});
