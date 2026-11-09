import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import type { AuditAction } from '@/lib/audit';
import { NeonAuthStore } from '@/lib/auth/neon-store';
import { sessionExpiry } from '@/lib/auth/session';
import { hashSecret, newSecret } from '@/lib/auth/token';
import { sqlFromUrl } from '@/lib/db/sql';
import { NeonUserStore } from '@/lib/users/neon-store';
import { bootstrapOwnerGrant, grantAccess, revokeAccess } from './grants';
import { NeonAccessStore } from './neon-store';

// Runs against a real Neon database with db/migrations/002 and 003 applied, so it only runs when TEST_DATABASE_URL
// is set (a branch, never production). It writes rows with random names and removes them afterwards.
const url = process.env.TEST_DATABASE_URL;
const run = url ? describe : describe.skip;

run('the access store against a real database', () => {
  const sql = sqlFromUrl(url!);
  const users = new NeonUserStore(sql);
  const auth = new NeonAuthStore(sql);
  const access = new NeonAccessStore(sql);
  const tag = randomUUID().slice(0, 8);
  const email = `it-${tag}@integration.test`;
  const NOW = new Date();
  const ADMIN = { kind: 'admin' as const, userId: null };
  // every user this run creates, so the cleanup touches nothing of another run's (an anonymised row no longer carries the tag)
  const created: string[] = [];
  const createUser = async (address: string) => {
    const { user } = await users.upsertVerified({ email: address, termsVersion: 'v1', at: NOW });
    created.push(user.id);
    return user;
  };

  afterAll(async () => {
    if (created.length === 0) return;
    await sql`delete from audit_log where subject_id = any(${created}::uuid[]) or subject_id in (select id from access_grants where user_id = any(${created}::uuid[])) or subject_id in (select id from billing_records where user_id = any(${created}::uuid[]))`;
    await sql`delete from billing_records where user_id = any(${created}::uuid[])`;
    await sql`delete from memberships where user_id = any(${created}::uuid[])`;
    await sql`delete from access_grants where user_id = any(${created}::uuid[])`;
    await sql`delete from users where id = any(${created}::uuid[])`;
  });

  it('writes a grant with its audit row, revokes it exactly once under two concurrent attempts, and projects the membership', async () => {
    const user = await createUser(email);
    const grant = await grantAccess(access, { userId: user.id, kind: 'complimentary', tier: 'pro', grantedBy: user.id, grantNote: 'integration' }, ADMIN, NOW);
    expect(grant.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(await access.listAudit('access_grants', grant.id)).toHaveLength(1);
    expect(await access.findMembership(user.id)).toMatchObject({ status: 'active', tier: 'pro', currentGrantId: grant.id });

    const results = await Promise.all([
      revokeAccess(access, { grantId: grant.id, reason: 'admin' }, ADMIN, new Date()),
      revokeAccess(access, { grantId: grant.id, reason: 'abuse' }, ADMIN, new Date()),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect((await access.listAudit('access_grants', grant.id)).map(a => a.action)).toEqual(['grant.create', 'grant.revoke']);
    expect(await access.findMembership(user.id)).toMatchObject({ status: 'lapsed', currentGrantId: null });
  });

  it('enforces the check constraints the code relies on', async () => {
    const user = await createUser(`it-${tag}-c@integration.test`);
    const stub = { at: NOW, actorUserId: null, actorKind: 'system' as const, action: 'grant.create' as const, reason: null, ipHash: null };
    // a complimentary grant needs a granter; a paid grant needs a billing record; the tier is basic or pro
    await expect(access.createGrant({ userId: user.id, kind: 'complimentary', tier: 'basic', startsAt: NOW, endsAt: null, billingRecordId: null, grantedBy: null, grantNote: null, createdAt: NOW }, stub)).rejects.toThrow();
    await expect(access.createGrant({ userId: user.id, kind: 'purchase', tier: 'basic', startsAt: NOW, endsAt: null, billingRecordId: null, grantedBy: null, grantNote: null, createdAt: NOW }, stub)).rejects.toThrow();
    await expect(sql`insert into access_grants (user_id, kind, tier, granted_by) values (${user.id}, 'promo', 'gold', ${user.id})`).rejects.toThrow();
    expect(await access.listAudit('access_grants', user.id)).toHaveLength(0); // nothing half-written
  });

  it('anonymises in one batch: the row is marked deleted, sessions and tokens go, grants and the audit stay', async () => {
    const victim = `it-${tag}-d@integration.test`;
    const user = await createUser(victim);
    await users.setRole(user.id, 'admin', NOW);
    await bootstrapOwnerGrant(access, user.id, NOW);
    const raw = newSecret();
    await auth.createSession({ idHash: hashSecret(raw), userId: user.id, createdAt: NOW, expiresAt: sessionExpiry(NOW) });
    await auth.createToken({ tokenHash: hashSecret(newSecret()), email: victim, nextPath: null, termsVersion: 'v1', source: null, expiresAt: NOW, createdIpHash: null, createdAt: NOW });

    const stub = { at: NOW, actorUserId: user.id, actorKind: 'user' as const, action: 'user.anonymize' as const, reason: null, ipHash: null };
    expect(await access.anonymise({ userId: user.id, email: victim, emailHash: 'h', at: NOW }, stub)).toBe(true);
    expect(await access.anonymise({ userId: user.id, email: victim, emailHash: 'h', at: NOW }, stub)).toBe(false);

    const after = await users.findById(user.id);
    expect(after).toMatchObject({ status: 'deleted', role: 'reader', email: `deleted+${user.id}@invalid.local` });
    expect(await access.findMembership(user.id)).toBeNull();
    expect(await auth.findSession(hashSecret(raw))).toBeNull();
    expect(await sql`select 1 from auth_tokens where email = ${victim}`).toHaveLength(0);
    expect(await access.listGrants(user.id)).toHaveLength(1);
    const log = await access.listAudit('users', user.id);
    expect(log.map(a => a.action)).toEqual(['user.anonymize']);
    expect(JSON.stringify(log)).not.toContain(victim);
    // the grant's own row is filed under the grant id; the user's row is the one anonymisation wrote
    expect(await sql`select count(*)::int as n from audit_log where subject_id = ${user.id}`).toEqual([{ n: 1 }]);
    expect(await sql`select count(*)::int as n from audit_log where subject_table = 'access_grants' and subject_id in (select id from access_grants where user_id = ${user.id})`).toEqual([{ n: 1 }]);
  });

  it('runs each admin state-setter once: the repeat changes nothing and logs nothing, and the lists page', async () => {
    const user = await createUser(`it-${tag}-e@integration.test`);
    const actor = await createUser(`it-${tag}-f@integration.test`);
    const stub = (action: AuditAction, reason: string | null = null) => ({ at: NOW, actorUserId: actor.id, actorKind: 'admin' as const, action, reason, ipHash: null });

    expect(await access.setUserRole(user.id, 'admin', NOW, stub('role.set'))).toBe(true);
    expect(await access.setUserRole(user.id, 'admin', NOW, stub('role.set'))).toBe(false);
    expect((await users.findById(user.id))?.role).toBe('admin');

    const raw = newSecret();
    await auth.createSession({ idHash: hashSecret(raw), userId: user.id, createdAt: NOW, expiresAt: sessionExpiry(NOW) });
    const disablement = { at: NOW, by: actor.id, reason: 'integration' };
    expect(await access.disableUser(user.id, disablement, stub('user.disable', 'integration'))).toBe(true);
    expect(await access.disableUser(user.id, disablement, stub('user.disable', 'integration'))).toBe(false);
    expect((await users.findById(user.id))?.status).toBe('disabled');
    expect(await auth.findSession(hashSecret(raw))).toBeNull();
    expect(await access.enableUser(user.id, NOW, stub('user.enable'))).toBe(true);
    expect(await access.enableUser(user.id, NOW, stub('user.enable'))).toBe(false);
    expect((await users.findById(user.id))?.status).toBe('active');

    // suspended before any grant exists, so the projection row is inserted; a grant made meanwhile shows through when lifted
    const suspension = { at: NOW, by: actor.id, reason: 'hold' };
    expect(await access.suspend(user.id, suspension, stub('membership.suspend', 'hold'))).toMatchObject({ status: 'suspended', tier: null, suspendReason: 'hold' });
    expect(await access.suspend(user.id, suspension, stub('membership.suspend', 'hold'))).toBeNull();
    await grantAccess(access, { userId: user.id, kind: 'complimentary', tier: 'basic', grantedBy: actor.id }, ADMIN, NOW);
    expect(await access.findMembership(user.id)).toMatchObject({ status: 'suspended', tier: 'basic' });
    expect(await access.unsuspend(user.id, NOW, stub('membership.unsuspend'))).toMatchObject({ status: 'active', tier: 'basic', suspendedAt: null, suspendedBy: null, suspendReason: null });
    expect(await access.unsuspend(user.id, NOW, stub('membership.unsuspend'))).toBeNull();

    const inserted = await sql`insert into billing_records (kind, provider, provider_object_id, product_key, tier, status) values ('purchase', 'manual', ${`it-${tag}`}, 'handbook', 'basic', 'paid') returning id`;
    const recordId = String(inserted[0]!.id);
    expect(await access.linkBilling(recordId, user.id, NOW, stub('billing.link_user'))).toEqual({ changed: true });
    expect(await access.linkBilling(recordId, user.id, NOW, stub('billing.link_user'))).toEqual({ changed: false });
    expect(await access.linkBilling(randomUUID(), user.id, NOW, stub('billing.link_user'))).toBeNull();

    // rows written at the same instant have no order between them, so the sets are compared
    expect((await access.listAudit('users', user.id)).map(a => a.action).sort()).toEqual(['role.set', 'user.disable', 'user.enable']);
    expect((await access.listAudit('memberships', user.id)).map(a => a.action).sort()).toEqual(['membership.suspend', 'membership.unsuspend']);
    expect((await access.listAudit('billing_records', recordId)).map(a => a.action)).toEqual(['billing.link_user']);
    const page = await access.listAuditLog({ offset: 0, limit: 5 });
    expect(page.total).toBeGreaterThanOrEqual(7);
    expect(page.rows).toHaveLength(5);
    expect(await access.accessSummaries([user.id, actor.id])).toMatchObject([{ userId: user.id, membership: { status: 'active', tier: 'basic' }, billingRecords: 1 }, { userId: actor.id, membership: null, billingRecords: 0 }]);
    const listed = await users.list({ offset: 0, limit: 5 });
    expect(listed.total).toBeGreaterThanOrEqual(2);
    expect(listed.users.length).toBeLessThanOrEqual(5);
    expect((await users.findByIds([user.id, actor.id])).map(u => u.id).sort()).toEqual([user.id, actor.id].sort());
  });
});
