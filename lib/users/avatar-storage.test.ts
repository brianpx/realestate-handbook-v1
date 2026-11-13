import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { del, get, put } from '@vercel/blob';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newAvatarKey } from './avatar';
import { avatarStorageFromEnv, FileAvatarStorage, MemoryAvatarStorage, VercelBlobAvatarStorage, type AvatarStorage } from './avatar-storage';

vi.mock('@vercel/blob', () => ({ put: vi.fn(), get: vi.fn(), del: vi.fn() }));

const USER = '0b9f5f0e-3f43-4d7f-9a53-6f4f2a1c7e11';
const bytesOf = async (found: Awaited<ReturnType<AvatarStorage['get']>>) => (found ? new Uint8Array(await new Response(found.stream).arrayBuffer()) : null);

let dir: string;
beforeEach(async () => { dir = await mkdtemp(path.join(tmpdir(), 'avatars-')); });
afterEach(() => rm(dir, { recursive: true, force: true }));

describe.each([
  ['memory', () => new MemoryAvatarStorage()],
  ['file', () => new FileAvatarStorage(dir)],
])('%s avatar storage', (_name, make) => {
  it('stores, reads back and deletes a picture, and treats a missing one as absent, not an error', async () => {
    const storage = make();
    const key = newAvatarKey(USER);
    expect(await storage.get(key)).toBeNull();
    await storage.put(key, new Uint8Array([1, 2, 3]));
    const found = await storage.get(key);
    expect(found?.contentType).toBe('image/webp');
    expect(await bytesOf(found)).toEqual(new Uint8Array([1, 2, 3]));
    await storage.delete(key);
    expect(await storage.get(key)).toBeNull();
    await expect(storage.delete(key)).resolves.toBeUndefined();
  });
  it('refuses any key it did not make', async () => {
    const storage = make();
    for (const bad of ['../escape.webp', `avatars/${USER}/../../x.webp`, 'avatars/other/name.png', '']) {
      await expect(storage.put(bad, new Uint8Array([1]))).rejects.toThrow(/refused a key/);
      await expect(storage.get(bad)).rejects.toThrow(/refused a key/);
      await expect(storage.delete(bad)).rejects.toThrow(/refused a key/);
    }
  });
});

describe('FileAvatarStorage', () => {
  it('leaves only the picture on disk after a write', async () => {
    const key = newAvatarKey(USER);
    await new FileAvatarStorage(dir).put(key, new Uint8Array([9]));
    expect(await readdir(path.join(dir, 'avatars', USER))).toEqual([key.split('/')[2]]);
  });
});

describe('VercelBlobAvatarStorage', () => {
  beforeEach(() => vi.resetAllMocks());
  it('writes private, never overwrites and never adds a suffix, so the stored key is the one the row holds', async () => {
    const key = newAvatarKey(USER);
    await new VercelBlobAvatarStorage().put(key, new Uint8Array([1, 2]));
    expect(put).toHaveBeenCalledWith(key, Buffer.from([1, 2]), { access: 'private', contentType: 'image/webp', addRandomSuffix: false, allowOverwrite: false });
  });
  it('reads private, passes the stream on, and answers null for a missing blob or an unchanged one', async () => {
    const key = newAvatarKey(USER);
    const storage = new VercelBlobAvatarStorage();
    vi.mocked(get).mockResolvedValueOnce({ statusCode: 200, stream: new Response('x').body!, headers: new Headers(), blob: {} as never });
    expect(await bytesOf(await storage.get(key))).toEqual(new Uint8Array([120]));
    expect(get).toHaveBeenCalledWith(key, { access: 'private' });
    vi.mocked(get).mockResolvedValueOnce(null);
    expect(await storage.get(key)).toBeNull();
    vi.mocked(get).mockResolvedValueOnce({ statusCode: 304, stream: null, headers: new Headers(), blob: {} as never });
    expect(await storage.get(key)).toBeNull();
  });
  it('deletes by key and lets a failure through for the caller to decide on', async () => {
    const key = newAvatarKey(USER);
    await new VercelBlobAvatarStorage().delete(key);
    expect(del).toHaveBeenCalledWith(key);
    vi.mocked(del).mockRejectedValueOnce(new Error('blob down'));
    await expect(new VercelBlobAvatarStorage().delete(key)).rejects.toThrow('blob down');
  });
});

describe('avatarStorageFromEnv', () => {
  it('uses Vercel Blob when its credentials are set, by token or by store id', () => {
    expect(avatarStorageFromEnv({ BLOB_READ_WRITE_TOKEN: 'x' })).toBeInstanceOf(VercelBlobAvatarStorage);
    expect(avatarStorageFromEnv({ BLOB_STORE_ID: 'store_x', VERCEL_ENV: 'production' })).toBeInstanceOf(VercelBlobAvatarStorage);
  });
  it('is none without a store, so the upload route can answer 503', () => {
    expect(avatarStorageFromEnv({})).toBeNull();
    expect(avatarStorageFromEnv({ VERCEL_ENV: 'production' })).toBeNull();
  });
  it('uses the throwaway directory only when AUTH_STORE=file names it and only outside a hosted deployment', () => {
    expect(avatarStorageFromEnv({ AUTH_STORE: 'file', AVATAR_STORE_PATH: dir })).toBeInstanceOf(FileAvatarStorage);
    expect(avatarStorageFromEnv({ AUTH_STORE: 'file', AVATAR_STORE_PATH: dir })).toBe(avatarStorageFromEnv({ AUTH_STORE: 'file', AVATAR_STORE_PATH: dir }));
    expect(avatarStorageFromEnv({ AUTH_STORE: 'file', VERCEL_ENV: 'preview' })).toBeNull();
    expect(avatarStorageFromEnv({ AUTH_STORE: 'file', VERCEL_ENV: 'preview', BLOB_READ_WRITE_TOKEN: 'x' })).toBeInstanceOf(VercelBlobAvatarStorage);
  });
});
