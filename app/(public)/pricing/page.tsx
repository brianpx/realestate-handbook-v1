import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHead } from '@/components/site/Draft';
import { PricingTable } from '@/components/site/PricingTable';
import { ToolIndex } from '@/components/site/ToolIndex';
import { pricingFaqs } from '@/content/site/faq';
import { OFFER, OWNER, POLICY_STATUS, purchaseOpen, REFUND_DAYS, upgradeOffered, upgradePriceDisplay } from '@/lib/offer';
import { paidTiers } from '@/lib/tiers';

export const metadata: Metadata = {
  title: 'Pricing and availability',
  description: 'What each plan includes, what it costs, and how access, updates and support work.',
  alternates: { canonical: '/pricing' },
};

const NOT_PUBLISHED = 'Not published yet';

export default function PricingPage() {
  const open = purchaseOpen();
  const upgradePrice = upgradeOffered() ? upgradePriceDisplay() : null;
  return (
    <>
      <PageHead eyebrow="Pricing" title={open ? 'Three plans, one handbook.' : 'Pricing and availability'}>
        {open
          ? 'Three plans; everything in Basic is in Pro. Each paid plan is a one-time purchase, and the free set stays free.'
          : 'Purchase is not open yet. This page shows exactly what each plan includes now, and it will carry the prices and every term before you are asked to pay.'}
      </PageHead>

      <section className="pub-section pub-tight" aria-labelledby="plansTitle">
        <div className="pub-wrap">
          <h2 id="plansTitle" className="pub-h2 text-2xl">Compare the plans</h2>
          {!open && <p className="pub-small">Basic and Pro are not on sale yet: there is no price, checkout or refund policy to show, so nothing here can be bought and nothing has been charged or promised. The free set opens with an emailed sign-in link; the sample lesson needs no sign-up at all.</p>}
          <PricingTable />
          <p className="pub-small mt-6">Not included in any plan: coaching calls, continuing education credit, legal advice, or help with a specific transaction.</p>
          <ToolIndex />
        </div>
      </section>

      <section className="pub-section tint" aria-labelledby="termsTitle">
        <div className="pub-wrap pub-narrow">
          <h2 id="termsTitle" className="pub-h2">Terms at a glance</h2>
          <dl className="pub-terms">
            <div><dt>Price</dt><dd>{open ? paidTiers().map(t => `${t.name} ${t.priceDisplay}`).join('; ') + (upgradePrice ? `; Pro upgrade for Basic owners ${upgradePrice}` : '') : NOT_PUBLISHED}</dd></div>
            {upgradePrice && <div><dt>Upgrade</dt><dd>A Basic owner moves to Pro by paying the difference, {upgradePrice}, once, with no time limit. It covers the edition you bought. Sign in and open your account page to find your upgrade link.</dd></div>}
            <div><dt>Access</dt><dd>{OFFER.accessTerm ?? NOT_PUBLISHED}</dd></div>
            <div><dt>Updates</dt><dd>{OFFER.updatesTerm ?? NOT_PUBLISHED}</dd></div>
            <div>
              <dt>Refunds</dt>
              <dd>
                {REFUND_DAYS} days from each purchase, for any reason.{' '}
                {POLICY_STATUS.refunds === 'approved' ? <Link href="/refunds">Read the refund policy</Link> : 'The full policy is a draft awaiting approval.'}
              </dd>
            </div>
            <div><dt>Devices</dt><dd>Use it in the browser on any phone, tablet or computer, with nothing to install. Your purchase follows your account, so you can sign in on every device you own. Your progress does not follow you: it is saved in each browser separately and is not sent to a server. To move it to another device or browser, download a backup file on the first and restore it on the second.</dd></div>
            <div>
              <dt>Support</dt>
              <dd>{OWNER.supportEmail ? <a href={`mailto:${OWNER.supportEmail}`}>{OWNER.supportEmail}</a> : NOT_PUBLISHED}. Self-help is on the <Link href="/support">support page</Link>.</dd>
            </div>
          </dl>
          <p className="pub-small">
            You sign in with a link we email you, with no password, and a purchase will belong to the address you sign in with. {open ? <>How access works is explained on <Link href="/updates">Access and updates</Link>.</> : <><Link href="/updates">Access and updates</Link> explains how access works now and what a purchase will add.</>}
          </p>
        </div>
      </section>

      <section className="pub-section" aria-labelledby="tryTitle">
        <div className="pub-wrap pub-narrow">
          <h2 id="tryTitle" className="pub-h2">Judge it before you decide.</h2>
          <p>The sample is Chapter 1 and Chapter 7 in full, with the income goal calculator, the pitfall cycle explorer, the six-errors self-score, the checkpoints and the quizzes working, plus a Chapter 6 script you can practice and the Chapter 8 weekly planner. The tools run as they do inside the handbook; the sample leaves out the glossary pop-ups, the chapter outline, read tracking and the next-chapter links.</p>
          <div className="pub-actions">
            <Link className="pub-btn pub-btn-primary" href="/preview">Try a sample lesson</Link>
            <Link className="pub-btn pub-btn-secondary" href="/#fit">Is it a good fit?</Link>
          </div>
        </div>
      </section>

      <section className="pub-section tint" id="faq" aria-labelledby="faqTitle">
        <div className="pub-wrap pub-narrow">
          <h2 id="faqTitle" className="pub-h2">Questions about buying.</h2>
          <div className="pub-faq">
            {pricingFaqs().map(f => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <div className="pub-faq-a"><p>{f.a}</p></div>
              </details>
            ))}
          </div>
          <p className="pub-small mt-4">More questions are on the <Link href="/#faq">home page</Link> and the <Link href="/support">support page</Link>.</p>
        </div>
      </section>
    </>
  );
}
