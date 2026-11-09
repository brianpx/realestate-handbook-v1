import { describe, expect, it } from 'vitest';
import { fakeSql } from '@/lib/db/fake-sql';
import { NeonAccessStore, rowToAudit, rowToBilling, rowToGrant, rowToMembership } from './neon-store';

const NOW = new Date('2026-11-08T12:00:00Z');
const ISO = NOW.toISOString();
const STUB = { at: NOW, actorUserId: 'admin', actorKind: 'admin' as const, action: 'grant.create' as const, reason: null, ipHash: null };
const GRANT_ROW = { id: 'g', user_id: 'u', kind: 'complimentary', tier: 'pro', starts_at: ISO, ends_at: null, billing_record_id: null, granted_by: 'admin', grant_note: 'thanks', revoked_at: null, revoked_by: null, revoke_reason: null, created_at: ISO };

describe('NeonAccessStore', () => {
  it('loads grants, membership and billing in one round trip', async () => {
    const { sql, calls, transactions } = fakeSql([GRANT_ROW], [], [{ id: 'b', kind: 'purchase', tier: 'basic', status: 'paid', access_ends_at: null, current_period_end: null }]);
    const snapshot = await new NeonAccessStore(sql).loadAccess('u');
    expect(transactions).toEqual([3]);
    expect(calls.map(c => c.values)).toEqual([['u'], ['u'], ['u']]);
    expect(snapshot.grants[0]).toEqual(rowToGrant(GRANT_ROW));
    expect(snapshot.membership).toBeNull();
    expect(snapshot.billing).toEqual([{ id: 'b', kind: 'purchase', tier: 'basic', status: 'paid', accessEndsAt: null, currentPeriodEnd: null }]);
  });
  it('inserts a grant and its audit row in one statement, every value bound', async () => {
    const { sql, calls } = fakeSql([GRANT_ROW]);
    const grant = await new NeonAccessStore(sql).createGrant({ userId: 'u', kind: 'complimentary', tier: 'pro', startsAt: NOW, endsAt: null, billingRecordId: null, grantedBy: 'admin', grantNote: 'thanks', createdAt: NOW }, STUB);
    expect(calls).toHaveLength(1);
    const { text, values } = calls[0]!;
    expect(text).toContain('insert into access_grants');
    expect(text).toContain('insert into audit_log');
    expect(text).toContain("'access_grants', g.id, null, to_jsonb(g)");
    expect(values).toEqual(['u', 'complimentary', 'pro', ISO, null, null, 'admin', 'thanks', ISO, ISO, 'admin', 'admin', 'grant.create', null, null]);
    expect(grant.id).toBe('g');
    expect(grant.grantNote).toBe('thanks');
  });
  it('revokes with one conditional statement that logs only when a row changed', async () => {
    const revoked = { ...GRANT_ROW, revoked_at: ISO, revoked_by: 'admin', revoke_reason: 'abuse' };
    const { sql, calls } = fakeSql([revoked], []);
    const store = new NeonAccessStore(sql);
    expect(await store.revokeGrant('g', { at: NOW, by: 'admin', reason: 'abuse' }, { ...STUB, action: 'grant.revoke', reason: 'abuse' })).toMatchObject({ revokedAt: NOW, revokeReason: 'abuse' });
    expect(await store.revokeGrant('g', { at: NOW, by: 'admin', reason: 'abuse' }, { ...STUB, action: 'grant.revoke', reason: 'abuse' })).toBeNull();
    const { text, values } = calls[0]!;
    expect(text).toContain('where id = ? and revoked_at is null for update');
    expect(text).toContain('to_jsonb(before), to_jsonb(after)');
    expect(text).toContain('from before join after on after.id = before.id');
    expect(values).toEqual(['g', ISO, 'admin', 'abuse', ISO, 'admin', 'admin', 'grant.revoke', 'abuse', null]);
  });
  it('upserts the membership projection whole, suspension fields included', async () => {
    const { sql, calls } = fakeSql([]);
    await new NeonAccessStore(sql).saveMembership({ userId: 'u', status: 'suspended', tier: 'basic', startedAt: NOW, endsAt: null, currentGrantId: 'g', complimentary: true, suspendedAt: NOW, suspendedBy: 'admin', suspendReason: 'abuse', updatedAt: NOW });
    expect(calls[0]!.text).toContain('on conflict (user_id) do update set');
    expect(calls[0]!.text).toContain('suspended_at = excluded.suspended_at');
    expect(calls[0]!.values).toEqual(['u', 'suspended', 'basic', ISO, null, 'g', true, ISO, 'admin', 'abuse', ISO]);
  });
  it('anonymises in one statement that never carries the address into the audit row, and says whether anything changed', async () => {
    const { sql, calls } = fakeSql([{ id: 'u' }], []);
    const store = new NeonAccessStore(sql);
    const input = { userId: 'u', email: 'a@b.co', emailHash: 'h', at: NOW };
    expect(await store.anonymise(input, { ...STUB, actorKind: 'user', actorUserId: 'u', action: 'user.anonymize' })).toBe(true);
    expect(await store.anonymise(input, { ...STUB, actorKind: 'user', actorUserId: 'u', action: 'user.anonymize' })).toBe(false);
    const { text, values } = calls[0]!;
    expect(text).toContain("where id = ? and status <> 'deleted'");
    expect(text).toContain("set status = 'deleted', role = 'reader'");
    expect(text).toContain("email = 'deleted+' || users.id || '@invalid.local'");
    expect(text).toContain('delete from memberships where user_id = ? and exists (select 1 from before)');
    expect(text).toContain('delete from sessions where user_id = ? and exists (select 1 from before)');
    expect(text).toContain('delete from auth_tokens where email = ? and exists (select 1 from before)');
    expect(text).toContain('update billing_customers set email_at_provider = ?');
    expect(text).toContain("jsonb_build_object('status', before.status, 'role', before.role), jsonb_build_object('status', 'deleted', 'role', 'reader')");
    expect(values).toEqual(['u', ISO, ISO, 'u', 'u', 'a@b.co', 'h', ISO, 'u', ISO, 'u', 'user', 'user.anonymize', null, null]);
  });
  it('appends and lists audit rows', async () => {
    const row = { id: 'a', at: ISO, actor_user_id: null, actor_kind: 'system', action: 'bootstrap_admin', subject_table: 'users', subject_id: 'u', before: { role: 'reader' }, after: { role: 'admin' }, reason: null, ip_hash: null };
    const { sql, calls } = fakeSql([], [row]);
    const store = new NeonAccessStore(sql);
    await store.appendAudit({ at: NOW, actorUserId: null, actorKind: 'system', action: 'bootstrap_admin', subjectTable: 'users', subjectId: 'u', before: null, after: { role: 'admin' }, reason: null, ipHash: null });
    expect(calls[0]!.text).toContain('insert into audit_log');
    expect(calls[0]!.values).toEqual([ISO, null, 'system', 'bootstrap_admin', 'users', 'u', null, '{"role":"admin"}', null, null]);
    expect(await store.listAudit('users', 'u')).toEqual([rowToAudit(row)]);
    expect(calls[1]!.values).toEqual(['users', 'u']);
  });
  it('maps rows', () => {
    expect(rowToMembership({ user_id: 'u', status: 'active', tier: 'pro', started_at: ISO, ends_at: null, current_grant_id: 'g', complimentary: false, suspended_at: null, suspended_by: null, suspend_reason: null, updated_at: ISO }))
      .toEqual({ userId: 'u', status: 'active', tier: 'pro', startedAt: NOW, endsAt: null, currentGrantId: 'g', complimentary: false, suspendedAt: null, suspendedBy: null, suspendReason: null, updatedAt: NOW });
    expect(rowToBilling({ id: 'b', kind: 'subscription', tier: 'pro', status: 'active', access_ends_at: null, current_period_end: ISO }))
      .toEqual({ id: 'b', kind: 'subscription', tier: 'pro', status: 'active', accessEndsAt: null, currentPeriodEnd: NOW });
  });
});
