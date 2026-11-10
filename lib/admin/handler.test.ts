import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { grantAccess } from '@/lib/access/grants';
import { MemoryAccessStore } from '@/lib/access/memory-store';
import { MemoryAuthStore } from '@/lib/auth/memory-store';
import { sessionExpiry } from '@/lib/auth/session';
import { hashSecret, newSecret } from '@/lib/auth/token';
import { MemoryUserStore } from '@/lib/users/store';
import { handleAdminAction, type AdminDeps } from './handler';

const NOW = new Date('2026-11-08T12:00:00Z');
const ORIGIN = 'https://handbook.example';

async function setup() {
  const users = new MemoryUserStore();
  const auth = new MemoryAuthStore();
  const access = new MemoryAccessStore({ users, auth });
  const deps: AdminDeps = { stores: { users, auth, access }, allowedOrigins: [ORIGIN], ipSalt: 's', now: () => NOW };
  const signIn = async (email: string) => {
    const { user } = await users.upsertVerified({ email, termsVersion: 'v1', at: NOW });
    const sessionId = newSecret();
    await auth.createSession({ idHash: hashSecret(sessionId), userId: user.id, createdAt: NOW, expiresAt: sessionExpiry(NOW) });
    return { user, sessionId };
  };
  const admin = await signIn('admin@example.com');
  await users.setRole(admin.user.id, 'admin');
  const reader = await signIn('reader@example.com');
  type Extra = { userId?: string; sessionId?: string; origin?: string | null; deps?: AdminDeps };
  const post = (action: string, body: unknown = {}, extra: Extra = {}) =>
    handleAdminAction(
      {
        url: `${ORIGIN}/api/admin/users/x/${action}`,
        origin: 'origin' in extra ? (extra.origin ?? null) : ORIGIN,
        ip: '203.0.113.9',
        body: typeof body === 'string' ? body : JSON.stringify(body),
        sessionId: 'sessionId' in extra ? extra.sessionId : admin.sessionId,
      },
      { userId: extra.userId ?? reader.user.id, action },
      extra.deps ?? deps,
    );
  return { users, auth, access, deps, admin, reader, post };
}

describe('who may act', () => {
  it('refuses a foreign or missing origin, a stranger and a signed-in reader, and is 503 without stores', async () => {
    const { post, deps, reader, access } = await setup();
    expect((await post('set-role', { role: 'admin' }, { origin: 'https://evil.example' })).status).toBe(403);
    expect((await post('set-role', { role: 'admin' }, { origin: null })).status).toBe(403);
    expect((await post('set-role', { role: 'admin' }, { sessionId: undefined })).status).toBe(403);
    expect((await post('set-role', { role: 'admin' }, { sessionId: newSecret() })).status).toBe(403);
    expect((await post('set-role', { role: 'admin' }, { sessionId: reader.sessionId })).status).toBe(403);
    expect((await post('set-role', { role: 'admin' }, { deps: { ...deps, stores: null } })).status).toBe(503);
    expect((await post('set-role', 'x'.repeat(5000))).status).toBe(413);
    expect(reader.user.role).toBe('reader');
    expect(access.audit).toHaveLength(0);
  });
  it('is a 404 for an unknown action, a malformed or unknown id, and 400 for a body that does not fit', async () => {
    const { post, access } = await setup();
    expect((await post('explode')).status).toBe(404);
    expect((await post('set-role', { role: 'admin' }, { userId: 'nope' })).status).toBe(404);
    expect((await post('set-role', { role: 'admin' }, { userId: randomUUID() })).status).toBe(404);
    const bad = await post('set-role', { role: 'king' });
    expect(bad.status).toBe(400);
    expect(bad.body).toMatchObject({ ok: false, error: 'invalid_request' });
    expect((await post('set-role', 'not json')).status).toBe(400);
    expect((await post('set-role', '[1]')).status).toBe(400);
    expect(access.audit).toHaveLength(0);
  });
  it('is a 503 when the store fails', async () => {
    const { post, access } = await setup();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      access.failWith = new Error('db down');
      expect((await post('set-role', { role: 'admin' })).status).toBe(503);
    } finally {
      spy.mockRestore();
    }
  });
});

