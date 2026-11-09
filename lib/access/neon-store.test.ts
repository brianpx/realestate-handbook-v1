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
  it('pages the whole log and summarises access for a set of users, each in one round trip', async () => {
    const audit = { id: 'a', at: ISO, actor_user_id: 'admin', actor_kind: 'admin', action: 'role.set', subject_table: 'users', subject_id: 'u', before: { role: 'reader' }, after: { role: 'admin' }, reason: null, ip_hash: null };
    const membership = { user_id: 'u', status: 'active', tier: 'pro', started_at: ISO, ends_at: null, current_grant_id: 'g', complimentary: true, suspended_at: null, suspended_by: null, suspend_reason: null, updated_at: ISO };
    const { sql, calls, transactions } = fakeSql([{ n: 3 }], [audit], [membership], [{ user_id: 'u', n: 2 }]);
    const store = new NeonAccessStore(sql);
    expect(await store.listAuditLog({ offset: 50, limit: 25 })).toEqual({ rows: [rowToAudit(audit)], total: 3 });
    expect(calls[1]!.text).toContain('from audit_log order by at desc, id desc limit ? offset ?');
    expect(calls[1]!.values).toEqual([25, 50]);
    expect(await store.accessSummaries(['u', 'v'])).toEqual([
      { userId: 'u', membership: rowToMembership(membership), billingRecords: 2 },
      { userId: 'v', membership: null, billingRecords: 0 },
    ]);
    expect(calls[2]!.values).toEqual([['u', 'v']]);
    expect(calls[3]!.text).toContain('from billing_records where user_id = any(?::uuid[]) group by user_id');
    expect(transactions).toEqual([2, 2]);
    expect(await store.accessSummaries([])).toEqual([]);
    expect(calls).toHaveLength(4);
  });
  it('sets a role with one conditional statement that logs only when the row changed', async () => {
    const { sql, calls } = fakeSql([{ id: 'u', role: 'admin' }], []);
    const store = new NeonAccessStore(sql);
    const stub = { ...STUB, action: 'role.set' as const };
    expect(await store.setUserRole('u', 'admin', NOW, stub)).toBe(true);
    expect(await store.setUserRole('u', 'admin', NOW, stub)).toBe(false);
    const { text, values } = calls[0]!;
    expect(text).toContain("where id = ? and role <> ? and status <> 'deleted' for update");
    expect(text).toContain("jsonb_build_object('role', before.role), jsonb_build_object('role', changed.role)");
    expect(text).toContain('from before join changed on changed.id = before.id');
    expect(values).toEqual(['u', 'admin', 'admin', ISO, ISO, 'admin', 'admin', 'role.set', null, null]);
  });
  it('disables with the triple and the sessions gone, enables with the triple cleared, each conditional on the state left', async () => {
    const { sql, calls } = fakeSql([{ id: 'u' }], [], [{ id: 'u' }], []);
    const store = new NeonAccessStore(sql);
    const disabled = { ...STUB, action: 'user.disable' as const, reason: 'Abuse' };
    expect(await store.disableUser('u', { at: NOW, by: 'admin', reason: 'Abuse' }, disabled)).toBe(true);
    expect(await store.disableUser('u', { at: NOW, by: 'admin', reason: 'Abuse' }, disabled)).toBe(false);
    expect(calls[0]!.text).toContain("where id = ? and status = 'active' for update");
    expect(calls[0]!.text).toContain("set status = 'disabled', disabled_at = ?, disabled_by = ?, disable_reason = ?, updated_at = ?");
    expect(calls[0]!.text).toContain('delete from sessions where user_id = ? and exists (select 1 from before)');
    expect(calls[0]!.text).toContain("jsonb_build_object('status', 'active'), jsonb_build_object('status', 'disabled')");
    expect(calls[0]!.values).toEqual(['u', ISO, 'admin', 'Abuse', ISO, 'u', ISO, 'admin', 'admin', 'user.disable', 'Abuse', null]);
    const enabled = { ...STUB, action: 'user.enable' as const };
    expect(await store.enableUser('u', NOW, enabled)).toBe(true);
    expect(await store.enableUser('u', NOW, enabled)).toBe(false);
    expect(calls[2]!.text).toContain("where id = ? and status = 'disabled' for update");
    expect(calls[2]!.text).toContain("set status = 'active', disabled_at = null, disabled_by = null, disable_reason = null, updated_at = ?");
    expect(calls[2]!.values).toEqual(['u', ISO, ISO, 'admin', 'admin', 'user.enable', null, null]);
  });
  it('suspends by upsert (a reader without a projection row gets one) and lifts with the status the grants decide', async () => {
    const suspended = { user_id: 'u', status: 'suspended', tier: null, started_at: null, ends_at: null, current_grant_id: null, complimentary: false, suspended_at: ISO, suspended_by: 'admin', suspend_reason: 'Hold', updated_at: ISO };
    const { sql, calls } = fakeSql([suspended], [], [{ ...suspended, status: 'none', suspended_at: null, suspended_by: null, suspend_reason: null }], []);
    const store = new NeonAccessStore(sql);
    const hold = { ...STUB, action: 'membership.suspend' as const, reason: 'Hold' };
    expect(await store.suspend('u', { at: NOW, by: 'admin', reason: 'Hold' }, hold)).toMatchObject({ status: 'suspended', suspendedAt: NOW, suspendReason: 'Hold' });
    expect(await store.suspend('u', { at: NOW, by: 'admin', reason: 'Hold' }, hold)).toBeNull();
    expect(calls[0]!.text).toContain("on conflict (user_id) do update set status = 'suspended'");
    expect(calls[0]!.text).toContain('where memberships.suspended_at is null returning');
    expect(calls[0]!.text).toContain('(select to_jsonb(before) from before), to_jsonb(after)');
    expect(calls[0]!.values).toEqual(['u', 'u', ISO, 'admin', 'Hold', ISO, ISO, 'admin', 'admin', 'membership.suspend', 'Hold', null]);
    const lift = { ...STUB, action: 'membership.unsuspend' as const };
    expect(await store.unsuspend('u', NOW, lift)).toMatchObject({ status: 'none', suspendedAt: null });
    expect(await store.unsuspend('u', NOW, lift)).toBeNull();
    expect(calls[2]!.text).toContain('where user_id = ? and suspended_at is not null for update');
    expect(calls[2]!.text).toContain('set suspended_at = null, suspended_by = null, suspend_reason = null, updated_at = ?, status = case');
    expect(calls[2]!.text).toContain("then 'active' when exists (select 1 from access_grants g where g.user_id = m.user_id) then 'lapsed' else 'none' end");
    expect(calls[2]!.values).toEqual(['u', ISO, ISO, ISO, ISO, 'admin', 'admin', 'membership.unsuspend', null, null]);
  });
  it('links a billing record once and tells an unknown record from one already linked', async () => {
    const { sql, calls } = fakeSql([{ id: 'b', changed: true }], [{ id: 'b', changed: false }], []);
    const store = new NeonAccessStore(sql);
    const stub = { ...STUB, action: 'billing.link_user' as const };
    expect(await store.linkBilling('b', 'u', NOW, stub)).toEqual({ changed: true });
    expect(await store.linkBilling('b', 'u', NOW, stub)).toEqual({ changed: false });
    expect(await store.linkBilling('b', 'u', NOW, stub)).toBeNull();
    const { text, values } = calls[0]!;
    expect(text).toContain('from found where b.id = found.id and found.user_id is distinct from ?::uuid');
    expect(text).toContain("jsonb_build_object('userId', found.user_id::text), jsonb_build_object('userId', ?::text)");
    expect(text).toContain('select found.id, (changed.id is not null) as changed from found left join changed on changed.id = found.id');
    expect(values).toEqual(['b', 'u', ISO, 'u', ISO, 'admin', 'admin', 'billing.link_user', 'u', null, null]);
  });
  it('maps rows', () => {
    expect(rowToMembership({ user_id: 'u', status: 'active', tier: 'pro', started_at: ISO, ends_at: null, current_grant_id: 'g', complimentary: false, suspended_at: null, suspended_by: null, suspend_reason: null, updated_at: ISO }))
      .toEqual({ userId: 'u', status: 'active', tier: 'pro', startedAt: NOW, endsAt: null, currentGrantId: 'g', complimentary: false, suspendedAt: null, suspendedBy: null, suspendReason: null, updatedAt: NOW });
    expect(rowToBilling({ id: 'b', kind: 'subscription', tier: 'pro', status: 'active', access_ends_at: null, current_period_end: ISO }))
      .toEqual({ id: 'b', kind: 'subscription', tier: 'pro', status: 'active', accessEndsAt: null, currentPeriodEnd: NOW });
  });
});
