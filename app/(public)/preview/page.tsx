import type { Metadata } from 'next';
import Link from 'next/link';
import { Excerpt } from '@/components/site/Excerpt';
import { LeadForm } from '@/components/site/LeadForm';
import { purchaseOpen } from '@/lib/offer';

export const metadata: Metadata = {
  title: 'Free sample: two full chapters',
  description: 'Read Chapter 1 and Chapter 7 of the handbook in full, with every tool working: turn an income goal into a daily conversation target, score your week against the six new-agent errors, practice a script and plan your week. No sign-up.',
  alternates: { canonical: '/preview' },
};

export default function PreviewPage() {
  const open = purchaseOpen();
  return (
    <>
      <section className="pub-pagehead">
        <div className="pub-wrap pub-narrow">
          <p className="pub-eyebrow">Free sample</p>
          <h1 className="pub-h1">Read two chapters before you buy.</h1>
          <p className="pub-lede">
            Chapter 1 and Chapter 7 in full, with their tools, checkpoints and quizzes working, the preface's four checks before your first
            outreach, and two more tools from later chapters. Nothing is blurred or locked, and you do not need to sign up.
          </p>
        </div>
      </section>

      <section className="pub-wrap pub-narrow" style={{ paddingBottom: 24 }}>
        <div className="pub-included-box">
          <p className="pub-h3" style={{ margin: 0 }}>What is in this sample</p>
          <ul>
            <li>Chapter 1, Mindset and business foundations, in full: leading and lagging indicators, working backward from an income goal with the income goal calculator, and why your CRM comes first.</li>
            <li>The four checks from the quick start to make before your first outreach: consent, fair housing, agency disclosure and do-not-call.</li>
            <li>Chapter 7, Common errors and pitfalls of new agents, in full: the six errors, the pitfall cycle explorer, and a self-score that points you at the chapter that fixes your worst habit.</li>
            <li>One script from Chapter 6 with the practice mode.</li>
            <li>The weekly time-block planner from Chapter 8, including calendar export.</li>
          </ul>
          <p className="pub-small" style={{ margin: '10px 0 0' }}>
            Not in the sample: the other eleven chapters and their tools, the appendices, the guided setup, the checklists and the scorecard,
            and the reading aids the handbook wraps around every chapter (glossary pop-ups, the chapter outline, read tracking and the link to
            the next chapter). What you type here is saved in this browser only, the same way it is in the handbook, and it is still there if you buy.
          </p>
        </div>

        {/* The chapter's own title is the heading here; Excerpt demotes it to an h2 under the page's h1. */}
        <div className="pub-sample" id="goal-calculator">
          <Excerpt page="ch1" />
        </div>

        <h2 className="pub-h2" id="outreach-safeguards" style={{ marginTop: 56 }}>Safeguards from the quick start</h2>
        <p>The handbook's quick start asks you to check these four things before your first call, text or post.</p>
        <div className="pub-sample">
          <Excerpt page="pref" from={'<h3 id="before-your-first-outreach">'} to={'<h2 id="what-the-boxes-mean">'} />
        </div>

        <p style={{ marginTop: 56 }}>Chapter 7 sits later in the book, after the system has been built. It is here because it tells you which trap is yours, and which chapter to read first.</p>
        <div className="pub-sample">
          <Excerpt page="ch7" />
        </div>

        <h2 className="pub-h2" id="script-practice" style={{ marginTop: 56 }}>Practice a script</h2>
        <p>Chapter 6 gives you the words for every first contact. Hide the script, say it out loud from memory, then reveal it and check yourself.</p>
        <div className="pub-sample">
          <Excerpt page="ch6" from={'<h2 id="three-rules-to-read-every-script-by">'} to="<!--widget:script-practice#voicemail-no-answer-->" />
        </div>

        <h2 className="pub-h2" id="timeblock-planner" style={{ marginTop: 56 }}>Plan your week</h2>
        <p>Chapter 8 turns the daily number into protected time. Set your start time and block lengths, and the planner checks that lead generation is done before noon.</p>
        <div className="pub-sample">
          <Excerpt page="ch8" from="<!--widget:timeblock-planner-->" to={'<aside class="box field-note">'} />
        </div>

        <div className="pub-upsell">
          <p>
            <strong>That is two of thirteen chapters.</strong> The rest covers finding clients, your CRM, nurturing leads, the full script library,
            consultations, keeping clients and the 90-day plan, with a guided setup for your first session.
          </p>
          {/* The one optional email form on this page, after the sample and never in front of it (FS-D3, OD-02). */}
          <LeadForm source="sample" offer={open ? 'open' : 'closed'} />
          <div className="pub-actions" style={{ margin: 0 }}>
            <Link className="pub-btn pub-btn-secondary" href="/pricing">{open ? 'See pricing' : 'Pricing and availability'}</Link>
            <Link className="pub-btn pub-btn-secondary" href="/#included">What is included</Link>
          </div>
        </div>
      </section>
    </>
  );
}
