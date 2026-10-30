import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHead } from '@/components/site/Draft';
import { pricingFaqs } from '@/content/site/faq';
import { OFFER, OWNER, POLICY_STATUS, purchaseOpen } from '@/lib/offer';

export const metadata: Metadata = {
  title: 'Pricing and availability',
  description: 'What the handbook includes, what it costs, and how access, updates and support work.',
  alternates: { canonical: '/pricing' },
};

const NOT_PUBLISHED = 'Not published yet';

const INCLUDED = [
  {
    title: 'Read',
    items: [
      '13 chapters in a fixed order, each with an exercise and a short checkpoint',
      'An overview and a 90-day plan',
      'Six appendices: scorecard, follow-up starter kit, CRM checklist, glossary, tools index and links',
    ],
  },
  {
    title: 'Do',
    items: [
      'Income goal calculator and lead source comparison',
      'Weekly planner with calendar export',
      'CRM setup checklists and a weekly activity scorecard',
      'Pipeline value calculator and post-close scheduler',
    ],
  },
  {
    title: 'Practice',
    items: [
      'More than 20 word-for-word scripts with a practice mode',
      'An objection trainer and a consultation lab',
      'Qualifying and Fair Housing drills',
    ],
  },
  {
    title: 'Keep track',
    items: [
      'A guided first-session setup',
      'Search, a glossary and print-friendly pages',
      'Progress saved on your device, with a downloadable backup file',
    ],
  },
];

export default function PricingPage() {
  const open = purchaseOpen();
  return (
    <>
      <PageHead eyebrow="Pricing" title={open ? 'One handbook, one price.' : 'Pricing and availability'}>
        {open
          ? 'Everything below is included. There are no tiers and no add-ons.'
          : 'Purchase is not open yet. This page shows exactly what is included now, and it will carry the price and every term before you are asked to pay.'}
      </PageHead>

      <section className="pub-section pub-tight" aria-labelledby="offerTitle">
        <div className="pub-wrap pub-pricing-grid">
          <div className="pub-card pub-buy">
            <h2 id="offerTitle" className="pub-buy-label">The 90-day handbook</h2>
            {open ? (
              <>
                <p className="pub-price">{OFFER.priceDisplay}</p>
                <p className="pub-buy-note">{OFFER.accessTerm}</p>
                <a className="pub-btn pub-btn-primary pub-btn-block" href={OFFER.checkoutUrl ?? '#'} rel="noopener">{`Get the handbook, ${OFFER.priceDisplay}`}</a>
                <p className="pub-small">
                  Checkout opens on the payment provider’s own page. Read the <Link href="/terms">terms</Link>, <Link href="/refunds">refund policy</Link> and <Link href="/privacy">privacy policy</Link> first.
                </p>
              </>
            ) : (
              <>
                <span className="pub-status">Purchase is not open yet</span>
                <p className="pub-buy-note">There is no price, checkout, access term or refund policy to show, so nothing here can be bought and nothing has been charged or promised.</p>
                <Link className="pub-btn pub-btn-primary pub-btn-block" href="/preview">Try a sample lesson</Link>
                <p className="pub-small">Free, with its working calculator and no sign-up.</p>
              </>
            )}
          </div>

          <div>
            <h2 className="pub-h2 text-2xl">Everything in one handbook</h2>
            <div className="pub-grid two pub-included">
              {INCLUDED.map(g => (
                <div key={g.title}>
                  <h3 className="pub-h3">{g.title}</h3>
                  <ul>{g.items.map(i => <li key={i}>{i}</li>)}</ul>
                </div>
              ))}
            </div>
            <p className="pub-small">Not included: coaching, continuing education credit, legal advice, or help with a specific transaction.</p>
          </div>
        </div>
      </section>

      <section className="pub-section tint" aria-labelledby="termsTitle">
        <div className="pub-wrap pub-narrow">
          <h2 id="termsTitle" className="pub-h2">Terms at a glance</h2>
          <dl className="pub-terms">
            <div><dt>Price</dt><dd>{open ? OFFER.priceDisplay : NOT_PUBLISHED}</dd></div>
            <div><dt>Access</dt><dd>{OFFER.accessTerm ?? NOT_PUBLISHED}</dd></div>
            <div><dt>Updates</dt><dd>{OFFER.updatesTerm ?? NOT_PUBLISHED}</dd></div>
            <div><dt>Refunds</dt><dd>{POLICY_STATUS.refunds === 'approved' ? <Link href="/refunds">Read the refund policy</Link> : NOT_PUBLISHED}</dd></div>
            <div><dt>Devices</dt><dd>Works in the browser on a phone, tablet or computer, with nothing to install. Progress is saved per browser on each device with no sync; move it with a backup file.</dd></div>
            <div>
              <dt>Support</dt>
              <dd>{OWNER.supportEmail ? <a href={`mailto:${OWNER.supportEmail}`}>{OWNER.supportEmail}</a> : NOT_PUBLISHED}. Self-help is on the <Link href="/support">support page</Link>.</dd>
            </div>
          </dl>
          <p className="pub-small">
            The handbook has no accounts today. {open ? <>How access works is explained on <Link href="/updates">Access and updates</Link>.</> : <>When purchase opens, <Link href="/updates">Access and updates</Link> explains exactly how access works.</>}
          </p>
        </div>
      </section>

      <section className="pub-section" aria-labelledby="tryTitle">
        <div className="pub-wrap pub-narrow">
          <h2 id="tryTitle" className="pub-h2">Judge it before you decide.</h2>
          <p>The sample lesson is a real section of Chapter 1 with its working income goal calculator, a Chapter 6 script you can practice, and the Chapter 8 weekly planner. It runs exactly as it does inside the handbook.</p>
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
