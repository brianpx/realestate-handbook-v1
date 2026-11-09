import { sessionDueForRenewal, sessionExpiry, tokenUsable } from './session';
import type { AttemptScope, AuthStore, ConsumedToken, NewSession, NewToken } from './store';
import type { AuthToken, Session } from './types';

/** In-memory store for unit tests. */
export class MemoryAuthStore implements AuthStore {
  tokens: AuthToken[] = [];
  sessions: Session[] = [];
  attempts: { scope: AttemptScope; keyHash: string; at: Date }[] = [];
  failWith: Error | null = null;
  private check() { if (this.failWith) throw this.failWith; }

  async createToken(token: NewToken) { this.check(); this.tokens.push({ ...token, consumedAt: null }); }
  async peekToken(tokenHash: string) { this.check(); return this.tokens.find(t => t.tokenHash === tokenHash) ?? null; }
  async consumeToken(tokenHash: string, now: Date): Promise<ConsumedToken | null> {
    this.check();
    const token = this.tokens.find(t => t.tokenHash === tokenHash);
    if (!token || !tokenUsable(token, now)) return null;
    token.consumedAt = now;
    return { email: token.email, nextPath: token.nextPath, termsVersion: token.termsVersion, source: token.source };
  }

  async createSession(session: NewSession) { this.check(); this.sessions.push({ ...session, lastSeenAt: session.createdAt, revokedAt: null }); }
  async findSession(idHash: string) { this.check(); return this.sessions.find(s => s.idHash === idHash) ?? null; }
  async listSessions(userId: string) { this.check(); return this.sessions.filter(s => s.userId === userId); }
  async renewSession(idHash: string, now: Date) {
    this.check();
    const session = this.sessions.find(s => s.idHash === idHash);
    if (!session || !sessionDueForRenewal(session, now)) return false;
    session.expiresAt = sessionExpiry(now);
    session.lastSeenAt = now;
    return true;
  }
  async revokeSession(idHash: string, now: Date) { this.check(); const s = this.sessions.find(x => x.idHash === idHash); if (s && s.revokedAt === null) s.revokedAt = now; }
  async revokeAllForUser(userId: string, now: Date) {
    this.check();
    let n = 0;
    for (const s of this.sessions) if (s.userId === userId && s.revokedAt === null) { s.revokedAt = now; n++; }
    return n;
  }

  async recordAndCount(scope: AttemptScope, keyHash: string, at: Date, since: Date) {
    this.check();
    this.attempts.push({ scope, keyHash, at });
    return this.attempts.filter(a => a.scope === scope && a.keyHash === keyHash && a.at >= since).length;
  }
}
