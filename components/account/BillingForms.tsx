'use client';

import { useState, type ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { COUNTRY_CODES, COUNTRY_NAMES } from '@/lib/users/billing-countries';
import {
  BILLING_LIMITS,
  INVOICE_LANGUAGE_LABELS,
  INVOICE_LANGUAGES,
  TAX_ID_TYPE_KEYS,
  TAX_ID_TYPES,
  US_REGIONS,
  type BillingFields,
  type TaxIdType,
} from '@/lib/users/billing-info';
import { JURISDICTION_LABELS } from '@/lib/users/profile';
import { BillingCard } from './BillingCard';

type Props = { initial: BillingFields; accountEmail: string };

const text = (value: string | null) => value ?? '';
const same = (a: string, b: string | null) => a.trim() === text(b);
const SELECT = 'account-input';

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

// The Billing Information page's six cards. Each saves its own fields and keeps its own "saved" copy, so editing one
// never disturbs another; the values start as the server rendered them.
export function BillingForms({ initial, accountEmail }: Props) {
  return (
    <>
      <InvoiceEmailCard initial={initial} accountEmail={accountEmail} />
      <CompanyNameCard initial={initial} />
      <AddressCard initial={initial} />
      <InvoiceLanguageCard initial={initial} />
      <PurchaseOrderCard initial={initial} />
      <TaxIdCard initial={initial} />
    </>
  );
}

function InvoiceEmailCard({ initial, accountEmail }: { initial: BillingFields; accountEmail: string }) {
  const [saved, setSaved] = useState(text(initial.invoiceEmail));
  const [value, setValue] = useState(saved);
  return (
    <BillingCard
      id="invoice-email"
      title="Invoice Email Recipient"
      description="Enter the email address future invoices should be sent to. Leave it blank to use your account email."
      footer="Leave blank to use your account email. Please use 254 characters at maximum."
      dirty={!same(value, saved || null)}
      body={() => ({ invoiceEmail: value })}
      onSaved={s => { setSaved(text(s.invoiceEmail)); setValue(text(s.invoiceEmail)); }}
      invalidMessage="Enter a valid email address, or leave the box blank."
    >
      {({ busy, invalid, describedBy }) => (
        <>
          <label htmlFor="invoiceEmail" className="sr-only">Invoice email recipient</label>
          <Input id="invoiceEmail" name="invoiceEmail" type="email" autoComplete="off" maxLength={BILLING_LIMITS.invoiceEmail} placeholder={accountEmail} value={value} disabled={busy} onChange={e => setValue(e.target.value)} aria-invalid={invalid('invoiceEmail')} aria-describedby={describedBy} className="h-10 max-w-sm" />
        </>
      )}
    </BillingCard>
  );
}

function CompanyNameCard({ initial }: { initial: BillingFields }) {
  const [saved, setSaved] = useState(text(initial.companyName));
  const [value, setValue] = useState(saved);
  return (
    <BillingCard
      id="company-name"
      title="Company Name"
      description="Enter the name of your company or brokerage as you want it shown on future invoices."
      footer="Please use 64 characters at maximum."
      dirty={!same(value, saved || null)}
      body={() => ({ companyName: value })}
      onSaved={s => { setSaved(text(s.companyName)); setValue(text(s.companyName)); }}
      invalidMessage={`Use ${BILLING_LIMITS.companyName} characters at most, with no control characters.`}
    >
      {({ busy, invalid, describedBy }) => (
        <>
          <label htmlFor="companyName" className="sr-only">Company name</label>
          <Input id="companyName" name="companyName" type="text" autoComplete="organization" maxLength={BILLING_LIMITS.companyName} value={value} disabled={busy} onChange={e => setValue(e.target.value)} aria-invalid={invalid('companyName')} aria-describedby={describedBy} className="h-10 max-w-sm" />
        </>
      )}
    </BillingCard>
  );
}

type Address = { country: string; line1: string; line2: string; city: string; region: string; postalCode: string };
const addressOf = (f: BillingFields): Address => ({ country: text(f.addressCountry), line1: text(f.addressLine1), line2: text(f.addressLine2), city: text(f.addressCity), region: text(f.addressRegion), postalCode: text(f.addressPostalCode) });

function AddressCard({ initial }: { initial: BillingFields }) {
  const [saved, setSaved] = useState<Address>(addressOf(initial));
  const [value, setValue] = useState<Address>(saved);
  const set = (key: keyof Address, next: string) => setValue(v => ({ ...v, [key]: next }));
  // The state list belongs to the United States; any other country gets a free-text box, and the old value goes
  // when the kind of box changes so a state code never lands in a province box (or the reverse).
  const changeCountry = (country: string) => setValue(v => ({ ...v, country, region: (country === 'US') === (v.country === 'US') ? v.region : '' }));
  const dirty = (Object.keys(value) as (keyof Address)[]).some(key => value[key].trim() !== saved[key]);
  const us = value.country === 'US';
  return (
    <BillingCard
      id="billing-address"
      title="Billing Address"
      description="Enter the address future invoices should show."
      footer="Your address is only used on your invoices."
      dirty={dirty}
      body={() => ({ addressCountry: value.country, addressLine1: value.line1, addressLine2: value.line2, addressCity: value.city, addressRegion: value.region, addressPostalCode: value.postalCode })}
      onSaved={s => { const next = addressOf(s); setSaved(next); setValue(next); }}
      invalidMessage="Check the address: choose a country, use a state from the list for the United States, and keep the postal code to letters, numbers, spaces and dashes."
    >
      {({ busy, invalid, describedBy }) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="addressCountry" label="Country">
            <select id="addressCountry" name="addressCountry" className={SELECT} autoComplete="country" disabled={busy} value={value.country} onChange={e => changeCountry(e.target.value)} aria-invalid={invalid('addressCountry')} aria-describedby={describedBy}>
              <option value="">Select a country</option>
              {COUNTRY_CODES.map(code => <option key={code} value={code}>{COUNTRY_NAMES[code]}</option>)}
            </select>
          </Field>
          <Field id="addressLine1" label="Street Address">
            <Input id="addressLine1" name="addressLine1" type="text" autoComplete="address-line1" maxLength={BILLING_LIMITS.addressLine} disabled={busy} value={value.line1} onChange={e => set('line1', e.target.value)} aria-invalid={invalid('addressLine1')} aria-describedby={describedBy} className="h-10" />
          </Field>
          <Field id="addressLine2" label="Address Line 2 (optional)">
            <Input id="addressLine2" name="addressLine2" type="text" autoComplete="address-line2" maxLength={BILLING_LIMITS.addressLine} disabled={busy} value={value.line2} onChange={e => set('line2', e.target.value)} aria-invalid={invalid('addressLine2')} aria-describedby={describedBy} className="h-10" />
          </Field>
          <Field id="addressCity" label="City">
            <Input id="addressCity" name="addressCity" type="text" autoComplete="address-level2" maxLength={BILLING_LIMITS.addressCity} disabled={busy} value={value.city} onChange={e => set('city', e.target.value)} aria-invalid={invalid('addressCity')} aria-describedby={describedBy} className="h-10" />
          </Field>
          <Field id="addressRegion" label="State/Province">
            {us ? (
              <select id="addressRegion" name="addressRegion" className={SELECT} autoComplete="address-level1" disabled={busy} value={value.region} onChange={e => set('region', e.target.value)} aria-invalid={invalid('addressRegion')} aria-describedby={describedBy}>
                <option value="">Select a state</option>
                {US_REGIONS.map(code => <option key={code} value={code}>{JURISDICTION_LABELS[code]}</option>)}
              </select>
            ) : (
              <Input id="addressRegion" name="addressRegion" type="text" autoComplete="address-level1" maxLength={BILLING_LIMITS.addressRegion} disabled={busy} value={value.region} onChange={e => set('region', e.target.value)} aria-invalid={invalid('addressRegion')} aria-describedby={describedBy} className="h-10" />
            )}
          </Field>
          <Field id="addressPostalCode" label="ZIP/Postal Code">
            <Input id="addressPostalCode" name="addressPostalCode" type="text" autoComplete="postal-code" maxLength={BILLING_LIMITS.addressPostalCode} disabled={busy} value={value.postalCode} onChange={e => set('postalCode', e.target.value)} aria-invalid={invalid('addressPostalCode')} aria-describedby={describedBy} className="h-10" />
          </Field>
        </div>
      )}
    </BillingCard>
  );
}

