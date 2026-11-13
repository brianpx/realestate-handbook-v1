import type { Metadata } from 'next';
import { BillingForms } from '@/components/account/BillingForms';
import { ProductCard } from '@/components/shell/ProductCard';
import { requireViewer } from '@/lib/auth/dal';
import { billingFields, EMPTY_BILLING, type BillingFields } from '@/lib/users/billing-info';
import { billingInfoStoreFromEnv } from '@/lib/users/billing-info-store';

export const metadata: Metadata = { title: 'Billing Information', alternates: { canonical: '/account/billing' } };

type Loaded = { kind: 'none' } | { kind: 'failed' } | { kind: 'ok'; fields: BillingFields };

// No row is the normal case (empty cards); a store that fails to answer hides the cards for this render rather than
// showing empty ones that would overwrite what is saved.
async function load(userId: string): Promise<Loaded> {
  const store = billingInfoStoreFromEnv(process.env);
  if (!store) return { kind: 'none' };
  try {
    const row = await store.find(userId);
    return { kind: 'ok', fields: row ? billingFields(row) : EMPTY_BILLING };
  } catch (err) {
    console.error('account: billing info read failed', err instanceof Error ? err.name : 'error');
    return { kind: 'failed' };
  }
}

// The details the reader wants their invoices to show. They are stored with the account and used on future invoices;
// there is no payment method, no charge and no invoice yet, and the page says so rather than imply otherwise.
export default async function BillingPage() {
  const { user } = await requireViewer();
  const loaded = await load(user.id);
  return (
    <ProductCard>
      <p className="part-label">Account</p>
      <h1 className="hb-title">Billing Information</h1>
      <p data-billing-notice>
        There is no payment method and there are no invoices on your account yet. The details you save here are kept with your account and used on future invoices.
      </p>
      {loaded.kind === 'ok' && <BillingForms initial={loaded.fields} accountEmail={user.email} />}
      {loaded.kind === 'none' && <p role="note">Saving billing details needs the account database, which this setup does not have.</p>}
      {loaded.kind === 'failed' && <p role="alert">Your billing details could not be loaded right now. Please try again in a moment.</p>}
    </ProductCard>
  );
}
