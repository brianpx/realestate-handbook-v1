import { grantLive } from '@/lib/access/entitlement';
import { grantAccess, revokeAccess } from '@/lib/access/grants';
import { recomputeMembership } from '@/lib/access/membership';
import { auditBy, type Actor } from '@/lib/audit';
import { resendReadyForUser, resyncUserRecords, type ReconcileDeps } from '@/lib/billing/reconcile';
import { MAX_BODY_BYTES } from '@/lib/auth/config';
import type { AuthDeps, AuthReply, AuthRequest } from '@/lib/auth/handler';
import { signedInUser } from '@/lib/auth/request-user';
import { hashKey } from '@/lib/auth/token';
import type { User } from '@/lib/users/types';
import { adminActionSchema, adminTargetSchema, type AdminActionInput } from './validate';

export type AdminDeps = Pick<AuthDeps, 'stores' | 'allowedOrigins' | 'ipSalt' | 'now'> & {
  /** Absent until Lemon Squeezy is configured. Resync and resend then stay 501; every other action ignores it. The request URL supplies the origin. */
  billing?: Omit<ReconcileDeps, 'origin'> | null;
};
/** From the URL: /api/admin/users/[userId]/[action]. Both are checked here, never trusted. */
export type AdminTarget = { userId: string; action: string };

const reply = (status: number, error: string, message?: string): AuthReply => ({ status, body: { ok: false, error, ...(message ? { message } : {}) } });
/** Every state-setter answers alike: `changed` is false when the row was already in the state asked for, and then nothing was logged. */
const done = (changed: boolean, extra: Record<string, unknown> = {}): AuthReply => ({ status: 200, body: { ok: true, changed, ...extra } });
const originRefused = (req: AuthRequest, deps: AdminDeps) => !req.origin || !deps.allowedOrigins.includes(req.origin);
const iso = (d: Date | null | undefined): string | null => (d ? d.toISOString() : null);

/**
 * The admin mutations (user-database plan, section 9), one handler for the nine actions: an allow-listed Origin,
 * a signed-in administrator (403 for anyone else, never a redirect: this is an API), the target re-read from the
 * store, the body through its schema, then one conditional write that carries its own audit row. An
 * administrator can never change their own role or status, so the last one cannot lock themselves out.
 */
export async function handleAdminAction(req: AuthRequest, target: AdminTarget, deps: AdminDeps): Promise<AuthReply> {
  if (originRefused(req, deps)) return reply(403, 'forbidden');
  if (!deps.stores) return reply(503, 'unavailable');
  if (Buffer.byteLength(req.body) > MAX_BODY_BYTES) return reply(413, 'too_large');
  const { users, access } = deps.stores;
  try {
    const now = deps.now();
    const admin = await signedInUser(req.sessionId, deps.stores, now);
    if (!admin || admin.role !== 'admin') return reply(403, 'forbidden');

    const parsedTarget = adminTargetSchema.safeParse(target);
    if (!parsedTarget.success) return reply(404, 'not_found');
    const user = await users.findById(parsedTarget.data.userId);
    if (!user) return reply(404, 'not_found');

    let json: unknown = {};
    if (req.body.trim()) {
      try { json = JSON.parse(req.body); } catch { return reply(400, 'invalid_request'); }
    }
    if (typeof json !== 'object' || json === null || Array.isArray(json)) return reply(400, 'invalid_request');
    const parsed = adminActionSchema.safeParse({ ...json, action: parsedTarget.data.action });
    if (!parsed.success) return reply(400, 'invalid_request', parsed.error.issues[0]?.message);

    const actor: Actor = { kind: 'admin', userId: admin.id, ipHash: hashKey(req.ip, deps.ipSalt) };
    return await apply(parsed.data, { admin, user, actor, now, stores: deps.stores, billing: deps.billing ?? null, origin: new URL(req.url).origin });
  } catch (err) {
    console.error('admin: action failed', err instanceof Error ? err.name : 'error');
    return reply(503, 'unavailable');
  }
}

type Context = {
  admin: User;
  user: User;
  actor: Actor;
  now: Date;
  stores: NonNullable<AdminDeps['stores']>;
  billing: Omit<ReconcileDeps, 'origin'> | null;
  origin: string;
};