describe('set-role', () => {
  it('changes the role once with one audit row, says so when nothing changed, and never changes the acting admin', async () => {
    const { post, users, access, admin, reader } = await setup();
    const res = await post('set-role', { role: 'admin' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, changed: true });
    expect((await users.findById(reader.user.id))?.role).toBe('admin');
    expect(access.audit).toHaveLength(1);
    expect(access.audit[0]).toMatchObject({ action: 'role.set', actorKind: 'admin', actorUserId: admin.user.id, subjectTable: 'users', subjectId: reader.user.id, before: { role: 'reader' }, after: { role: 'admin' } });
    expect(access.audit[0]!.ipHash).toMatch(/^[0-9a-f]+$/);
    expect(access.audit[0]!.ipHash).not.toContain('203.0.113.9');

    const again = await post('set-role', { role: 'admin' });
    expect(again.status).toBe(200);
    expect(again.body).toEqual({ ok: true, changed: false });
    expect(access.audit).toHaveLength(1);

    const self = await post('set-role', { role: 'reader' }, { userId: admin.user.id });
    expect(self.status).toBe(400);
    expect(self.body).toMatchObject({ error: 'self_change' });
    expect((await users.findById(admin.user.id))?.role).toBe('admin');
    expect(access.audit).toHaveLength(1);
  });
});

describe('set-status', () => {
  it('disables with a reason (sessions gone), enables again, each once, and refuses self and deleted accounts', async () => {
    const { post, users, auth, access, admin, reader } = await setup();
    const noReason = await post('set-status', { status: 'disabled' });
    expect(noReason.status).toBe(400);
    expect(noReason.body).toMatchObject({ error: 'invalid_request', message: 'disabling needs a reason' });

    expect((await post('set-status', { status: 'disabled', reason: 'Chargeback' })).body).toEqual({ ok: true, changed: true });
    expect((await users.findById(reader.user.id))?.status).toBe('disabled');
    expect(auth.sessions.filter(s => s.userId === reader.user.id)).toHaveLength(0);
    expect(auth.sessions.filter(s => s.userId === admin.user.id)).toHaveLength(1);
    expect(access.audit).toHaveLength(1);
    expect(access.audit[0]).toMatchObject({ action: 'user.disable', reason: 'Chargeback', subjectId: reader.user.id, before: { status: 'active' }, after: { status: 'disabled' } });
    expect((await post('set-status', { status: 'disabled', reason: 'Again' })).body).toEqual({ ok: true, changed: false });
    expect(access.audit).toHaveLength(1);

    expect((await post('set-status', { status: 'active' })).body).toEqual({ ok: true, changed: true });
    expect((await users.findById(reader.user.id))?.status).toBe('active');
    expect(access.audit.map(a => a.action)).toEqual(['user.disable', 'user.enable']);
    expect((await post('set-status', { status: 'active' })).body).toEqual({ ok: true, changed: false });
    expect(access.audit).toHaveLength(2);

    const self = await post('set-status', { status: 'disabled', reason: 'Oops' }, { userId: admin.user.id });
    expect(self.status).toBe(400);
    expect(self.body).toMatchObject({ error: 'self_change' });
    expect((await users.findById(admin.user.id))?.status).toBe('active');

    await access.anonymise({ userId: reader.user.id, email: reader.user.email, emailHash: 'h', at: NOW }, { at: NOW, actorUserId: null, actorKind: 'system', action: 'user.anonymize', reason: null, ipHash: null });
    expect((await post('set-status', { status: 'active' })).body).toMatchObject({ error: 'account_deleted' });
    expect((await post('set-role', { role: 'admin' })).body).toMatchObject({ error: 'account_deleted' });
  });
});

