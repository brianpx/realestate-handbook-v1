import { createHash, randomBytes } from 'node:crypto';

// Sign-in tokens and session ids have the same shape: 32 random bytes, base64url in the link or cookie (43
// characters), SHA-256 hex in the database. The shape check is what proxy.ts uses to turn away junk cookies
// without touching the database.
export const SECRET_LENGTH = 43;
const SHAPE = /^[A-Za-z0-9_-]{43}$/;

export const newSecret = (): string => randomBytes(32).toString('base64url');
export const hashSecret = (raw: string): string => createHash('sha256').update(raw).digest('hex');
export const isSecretShape = (value: unknown): value is string => typeof value === 'string' && SHAPE.test(value);

/** Salted hash of an address or a connection, for the rate-limit counters; never the value itself. */
export const hashKey = (value: string, salt: string): string => createHash('sha256').update(`${salt}:${value}`).digest('hex').slice(0, 32);