async function apply(input: AdminActionInput, { admin, user, actor, now, stores: { access }, billing, origin }: Context): Promise<AuthReply> {
  const self = user.id === admin.id;
  switch (input.action) {
    case 'set-role': {
      if (self) return reply(400, 'self_change', 'You cannot change your own role.');
      if (user.status === 'deleted') return reply(400, 'account_deleted', 'A deleted account cannot be changed.');
      return done(await access.setUserRole(user.id, input.role, now, auditBy(actor, 'role.set', now)));
    }
    case 'set-status': {
      if (self) return reply(400, 'self_change', 'You cannot change your own status.');
      if (user.status === 'deleted') return reply(400, 'account_deleted', 'A deleted account cannot be changed.');
      // the schema has already insisted on a reason for a disable
      if (input.status === 'disabled') return done(await access.disableUser(user.id, { at: now, by: admin.id, reason: input.reason ?? '' }, auditBy(actor, 'user.disable', now, input.reason ?? null)));
      return done(await access.enableUser(user.id, now, auditBy(actor, 'user.enable', now)));
    }
    case 'create-grant': {
      if (user.status === 'deleted') return reply(400, 'account_deleted', 'A deleted account cannot be granted access.');
      const endsAt = input.endsAt ?? null;
      if (endsAt && endsAt <= now) return reply(400, 'invalid_request', 'ends before it starts');
      // the same grant again (kind, tier and end) is already in force: nothing to add, nothing to log
      const same = (await access.listGrants(user.id)).find(g => grantLive(g, now) && g.kind === input.kind && g.tier === input.tier && iso(g.endsAt) === iso(endsAt));
      if (same) return done(false, { grantId: same.id });
      const grant = await grantAccess(access, { userId: user.id, kind: input.kind, tier: input.tier, endsAt, grantedBy: admin.id, grantNote: input.grantNote ?? null }, actor, now);
      return done(true, { grantId: grant.id });
    }
    case 'revoke-grant': {
      // the grant must be this user's: an id from another account is not found, whatever it is
      if (!(await access.listGrants(user.id)).some(g => g.id === input.grantId)) return reply(404, 'not_found');
      return done((await revokeAccess(access, { grantId: input.grantId, reason: input.reason }, actor, now)) !== null);
    }
    case 'suspend':
      if (user.status === 'deleted') return reply(400, 'account_deleted', 'A deleted account has no membership to suspend.');
      return done((await access.suspend(user.id, { at: now, by: admin.id, reason: input.reason }, auditBy(actor, 'membership.suspend', now, input.reason))) !== null);
    case 'unsuspend': {
      const lifted = await access.unsuspend(user.id, now, auditBy(actor, 'membership.unsuspend', now));
      // the projection's other columns may have gone stale while suspended (an expired grant), as after a revoke
      if (lifted) await recomputeMembership(access, user.id, now);
      return done(lifted !== null);
    }
    case 'link-billing': {
      const linked = await access.linkBilling(input.billingRecordId, user.id, now, auditBy(actor, 'billing.link_user', now));
      if (!linked) return reply(404, 'not_found');
      // The access store's row is what the audit names. The billing store's copy is what the account page lists.
      if (billing) await billing.store.attachUser(input.billingRecordId, user.id);
      return done(linked.changed);
    }
    case 'resync-billing': {
      if (!billing) return reply(501, 'no_billing_provider', 'No billing provider is configured.');
      const { changed } = await resyncUserRecords({ ...billing, origin }, user.id, actor);
      return done(changed);
    }
    case 'resend-ready-email': {
      if (!billing) return reply(501, 'no_billing_provider', 'No billing provider is configured.');
      const outcome = await resendReadyForUser({ ...billing, origin }, user.id, actor);
      if (outcome === 'missing') return reply(404, 'not_found');
      if (outcome === 'not_paid') return reply(400, 'not_paid', 'Only a paid purchase can be resent.');
      if (outcome === 'not_sent') return reply(503, 'unavailable');
      return done(true);
    }
  }
}
