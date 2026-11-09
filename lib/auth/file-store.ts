import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fillVerified, newUser, type UserStore, type VerifiedSignIn } from '@/lib/users/store';
import type { Role, User } from '@/lib/users/types';
import { sessionDueForRenewal, sessionExpiry, tokenUsable } from './session';
import type { AttemptScope, AuthStore, ConsumedToken, NewSession, NewToken } from './store';
import type { AuthToken, Session } from './types';

// Dates are kept as ISO strings in the file and turned back into Dates on the way out.
type Iso<T> = { [K in keyof T]: T[K] extends Date ? string : T[K] extends Date | null ? string | null : T[K] };
type Shape = { users: Iso<User>[]; tokens: Iso<AuthToken>[]; sessions: Iso<Session>[]; attempts: { scope: AttemptScope; keyHash: string; at: string }[] };

const iso = (d: Date | null): string | null => (d ? d.toISOString() : null);
const date = (s: string | null): Date | null => (s ? new Date(s) : null);
const userOut = (u: Iso<User>): User => ({ ...u, emailVerifiedAt: date(u.emailVerifiedAt), acceptedTermsAt: date(u.acceptedTermsAt), lastSignInAt: date(u.lastSignInAt), createdAt: new Date(u.createdAt) });
const userIn = (u: User): Iso<User> => ({ ...u, emailVerifiedAt: iso(u.emailVerifiedAt), acceptedTermsAt: iso(u.acceptedTermsAt), lastSignInAt: iso(u.lastSignInAt), createdAt: u.createdAt.toISOString() });
const tokenOut = (t: Iso<AuthToken>): AuthToken => ({ ...t, expiresAt: new Date(t.expiresAt), consumedAt: date(t.consumedAt), createdAt: new Date(t.createdAt) });
const sessionOut = (s: Iso<Session>): Session => ({ ...s, createdAt: new Date(s.createdAt), expiresAt: new Date(s.expiresAt), lastSeenAt: new Date(s.lastSeenAt), revokedAt: date(s.revokedAt) });

/**
 * Users, tokens, sessions and counters in one JSON file, for local development and the e2e suite: a sign-in needs
 * a user and a session written together, and the suite seeds both before the first request. Same discipline as
 * FileLeadStore: one change at a time, written to a temp file then renamed, read fresh on every call. Never for a
 * hosted deployment (authStoresFromEnv refuses it there).
 */
export class FileAuthStore implements UserStore, AuthStore {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private readonly file: string) {}

  private async read(): Promise<Shape> {
    let data: Partial<Shape> | null;
    try {
      data = JSON.parse(await readFile(this.file, 'utf8')) as Partial<Shape> | null;
    } catch {
      return { users: [], tokens: [], sessions: [], attempts: [] };
    }
    // a hand-edited or truncated file must not break every later request: a missing or non-array field starts empty
    return {
      users: Array.isArray(data?.users) ? data.users : [],
      tokens: Array.isArray(data?.tokens) ? data.tokens : [],
      sessions: Array.isArray(data?.sessions) ? data.sessions : [],
      attempts: Array.isArray(data?.attempts) ? data.attempts : [],
    };
  }

  private change<T>(fn: (data: Shape) => T): Promise<T> {
    const run = this.queue.then(async () => {
      const data = await this.read();
      const result = fn(data);
      await mkdir(path.dirname(this.file), { recursive: true });
      const tmp = `${this.file}.${process.pid}.tmp`;
      await writeFile(tmp, JSON.stringify(data));
      await rename(tmp, this.file);
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async view<T>(fn: (data: Shape) => T): Promise<T> {
    await this.queue;
    return fn(await this.read());
  }

  // users
  findByEmail(email: string) { return this.view(d => { const u = d.users.find(x => x.email === email); return u ? userOut(u) : null; }); }
  findById(id: string) { return this.view(d => { const u = d.users.find(x => x.id === id); return u ? userOut(u) : null; }); }
  upsertVerified(input: VerifiedSignIn) {
    return this.change(d => {
      const i = d.users.findIndex(u => u.email === input.email);
      if (i >= 0) {
        const user = fillVerified(userOut(d.users[i]!), input);
        d.users[i] = userIn(user);
        return { user, created: false };
      }
      const user = newUser(input);
      d.users.push(userIn(user));
      return { user, created: true };
    });
  }
  countAdmins() { return this.view(d => d.users.filter(u => u.role === 'admin').length); }
  setRole(id: string, role: Role) { return this.change(d => { const u = d.users.find(x => x.id === id); if (u) u.role = role; }); }
  touchSignIn(id: string, at: Date) { return this.change(d => { const u = d.users.find(x => x.id === id); if (u) u.lastSignInAt = at.toISOString(); }); }

  // tokens
  createToken(t: NewToken) {
    return this.change(d => { d.tokens.push({ ...t, expiresAt: t.expiresAt.toISOString(), createdAt: t.createdAt.toISOString(), consumedAt: null }); });
  }
  peekToken(tokenHash: string) { return this.view(d => { const t = d.tokens.find(x => x.tokenHash === tokenHash); return t ? tokenOut(t) : null; }); }
  consumeToken(tokenHash: string, now: Date): Promise<ConsumedToken | null> {
    return this.change(d => {
      const t = d.tokens.find(x => x.tokenHash === tokenHash);
      if (!t || !tokenUsable(tokenOut(t), now)) return null;
      t.consumedAt = now.toISOString();
      return { email: t.email, nextPath: t.nextPath, source: t.source };
    });
  }

  // sessions
  createSession(s: NewSession) {
    return this.change(d => { d.sessions.push({ idHash: s.idHash, userId: s.userId, createdAt: s.createdAt.toISOString(), expiresAt: s.expiresAt.toISOString(), lastSeenAt: s.createdAt.toISOString(), revokedAt: null }); });
  }
  findSession(idHash: string) { return this.view(d => { const s = d.sessions.find(x => x.idHash === idHash); return s ? sessionOut(s) : null; }); }
  renewSession(idHash: string, now: Date) {
    return this.change(d => {
      const s = d.sessions.find(x => x.idHash === idHash);
      if (!s || !sessionDueForRenewal(sessionOut(s), now)) return false;
      s.expiresAt = sessionExpiry(now).toISOString();
      s.lastSeenAt = now.toISOString();
      return true;
    });
  }
  revokeSession(idHash: string, now: Date) { return this.change(d => { const s = d.sessions.find(x => x.idHash === idHash); if (s && s.revokedAt === null) s.revokedAt = now.toISOString(); }); }
  revokeAllForUser(userId: string, now: Date) { return this.change(d => { for (const s of d.sessions) if (s.userId === userId && s.revokedAt === null) s.revokedAt = now.toISOString(); }); }

  // counters
  recordAndCount(scope: AttemptScope, keyHash: string, at: Date, since: Date) {
    return this.change(d => {
      const cutoff = at.getTime() - 24 * 3600 * 1000;
      d.attempts = d.attempts.filter(a => Date.parse(a.at) >= cutoff); // keep the file small
      d.attempts.push({ scope, keyHash, at: at.toISOString() });
      return d.attempts.filter(a => a.scope === scope && a.keyHash === keyHash && Date.parse(a.at) >= since.getTime()).length;
    });
  }
}
