import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

// Applies db/migrations/*.sql, in name order, to DATABASE_URL, once each: every applied file is recorded in
// schema_migrations, so running this on every deployment is safe. One file is one transaction, taken under an
// advisory lock so two builds of the same branch cannot interleave. With no DATABASE_URL (a local build, CI) it
// does nothing and says so. The files are hand-written and must be re-runnable anyway (create ... if not exists),
// because the branches that pre-date this runner were migrated by hand and are recorded on their first run here.
//
//   pnpm db:migrate                       the Vercel build runs this before `next build` (package.json)
//   node --env-file=.env.x.local db/migrate.ts   against a branch whose URL is in a git-ignored file

export const MIGRATIONS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');
const LOCK_KEY = 7_361_002; // any constant; one lock for all migrations

/** The statements of a migration file: `--` comments dropped, split on the semicolons that end them. */
export function splitStatements(sql: string): string[] {
  const body = sql
    .split('\n')
    .filter(line => !line.trimStart().startsWith('--'))
    .map(line => line.replace(/\s+--.*$/, ''))
    .join('\n');
  return body.split(';').map(s => s.trim()).filter(Boolean).map(s => `${s};`);
}

/** Migration file names in the order they run; anything that is not NNN_name.sql is ignored. */
export const migrationFiles = (names: readonly string[]): string[] => names.filter(n => /^\d{3}_[a-z0-9_]+\.sql$/.test(n)).sort();

/** The files still to apply, given what schema_migrations already lists. */
export const pending = (files: readonly string[], applied: readonly string[]): string[] => files.filter(f => !applied.includes(f));

export async function migrate(url: string, dir = MIGRATIONS_DIR, log: (line: string) => void = console.log): Promise<string[]> {
  const sql = neon(url);
  await sql.query('create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())');
  const applied = (await sql.query('select name from schema_migrations')).map(row => String((row as { name: unknown }).name));
  const files = pending(migrationFiles(await readdir(dir)), applied);
  for (const file of files) {
    const statements = splitStatements(await readFile(path.join(dir, file), 'utf8'));
    const queries = [
      sql.query(`select pg_advisory_xact_lock(${LOCK_KEY})`),
      ...statements.map(s => sql.query(s)),
      sql.query('insert into schema_migrations (name) values ($1)', [file]),
    ];
    // the driver types each unawaited query by its own options; transaction() wants the general form of the same type
    await sql.transaction(queries as unknown as Parameters<typeof sql.transaction>[0]);
    log(`applied ${file} (${statements.length} statements)`);
  }
  if (files.length === 0) log('nothing to apply');
  return files;
}

/**
 * Why a non-production deployment is refused, or null. The Vercel Neon integration gives a CLI (non-pushed) preview
 * the production branch's URL, and the integration has no per-environment branch mapping, so the runner itself must
 * refuse to migrate the production database from anywhere but a production deployment. PRODUCTION_DB_HOST is the
 * production endpoint id (a plain, non-secret value set on every target); unset means no check.
 */
export function refusalReason(env: Record<string, string | undefined>, url: string): string | null {
  const prodHost = env.PRODUCTION_DB_HOST;
  if (!env.VERCEL_ENV || env.VERCEL_ENV === 'production' || !prodHost) return null;
  const host = new URL(url).hostname;
  const isProduction = host === prodHost || host.startsWith(`${prodHost}.`) || host.startsWith(`${prodHost}-pooler.`);
  return isProduction ? `a ${env.VERCEL_ENV} deployment points at the production database (${prodHost})` : null;
}

const isMain = process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log('db:migrate: DATABASE_URL is not set, nothing to do');
  } else if (refusalReason(process.env, url)) {
    console.log(`db:migrate: skipped, ${refusalReason(process.env, url)}; migrations run from production deployments only`);
  } else {
    migrate(url).catch(err => {
      // the message can quote SQL but never the URL; the driver's errors do not carry it
      console.error('db:migrate failed:', err instanceof Error ? err.message : String(err));
      process.exit(1);
    });
  }
}