function InvoiceLanguageCard({ initial }: { initial: BillingFields }) {
  const [saved, setSaved] = useState<string>(initial.invoiceLanguage);
  const [value, setValue] = useState(saved);
  return (
    <BillingCard
      id="invoice-language"
      title="Invoice Language"
      description="Choose the language your future invoices are written in."
      footer="English is the only invoice language available for now."
      dirty={value !== saved}
      body={() => ({ invoiceLanguage: value })}
      onSaved={s => { setSaved(s.invoiceLanguage); setValue(s.invoiceLanguage); }}
      invalidMessage="That language is not available."
    >
      {({ busy, invalid, describedBy }) => (
        <>
          <label htmlFor="invoiceLanguage" className="sr-only">Invoice language</label>
          <select id="invoiceLanguage" name="invoiceLanguage" className={`${SELECT} max-w-sm`} disabled={busy} value={value} onChange={e => setValue(e.target.value)} aria-invalid={invalid('invoiceLanguage')} aria-describedby={describedBy}>
            {INVOICE_LANGUAGES.map(code => <option key={code} value={code}>{INVOICE_LANGUAGE_LABELS[code]}</option>)}
          </select>
        </>
      )}
    </BillingCard>
  );
}

function PurchaseOrderCard({ initial }: { initial: BillingFields }) {
  const [saved, setSaved] = useState(text(initial.purchaseOrder));
  const [value, setValue] = useState(saved);
  return (
    <BillingCard
      id="purchase-order"
      title="Invoice Purchase Order"
      description="Enter a purchase order number to show on future invoices, if your company asks for one."
      footer="Please use 64 characters at maximum."
      dirty={!same(value, saved || null)}
      body={() => ({ purchaseOrder: value })}
      onSaved={s => { setSaved(text(s.purchaseOrder)); setValue(text(s.purchaseOrder)); }}
      invalidMessage={`Use ${BILLING_LIMITS.purchaseOrder} characters at most, with no control characters.`}
    >
      {({ busy, invalid, describedBy }) => (
        <>
          <label htmlFor="purchaseOrder" className="sr-only">Invoice purchase order</label>
          <Input id="purchaseOrder" name="purchaseOrder" type="text" autoComplete="off" maxLength={BILLING_LIMITS.purchaseOrder} value={value} disabled={busy} onChange={e => setValue(e.target.value)} aria-invalid={invalid('purchaseOrder')} aria-describedby={describedBy} className="h-10 max-w-sm" />
        </>
      )}
    </BillingCard>
  );
}

