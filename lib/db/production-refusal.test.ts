import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NeonAccessStore } from '@/lib/access/neon-store';
import { FileAuthStore } from '@/lib/auth/file-store';
import { authMailFromEnv } from '@/lib/auth/mail';
import { NeonAuthStore } from '@/lib/auth/neon-store';
import { authStoresFromEnv } from '@/lib/auth/store';
import { billingStoreFromEnv, billingWebhookDeps } from '@/lib/billing/env';
import { FileBillingStore } from '@/lib/billing/file-store';
import { NeonBillingStore } from '@/lib/billing/neon-store';
import { mailFromEnv } from '@/lib/leads/mail';
import { NeonLeadStore } from '@/lib/leads/neon-store';
import { FileLeadStore, storeFromEnv } from '@/lib/leads/store';
import { NeonUserStore } from '@/lib/users/neon-store';
import { NeonProfileStore } from '@/lib/users/profile-neon-store';
import { profileStoreFromEnv } from '@/lib/users/profile-store';

// Counts database constructors. A refused host must stay at zero: the fake URL is never opened.
const opens = vi.hoisted(() => ({ n: 0 }));
vi.mock('@/lib/db/sql', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db/sql')>();
  return {
    ...actual,
    sqlFromUrl: (url: string) => {
      opens.n += 1;
      return actual.sqlFromUrl(url);
    },
  };
});

// Same shape as db/migrate.test.ts. These hosts are fixtures, not a live database.
const prod = 'postgres://u:p@ep-prod-1234.c-1.us-east-1.aws.neon.tech/db';
const pooled = 'postgres://u:p@ep-prod-1234-pooler.c-1.us-east-1.aws.neon.tech/db';
const branch = 'postgres://u:p@ep-prod-12345.c-1.us-east-1.aws.neon.tech/db';

const mailEnv = {
  SENDGRID_API_KEY: 'k',
  LEAD_FROM_EMAIL: 'me@x.co',
  LEAD_MAILING_ADDRESS: '1 Main St',
  MAILPIT_URL: 'http://127.0.0.1:8025',
};
const billingEnv = {
  BILLING_PROVIDER: 'lemonsqueezy',
  BILLING_WEBHOOK_SECRET: 'whsec_test',
  BILLING_API_KEY: 'test-key',
};

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'preview-guard-'));
  opens.n = 0;
});
afterEach(() => rm(dir, { recursive: true, force: true }));

function env(databaseUrl: string, vercelEnv?: string): Record<string, string | undefined> {
  return {
    ...mailEnv,
    ...billingEnv,
    PRODUCTION_DB_HOST: 'ep-prod-1234',
    DATABASE_URL: databaseUrl,
    AUTH_STORE: 'file',
    AUTH_STORE_PATH: path.join(dir, 'auth.json'),
    LEAD_STORE: 'file',
    LEAD_STORE_PATH: path.join(dir, 'leads.json'),
    BILLING_STORE: 'file',
    BILLING_STORE_PATH: path.join(dir, 'billing.json'),
    ...(vercelEnv ? { VERCEL_ENV: vercelEnv } : {}),
  };
}

function expectClosed(target: Record<string, string | undefined>) {
  expect(authStoresFromEnv(target)).toBeNull();
  expect(storeFromEnv(target)).toBeNull();
  expect(billingStoreFromEnv(target)).toBeNull();
  expect(profileStoreFromEnv(target)).toBeNull();
  expect(authMailFromEnv(target)).toEqual({ provider: 'none' });
  expect(mailFromEnv(target)).toEqual({ provider: 'none' });
  expect(billingWebhookDeps(target)).toBeNull();
}

function expectNeon(target: Record<string, string | undefined>) {
  const auth = authStoresFromEnv(target);
  expect(auth?.auth).toBeInstanceOf(NeonAuthStore);
  expect(auth?.users).toBeInstanceOf(NeonUserStore);
  expect(auth?.access).toBeInstanceOf(NeonAccessStore);
  expect(storeFromEnv(target)).toBeInstanceOf(NeonLeadStore);
  expect(billingStoreFromEnv(target)).toBeInstanceOf(NeonBillingStore);
  expect(profileStoreFromEnv(target)).toBeInstanceOf(NeonProfileStore);
  expect(authMailFromEnv(target)).toMatchObject({ provider: 'sendgrid', from: 'me@x.co' });
  expect(mailFromEnv(target)).toMatchObject({ provider: 'sendgrid', from: 'me@x.co', mailingAddress: '1 Main St' });
  const deps = billingWebhookDeps(target);
  expect(deps?.store).toBeInstanceOf(NeonBillingStore);
  expect(deps?.mail).toMatchObject({ provider: 'sendgrid' });
}

describe('production database refusal', () => {
  it('gives a preview on the production host no stores and no mail provider', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    expectClosed(env(prod, 'preview'));
    expectClosed(env(pooled, 'preview'));
    expect(opens.n).toBe(0);
    expect(log).not.toHaveBeenCalled();
    expect(err).not.toHaveBeenCalled();
    log.mockRestore();
    err.mockRestore();
  });

  it('gives vercel dev on the production host no stores, so the file store cannot open it', () => {
    expectClosed(env(prod, 'development'));
    expect(opens.n).toBe(0);
  });

  it('still builds Neon stores for a preview on a different host, and can select SendGrid', () => {
    expectNeon(env(branch, 'preview'));
    expect(opens.n).toBeGreaterThan(0);
  });

  it('still builds stores and can select SendGrid in production', () => {
    opens.n = 0;
    expectNeon(env(prod, 'production'));
    expect(opens.n).toBeGreaterThan(0);
  });

  it('still builds stores when the production host is unset', () => {
    const target = env(prod, 'preview');
    delete target.PRODUCTION_DB_HOST;
    opens.n = 0;
    expectNeon(target);
    expect(opens.n).toBeGreaterThan(0);
  });

  it('still allows the file store when VERCEL_ENV is unset', () => {
    const target = env(prod);
    opens.n = 0;
    expect(authStoresFromEnv(target)?.auth).toBeInstanceOf(FileAuthStore);
    expect(storeFromEnv(target)).toBeInstanceOf(FileLeadStore);
    expect(billingStoreFromEnv(target)).toBeInstanceOf(FileBillingStore);
    expect(profileStoreFromEnv(target)).toBeInstanceOf(NeonProfileStore);
    expect(authMailFromEnv(target)).toMatchObject({ provider: 'sendgrid' });
    expect(mailFromEnv(target)).toMatchObject({ provider: 'sendgrid' });
    expect(opens.n).toBe(1);
  });
});
