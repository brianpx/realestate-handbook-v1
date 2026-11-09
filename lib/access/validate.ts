import { z } from 'zod';
import { emailSchema } from '@/lib/validate/email';

// Inputs to the grant and account mutations. Ids are re-read from the database by the code that uses them; the
// schemas only keep malformed values out. Kinds, tiers and reasons mirror the checks in migration 003.
const uuid = z.uuid();
const kind = z.enum(['purchase', 'subscription', 'complimentary', 'promo']);
const tier = z.enum(['basic', 'pro']);
const date = z.coerce.date();

export const grantInputSchema = z.object({
  userId: uuid,
  kind,
  tier,
  startsAt: date.optional(),
  endsAt: date.nullable().optional(),
  billingRecordId: uuid.nullable().optional(),
  grantedBy: uuid.nullable().optional(),
  grantNote: z.string().trim().max(500).nullable().optional(),
}).superRefine((g, ctx) => {
  // the same exclusivity as the two check constraints in migration 003
  const paid = g.kind === 'purchase' || g.kind === 'subscription';
  if (paid && !g.billingRecordId) ctx.addIssue({ code: 'custom', path: ['billingRecordId'], message: 'a paid grant names its billing record' });
  if (paid && g.grantedBy) ctx.addIssue({ code: 'custom', path: ['grantedBy'], message: 'a paid grant is made by the billing record, not a person' });
  if (!paid && !g.grantedBy) ctx.addIssue({ code: 'custom', path: ['grantedBy'], message: 'a hand-made grant names who made it' });
  if (!paid && g.billingRecordId) ctx.addIssue({ code: 'custom', path: ['billingRecordId'], message: 'a hand-made grant has no billing record' });
  if (g.endsAt && g.startsAt && g.endsAt <= g.startsAt) ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'ends before it starts' });
});
export type GrantInput = z.infer<typeof grantInputSchema>;

export const revokeInputSchema = z.object({
  grantId: uuid,
  reason: z.enum(['refund', 'chargeback', 'abuse', 'admin', 'expired_promo']),
});
export type RevokeInput = z.infer<typeof revokeInputSchema>;

/** The delete-account form: the reader types their own address (OD-21). */
export const deleteAccountSchema = z.object({ confirmEmail: emailSchema });
