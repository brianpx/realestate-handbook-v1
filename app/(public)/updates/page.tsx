import Link from 'next/link';
import { DraftNotice, PageHead, policyMetadata } from '@/components/site/Draft';
import { OFFER } from '@/lib/offer';

export const metadata = policyMetadata('updates', 'Access and updates', 'How access to the handbook works and what updates include.', '/updates');

// Both terms are set in lib/offer.ts; a null there (an open decision) is said plainly, as on /pricing.
const NOT_PUBLISHED = 'Not published yet';

export default function UpdatesPage() {
  return (
    <>
      <PageHead eyebrow="Policy" title="Access and updates" />
      <div className="pub-wrap pub-narrow pub-prose">
        <DraftNotice policy="updates" />

        <h2>How access works today</h2>
        <p>
          The handbook opens in a web browser. You sign in with a link we email to your address; there is no password. A sign-in lasts 90 days from your last visit and
          at most a year, and the <Link href="/account">Account page</Link> can end every sign-in at once. Signed in, the free set (the cover, the preface, Chapter 1 and Chapter 7)
          is open to you; the other chapters and appendices open with a purchase, which is not on sale yet. Your progress is saved in your browser on your device, not in
          the account (see <Link href="/support#saving">Support</Link>).
        </p>

        <h2>Access after purchase</h2>
        <p>{OFFER.accessTerm ?? NOT_PUBLISHED}</p>
        <p>
          A purchase belongs to the email address you sign in with. Basic opens every chapter and appendix with the essential tools; Pro opens every tool, the reading-plan
          coach and the PDF edition. Each is a one-time purchase with nothing to renew. The same address signs you in on any device; each sign-in gets its own emailed link.
        </p>

        <h2>Updates</h2>
        <p>The current edition is version 1.0, October 2026. Corrections and improvements to the chapters and tools appear in the handbook when you next open it. A change to how progress is stored is migrated automatically, and the previous copy is kept as a backup in your browser.</p>
        <ul>
          <li><strong>Basic:</strong> {OFFER.updatesByPlan.basic}</li>
          <li><strong>Pro:</strong> {OFFER.updatesByPlan.pro}</li>
        </ul>
        <p>
          An edition is a re-write of the book under a new edition number. A new chapter, tool or script added to the current edition is an addition, not a new edition.
          Pro covers both for as long as the handbook is published; if it is ever retired, notice will be given here first.
        </p>

        <p>
          A Basic owner can upgrade to Pro by paying the difference between the two prices, with no time limit. The upgrade covers the edition you bought. When a new edition is
          published, a Basic owner gets the existing-buyer discount on it as above, and Pro is priced at that edition’s Pro price.
        </p>

        <h2>Support</h2>
        <p>Self-help is on the <Link href="/support">support page</Link>.</p>

        <h2>If something changes</h2>
        <p>Material changes to this policy will be dated here. Nothing in this draft applies until it is approved.</p>
      </div>
    </>
  );
}
