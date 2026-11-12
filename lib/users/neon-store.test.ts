import { describe, expect, it } from 'vitest';
import { fakeSql } from '@/lib/db/fake-sql';
import { NeonUserStore, rowToUser } from './neon-store';

const AT = new Date('2026-11-08T12:00:00Z');
const row = { id: 'u-1', email: 'a@b.co', email_verified_at: '2026-11-08T12:00:00.000Z', first_name: null, last_name: 'Realtor', display_name: 'Pat', role: 'reader', status: 'active', accepted_terms_version: 'v1', accepted_terms_at: AT, last_sign_in_at: null, created_at: AT };

describe('NeonUserStore', () => {
  it('maps a row, taking dates as the driver gives them (Date or string)', () => {
    expect(rowToUser(row)).toEqual({ id: 'u-1', email: 'a@b.co', emailVerifiedAt: AT, firstName: null, lastName: 'Realtor', displayName: 'Pat', role: 'reader', status: 'active', acceptedTermsVersion: 'v1', acceptedTermsAt: AT, lastSignInAt: null, createdAt: AT });
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
  it('sets the display name for an active user and says whether a row changed', async () => {
    const { sql, calls } = fakeSql([{ id: 'u-1' }], []);
    const store = new NeonUserStore(sql);
    expect(await store.setDisplayName('u-1', 'Pat', AT)).toBe(true);
    expect(await store.setDisplayName('gone', 'Pat', AT)).toBe(false);
    expect(calls[0]).toEqual({ text: expect.stringContaining("where id = ? and status = 'active'"), values: ['Pat', AT.toISOString(), 'u-1'] });
  });
  it('lists a page with its total in one round trip, and finds a set of ids without a query for none', async () => {
    const { sql, calls, transactions } = fakeSql([{ n: 7 }], [row], [row]);
    const store = new NeonUserStore(sql);
    const page = await store.list({ offset: 25, limit: 25 });
    expect(transactions).toEqual([2]);
    expect(page.total).toBe(7);
    expect(page.users[0]!.id).toBe('u-1');
    expect(calls[1]!.text).toContain('from users order by created_at desc, id desc limit ? offset ?');
    expect(calls[1]!.values).toEqual([25, 25]);
    expect(await store.findByIds([])).toEqual([]);
    expect(calls).toHaveLength(2);
    expect((await store.findByIds(['u-1']))[0]!.id).toBe('u-1');
    expect(calls[2]!.text).toContain('from users where id = any(?::uuid[])');
    expect(calls[2]!.values).toEqual([['u-1']]);
  });
});
