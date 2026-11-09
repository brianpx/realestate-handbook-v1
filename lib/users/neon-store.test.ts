import { describe, expect, it } from 'vitest';
import { fakeSql } from '@/lib/db/fake-sql';
import { NeonUserStore, rowToUser } from './neon-store';

const AT = new Date('2026-11-08T12:00:00Z');
const row = { id: 'u-1', email: 'a@b.co', email_verified_at: '2026-11-08T12:00:00.000Z', role: 'reader', status: 'active', accepted_terms_version: 'v1', accepted_terms_at: AT, last_sign_in_at: null, created_at: AT };

describe('NeonUserStore', () => {
  it('maps a row, taking dates as the driver gives them (Date or string)', () => {
    expect(rowToUser(row)).toEqual({ id: 'u-1', email: 'a@b.co', emailVerifiedAt: AT, role: 'reader', status: 'active', acceptedTermsVersion: 'v1', acceptedTermsAt: AT, lastSignInAt: null, createdAt: AT });
  });
  it('upserts in one statement with the values bound, and reads created from xmax', async () => {
    const { sql, calls } = fakeSql([{ ...row, created: true }]);
    const result = await new NeonUserStore(sql).upsertVerified({ email: 'a@b.co', termsVersion: 'v1', at: AT });
    expect(result.created).toBe(true);
    expect(result.user.email).toBe('a@b.co');
    expect(calls).toHaveLength(1);
    expect(calls[0]!.text).toContain('on conflict (email) do update');
    expect(calls[0]!.text).toContain('coalesce(users.email_verified_at, excluded.email_verified_at)');
    expect(calls[0]!.text).toContain('(xmax = 0) as created');
    expect(calls[0]!.values).toEqual(['a@b.co', AT.toISOString(), 'v1', AT.toISOString(), AT.toISOString(), AT.toISOString()]);
  });
  it('reports a repeat as not created', async () => {
    const { sql } = fakeSql([{ ...row, created: false }]);
    expect((await new NeonUserStore(sql).upsertVerified({ email: 'a@b.co', termsVersion: 'v1', at: AT })).created).toBe(false);
  });
  it('finds by email and by id, and answers null for no row', async () => {
    const { sql, calls } = fakeSql([row], []);
    const store = new NeonUserStore(sql);
    expect((await store.findByEmail('a@b.co'))?.id).toBe('u-1');
    expect(await store.findById('nope')).toBeNull();
    expect(calls[0]!.text).toContain('from users where email = ?');
    expect(calls[1]!.text).toContain('from users where id = ?');
  });
  it('counts admins, sets a role and records a sign-in with the time bound', async () => {
    const { sql, calls } = fakeSql([{ n: 2 }], [], []);
    const store = new NeonUserStore(sql);
    expect(await store.countAdmins()).toBe(2);
    await store.setRole('u-1', 'admin', AT);
    await store.touchSignIn('u-1', AT);
    expect(calls[1]).toEqual({ text: 'update users set role = ?, updated_at = ? where id = ?', values: ['admin', AT.toISOString(), 'u-1'] });
    expect(calls[2]!.values).toEqual([AT.toISOString(), AT.toISOString(), 'u-1']);
  });
});
