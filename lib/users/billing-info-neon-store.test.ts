import { describe, expect, it } from 'vitest';
import { fakeSql } from '@/lib/db/fake-sql';
import { EMPTY_BILLING } from './billing-info';
import { NeonBillingInfoStore, rowToBillingInfo } from './billing-info-neon-store';

const AT = new Date('2026-11-08T12:00:00Z');
const ISO = AT.toISOString();
const row = {
  user_id: 'u-1', invoice_email: 'billing@example.com', company_name: 'Example LLC', address_country: 'US', address_line1: '1 Main St',
  address_line2: null, address_city: 'Austin', address_region: 'TX', address_postal_code: '78701', invoice_language: 'en',
  purchase_order: 'PO-1', tax_id_type: 'us_ein', tax_id_value: '12-3456789', updated_at: ISO,
};

describe('NeonBillingInfoStore', () => {
  it('maps a row, with nulls kept and the stamp as a Date', () => {
    expect(rowToBillingInfo(row)).toEqual({
      userId: 'u-1', invoiceEmail: 'billing@example.com', companyName: 'Example LLC', addressCountry: 'US', addressLine1: '1 Main St', addressLine2: null,
      addressCity: 'Austin', addressRegion: 'TX', addressPostalCode: '78701', invoiceLanguage: 'en', purchaseOrder: 'PO-1', taxIdType: 'us_ein',
      taxIdValue: '12-3456789', updatedAt: AT,
    });
    expect(rowToBillingInfo({ ...row, company_name: null, tax_id_type: null, tax_id_value: null })).toMatchObject({ companyName: null, taxIdType: null, taxIdValue: null });
  });
  it('finds by user id and answers null for no row', async () => {
    const { sql, calls } = fakeSql([row], []);
    const store = new NeonBillingInfoStore(sql);
    expect((await store.find('u-1'))?.companyName).toBe('Example LLC');
    expect(await store.find('nope')).toBeNull();
    expect(calls[0]!.text).toContain('from billing_profiles where user_id = ?');
    expect(calls[1]!.values).toEqual(['nope']);
  });
  it('saves in one upsert that locks the active user, binds a flag per column, and overwrites only the flagged ones', async () => {
    const { sql, calls } = fakeSql([row]);
    const saved = await new NeonBillingInfoStore(sql).save('u-1', { companyName: 'Example LLC' }, AT);
    expect(saved?.companyName).toBe('Example LLC');
    expect(calls).toHaveLength(1);
    const { text, values } = calls[0]!;
    expect(text).toContain("select id from users where id = ? and status = 'active' for update");
    expect(text).toContain('insert into billing_profiles');
    expect(text).toContain('from active_user where true');
    expect(text).toContain('on conflict (user_id) do update set');
    expect(text).toContain('company_name = case when ?::boolean then excluded.company_name else billing_profiles.company_name end');
    expect(text).toContain('tax_id_value = case when ?::boolean then excluded.tax_id_value else billing_profiles.tax_id_value end');
    expect(text).toContain('updated_at = excluded.updated_at');
    expect(text).not.toMatch(/created_at/);
    // user, twelve values (language defaulting to en), the stamp, then twelve flags in the same column order
    expect(values).toEqual(['u-1', null, 'Example LLC', null, null, null, null, null, null, 'en', null, null, null, ISO, ...[false, true, ...Array(10).fill(false)]]);
  });
  it('flags every field a patch names, including one cleared to null', async () => {
    const { sql, calls } = fakeSql([row]);
    await new NeonBillingInfoStore(sql).save('u-1', { taxIdType: null, taxIdValue: null, invoiceEmail: null }, AT);
    const flags = calls[0]!.values.slice(14);
    expect(flags).toEqual([true, false, false, false, false, false, false, false, false, false, true, true]);
  });
  it('answers null, not an error, when the user is gone and nothing was written', async () => {
    const { sql } = fakeSql([]);
    expect(await new NeonBillingInfoStore(sql).save('u-1', { ...EMPTY_BILLING }, AT)).toBeNull();
  });
  it('deletes by user id', async () => {
    const { sql, calls } = fakeSql([]);
    await new NeonBillingInfoStore(sql).deleteByUser('u-1');
    expect(calls[0]).toEqual({ text: 'delete from billing_profiles where user_id = ?', values: ['u-1'] });
  });
});
