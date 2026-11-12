import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_BILLING } from './billing-info';
import { billingInfoStoreFromEnv, FileBillingInfoStore, MemoryBillingInfoStore, type BillingInfoStore } from './billing-info-store';

const AT = new Date('2026-11-08T12:00:00Z');
const LATER = new Date('2026-11-09T12:00:00Z');

function behaves(name: string, make: () => Promise<BillingInfoStore>) {
  describe(name, () => {
    it('has no row for a new user and creates one on the first save with the rest empty', async () => {
      const store = await make();
      expect(await store.find('u-1')).toBeNull();
      const saved = await store.save('u-1', { companyName: 'Example LLC' }, AT);
      expect(saved).toEqual({ ...EMPTY_BILLING, companyName: 'Example LLC', userId: 'u-1', updatedAt: AT });
      expect(await store.find('u-1')).toEqual(saved);
    });
    it('writes only the fields it is given and leaves the others as they were', async () => {
      const store = await make();
      await store.save('u-1', { companyName: 'Example LLC', purchaseOrder: 'PO-1' }, AT);
      await store.save('u-1', { taxIdType: 'us_ein', taxIdValue: '12-3456789' }, AT);
      const third = await store.save('u-1', { purchaseOrder: null }, LATER);
      expect(third).toMatchObject({ companyName: 'Example LLC', purchaseOrder: null, taxIdType: 'us_ein', taxIdValue: '12-3456789', invoiceLanguage: 'en', updatedAt: LATER });
    });
    it('keeps one user’s row apart from another’s', async () => {
      const store = await make();
      await store.save('u-1', { companyName: 'One' }, AT);
      await store.save('u-2', { companyName: 'Two' }, AT);
      await store.save('u-1', { companyName: 'One again' }, LATER);
      expect((await store.find('u-2'))?.companyName).toBe('Two');
    });
    it('deletes a user’s row and only theirs, and is quiet when there is none', async () => {
      const store = await make();
      await store.save('u-1', { companyName: 'One', addressCity: 'Austin' }, AT);
      await store.save('u-2', { companyName: 'Two' }, AT);
      await store.deleteByUser('u-1');
      await store.deleteByUser('u-9');
      expect(await store.find('u-1')).toBeNull();
      expect((await store.find('u-2'))?.companyName).toBe('Two');
    });
  });
}

behaves('the memory store', async () => new MemoryBillingInfoStore());

describe('the file store', () => {
  let dir: string;
  beforeEach(async () => { dir = await mkdtemp(path.join(tmpdir(), 'billing-info-')); });
  afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

  behaves('as a store', async () => new FileBillingInfoStore(path.join(dir, 'nested', 'b.json')));

  it('survives a new instance on the same file, and holds the stamp as a Date', async () => {
    const file = path.join(dir, 'b.json');
    await new FileBillingInfoStore(file).save('u-1', { companyName: 'Example LLC' }, AT);
    const found = await new FileBillingInfoStore(file).find('u-1');
    expect(found?.companyName).toBe('Example LLC');
    expect(found?.updatedAt.getTime()).toBe(AT.getTime());
  });
  it('removes the data from the file on delete', async () => {
    const file = path.join(dir, 'b.json');
    const store = new FileBillingInfoStore(file);
    await store.save('u-1', { companyName: 'Example LLC', taxIdType: 'other', taxIdValue: 'SECRET-123' }, AT);
    await store.deleteByUser('u-1');
    expect(await readFile(file, 'utf8')).not.toContain('SECRET-123');
  });
  it('keeps concurrent saves of different cards from overwriting each other', async () => {
    const store = new FileBillingInfoStore(path.join(dir, 'b.json'));
    await Promise.all([store.save('u-1', { companyName: 'A' }, AT), store.save('u-1', { purchaseOrder: 'B' }, AT), store.save('u-1', { addressCity: 'C' }, AT)]);
    expect(await store.find('u-1')).toMatchObject({ companyName: 'A', purchaseOrder: 'B', addressCity: 'C' });
  });
});

describe('billingInfoStoreFromEnv', () => {
  it('uses the file next to the auth file when AUTH_STORE=file outside a hosted deployment, one instance per path', () => {
    const env = { AUTH_STORE: 'file', AUTH_STORE_PATH: '/tmp/x/auth.json' };
    const store = billingInfoStoreFromEnv(env);
    expect(store).toBeInstanceOf(FileBillingInfoStore);
    expect(billingInfoStoreFromEnv(env)).toBe(store);
  });
  it('is none on a hosted deployment without a database, and for no configuration at all', () => {
    expect(billingInfoStoreFromEnv({ AUTH_STORE: 'file', VERCEL_ENV: 'preview' })).toBeNull();
    expect(billingInfoStoreFromEnv({})).toBeNull();
  });
  it('opens the database store when DATABASE_URL is set', () => {
    expect(billingInfoStoreFromEnv({ DATABASE_URL: 'postgres://u:p@ep-dev-1.c-1.us-east-1.aws.neon.tech/db' })?.constructor.name).toBe('NeonBillingInfoStore');
  });
  it('refuses a non-production deployment pointed at the production host', () => {
    const env = { VERCEL_ENV: 'preview', PRODUCTION_DB_HOST: 'ep-prod-1234', DATABASE_URL: 'postgres://u:p@ep-prod-1234.c-1.us-east-1.aws.neon.tech/db' };
    expect(billingInfoStoreFromEnv(env)).toBeNull();
  });
});
