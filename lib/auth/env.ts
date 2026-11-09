import { allowedOrigins } from '@/lib/site';
import { COOKIE_NAMES } from './cookie';
import type { AuthDeps, AuthReply, AuthRequest } from './handler';
import { authMailFromEnv } from './mail';
import { authStoresFromEnv } from './store';

// The wiring the three auth routes share: the request as the handlers see it, the dependencies from the
// environment, and the reply as a Response. Kept out of the handlers so they stay testable without a server.

export async function authRequestFrom(request: Request): Promise<AuthRequest> {
  const cookie = request.headers.get('cookie') ?? '';
  const sessionId = COOKIE_NAMES.map(name => new RegExp(`(?:^|;\\s*)${name.replace('-', '\\-')}=([^;]*)`).exec(cookie)?.[1]).find(Boolean);
  return {
    url: request.url,
    origin: request.headers.get('origin'),
    // behind Vercel's proxy the first x-forwarded-for entry is the client; locally there is no header
    ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local',
    body: await request.text(),
    sessionId,
  };
}

export function authDepsFromEnv(env: Record<string, string | undefined>): AuthDeps {
  const ipSalt = env.AUTH_IP_SALT ?? env.LEAD_IP_SALT;
  // In production the hashes need a real secret; without one the routes refuse rather than run unsalted.
  const configured = env.NODE_ENV !== 'production' || Boolean(ipSalt);
  return {
    stores: configured ? authStoresFromEnv(env) : null,
    mail: authMailFromEnv(env),
    allowedOrigins: allowedOrigins(env),
    ipSalt: ipSalt ?? 'dev-only-salt',
    bootstrapEmails: env.ADMIN_BOOTSTRAP_EMAILS?.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) ?? [],
    now: () => new Date(),
  };
}

export function toResponse(reply: AuthReply): Response {
  const headers = { 'Cache-Control': 'no-store', ...reply.headers };
  return reply.body ? Response.json(reply.body, { status: reply.status, headers }) : new Response(null, { status: reply.status, headers });
}
