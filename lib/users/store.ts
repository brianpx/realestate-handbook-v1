import { randomUUID } from 'node:crypto';
import type { Role, User } from './types';

export type VerifiedSignIn = { email: string; termsVersion: string; at: Date };
/** One page of a listing, zero-based offset; the admin tables page through every row this way. */
export type Page = { offset: number; limit: number };

/**
 * Where users live. Production uses the database; the memory store is for unit tests and the file store in
 * lib/auth/file-store.ts for local development. Addresses are already normalised (lib/validate/email.ts) by the
 * time they get here; the database refuses anything else.
 */
export interface UserStore {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  /** First sign-in creates the row; a later one only fills what is still empty (verification, terms). */
  upsertVerified(input: VerifiedSignIn): Promise<{ user: User; created: boolean }>;
  countAdmins(): Promise<number>;
  setRole(id: string, role: Role, at: Date): Promise<void>;
  touchSignIn(id: string, at: Date): Promise<void>;
  /** Sets (or, with null, clears) the name the reader chose; false when no active user has that id. */
  setDisplayName(id: string, displayName: string | null, at: Date): Promise<boolean>;
  /**
   * Sets (or, with a null key, removes) the reader's picture and stamps the change; answers the key it replaced so
   * the caller can delete that blob, or null when no active user has that id.
   */
  setAvatar(id: string, key: string | null, at: Date): Promise<{ previousKey: string | null } | null>;
  /** Newest first, with the count over every row, for the admin list. */
  list(page: Page): Promise<{ users: User[]; total: number }>;
  /** The rows for a set of ids, in no particular order; unknown ids are simply absent (the audit list resolves actors). */
  findByIds(ids: string[]): Promise<User[]>;
}

export const newUser = (input: VerifiedSignIn): User => ({
  id: randomUUID(),
  email: input.email,
  emailVerifiedAt: input.at,
  firstName: null,
  lastName: null,
  displayName: null,
  avatarKey: null,
  avatarUpdatedAt: null,
  role: 'reader',
  status: 'active',
  acceptedTermsVersion: input.termsVersion,
  acceptedTermsAt: input.at,
  lastSignInAt: null,
  createdAt: input.at,
});

/** Applies a repeat sign-in to an existing row the way the database upsert does: only empty fields are filled. */
export const fillVerified = (user: User, input: VerifiedSignIn): User => ({
  ...user,
  emailVerifiedAt: user.emailVerifiedAt ?? input.at,
  acceptedTermsVersion: user.acceptedTermsVersion ?? input.termsVersion,
  acceptedTermsAt: user.acceptedTermsAt ?? input.at,
});

/** In-memory store for unit tests. */
export class MemoryUserStore implements UserStore {
  users: User[] = [];
  failWith: Error | null = null;
  private check() { if (this.failWith) throw this.failWith; }

  async findByEmail(email: string) { this.check(); return this.users.find(u => u.email === email) ?? null; }
  async findById(id: string) { this.check(); return this.users.find(u => u.id === id) ?? null; }
  async upsertVerified(input: VerifiedSignIn) {
    this.check();
    const i = this.users.findIndex(u => u.email === input.email);
    if (i >= 0) {
      const user = fillVerified(this.users[i]!, input);
      this.users[i] = user;
      return { user, created: false };
    }
    const user = newUser(input);
    this.users.push(user);
    return { user, created: true };
  }
  async countAdmins() { this.check(); return this.users.filter(u => u.role === 'admin').length; }
  async setRole(id: string, role: Role) { this.check(); const u = this.users.find(x => x.id === id); if (u) u.role = role; }
  async touchSignIn(id: string, at: Date) { this.check(); const u = this.users.find(x => x.id === id); if (u) u.lastSignInAt = at; }
  async setDisplayName(id: string, displayName: string | null) {
    this.check();
    const u = this.users.find(x => x.id === id && x.status === 'active');
    if (u) u.displayName = displayName;
    return Boolean(u);
  }
  async setAvatar(id: string, key: string | null, at: Date) {
    this.check();
    const u = this.users.find(x => x.id === id && x.status === 'active');
    if (!u) return null;
    const previousKey = u.avatarKey;
    u.avatarKey = key;
    u.avatarUpdatedAt = key ? at : null;
    return { previousKey };
  }
  async list({ offset, limit }: Page) {
    this.check();
    const sorted = [...this.users].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return { users: sorted.slice(offset, offset + limit), total: this.users.length };
  }
  async findByIds(ids: string[]) { this.check(); return this.users.filter(u => ids.includes(u.id)); }
}
