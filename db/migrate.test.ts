import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { migrationFiles, MIGRATIONS_DIR, pending, refusalReason, splitStatements } from './migrate';

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
    expect(files).toEqual(['001_leads.sql', '002_users_auth.sql', '003_access_billing.sql', '004_leads_confirmation.sql', '005_send_ceiling.sql']);
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
    expect(refusalReason(env, prod)).toMatch(/preview deployment points at the production database/);
    expect(refusalReason(env, pooled)).not.toBeNull();
  });
  it('lets a preview migrate its own branch, and never blocks production or a local run', () => {
    expect(refusalReason({ VERCEL_ENV: 'preview', PRODUCTION_DB_HOST: 'ep-prod-1234' }, branch)).toBeNull();
    expect(refusalReason({ VERCEL_ENV: 'production', PRODUCTION_DB_HOST: 'ep-prod-1234' }, prod)).toBeNull();
    expect(refusalReason({ PRODUCTION_DB_HOST: 'ep-prod-1234' }, prod)).toBeNull();
    expect(refusalReason({ VERCEL_ENV: 'preview' }, prod)).toBeNull();
  });
});
