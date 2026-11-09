import { z } from '@/lib/zod';

// The admin state-setters' inputs (user-database plan, section 9). The target user comes from the URL and is
// re-read from the database by the handler; the body only carries what the action needs. Kinds, tiers and
// reasons mirror the checks in migration 003; a reason is a short sentence for the audit row, never a token.
export const ADMIN_ACTIONS = ['set-role', 'set-status', 'create-grant', 'revoke-grant', 'suspend', 'unsuspend', 'link-billing', 'resync-billing', 'resend-ready-email'] as const;
export type AdminAction = (typeof ADMIN_ACTIONS)[number];

const uuid = z.uuid();
const reason = z.string().trim().min(1, 'a reason is required').max(500);

export const adminTargetSchema = z.object({ userId: uuid, action: z.enum(ADMIN_ACTIONS) });

export const adminActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('set-role'), role: z.enum(['reader', 'admin']) }),
  z.object({ action: z.literal('set-status'), status: z.enum(['active', 'disabled']), reason: reason.optional() })
    .superRefine((s, ctx) => { if (s.status === 'disabled' && !s.reason) ctx.addIssue({ code: 'custom', path: ['reason'], message: 'disabling needs a reason' }); }),
  // hand-made grants only: a paid grant is the billing record's to make, through the webhook
  z.object({
    action: z.literal('create-grant'),
    kind: z.enum(['complimentary', 'promo']),
    tier: z.enum(['basic', 'pro']),
    endsAt: z.coerce.date().nullable().optional(),
    grantNote: z.string().trim().max(500).nullable().optional(),
  }),
  z.object({ action: z.literal('revoke-grant'), grantId: uuid, reason: z.enum(['refund', 'chargeback', 'abuse', 'admin', 'expired_promo']) }),
  z.object({ action: z.literal('suspend'), reason }),
  z.object({ action: z.literal('unsuspend') }),
  z.object({ action: z.literal('link-billing'), billingRecordId: uuid }),
  z.object({ action: z.literal('resync-billing') }),
  z.object({ action: z.literal('resend-ready-email') }),
]);
export type AdminActionInput = z.infer<typeof adminActionSchema>;
