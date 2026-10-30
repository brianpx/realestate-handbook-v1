import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHead } from '@/components/site/Draft';
import { OWNER } from '@/lib/offer';

export const metadata: Metadata = {
  title: 'About the handbook',
  description: 'Who the handbook is for, how it teaches, and what it assumes.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  const author = OWNER.author;
  return (
    <>
      <PageHead eyebrow="About" title="Written for the agent who does not know what to do on Tuesday morning.">
        Finding, Keeping, and Nurturing Clients is a practical training manual for agents in their first year, built to be worked through rather than just read.
      </PageHead>
      <div className="pub-wrap pub-narrow pub-prose">
        <h2>Who it is for</h2>
        <p>
          The handbook is written for an agent who is licensed, affiliated with a brokerage, and unsure how to find people who might buy or sell and how to
          stay in touch until they are ready. It does not teach you to write a contract or run a closing. Your broker and your state course do that.
        </p>

        <h2>How it teaches</h2>
        <ul>
          <li><strong>One system, three jobs.</strong> Find conversations, nurture leads on a plan, and keep clients so they refer. Every chapter serves one of them.</li>
          <li><strong>Work, not just reading.</strong> Each chapter opens with what you will be able to do, teaches the idea, shows the words to say, and closes with an exercise and a checkpoint.</li>
          <li><strong>Numbers you can see into.</strong> The calculators show their arithmetic. Ratios such as three appointments per closing are labeled as rules of thumb for you to replace with your own results.</li>
          <li><strong>Activity you control.</strong> Goals are set on conversations, appointments and follow-up, which you can do tomorrow, not on closings that arrive 60 to 120 days later.</li>
          <li><strong>Plain about its limits.</strong> It is not legal advice, and it tells you to confirm forms, compensation and prospecting rules with your broker.</li>
        </ul>

        <h2>Independent, and CRM-neutral</h2>
        <p>
          The handbook is written independently. Its worked examples use Keller Williams Command screens and terms because they had to use something; each
          example is labeled, and none of it is an endorsement. The method (profile, tagged contacts, follow-up plans, honest pipeline stages, a mobile app) applies in any CRM that
          offers those features.
        </p>

        <h2>The author</h2>
        {author ? (
          <>
            <p><strong>{author.name}.</strong> {author.bio}</p>
            {author.background && <ul>{author.background.map(b => <li key={b}>{b}</li>)}</ul>}
          </>
        ) : (
          <p>
            The author’s name and background have not been published here yet, and nothing is claimed in their place. Until they are, judge the handbook on
            the work itself: <Link href="/preview">the free sample lesson</Link> is a full section with its working calculator.
          </p>
        )}

        <h2>Questions</h2>
        <p>See <Link href="/support">Support</Link> for help and contact options, or <Link href="/pricing">Pricing</Link> for the offer.</p>
      </div>
    </>
  );
}