function TaxIdCard({ initial }: { initial: BillingFields }) {
  const [saved, setSaved] = useState({ type: text(initial.taxIdType), value: text(initial.taxIdValue) });
  const [type, setType] = useState(saved.type);
  const [value, setValue] = useState(saved.value);
  const example = type in TAX_ID_TYPES ? TAX_ID_TYPES[type as TaxIdType].example : '';
  return (
    <BillingCard
      id="tax-id"
      title="Tax ID"
      description="Enter your tax identification number to show on future invoices. Choose its type first."
      footer="Choose no type and leave the number blank to remove it."
      dirty={type !== saved.type || value.trim() !== saved.value}
      body={() => ({ taxIdType: type, taxIdValue: value })}
      onSaved={s => { const next = { type: text(s.taxIdType), value: text(s.taxIdValue) }; setSaved(next); setType(next.type); setValue(next.value); }}
      invalidMessage="Check the tax ID: choose its type, enter the number, and make sure it matches the format for that type."
    >
      {({ busy, invalid, describedBy }) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="taxIdType" label="Tax ID Type">
            <select id="taxIdType" name="taxIdType" className={SELECT} disabled={busy} value={type} onChange={e => { setType(e.target.value); if (!e.target.value) setValue(''); }} aria-invalid={invalid('taxIdType')} aria-describedby={describedBy}>
              <option value="">No tax ID</option>
              {TAX_ID_TYPE_KEYS.map(key => <option key={key} value={key}>{TAX_ID_TYPES[key].label}</option>)}
            </select>
          </Field>
          <Field id="taxIdValue" label="Tax ID Number">
            <Input id="taxIdValue" name="taxIdValue" type="text" autoComplete="off" maxLength={BILLING_LIMITS.taxIdValue} placeholder={example} value={value} disabled={busy || !type} onChange={e => setValue(e.target.value)} aria-invalid={invalid('taxIdValue')} aria-describedby={describedBy} className="h-10" />
          </Field>
        </div>
      )}
    </BillingCard>
  );
}
