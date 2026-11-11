import Link from 'next/link';
import { Decision, DraftNotice, PageHead, policyMetadata } from '@/components/site/Draft';
import { OWNER, REFUND_DAYS } from '@/lib/offer';

export const metadata = policyMetadata('refunds', 'Refund policy', 'The handbook’s refund policy.', '/refunds');

export default function RefundsPage() {
  return (
    <>
      <PageHead eyebrow="Policy" title="Refund policy" />
      <div className="pub-wrap pub-narrow pub-prose">
        <DraftNotice policy="refunds" />
        <p><strong>Purchase is not open, so nothing can be bought or refunded today.</strong> This is the policy the owner has set for when it opens; it promises nothing until it is approved.</p>

        <h2>The refund window</h2>
        <p>
          A purchase of Basic or Pro can be refunded in full within {REFUND_DAYS} days of the purchase, for any reason. How much of the handbook you have read or used in those days
          makes no difference. Each purchase has its own {REFUND_DAYS} days, counted from the day that purchase was paid. Each paid plan is a one-time purchase, so there is no subscription to cancel. A refund ends the access the purchase gave.
        </p>

        <h2>If you upgrade from Basic to Pro</h2>
        <p>
          The upgrade is its own purchase, so it has its own {REFUND_DAYS} days from the day it was paid. Refund it in that time and you go back to Basic, which you keep.
          If you refund your Basic purchase, an upgrade bought on top of it ends with it, because the upgrade is priced against Basic, and that upgrade is refunded too.
        </p>

        <h2>How to ask</h2>
        <p>Write from the email address you bought with, within the {REFUND_DAYS} days, and say which purchase it is. No reason is needed.</p>
        {OWNER.supportEmail
          ? <p>Send the request to <a href={`mailto:${OWNER.supportEmail}`}>{OWNER.supportEmail}</a>.</p>
          : <Decision>the address refund requests go to; the support address is not published yet.</Decision>}
        <p>The money goes back by the way you paid, through Lemon Squeezy, the merchant of record that took the payment.</p>
        <Decision>how long a decision takes after a request, and how long Lemon Squeezy takes to return the money.</Decision>
        <Decision>how the policy fits consumer-protection rules where buyers live. This needs a professional’s review before it is published.</Decision>

        <h2>Before you buy</h2>
        <p>The <Link href="/preview">free sample lesson</Link> is two full chapters with working tools, so you can judge the handbook first.</p>
      </div>
    </>
  );
}
