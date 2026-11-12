import { randomBytes } from 'node:crypto';
import type { User } from './types';

// The rules for the picture on the account page (db/migrations/011_avatar.sql). Pure and free of sharp, so the
// account card can import the limits; the decoding is in avatar-image.ts.

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const AVATAR_SIZE = 256;
export const AVATAR_TYPE = 'image/webp';
/** The types a reader may upload, as the file picker and the client-side pre-check name them. */
export const ACCEPTED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

export type AvatarFormat = 'png' | 'jpeg' | 'webp';

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) => signature.every((b, i) => bytes[offset + i] === b);

/** The format the first bytes say, or null. The client's file name and type are never consulted. */
export function sniffAvatarFormat(bytes: Uint8Array): AvatarFormat | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return 'webp';
  return null;
}

const KEY_SHAPE = /^avatars\/[0-9a-f-]{36}\/[0-9a-f]{32}\.webp$/;

/** A new key for one upload: the user id and 128 random bits, so a key can be neither guessed nor chosen. */
export const newAvatarKey = (userId: string): string => `avatars/${userId}/${randomBytes(16).toString('hex')}.webp`;
export const isAvatarKey = (key: string): boolean => KEY_SHAPE.test(key);

export const AVATAR_PATH = '/api/account/avatar';

/** Where the browser loads the reader's picture; the version changes with every upload, so a new one is fetched. */
export function avatarUrlFor(user: Partial<Pick<User, 'avatarKey' | 'avatarUpdatedAt'>>): string | null {
  return user.avatarKey && user.avatarUpdatedAt ? `${AVATAR_PATH}?v=${user.avatarUpdatedAt.getTime()}` : null;
}
