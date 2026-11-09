import { auditBy, type Actor } from '@/lib/audit';
import { recomputeMembership } from './membership';
import type { AccessStore } from './store';
import type { Grant } from './types';
import type { GrantInput, RevokeInput } from './validate';

/**
 * Gives a reader access: the grant and its audit row in one write, then the membership projection. The admin
 * screens (M7) and the billing webhook call this with inputs already through grantInputSchema; the owner's own
 * grant at bootstrap comes through bootstrapOwnerGrant below.
 */
export async function grantAccess(access: AccessStore, input: GrantInput, actor: Actor, now: Date): Promise<Grant> {
  const grant = await access.createGrant(
    {
      userId: input.userId,
      kind: input.kind,
      tier: input.tier,
      startsAt: input.startsAt ?? now,
      endsAt: input.endsAt ?? null,
      billingRecordId: input.billingRecordId ?? null,
      grantedBy: input.grantedBy ?? null,
      grantNote: input.grantNote ?? null,
      createdAt: now,
    },
    auditBy(actor, 'grant.create', now, input.grantNote ?? null),
  );
  await recomputeMembership(access, input.userId, now);
  return grant;
}

/** Takes access away. Null when the grant is unknown or already revoked; nothing is written then. */
export async function revokeAccess(access: AccessStore, input: RevokeInput, actor: Actor, now: Date): Promise<Grant | null> {
  const revoked = await access.revokeGrant(input.grantId, { at: now, by: actor.userId, reason: input.reason }, auditBy(actor, 'grant.revoke', now, input.reason));
  if (revoked) await recomputeMembership(access, revoked.userId, now);
  return revoked;
}

/** The first administrator reads through a grant like everyone else (OD-13): complimentary Pro, for life, by the system. */
export const bootstrapOwnerGrant = (access: AccessStore, ownerId: string, now: Date): Promise<Grant> =>
  grantAccess(access, { userId: ownerId, kind: 'complimentary', tier: 'pro', grantedBy: ownerId, grantNote: 'Owner access, inserted at bootstrap' }, { kind: 'system', userId: null }, now);
