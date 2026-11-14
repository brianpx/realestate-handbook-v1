import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { migrationChecksum, migrationDecision, migrationFiles, MIGRATIONS_DIR, pending, refusalReason, splitStatements } from './migrate';

describe('splitStatements', () => {
  it('drops comment lines and trailing comments, and keeps one statement per semicolon', () => {
    const sql = '-- header\ncreate table if not exists t (\n  a int,  -- trailing\n  b text\n);\n-- down\n--   drop table t;\ncreate index if not exists i on t (a);\n';
    expect(splitStatements(sql)).toEqual(['create table if not exists t (\n  a int,\n  b text\n);', 'create index if not exists i on t (a);']);
  });
  it('leaves a commented-out down block out entirely', () => {
    expect(splitStatements('-- down\n--   drop table if exists x;\n')).toEqual([]);
  });
});

describe('the migration list', () => {
  it('orders by number and ignores anything else in the folder', () => {
    expect(migrationFiles(['003_b.sql', 'README.md', '001_a.sql', '002_c.sql', 'notes.sql'])).toEqual(['001_a.sql', '002_c.sql', '003_b.sql']);
    expect(pending(['001_a.sql', '002_c.sql'], ['001_a.sql'])).toEqual(['002_c.sql']);
  });
  it('covers every file in db/migrations, and each one splits into statements without a semicolon inside a string', async () => {
    const files = migrationFiles(await readdir(MIGRATIONS_DIR));
    expect(files).toEqual(['001_leads.sql', '002_users_auth.sql', '003_access_billing.sql', '004_leads_confirmation.sql', '005_send_ceiling.sql', '006_realtor_profiles.sql', '007_confirmation_delivery.sql', '008_leads_unsubscribe.sql', '009_display_name.sql', '010_billing_info.sql', '011_avatar.sql']);
    for (const file of files) {
      const statements = splitStatements(await readFile(path.join(MIGRATIONS_DIR, file), 'utf8'));
      expect(statements.length, file).toBeGreaterThan(0);
      for (const s of statements) {
        expect(s, file).toMatch(/^(create|alter)\s/);
        expect((s.match(/'/g) ?? []).length % 2, `${file}: ${s.slice(0, 40)}`).toBe(0); // an odd quote count means a split inside a literal
      }
    }
  });
});

describe('refusalReason', () => {
  const prod = 'postgres://u:p@ep-prod-1234.c-1.us-east-1.aws.neon.tech/db';
  const pooled = 'postgres://u:p@ep-prod-1234-pooler.c-1.us-east-1.aws.neon.tech/db';
  const branch = 'postgres://u:p@ep-prod-12345.c-1.us-east-1.aws.neon.tech/db';
  it('refuses a preview deployment that points at the production host, pooled or not', () => {
    const env = { VERCEL_ENV: 'preview', PRODUCTION_DB_HOST: 'ep-prod-1234' };
    expect(refusalReason(env, prod)).toMatch(/production database/);
    expect(refusalReason(env, pooled)).not.toBeNull();
  });
  it('lets a preview migrate its own branch', () => {
    expect(refusalReason({ VERCEL_ENV: 'preview', PRODUCTION_DB_HOST: 'ep-prod-1234' }, branch)).toBeNull();
  });
  it('refuses a production host unless production migration is explicitly authorized', () => {
    expect(refusalReason({ VERCEL_ENV: 'production', PRODUCTION_DB_HOST: 'ep-prod-1234' }, prod)).toMatch(/MIGRATE_ALLOW_PRODUCTION/);
    expect(refusalReason({ PRODUCTION_DB_HOST: 'ep-prod-1234' }, prod)).toMatch(/MIGRATE_ALLOW_PRODUCTION/);
    expect(refusalReason({ VERCEL_ENV: 'production', PRODUCTION_DB_HOST: 'ep-prod-1234', MIGRATE_ALLOW_PRODUCTION: '1' }, prod)).toBeNull();
  });
  it('refuses an undeclared target and a missing or invalid URL', () => {
    expect(refusalReason({ VERCEL_ENV: 'preview' }, prod)).toMatch(/ambiguous/);
    expect(refusalReason({ MIGRATE_ALLOW_UNDECLARED_TARGET: '1' }, branch)).toBeNull();
    expect(refusalReason({ PRODUCTION_DB_HOST: 'ep-prod-1234' }, 'not a url')).toMatch(/not a valid URL/);
    expect(migrationDecision({}, undefined)).toEqual({ ok: false, reason: 'DATABASE_URL is not set' });
    expect(migrationDecision({ PRODUCTION_DB_HOST: 'ep-prod-1234' }, branch)).toEqual({ ok: true });
  });
  it('checksums the file text', () => {
    expect(migrationChecksum('select 1;')).toBe(migrationChecksum('select 1;'));
    expect(migrationChecksum('select 1;')).not.toBe(migrationChecksum('select 2;'));
  });
});
