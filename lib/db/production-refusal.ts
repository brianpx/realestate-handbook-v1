import { refusalReason } from '@/db/migrate';

/**
 * Whether this process must not open DATABASE_URL or send mail. The decision is
 * `refusalReason` in db/migrate.ts, so the host is parsed in one place. Unset
 * VERCEL_ENV, a production deployment, and an unset PRODUCTION_DB_HOST all stay
 * on the current path. Callers answer 503 or skip the send. They do not log the
 * reason: it names the host.
 */
export function productionDatabaseRefused(env: Record<string, string | undefined>): boolean {
  const url = env.DATABASE_URL;
  if (!url) return false;
  return refusalReason(env, url) !== null;
}
