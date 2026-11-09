import { grantLive } from './entitlement';
import type { AccessStore } from './store';
import type { Grant, Membership } from './types';

// Purchases and subscriptions are shown ahead of complimentary and promo grants; within a kind the one that runs
// longest (an indefinite grant longest of all). This only decides what the projection displays; entitlement treats
// every live grant alike.
const PAID = new Set(['purchase', 'subscription']);
const endsRank = (g: Grant) => (g.endsAt === null ? Infinity : g.endsAt.getTime());
export function currentGrant(grants: Grant[], now: Date): Grant | null {
  const live = grants.filter(g => grantLive(g, now));
  live.sort((a, b) => Number(PAID.has(b.kind)) - Number(PAID.has(a.kind)) || endsRank(b) - endsRank(a));
  return live[0] ?? null;
}

/**
 * The cached membership row for admin lists (user-database plan, section 7.2): suspended wins, then a live grant
 * is active, any grant at all is lapsed, nothing is none. The suspension triple is the only hand-written part and
 * is carried over unchanged. Enforcement never reads `status`; a stale projection changes nothing a reader can open.
 */
export function projectMembership(userId: string, grants: Grant[], existing: Membership | null, now: Date): Membership {
  const current = currentGrant(grants, now);
  const suspended = existing?.suspendedAt ?? null;
  return {
    userId,
    status: suspended ? 'suspended' : current ? 'active' : grants.length > 0 ? 'lapsed' : 'none',
    tier: current?.tier ?? null,
    startedAt: current?.startsAt ?? null,
    endsAt: current?.endsAt ?? null,
    currentGrantId: current?.id ?? null,
    complimentary: current !== null && !PAID.has(current.kind),
    suspendedAt: suspended,
    suspendedBy: existing?.suspendedBy ?? null,
    suspendReason: existing?.suspendReason ?? null,
    updatedAt: now,
  };
}

/** Rewrites the projection from the grants on file. Run after every grant change, and lazily when a read finds it stale. */
export async function recomputeMembership(store: AccessStore, userId: string, now: Date): Promise<Membership> {
  const [grants, existing] = await Promise.all([store.listGrants(userId), store.findMembership(userId)]);
  const next = projectMembership(userId, grants, existing, now);
  await store.saveMembership(next);
  return next;
}

/** True when the cached row says active but its grant has run out, so the next admin list would mislead. */
export const membershipStale = (m: Membership | null, now: Date): boolean => m !== null && m.status === 'active' && m.endsAt !== null && m.endsAt <= now;
