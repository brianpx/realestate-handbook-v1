import type { Metadata } from 'next';
import Link from 'next/link';
import { Excerpt } from '@/components/site/Excerpt';
import { purchaseOpen } from '@/lib/offer';

export const metadata: Metadata = {
  title: 'Free sample lesson',
  description: 'Read a real lesson from the handbook and use its tools: turn an income goal into a daily conversation target, practice a script and plan your week. No sign-up.',
  alternates: { canonical: '/preview' },
};

export default function PreviewPage() {
  return (
    <>
      <section className="pub-pagehead">
        <div className="pub-wrap pub-narrow">
          <p className="pub-eyebrow">Free sample lesson</p>
          <h1 className="pub-h1">Set a daily number you can hit.</h1>
          <p className="pub-lede">
            This is part of Chapter 1 as it appears in the handbook, with the working calculator, followed by two more tools from later
            chapters. Nothing is blurred or locked, and you do not need to sign up.
          </p>
        </div>
      </section>

      <section className="pub-wrap pub-narrow" style={{ paddingBottom: 24 }}>
        <div className="pub-included-box">
          <p className="pub-h3" style={{ margin: 0 }}>What is in this preview</p>
          <ul>
            <li>A full section of Chapter 1 on leading and lagging indicators and working backward from an income goal, with its figure and the working income goal calculator.</li>
            <li>One script from Chapter 6 with the practice mode.</li>
            <li>The weekly time-block planner from Chapter 8, including calendar export.</li>
          </ul>
          <p className="pub-small" style={{ margin: '10px 0 0' }}>
            Not in the preview: the other chapters and tools, the guided setup, the checklists and scorecard, and the quizzes. What you type here is
            saved in this browser only, the same way it is in the handbook.
          </p>
        </div>

        <h2 className="pub-h2" id="lesson">The lesson</h2>
        <div className="pub-sample" id="goal-calculator">
          <Excerpt page="ch1" from={'<h2 id="leading-and-lagging-indicators">Leading and lagging indicators</h2>'} to={'<h2 id="your-crm-is-your-headquarters">Your CRM is your headquarters</h2>'} />
        </div>

        <h2 className="pub-h2" id="script-practice" style={{ marginTop: 56 }}>Practice a script</h2>
        <p>Chapter 6 gives you the words for every first contact. Hide the script, say it out loud from memory, then reveal it and check yourself.</p>
        <div className="pub-sample">
          <Excerpt page="ch6" from="<h2>Three rules to read every script by</h2>" to="<!--widget:script-practice#voicemail-no-answer-->" />
        </div>

        <h2 className="pub-h2" id="timeblock-planner" style={{ marginTop: 56 }}>Plan your week</h2>
        <p>Chapter 8 turns the daily number into protected time. Set your start time and block lengths, and the planner checks that lead generation is done before noon.</p>
        <div className="pub-sample">
          <Excerpt page="ch8" from="<!--widget:timeblock-planner-->" to={'<aside class="box field-note">'} />
        </div>

        <div className="pub-upsell">
          <p>
            <strong>That is a small part of one handbook.</strong> The rest covers finding clients, your CRM, nurturing leads, scripts,
            consultations, keeping clients and a 90-day plan, with a guided setup for your first session.
          </p>
          <div className="pub-actions" style={{ margin: 0 }}>
            <Link className="pub-btn pub-btn-primary" href="/pricing">{purchaseOpen() ? 'See pricing' : 'Pricing and availability'}</Link>
            <Link className="pub-btn pub-btn-secondary" href="/#included">What is included</Link>
          </div>
        </div>
      </section>
    </>
  );
}
