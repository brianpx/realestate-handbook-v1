import Link from 'next/link';
import { Decision, DraftNotice, PageHead, policyMetadata } from '@/components/site/Draft';

export const metadata = policyMetadata('refunds', 'Refund policy', 'The handbook’s refund policy.', '/refunds');

export default function RefundsPage() {
  return (
    <>
      <PageHead eyebrow="Policy" title="Refund policy" />
      <div className="pub-wrap pub-narrow pub-prose">
        <DraftNotice policy="refunds" />
        <p><strong>No refund commitment has been made.</strong> Purchase is not open, nothing can be bought today, and this page promises nothing until the owner approves it.</p>

        <h2>What the policy will need to say</h2>
        <Decision>whether refunds are offered, and for how long after purchase.</Decision>
        <Decision>any conditions (for example, how much of the handbook has been used), and whether they are stated in numbers.</Decision>
        <Decision>how to ask for a refund (the contact address), how long a decision takes, and how the money is returned, which depends on the payment provider chosen.</Decision>
        <Decision>how the policy fits consumer-protection rules where buyers live. This needs a professional’s review before it is published.</Decision>

        <h2>Before you buy</h2>
        <p>The <Link href="/preview">free sample lesson</Link> is a full section with working tools, so you can judge the handbook first.</p>
      </div>
    </>
  );
}
