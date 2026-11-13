import { emailSchema } from '@/lib/validate/email';
import { z } from '@/lib/zod';
import { isCountryCode } from './billing-countries';
import { JURISDICTIONS } from './profile';

// The details a reader wants their invoices to show (db/migrations/010_billing_info.sql): at most one row per user,
// every field optional, null meaning "not given". Stored for future invoices; no payment provider reads them yet.
// No server imports here: the cards on the billing page (client components) read the choice lists.

export const INVOICE_LANGUAGES = ['en'] as const;
export type InvoiceLanguage = (typeof INVOICE_LANGUAGES)[number];
export const INVOICE_LANGUAGE_LABELS: Record<InvoiceLanguage, string> = { en: 'English' };

export const BILLING_LIMITS = {
  invoiceEmail: 254,
  companyName: 64,
  addressLine: 100,
  addressCity: 100,
  addressRegion: 100,
  addressPostalCode: 20,
  purchaseOrder: 64,
  taxIdValue: 64,
} as const;

/** US states, the District and the inhabited territories: the region choices when the country is the United States. */
export const US_REGIONS = JURISDICTIONS.filter(code => code !== 'other');

// Each type checks the value leniently, ignoring spaces, dots and dashes and the case: it rejects only what cannot be
// that kind of number, since a stricter rule would turn a valid but unusual number away. The value is stored as typed.
const compact = (value: string) => value.replace(/[\s.-]/g, '').toUpperCase();
export const TAX_ID_TYPES = {
  us_ein: { label: 'US EIN', example: '12-3456789', valid: (v: string) => /^\d{9}$/.test(compact(v)) },
  eu_vat: { label: 'EU VAT', example: 'DE123456789', valid: (v: string) => /^[A-Z]{2}[A-Z0-9]{2,12}$/.test(compact(v)) },
  gb_vat: { label: 'UK VAT', example: 'GB123456789', valid: (v: string) => /^(GB)?(\d{9}|\d{12}|GD\d{3}|HA\d{3})$/.test(compact(v)) },
  ca_gst: { label: 'Canada GST/HST', example: '123456789RT0001', valid: (v: string) => /^\d{9}(RT\d{4})?$/.test(compact(v)) },
  au_abn: { label: 'Australia ABN', example: '51 824 753 556', valid: (v: string) => /^\d{11}$/.test(compact(v)) },
  in_gst: { label: 'India GST', example: '22AAAAA0000A1Z5', valid: (v: string) => /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(compact(v)) },
  other: { label: 'Other', example: '', valid: () => true },
} as const;
export type TaxIdType = keyof typeof TAX_ID_TYPES;
export const TAX_ID_TYPE_KEYS = Object.keys(TAX_ID_TYPES) as [TaxIdType, ...TaxIdType[]];
const isTaxIdType = (value: string): value is TaxIdType => Object.hasOwn(TAX_ID_TYPES, value);

/** The columns, as the cards and the store see them; null is "not given". */
export type BillingFields = {
  invoiceEmail: string | null;
  companyName: string | null;
  addressCountry: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  addressCity: string | null;
  addressRegion: string | null;
  addressPostalCode: string | null;
  invoiceLanguage: InvoiceLanguage;
  purchaseOrder: string | null;
  taxIdType: TaxIdType | null;
  taxIdValue: string | null;
};
export type BillingField = keyof BillingFields;

/** One row of `billing_profiles` as the app reads it. */
export type BillingInfo = BillingFields & { userId: string; updatedAt: Date };

export const EMPTY_BILLING: BillingFields = {
  invoiceEmail: null,
  companyName: null,
  addressCountry: null,
  addressLine1: null,
  addressLine2: null,
  addressCity: null,
  addressRegion: null,
  addressPostalCode: null,
  invoiceLanguage: 'en',
  purchaseOrder: null,
  taxIdType: null,
  taxIdValue: null,
};

export const billingFields = (b: BillingFields): BillingFields => ({
  invoiceEmail: b.invoiceEmail,
  companyName: b.companyName,
  addressCountry: b.addressCountry,
  addressLine1: b.addressLine1,
  addressLine2: b.addressLine2,
  addressCity: b.addressCity,
  addressRegion: b.addressRegion,
  addressPostalCode: b.addressPostalCode,
  invoiceLanguage: b.invoiceLanguage,
  purchaseOrder: b.purchaseOrder,
  taxIdType: b.taxIdType,
  taxIdValue: b.taxIdValue,
});

