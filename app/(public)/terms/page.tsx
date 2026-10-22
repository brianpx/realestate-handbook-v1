import Link from 'next/link';
import { Decision, DraftNotice, PageHead, policyMetadata } from '@/components/site/Draft';
import { OWNER } from '@/lib/offer';

export const metadata = policyMetadata('terms', 'Terms of use', 'The terms for using the handbook and its tools.', '/terms');

export default function TermsPage() {
  return (
    <>
      <PageHead eyebrow="Policy" title="Terms of use" />
      <div className="pub-wrap pub-narrow pub-prose">
        <DraftNotice policy="terms" />

        <h2>What this is</h2>
        <p>
          Finding, Keeping, and Nurturing Clients is training material for new real estate agents, with interactive tools. It is provided by{' '}
          {OWNER.businessName ?? 'the author'}. Using the site means you accept these terms once they are approved.
        </p>
        {!OWNER.businessName && <Decision>the legal name of the seller and a postal address.</Decision>}

        <h2>Not legal or professional advice</h2>
        <p>
          The handbook describes professional habits, not legal advice. Agency, disclosure, compensation, advertising and prospecting rules differ by state and change over
          time. Confirm forms and rules with your broker, your office leadership and your state regulator. The handbook does not replace brokerage supervision.
        </p>

        <h2>No guarantee of results</h2>
        <p>
          Examples, ratios and milestones are planning aids. They are not predictions, and the handbook does not promise closings, income or any result. Your outcomes depend on
          your market, your effort and many things outside the handbook.
        </p>

        <h2>Your use</h2>
        <ul>
          <li>Your access is for your own use. Do not copy, resell or publish the handbook or its tools.</li>
          <li>You are responsible for following your license law, your broker’s policies and the rules on calls, texts and email you send.</li>
          <li>Progress you save is stored in your own browser. Keeping a backup is your responsibility.</li>
        </ul>

        <h2>Third-party names</h2>
        <p>Keller Williams Command and other product or company names appear as examples. They belong to their owners, and their use here is not an endorsement or an affiliation.</p>

        <h2>Changes, access and liability</h2>
        <Decision>how long access lasts and whether the terms may change, see <Link href="/updates">Access and updates</Link>.</Decision>
        <Decision>the limits on liability, the governing law and where disputes are heard. These need a professional’s review.</Decision>

        <h2>Related policies</h2>
        <p><Link href="/privacy">Privacy</Link> · <Link href="/refunds">Refunds</Link> · <Link href="/updates">Access and updates</Link></p>
      </div>
    </>
  );
}
