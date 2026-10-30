import { handleLead } from '@/lib/leads/handler';
import { mailFromEnv } from '@/lib/leads/mail';
import { storeFromEnv } from '@/lib/leads/store';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

const json = (status: number, body: Record<string, unknown>, headers?: Record<string, string>) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });

export async function POST(request: Request) {
  const env = process.env;
  // In production the address hashes need a real secret; without one the route refuses rather than run unsalted.
  const configured = env.NODE_ENV !== 'production' || Boolean(env.LEAD_IP_SALT);
  const reply = await handleLead(
    {
      origin: request.headers.get('origin'),
      // behind Vercel's proxy the first x-forwarded-for entry is the client; locally there is no header
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local',
      body: await request.text(),
    },
    {
      store: configured ? storeFromEnv(env) : null,
      mail: mailFromEnv(env),
      allowedOrigins: [new URL(SITE_URL).origin, ...(env.LEAD_ALLOWED_ORIGINS?.split(',').map(s => s.trim()).filter(Boolean) ?? [])],
      ipSalt: env.LEAD_IP_SALT ?? 'dev-only-salt',
      now: () => new Date(),
    },
  );
  return json(reply.status, reply.body, reply.headers);
}
