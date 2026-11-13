import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { del, get, put } from '@vercel/blob';
import { AVATAR_TYPE, isAvatarKey } from './avatar';

/**
 * Where the processed pictures live (db/migrations/011_avatar.sql keeps only the key). Production uses a private
 * Vercel Blob store, read back through the account route so the browser never holds a link to the file; the memory
 * store is for unit tests and the file store for local development and e2e. Keys are server-made (avatar.ts), and
 * every implementation refuses any other shape.
 */
export interface AvatarStorage {
  put(key: string, bytes: Uint8Array): Promise<void>;
  /** Null when there is no such picture. */
  get(key: string): Promise<{ stream: ReadableStream<Uint8Array>; contentType: string } | null>;
  /** Removing a picture that is already gone is not an error. */
  delete(key: string): Promise<void>;
}

const checked = (key: string): string => {
  if (!isAvatarKey(key)) throw new Error('avatar storage: refused a key it did not make');
  return key;
};
const streamOf = (bytes: Uint8Array): ReadableStream<Uint8Array> => new Response(bytes as BodyInit).body!;

/** In-memory storage for unit tests. */
export class MemoryAvatarStorage implements AvatarStorage {
  objects = new Map<string, Uint8Array>();
  failWith: Error | null = null;
  private check() { if (this.failWith) throw this.failWith; }

  async put(key: string, bytes: Uint8Array) { this.check(); this.objects.set(checked(key), bytes); }
  async get(key: string) {
    this.check();
    const bytes = this.objects.get(checked(key));
    return bytes ? { stream: streamOf(bytes), contentType: AVATAR_TYPE } : null;
  }
  async delete(key: string) { this.check(); this.objects.delete(checked(key)); }
}

/** Files under a directory, for local development and e2e. Each write lands by rename, so a read never sees half a picture. */
export class FileAvatarStorage implements AvatarStorage {
  constructor(private readonly dir: string) {}

  private pathOf(key: string) { return path.join(this.dir, ...checked(key).split('/')); }

  async put(key: string, bytes: Uint8Array) {
    const file = this.pathOf(key);
    await mkdir(path.dirname(file), { recursive: true });
    const temp = `${file}.${randomUUID()}.tmp`;
    try {
      await writeFile(temp, bytes, { mode: 0o600 });
      await rename(temp, file);
    } catch (err) {
      await rm(temp, { force: true });
      throw err;
    }
  }
  async get(key: string) {
    try {
      return { stream: streamOf(await readFile(this.pathOf(key))), contentType: AVATAR_TYPE };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
  }
  async delete(key: string) { await rm(this.pathOf(key), { force: true }); }
}

/**
 * A private Vercel Blob store. The SDK picks its credentials from the environment: BLOB_READ_WRITE_TOKEN, or
 * BLOB_STORE_ID with the deployment's OIDC token. Every call asks for `access: 'private'`, which must match the
 * store, so a public store fails loudly instead of publishing a face.
 */
export class VercelBlobAvatarStorage implements AvatarStorage {
  async put(key: string, bytes: Uint8Array) {
    await put(checked(key), Buffer.from(bytes), { access: 'private', contentType: AVATAR_TYPE, addRandomSuffix: false, allowOverwrite: false });
  }
  async get(key: string) {
    const result = await get(checked(key), { access: 'private' });
    return result?.statusCode === 200 ? { stream: result.stream, contentType: AVATAR_TYPE } : null;
  }
  async delete(key: string) { await del(checked(key)); }
}

// One file storage per directory for the life of the process.
const fileStorages = new Map<string, FileAvatarStorage>();

/**
 * Vercel Blob when its credentials are in the environment; the throwaway directory only when AUTH_STORE=file asks for
 * it and only outside a hosted deployment (its disk is ephemeral); otherwise none, and the upload route answers 503.
 */
export function avatarStorageFromEnv(env: Record<string, string | undefined>): AvatarStorage | null {
  const hosted = Boolean(env.VERCEL_ENV) && env.VERCEL_ENV !== 'development';
  if (env.AUTH_STORE === 'file' && !hosted) {
    const authFile = env.AUTH_STORE_PATH ?? path.join(process.cwd(), '.data', 'auth.json');
    const dir = env.AVATAR_STORE_PATH ?? path.join(path.dirname(authFile), 'avatars');
    let storage = fileStorages.get(dir);
    if (!storage) fileStorages.set(dir, (storage = new FileAvatarStorage(dir)));
    return storage;
  }
  return env.BLOB_READ_WRITE_TOKEN || env.BLOB_STORE_ID ? new VercelBlobAvatarStorage() : null;
}
