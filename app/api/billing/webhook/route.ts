import { billingWebhookDeps } from '@/lib/billing/env';
import { billingWebhookResponse, processBillingWebhook } from '@/lib/billing/process-event';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Raw body, then the signature, before any billing query. The ready link uses this request's origin. */
export async function POST(request: Request) {
  const raw = await request.text();
  const deps = billingWebhookDeps(process.env);
  if (!deps) return Response.json({ ok: false, error: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  const result = await processBillingWebhook({
    raw,
    signature: request.headers.get('x-signature'),
    eventName: request.headers.get('x-event-name'),
    origin: new URL(request.url).origin,
  }, deps);
  return billingWebhookResponse(result);
}
