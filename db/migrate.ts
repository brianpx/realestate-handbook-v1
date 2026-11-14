import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

// Applies db/migrations/*.sql, in name order, to DATABASE_URL, once each: every applied file is recorded in
// schema_migrations, so a repeated explicit run applies only new files. One file is one transaction, taken under an
// advisory lock so two runs cannot interleave. `pnpm build` does not call this. The files are hand-written and
// must be re-runnable anyway (create ... if not exists),
// because the branches that pre-date this runner were migrated by hand and are recorded on their first run here.
//
//   pnpm db:migrate                       explicit only. `pnpm build` does not run this.
//   node --env-file=.env.x.local db/migrate.ts   against a branch whose URL is in a git-ignored file
// A missing DATABASE_URL, an ambiguous target, or a production host without MIGRATE_ALLOW_PRODUCTION=1 exits 1.

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

export function migrationChecksum(sql: string): string {
  return createHash('sha256').update(sql).digest('hex');
}

export async function migrate(url: string, dir = MIGRATIONS_DIR, log: (line: string) => void = console.log): Promise<string[]> {
  const sql = neon(url);
  await sql.query('create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())');
  await sql.query('alter table schema_migrations add column if not exists checksum text');
  const rows = await sql.query('select name, checksum from schema_migrations');
  const applied: string[] = [];
  for (const row of rows) {
    const name = String((row as { name: unknown }).name);
    const checksum = (row as { checksum: unknown }).checksum;
    applied.push(name);
    if (typeof checksum !== 'string' || checksum.length === 0) continue;
    let current: string;
    try {
      // turbopackIgnore: importing this module must not trace the whole project into the server bundle.
      current = migrationChecksum(await readFile(/*turbopackIgnore: true*/ path.join(dir, name), 'utf8'));
    } catch {
      throw new Error(`applied migration ${name} is missing from the migrations directory`);
    }
    if (current !== checksum) throw new Error(`checksum mismatch for applied migration ${name}`);
  }
  const files = pending(migrationFiles(await readdir(/*turbopackIgnore: true*/ dir)), applied);
  for (const file of files) {
    const body = await readFile(/*turbopackIgnore: true*/ path.join(dir, file), 'utf8');
    const statements = splitStatements(body);
    const queries = [
      sql.query(`select pg_advisory_xact_lock(${LOCK_KEY})`),
      ...statements.map(s => sql.query(s)),
      sql.query('insert into schema_migrations (name, checksum) values ($1, $2)', [file, migrationChecksum(body)]),
    ];
    // the driver types each unawaited query by its own options; transaction() wants the general form of the same type
    await sql.transaction(queries as unknown as Parameters<typeof sql.transaction>[0]);
    log(`applied ${file} (${statements.length} statements)`);
  }
  if (files.length === 0) log('nothing to apply');
  return files;
}

function hostMatches(hostname: string, endpointId: string): boolean {
  return hostname === endpointId || hostname.startsWith(`${endpointId}.`) || hostname.startsWith(`${endpointId}-pooler.`);
}

/**
 * Why this target is refused, or null when it may be migrated.
 * Hostname match is not enough: a production host also needs MIGRATE_ALLOW_PRODUCTION=1.
 * An unset PRODUCTION_DB_HOST is ambiguous and needs MIGRATE_ALLOW_UNDECLARED_TARGET=1.
 */
export function refusalReason(env: Record<string, string | undefined>, url: string): string | null {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return 'DATABASE_URL is not a valid URL';
  }
  const prodHost = env.PRODUCTION_DB_HOST;
  if (!prodHost) {
    return env.MIGRATE_ALLOW_UNDECLARED_TARGET === '1'
      ? null
      : 'PRODUCTION_DB_HOST is unset, so the target is ambiguous';
  }
  const production = hostMatches(hostname, prodHost);
  if (production) {
    return env.MIGRATE_ALLOW_PRODUCTION === '1'
      ? null
      : `target matches the production database (${prodHost}) without MIGRATE_ALLOW_PRODUCTION=1`;
  }
  return null;
}

export function migrationDecision(env: Record<string, string | undefined>, url: string | undefined): { ok: true } | { ok: false; reason: string } {
  if (!url) return { ok: false, reason: 'DATABASE_URL is not set' };
  const reason = refusalReason(env, url);
  return reason ? { ok: false, reason } : { ok: true };
}

const isMain = process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const decision = migrationDecision(process.env, process.env.DATABASE_URL);
  if (!decision.ok) {
    console.error(`db:migrate: refused, ${decision.reason}`);
    process.exit(1);
  }
  migrate(process.env.DATABASE_URL as string).catch(err => {
    // the message can quote SQL but never the URL; the driver's errors do not carry it
    console.error('db:migrate failed:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
