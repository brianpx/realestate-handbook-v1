import { MAX_BODY_BYTES } from '@/lib/auth/config';
import type { AuthDeps, AuthReply, AuthRequest } from '@/lib/auth/handler';
import { signedInUser } from '@/lib/auth/request-user';
import { billingFields, billingInfoInputSchema } from '@/lib/users/billing-info';
import type { BillingInfoStore } from '@/lib/users/billing-info-store';

export type BillingInfoDeps = Pick<AuthDeps, 'stores' | 'allowedOrigins' | 'now'> & { billingInfo: BillingInfoStore | null };

const reply = (status: number, error: string, extra: Record<string, unknown> = {}): AuthReply => ({ status, body: { ok: false, error, ...extra } });
const originRefused = (req: AuthRequest, deps: BillingInfoDeps) => !req.origin || !deps.allowedOrigins.includes(req.origin);

/**
 * PUT: saves the fields of one card of the billing page for the signed-in reader. Same order as the profile save:
 * Origin first, then the stores, the body size, the session, and only then the body. The reader is the session
 * cookie's user; the body names no account. Only the fields in the body are written. A 400 names the fields that
 * failed, never their values, and writes nothing. These are personal details: nothing here is logged.
 */
export async function handleSaveBillingInfo(req: AuthRequest, deps: BillingInfoDeps): Promise<AuthReply> {
  if (originRefused(req, deps)) return reply(403, 'forbidden');
  if (!deps.stores || !deps.billingInfo) return reply(503, 'unavailable');
  if (Buffer.byteLength(req.body) > MAX_BODY_BYTES) return reply(413, 'too_large');
  try {
    const now = deps.now();
    const user = await signedInUser(req.sessionId, deps.stores, now);
    if (!user) return reply(401, 'unauthorized');
    let json: unknown;
    try { json = JSON.parse(req.body); } catch { return reply(400, 'invalid_request'); }
    const parsed = billingInfoInputSchema.safeParse(json);
    if (!parsed.success) return reply(400, 'invalid_billing_info', { fields: [...new Set(parsed.error.issues.map(i => String(i.path[0] ?? '')))].filter(Boolean) });
    const saved = await deps.billingInfo.save(user.id, parsed.data, now);
    if (!saved) return reply(401, 'unauthorized');
    return { status: 200, body: { ok: true, billingInfo: billingFields(saved), updatedAt: saved.updatedAt.toISOString() } };
  } catch (err) {
    console.error('account: billing info save failed', err instanceof Error ? err.name : 'error');
    return reply(503, 'unavailable');
  }
}
