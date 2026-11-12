import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { sqlFromUrl } from '@/lib/db/sql';
import { NeonBillingInfoStore } from './billing-info-neon-store';
import { NeonUserStore } from './neon-store';

// Runs against a real Neon database with db/migrations/002 and 010 applied, so it only runs when TEST_DATABASE_URL
// is set (a branch, never production). It writes rows with random names and removes them afterwards.
const url = process.env.TEST_DATABASE_URL;
const run = url ? describe : describe.skip;

run('the billing info store against a real database', () => {
  const sql = sqlFromUrl(url!);
  const users = new NeonUserStore(sql);
  const store = new NeonBillingInfoStore(sql);
  const tag = randomUUID().slice(0, 8);
  const NOW = new Date();
  const created: string[] = [];
  const createUser = async (address: string) => {
    const { user } = await users.upsertVerified({ email: address, termsVersion: 'v1', at: NOW });
    created.push(user.id);
    return user;
  };

  afterAll(async () => {
    if (created.length === 0) return;
    await sql`delete from billing_profiles where user_id = any(${created}::uuid[])`;
    await sql`delete from users where id = any(${created}::uuid[])`;
  });

  it('has no row for a new user, creates one on the first save, and then changes only the fields a save names', async () => {
    const user = await createUser(`it-${tag}@integration.test`);
    expect(await store.find(user.id)).toBeNull();
    const first = await store.save(user.id, { companyName: 'Example LLC', purchaseOrder: 'PO-1' }, NOW);
    expect(first).toMatchObject({ userId: user.id, companyName: 'Example LLC', purchaseOrder: 'PO-1', taxIdType: null, invoiceLanguage: 'en' });
    expect(first?.updatedAt.getTime()).toBe(NOW.getTime());
    const later = new Date(NOW.getTime() + 60_000);
    const second = await store.save(user.id, { taxIdType: 'us_ein', taxIdValue: '12-3456789', purchaseOrder: null }, later);
    expect(second).toMatchObject({ companyName: 'Example LLC', purchaseOrder: null, taxIdType: 'us_ein', taxIdValue: '12-3456789' });
    expect(second?.updatedAt.getTime()).toBe(later.getTime());
    expect(await sql`select count(*)::int as n from billing_profiles where user_id = ${user.id}`).toEqual([{ n: 1 }]);
  });

  it('does not write for a user who is not active', async () => {
    const user = await createUser(`it-${tag}-g@integration.test`);
    await sql`update users set status = 'deleted' where id = ${user.id}`;
    expect(await store.save(user.id, { companyName: 'Late' }, NOW)).toBeNull();
    expect(await store.find(user.id)).toBeNull();
  });

  it('enforces the checks the code relies on', async () => {
    const user = await createUser(`it-${tag}-c@integration.test`);
    await expect(sql`insert into billing_profiles (user_id, company_name) values (${user.id}, ${'x'.repeat(65)})`).rejects.toThrow();
    await expect(sql`insert into billing_profiles (user_id, purchase_order) values (${user.id}, ${'x'.repeat(65)})`).rejects.toThrow();
    await expect(sql`insert into billing_profiles (user_id, address_country) values (${user.id}, 'us')`).rejects.toThrow();
    await expect(sql`insert into billing_profiles (user_id, address_postal_code) values (${user.id}, ${'x'.repeat(21)})`).rejects.toThrow();
    await expect(sql`insert into billing_profiles (user_id, invoice_language) values (${user.id}, 'fr')`).rejects.toThrow();
    await expect(sql`insert into billing_profiles (user_id, tax_id_type) values (${user.id}, 'us_ein')`).rejects.toThrow();
    await expect(sql`insert into billing_profiles (user_id, tax_id_value) values (${user.id}, '12-3456789')`).rejects.toThrow();
    await expect(sql`insert into billing_profiles (user_id) values (${randomUUID()})`).rejects.toThrow(); // no such user
    expect(await store.find(user.id)).toBeNull();
  });

  it('goes with the user: deleteByUser removes the row, and so does removing the user row', async () => {
    const user = await createUser(`it-${tag}-d@integration.test`);
    await store.save(user.id, { companyName: 'One' }, NOW);
    await store.deleteByUser(user.id);
    expect(await store.find(user.id)).toBeNull();
    await store.save(user.id, { companyName: 'Two' }, NOW);
    await sql`delete from users where id = ${user.id}`;
    created.splice(created.indexOf(user.id), 1);
    expect(await sql`select 1 from billing_profiles where user_id = ${user.id}`).toHaveLength(0);
  });
});
