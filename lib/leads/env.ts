import { sendCeilingFromEnv } from '@/lib/send-ceiling';
import { allowedOrigins, SITE_URL } from '@/lib/site';
import type { LeadDeps, LeadReply, LeadRequest } from './handler';
import { mailFromEnv } from './mail';
import { storeFromEnv } from './store';

// The wiring the two lead routes share: the request as the handlers see it, the dependencies from the environment,
// and the reply as a Response. Kept out of the handlers so they stay testable without a server.

export async function leadRequestFrom(request: Request): Promise<LeadRequest> {
  return {
    origin: request.headers.get('origin'),
    // behind Vercel's proxy the first x-forwarded-for entry is the client; locally there is no header
    ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local',
    body: await request.text(),
  };
}

export function leadDepsFromEnv(env: Record<string, string | undefined>): LeadDeps {
  // In production the address hashes need a real secret; without one the routes refuse rather than run unsalted.
  const configured = env.NODE_ENV !== 'production' || Boolean(env.LEAD_IP_SALT);
  return {
    store: configured ? storeFromEnv(env) : null,
    mail: mailFromEnv(env),
    allowedOrigins: allowedOrigins(env),
    siteUrl: SITE_URL,
    ipSalt: env.LEAD_IP_SALT ?? 'dev-only-salt',
    sendCeiling: sendCeilingFromEnv(env),
    now: () => new Date(),
  };
}

export function toResponse(reply: LeadReply): Response {
  const headers = { 'Cache-Control': 'no-store', ...reply.headers };
  return reply.body ? Response.json(reply.body, { status: reply.status, headers }) : new Response(null, { status: reply.status, headers });
}
