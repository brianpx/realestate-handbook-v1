import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
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

  afterAll(async () => {
    await sql`delete from audit_log where subject_id in (select id from users where email like ${`it-${tag}%`} or email like ${`deleted+%`})`;
    await sql`delete from memberships where user_id in (select id from users where email like ${`it-${tag}%`})`;
    await sql`delete from access_grants where user_id in (select id from users where email like ${`it-${tag}%`})`;
    await sql`delete from users where email like ${`it-${tag}%`}`;
  });

  it('writes a grant with its audit row, revokes it exactly once under two concurrent attempts, and projects the membership', async () => {
    const { user } = await users.upsertVerified({ email, termsVersion: 'v1', at: NOW });
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
    const { user } = await users.upsertVerified({ email: `it-${tag}-c@integration.test`, termsVersion: 'v1', at: NOW });
    const stub = { at: NOW, actorUserId: null, actorKind: 'system' as const, action: 'grant.create' as const, reason: null, ipHash: null };
    // a complimentary grant needs a granter; a paid grant needs a billing record; the tier is basic or pro
    await expect(access.createGrant({ userId: user.id, kind: 'complimentary', tier: 'basic', startsAt: NOW, endsAt: null, billingRecordId: null, grantedBy: null, grantNote: null, createdAt: NOW }, stub)).rejects.toThrow();
    await expect(access.createGrant({ userId: user.id, kind: 'purchase', tier: 'basic', startsAt: NOW, endsAt: null, billingRecordId: null, grantedBy: null, grantNote: null, createdAt: NOW }, stub)).rejects.toThrow();
    await expect(sql`insert into access_grants (user_id, kind, tier, granted_by) values (${user.id}, 'promo', 'gold', ${user.id})`).rejects.toThrow();
    expect(await access.listAudit('access_grants', user.id)).toHaveLength(0); // nothing half-written
  });

  it('anonymises in one batch: the row is marked deleted, sessions and tokens go, grants and the audit stay', async () => {
    const victim = `it-${tag}-d@integration.test`;
    const { user } = await users.upsertVerified({ email: victim, termsVersion: 'v1', at: NOW });
    await bootstrapOwnerGrant(access, user.id, NOW);
    const raw = newSecret();
    await auth.createSession({ idHash: hashSecret(raw), userId: user.id, createdAt: NOW, expiresAt: sessionExpiry(NOW) });
    await auth.createToken({ tokenHash: hashSecret(newSecret()), email: victim, nextPath: null, termsVersion: 'v1', source: null, expiresAt: NOW, createdIpHash: null, createdAt: NOW });

    const stub = { at: NOW, actorUserId: user.id, actorKind: 'user' as const, action: 'user.anonymize' as const, reason: null, ipHash: null };
    expect(await access.anonymise({ userId: user.id, email: victim, emailHash: 'h', at: NOW }, stub)).toBe(true);
    expect(await access.anonymise({ userId: user.id, email: victim, emailHash: 'h', at: NOW }, stub)).toBe(false);

    const after = await users.findById(user.id);
    expect(after).toMatchObject({ status: 'deleted', email: `deleted+${user.id}@invalid.local` });
    expect(await auth.findSession(hashSecret(raw))).toBeNull();
    expect(await sql`select 1 from auth_tokens where email = ${victim}`).toHaveLength(0);
    expect(await access.listGrants(user.id)).toHaveLength(1);
    const log = await access.listAudit('users', user.id);
    expect(log.map(a => a.action)).toEqual(['user.anonymize']);
    expect(JSON.stringify(log)).not.toContain(victim);
    // the audit log is append-only in the application; the database still has no trigger, so this only checks our own code path
    expect(await sql`select count(*)::int as n from audit_log where subject_id = ${user.id}`).toEqual([{ n: 2 }]); // grant.create + user.anonymize
  });
});
