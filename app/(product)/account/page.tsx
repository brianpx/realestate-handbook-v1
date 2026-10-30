import type { Metadata } from 'next';
import Link from 'next/link';
import { SavedProgress } from '@/components/handbook/AccountPanels';
import { ProductCard } from '@/components/shell/ProductCard';
import { OWNER, purchaseOpen } from '@/lib/offer';

export const metadata: Metadata = { title: 'Account and saved progress', alternates: { canonical: '/account' } };

// There is no sign-in, purchase record or server-side progress yet (see docs/launch-handoff.md), so this page says so
// and offers only what works: the device's saved progress, backup and restore.
export default function AccountPage() {
  return (
    <ProductCard>
      <p className="part-label">Account</p>
      <h1 className="hb-title">Account and saved progress</h1>

      <h2 className="hb-h2">Access</h2>
      <p>
        The handbook has no accounts, passwords or purchase records today. It opens in your browser without signing in, and nothing here can be used to look up or
        recover a purchase.{' '}
        {purchaseOpen()
          ? <>How a purchase gives you access is explained on <Link href="/updates">Access and updates</Link>.</>
          : <>Purchase is not open yet; <Link href="/pricing">the pricing page</Link> says where things stand.</>}
      </p>

      <SavedProgress />

      <h2 className="hb-h2">Recovering your place</h2>
      <ul>
        <li>Lost your place on the same device? Check you are in the same browser and the same web address, and not in a private window.</li>
        <li>Moving to a new device or browser? Download a file here first, then restore it there.</li>
        <li>Restored a file by mistake? The progress that was here before is kept as a backup copy in this browser until your next restore, but there is no button to bring it back yet.</li>
      </ul>
      <p>
        {OWNER.supportEmail
          ? <>Questions: <a href={`mailto:${OWNER.supportEmail}`}>{OWNER.supportEmail}</a>.</>
          : <>A support address has not been published yet; <Link href="/support">the support page</Link> covers the common cases.</>}
      </p>
    </ProductCard>
  );
}
