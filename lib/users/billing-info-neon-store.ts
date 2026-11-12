import { toDate, toText, type Sql } from '@/lib/db/sql';
import { EMPTY_BILLING, type BillingInfo, type BillingPatch, type TaxIdType } from './billing-info';
import type { BillingInfoStore } from './billing-info-store';

export function rowToBillingInfo(row: Record<string, unknown>): BillingInfo {
  return {
    userId: String(row.user_id),
    invoiceEmail: toText(row.invoice_email),
    companyName: toText(row.company_name),
    addressCountry: toText(row.address_country),
    addressLine1: toText(row.address_line1),
    addressLine2: toText(row.address_line2),
    addressCity: toText(row.address_city),
    addressRegion: toText(row.address_region),
    addressPostalCode: toText(row.address_postal_code),
    invoiceLanguage: 'en',
    purchaseOrder: toText(row.purchase_order),
    taxIdType: toText(row.tax_id_type) as TaxIdType | null,
    taxIdValue: toText(row.tax_id_value),
    updatedAt: toDate(row.updated_at),
  };
}

// The production store. The table is defined in db/migrations/010_billing_info.sql, which also describes the upsert.
// Each column is written only when the request named it (`has_*`); otherwise the stored value stays.
export class NeonBillingInfoStore implements BillingInfoStore {
  constructor(private readonly sql: Sql) {}

  async find(userId: string) {
    const rows = await this.sql`
      select user_id, invoice_email, company_name, address_country, address_line1, address_line2, address_city, address_region,
        address_postal_code, invoice_language, purchase_order, tax_id_type, tax_id_value, updated_at
      from billing_profiles where user_id = ${userId}`;
    return rows[0] ? rowToBillingInfo(rows[0]) : null;
  }

  async save(userId: string, patch: BillingPatch, at: Date) {
    const f = { ...EMPTY_BILLING, ...patch };
    const has = (key: keyof BillingPatch) => key in patch;
    // Recheck and lock the active account in the write itself: a request authorized before account deletion
    // must not recreate personal data after that deletion commits.
    const rows = await this.sql`
      with active_user as (
        select id from users where id = ${userId} and status = 'active' for update
      )
      insert into billing_profiles (user_id, invoice_email, company_name, address_country, address_line1, address_line2,
        address_city, address_region, address_postal_code, invoice_language, purchase_order, tax_id_type, tax_id_value, updated_at)
      select id, ${f.invoiceEmail}, ${f.companyName}, ${f.addressCountry}, ${f.addressLine1}, ${f.addressLine2},
        ${f.addressCity}, ${f.addressRegion}, ${f.addressPostalCode}, ${f.invoiceLanguage}, ${f.purchaseOrder}, ${f.taxIdType}, ${f.taxIdValue},
        ${at.toISOString()}
      from active_user where true
      on conflict (user_id) do update set
        invoice_email = case when ${has('invoiceEmail')}::boolean then excluded.invoice_email else billing_profiles.invoice_email end,
        company_name = case when ${has('companyName')}::boolean then excluded.company_name else billing_profiles.company_name end,
        address_country = case when ${has('addressCountry')}::boolean then excluded.address_country else billing_profiles.address_country end,
        address_line1 = case when ${has('addressLine1')}::boolean then excluded.address_line1 else billing_profiles.address_line1 end,
        address_line2 = case when ${has('addressLine2')}::boolean then excluded.address_line2 else billing_profiles.address_line2 end,
        address_city = case when ${has('addressCity')}::boolean then excluded.address_city else billing_profiles.address_city end,
        address_region = case when ${has('addressRegion')}::boolean then excluded.address_region else billing_profiles.address_region end,
        address_postal_code = case when ${has('addressPostalCode')}::boolean then excluded.address_postal_code else billing_profiles.address_postal_code end,
        invoice_language = case when ${has('invoiceLanguage')}::boolean then excluded.invoice_language else billing_profiles.invoice_language end,
        purchase_order = case when ${has('purchaseOrder')}::boolean then excluded.purchase_order else billing_profiles.purchase_order end,
        tax_id_type = case when ${has('taxIdType')}::boolean then excluded.tax_id_type else billing_profiles.tax_id_type end,
        tax_id_value = case when ${has('taxIdValue')}::boolean then excluded.tax_id_value else billing_profiles.tax_id_value end,
        updated_at = excluded.updated_at
      returning user_id, invoice_email, company_name, address_country, address_line1, address_line2, address_city, address_region,
        address_postal_code, invoice_language, purchase_order, tax_id_type, tax_id_value, updated_at`;
    return rows[0] ? rowToBillingInfo(rows[0]) : null;
  }

  async deleteByUser(userId: string) {
    await this.sql`delete from billing_profiles where user_id = ${userId}`;
  }
}