describe('create-grant and revoke-grant', () => {
  it('grants by the admin once, refuses the same grant twice, revokes once, and only this user\'s grants', async () => {
    const { post, access, admin, reader } = await setup();
    const made = await post('create-grant', { kind: 'complimentary', tier: 'pro', grantNote: 'Beta reader' });
    expect(made.status).toBe(200);
    expect(made.body).toMatchObject({ ok: true, changed: true });
    const grantId = String(made.body?.grantId);
    expect(access.grants[0]).toMatchObject({ id: grantId, userId: reader.user.id, kind: 'complimentary', tier: 'pro', endsAt: null, grantedBy: admin.user.id, grantNote: 'Beta reader' });
    expect(access.memberships[0]).toMatchObject({ userId: reader.user.id, status: 'active', tier: 'pro' });
    expect(access.audit).toHaveLength(1);
    expect(access.audit[0]).toMatchObject({ action: 'grant.create', actorUserId: admin.user.id, subjectId: grantId, reason: 'Beta reader' });

    expect((await post('create-grant', { kind: 'complimentary', tier: 'pro' })).body).toEqual({ ok: true, changed: false, grantId });
    expect(access.grants).toHaveLength(1);
    expect(access.audit).toHaveLength(1);
    // a different end date is a different grant
    const dated = await post('create-grant', { kind: 'promo', tier: 'basic', endsAt: '2027-01-01T00:00:00Z' });
    expect(dated.body).toMatchObject({ changed: true });
    expect(access.grants[1]).toMatchObject({ kind: 'promo', tier: 'basic', endsAt: new Date('2027-01-01T00:00:00Z') });
    expect((await post('create-grant', { kind: 'promo', tier: 'gold' })).status).toBe(400);
    const past = await post('create-grant', { kind: 'promo', tier: 'basic', endsAt: '2026-11-08T12:00:00Z' });
    expect(past.status).toBe(400);
    expect(past.body).toMatchObject({ message: 'ends before it starts' });
    expect(access.grants).toHaveLength(2);

    expect((await post('revoke-grant', { grantId, reason: 'admin' })).body).toEqual({ ok: true, changed: true });
    expect(access.grants[0]).toMatchObject({ revokedAt: NOW, revokedBy: admin.user.id, revokeReason: 'admin' });
    expect(access.audit.map(a => a.action)).toEqual(['grant.create', 'grant.create', 'grant.revoke']);
    expect((await post('revoke-grant', { grantId, reason: 'abuse' })).body).toEqual({ ok: true, changed: false });
    expect(access.audit).toHaveLength(3);

    const other = await grantAccess(access, { userId: admin.user.id, kind: 'complimentary', tier: 'pro', grantedBy: admin.user.id }, { kind: 'system', userId: null }, NOW);
    expect((await post('revoke-grant', { grantId: other.id, reason: 'admin' })).status).toBe(404);
    expect(access.grants.find(g => g.id === other.id)?.revokedAt).toBeNull();
    expect((await post('revoke-grant', { grantId, reason: 'because' })).status).toBe(400);
  });
});

