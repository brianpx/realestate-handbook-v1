// Rows of `audit_log` (db/migrations/003_access_billing.sql). Every mutation of a user's role, status, grants,
// membership or sessions writes one, in the same statement as the change, and skips it when nothing changed.
// Never tokens, payment details or raw addresses: `before` and `after` carry the fields that changed.
export type ActorKind = 'user' | 'admin' | 'system' | 'webhook';
export type AuditAction =
  | 'user.disable' | 'user.enable' | 'user.anonymize' | 'role.set'
  | 'grant.create' | 'grant.revoke'
  | 'membership.suspend' | 'membership.unsuspend'
  | 'session.revoke_all'
  | 'billing.link_user' | 'billing.event' | 'billing.resend_ready_email'
  | 'bootstrap_admin';

/** Who is acting: the signed-in user or admin, the system (bootstrap), or a signed webhook. */
export type Actor = { kind: ActorKind; userId: string | null; ipHash?: string | null };

export type AuditEntry = {
  at: Date;
  actorUserId: string | null;
  actorKind: ActorKind;
  action: AuditAction;
  subjectTable: string;
  subjectId: string | null;
  before: unknown;
  after: unknown;
  reason: string | null;
  ipHash: string | null;
};
export type AuditRow = AuditEntry & { id: string };

export function audit(
  actor: Actor,
  action: AuditAction,
  subject: { table: string; id: string | null },
  change: { before?: unknown; after?: unknown; reason?: string | null },
  at: Date,
): AuditEntry {
  return {
    at,
    actorUserId: actor.userId,
    actorKind: actor.kind,
    action,
    subjectTable: subject.table,
    subjectId: subject.id,
    before: change.before ?? null,
    after: change.after ?? null,
    reason: change.reason ?? null,
    ipHash: actor.ipHash ?? null,
  };
}

/** True when a mutation would write the same values it found, so no audit row is due. Dates compare as ISO strings. */
export const unchanged = (before: unknown, after: unknown): boolean => JSON.stringify(before ?? null) === JSON.stringify(after ?? null);

/** An entry whose subject and before/after the store fills in from the row it changes (a grant, a user). */
export type AuditStub = Pick<AuditEntry, 'at' | 'actorUserId' | 'actorKind' | 'action' | 'reason' | 'ipHash'>;

export const auditBy = (actor: Actor, action: AuditAction, at: Date, reason: string | null = null): AuditStub =>
  ({ at, actorUserId: actor.userId, actorKind: actor.kind, action, reason, ipHash: actor.ipHash ?? null });
