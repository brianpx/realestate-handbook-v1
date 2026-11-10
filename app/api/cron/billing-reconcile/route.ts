import { billingWebhookDeps } from '@/lib/billing/env';
import { bearerMatches, reconcileBilling } from '@/lib/billing/reconcile';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const noStore = { 'Cache-Control': 'no-store' };

/** Vercel calls this daily with `Authorization: Bearer CRON_SECRET`. Anything else is a 401 and writes nothing. */
export async function GET(request: Request) {
  if (!bearerMatches(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return Response.json({ ok: false, error: 'unauthorized' }, { status: 401, headers: noStore });
  }
  const deps = billingWebhookDeps(process.env);
  if (!deps) return Response.json({ ok: false, error: 'unavailable' }, { status: 503, headers: noStore });
  try {
    const report = await reconcileBilling({ ...deps, origin: new URL(request.url).origin });
    return Response.json({ ok: true, ...report }, { status: 200, headers: noStore });
  } catch (err) {
    const name = err instanceof Error && err.name ? err.name : 'Error';
    console.error('billing: reconcile failed', name);
    return Response.json({ ok: false, error: name }, { status: 500, headers: noStore });
  }
}