describe('suspend and unsuspend', () => {
  it('pauses paid content once with a reason, and lifts it once, each with its audit row', async () => {
    const { post, access, admin, reader } = await setup();
    await grantAccess(access, { userId: reader.user.id, kind: 'complimentary', tier: 'basic', grantedBy: admin.user.id }, { kind: 'system', userId: null }, NOW);
    expect((await post('suspend', {})).status).toBe(400);
    expect((await post('suspend', { reason: 'Shared the sign-in link' })).body).toEqual({ ok: true, changed: true });
    expect(access.memberships[0]).toMatchObject({ userId: reader.user.id, status: 'suspended', tier: 'basic', suspendedAt: NOW, suspendedBy: admin.user.id, suspendReason: 'Shared the sign-in link' });
    expect(access.audit.at(-1)).toMatchObject({ action: 'membership.suspend', subjectTable: 'memberships', subjectId: reader.user.id, reason: 'Shared the sign-in link', before: expect.objectContaining({ status: 'active' }), after: expect.objectContaining({ status: 'suspended' }) });
    expect((await post('suspend', { reason: 'Again' })).body).toEqual({ ok: true, changed: false });
    expect(access.audit).toHaveLength(2);

    expect((await post('unsuspend')).body).toEqual({ ok: true, changed: true });
    expect(access.memberships[0]).toMatchObject({ status: 'active', suspendedAt: null, suspendedBy: null, suspendReason: null });
    expect(access.audit.at(-1)).toMatchObject({ action: 'membership.unsuspend', before: expect.objectContaining({ status: 'suspended' }), after: expect.objectContaining({ status: 'active' }) });
    expect((await post('unsuspend')).body).toEqual({ ok: true, changed: false });
    expect(access.audit).toHaveLength(3);
  });
  it('suspends a reader who has no projection row yet, and the row says none once lifted', async () => {
    const { post, access, reader } = await setup();
    expect((await post('suspend', { reason: 'Hold' })).body).toEqual({ ok: true, changed: true });
    expect(access.memberships[0]).toMatchObject({ userId: reader.user.id, status: 'suspended', tier: null });
    expect(access.audit[0]).toMatchObject({ action: 'membership.suspend', before: null });
    expect((await post('unsuspend')).body).toEqual({ ok: true, changed: true });
    expect(access.memberships[0]).toMatchObject({ status: 'none', suspendedAt: null });
  });
  it('lifting recomputes the projection, so a grant that ran out while suspended no longer shows as current', async () => {
    const { post, access, admin, reader, deps } = await setup();
    const grant = await grantAccess(access, { userId: reader.user.id, kind: 'promo', tier: 'basic', grantedBy: admin.user.id, endsAt: new Date('2026-11-10T12:00:00Z') }, { kind: 'system', userId: null }, NOW);
    expect((await post('suspend', { reason: 'Hold' })).body).toEqual({ ok: true, changed: true });
    expect(access.memberships[0]).toMatchObject({ status: 'suspended', currentGrantId: grant.id });
    deps.now = () => new Date('2026-11-11T12:00:00Z');
    expect((await post('unsuspend')).body).toEqual({ ok: true, changed: true });
    expect(access.memberships[0]).toMatchObject({ status: 'lapsed', tier: null, currentGrantId: null, endsAt: null });
  });
  it('a deleted account cannot be suspended, so no projection row is made for it', async () => {
    const { post, access, reader } = await setup();
    await access.anonymise({ userId: reader.user.id, email: reader.user.email, emailHash: 'h', at: NOW }, { at: NOW, actorUserId: null, actorKind: 'system', action: 'user.anonymize', reason: null, ipHash: null });
    expect((await post('suspend', { reason: 'Hold' })).body).toMatchObject({ error: 'account_deleted' });
    expect(access.memberships).toHaveLength(0);
  });
});

describe('billing', () => {
  it('links a record to the user once, 404 for an unknown record', async () => {
    const { post, access, reader, admin } = await setup();
    const record = { id: randomUUID(), kind: 'purchase' as const, tier: 'basic' as const, status: 'paid' as const, accessEndsAt: null, currentPeriodEnd: null, userId: null };
    access.billing.push(record);
    expect((await post('link-billing', { billingRecordId: record.id })).body).toEqual({ ok: true, changed: true });
    expect(record.userId).toBe(reader.user.id);
    expect(access.audit[0]).toMatchObject({ action: 'billing.link_user', actorUserId: admin.user.id, subjectTable: 'billing_records', subjectId: record.id, before: { userId: null }, after: { userId: reader.user.id } });
    expect((await post('link-billing', { billingRecordId: record.id })).body).toEqual({ ok: true, changed: false });
    expect(access.audit).toHaveLength(1);
    expect((await post('link-billing', { billingRecordId: randomUUID() })).status).toBe(404);
    expect((await post('link-billing', { billingRecordId: 'x' })).status).toBe(400);
  });
  it('resync and resend answer 501 until a provider exists, and write nothing', async () => {
    const { post, access } = await setup();
    for (const action of ['resync-billing', 'resend-ready-email']) {
      const res = await post(action);
      expect(res.status).toBe(501);
      expect(res.body).toMatchObject({ ok: false, error: 'no_billing_provider' });
    }
    expect(access.audit).toHaveLength(0);
  });
});