/** The fields each card saves together. A request naming one field of a group names all of them. */
export const BILLING_GROUPS = {
  invoiceEmail: ['invoiceEmail'],
  companyName: ['companyName'],
  address: ['addressCountry', 'addressLine1', 'addressLine2', 'addressCity', 'addressRegion', 'addressPostalCode'],
  invoiceLanguage: ['invoiceLanguage'],
  purchaseOrder: ['purchaseOrder'],
  taxId: ['taxIdType', 'taxIdValue'],
} as const satisfies Record<string, readonly BillingField[]>;

/** What a request may carry: only the fields it names are written. */
export type BillingPatch = Partial<BillingFields>;

const blankToNull = (value: string): string | null => value || null;
// Control and format characters (\p{C}) could reorder or hide text where an invoice shows it.
const clean = (value: string) => !/\p{C}/u.test(value);
const text = (max: number) => z.string().trim().max(max).refine(clean).transform(blankToNull);
const POSTAL_CODE = /^[A-Za-z0-9][A-Za-z0-9 -]*$/;

const shape = {
  invoiceEmail: z.string().trim().refine(clean).transform(blankToNull).pipe(emailSchema.nullable()),
  companyName: text(BILLING_LIMITS.companyName),
  addressCountry: z.string().trim().refine(clean).transform(blankToNull).refine(code => code === null || isCountryCode(code)),
  addressLine1: text(BILLING_LIMITS.addressLine),
  addressLine2: text(BILLING_LIMITS.addressLine),
  addressCity: text(BILLING_LIMITS.addressCity),
  addressRegion: text(BILLING_LIMITS.addressRegion),
  addressPostalCode: text(BILLING_LIMITS.addressPostalCode).refine(code => code === null || POSTAL_CODE.test(code)),
  invoiceLanguage: z.enum(INVOICE_LANGUAGES),
  purchaseOrder: text(BILLING_LIMITS.purchaseOrder),
  taxIdType: z.string().trim().transform(blankToNull).refine((type): type is TaxIdType | null => type === null || isTaxIdType(type)),
  taxIdValue: text(BILLING_LIMITS.taxIdValue),
};

/**
 * The PUT body of /api/account/billing-info, checked at the boundary: a partial object of one card's fields at a
 * time, strict (an unknown key, including an account id, is refused), at least one field, trimmed, blank as null.
 * The cross-field rules: a card's fields arrive together; an address needs a country (a US one needs a state code);
 * the tax ID is a pair, type and number both given or both blank, and the number must look like its type.
 * Issues name the field (path), never its value.
 */
export const billingInfoInputSchema = z.object(shape).partial().strict().superRefine((value, ctx) => {
  const given = Object.keys(value);
  if (given.length === 0) ctx.addIssue({ code: 'custom', message: 'no fields' });
  for (const fields of Object.values(BILLING_GROUPS)) {
    const missing = fields.filter(f => !given.includes(f));
    if (missing.length > 0 && missing.length < fields.length) for (const f of missing) ctx.addIssue({ code: 'custom', path: [f], message: 'missing' });
  }
  const fail = (path: BillingField) => ctx.addIssue({ code: 'custom', path: [path], message: 'invalid' });
  if ('addressCountry' in value) {
    const { addressCountry, addressLine1, addressLine2, addressCity, addressRegion, addressPostalCode } = value;
    if (addressCountry == null && [addressLine1, addressLine2, addressCity, addressRegion, addressPostalCode].some(part => part != null)) fail('addressCountry');
    if (addressCountry === 'US' && addressRegion != null && !(US_REGIONS as readonly string[]).includes(addressRegion)) fail('addressRegion');
  }
  if ('taxIdType' in value) {
    const { taxIdType, taxIdValue } = value;
    if (taxIdType == null && taxIdValue != null) fail('taxIdType');
    else if (taxIdType != null && taxIdValue == null) fail('taxIdValue');
    else if (taxIdType != null && taxIdValue != null && isTaxIdType(taxIdType) && !TAX_ID_TYPES[taxIdType].valid(taxIdValue)) fail('taxIdValue');
  }
});
export type BillingInput = z.infer<typeof billingInfoInputSchema>;
