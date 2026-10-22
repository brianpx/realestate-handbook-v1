import Link from 'next/link';
import { Decision, DraftNotice, PageHead, policyMetadata } from '@/components/site/Draft';
import { OFFER } from '@/lib/offer';

export const metadata = policyMetadata('updates', 'Access and updates', 'How access to the handbook works and what updates include.', '/updates');

export default function UpdatesPage() {
  return (
    <>
      <PageHead eyebrow="Policy" title="Access and updates" />
      <div className="pub-wrap pub-narrow pub-prose">
        <DraftNotice policy="updates" />

        <h2>How access works today</h2>
        <p>
          The handbook opens in a web browser. There are no accounts, passwords or purchase records in the product yet, and the handbook pages are not locked
          behind a login. Your progress is saved in your browser on your device (see <Link href="/support#saving">Support</Link>).
        </p>

        <h2>Access after purchase</h2>
        {OFFER.accessTerm ? <p>{OFFER.accessTerm}</p> : (
          <Decision>how a purchase turns into access (for example a sign-in link or an access code), how long access lasts, and whether it can be used on more than one device.</Decision>
        )}

        <h2>Updates</h2>
        <p>The current edition is version 1.0, October 2026. Corrections and improvements to the chapters and tools appear in the handbook when you next open it. A change to how progress is stored is migrated automatically, and the previous copy is kept as a backup in your browser.</p>
        {OFFER.updatesTerm ? <p>{OFFER.updatesTerm}</p> : (
          <Decision>what “updates” covers for a buyer: fixes only, or new editions as well, and for how long.</Decision>
        )}

        <h2>Support</h2>
        <p>Self-help is on the <Link href="/support">support page</Link>.</p>

        <h2>If something changes</h2>
        <p>Material changes to this policy will be dated here. Nothing in this draft applies until it is approved.</p>
      </div>
    </>
  );
}
