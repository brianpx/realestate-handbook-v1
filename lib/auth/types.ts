import type { Source } from './config';

// Rows of `auth_tokens` and `sessions` (db/migrations/002_users_auth.sql). Only hashes are ever stored: the raw
// token exists in the emailed link and the raw session id in the cookie, nowhere else.
export type AuthToken = {
  tokenHash: string;
  email: string;
  nextPath: string | null;
  source: Source | null;
  expiresAt: Date;
  consumedAt: Date | null;
  createdIpHash: string | null;
  createdAt: Date;
};

export type Session = {
  idHash: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  lastSeenAt: Date;
  revokedAt: Date | null;
};
