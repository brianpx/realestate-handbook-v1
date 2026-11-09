import { describe, expect, it, vi } from 'vitest';
import { fakeSql } from '@/lib/db/fake-sql';
import type { Sql } from '@/lib/db/sql';
import { NeonAuthStore, rowToSession, rowToToken } from './neon-store';

const NOW = new Date('2026-11-08T12:00:00Z');
const ISO = NOW.toISOString();

describe('NeonAuthStore', () => {
  it('stores a token with every value bound, never spliced in', async () => {
    const { sql, calls } = fakeSql([]);
    await new NeonAuthStore(sql).createToken({ tokenHash: 'h'.repeat(64), email: 'a@b.co', nextPath: '/handbook/ch2', termsVersion: 'v1', source: 'hero', expiresAt: NOW, createdIpHash: 'ip', createdAt: NOW });
    expect(calls[0]!.text).toBe('insert into auth_tokens (token_hash, email, next_path, terms_version, source, expires_at, created_ip_hash, created_at) values (?, ?, ?, ?, ?, ?, ?, ?)');
    expect(calls[0]!.values).toEqual(['h'.repeat(64), 'a@b.co', '/handbook/ch2', 'v1', 'hero', ISO, 'ip', ISO]);
  });
  it('consumes in one statement that refuses used and expired tokens, and answers null for no row', async () => {
    const { sql, calls } = fakeSql([{ email: 'a@b.co', next_path: null, terms_version: 'v1', source: 'signin' }], []);
    const store = new NeonAuthStore(sql);
    expect(await store.consumeToken('t', NOW)).toEqual({ email: 'a@b.co', nextPath: null, termsVersion: 'v1', source: 'signin' });
    expect(await store.consumeToken('t', NOW)).toBeNull();
    expect(calls[0]!.text).toContain('update auth_tokens set consumed_at = ?');
    expect(calls[0]!.text).toContain('consumed_at is null and expires_at > ?');
    expect(calls[0]!.values).toEqual([ISO, 't', ISO]);
  });
  it('counts requests and sign-ins per placement in one grouped statement', async () => {
    const { sql, calls } = fakeSql([{ source: 'hero', requested: 5, signed_in: 2 }, { source: null, requested: 1, signed_in: '1' }]);
    expect(await new NeonAuthStore(sql).placementStats()).toEqual([{ source: 'hero', requested: 5, signedIn: 2 }, { source: null, requested: 1, signedIn: 1 }]);
    expect(calls[0]!.text).toBe('select source, count(*)::int as requested, count(consumed_at)::int as signed_in from auth_tokens group by source order by requested desc, source');
    expect(calls[0]!.values).toEqual([]);
  });
  it('peeks without writing', async () => {
    const { sql, calls } = fakeSql([{ token_hash: 't', email: 'a@b.co', next_path: '/x', terms_version: 'v1', source: null, expires_at: ISO, consumed_at: null, created_ip_hash: null, created_at: NOW }]);
    const token = await new NeonAuthStore(sql).peekToken('t');
    expect(calls[0]!.text.startsWith('select')).toBe(true);
    expect(token).toEqual(rowToToken({ token_hash: 't', email: 'a@b.co', next_path: '/x', terms_version: 'v1', source: null, expires_at: ISO, consumed_at: null, created_ip_hash: null, created_at: NOW }));
    expect(token?.expiresAt).toEqual(NOW);
  });
  it('renews with the single conditional update, bound to the configured intervals, and reports whether a row changed', async () => {
    const { sql, calls } = fakeSql([{ id_hash: 's' }], []);
    const store = new NeonAuthStore(sql);
    expect(await store.renewSession('s', NOW)).toBe(true);
    expect(await store.renewSession('s', NOW)).toBe(false);
    const text = calls[0]!.text;
    expect(text).toContain('revoked_at is null');
    expect(text).toContain('expires_at > ?');
    expect(text).toContain('last_seen_at < ?::timestamptz - make_interval(secs => ?)');
    expect(text).toContain('created_at > ?::timestamptz - make_interval(secs => ?)');
    expect(calls[0]!.values).toEqual([ISO, 7776000, ISO, 's', ISO, ISO, 31536000, ISO, 86400]);
  });
  it('maps a session row and revokes by id and by user without touching rows already revoked', async () => {
    const { sql, calls } = fakeSql([{ id_hash: 's', user_id: 'u', created_at: ISO, expires_at: ISO, last_seen_at: ISO, revoked_at: null }], [], []);
    const store = new NeonAuthStore(sql);
    expect(await store.findSession('s')).toEqual(rowToSession({ id_hash: 's', user_id: 'u', created_at: ISO, expires_at: ISO, last_seen_at: ISO, revoked_at: null }));
    await store.revokeSession('s', NOW);
    await store.revokeAllForUser('u', NOW);
    expect(calls[1]).toEqual({ text: 'update sessions set revoked_at = ? where id_hash = ? and revoked_at is null', values: [ISO, 's'] });
    expect(calls[2]).toEqual({ text: 'update sessions set revoked_at = ? where user_id = ? and revoked_at is null returning id_hash', values: [ISO, 'u'] });
  });
  it('inserts and counts an attempt in one statement, and still returns the count when cleanup throws', async () => {
    const { sql, calls } = fakeSql([{ n: 4 }]);
    const cleanup = new Error('delete failed');
    cleanup.name = 'CleanupError';
    const flaky: Sql = Object.assign(async (strings: TemplateStringsArray, ...values: unknown[]) => {
      if (strings.join('').includes('delete')) throw cleanup;
      return sql(strings, ...values);
    }, { transaction: sql.transaction });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const since = new Date('2026-11-08T11:50:00Z');
      await expect(new NeonAuthStore(flaky).recordAndCount('email', 'k', NOW, since)).resolves.toBe(4);
      expect(calls).toHaveLength(1);
      expect(calls[0]!.text).toContain('insert into auth_attempts (scope, key_hash, at)');
      expect(calls[0]!.values).toEqual(['email', 'k', ISO, 'email', 'k', since.toISOString(), since.toISOString()]);
      expect(spy).toHaveBeenCalledWith('auth: attempt cleanup failed', 'CleanupError');
    } finally {
      spy.mockRestore();
    }
  });
});
