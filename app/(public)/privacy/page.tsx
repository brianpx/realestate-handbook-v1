import Link from 'next/link';
import { Decision, DraftNotice, PageHead, policyMetadata } from '@/components/site/Draft';
import { CONSENT_DETAILS } from '@/lib/leads/config';
import { OWNER } from '@/lib/offer';

export const metadata = policyMetadata('privacy', 'Privacy policy', 'What the site and the handbook do with your information.', '/privacy');

export default function PrivacyPage() {
  return (
    <>
      <PageHead eyebrow="Policy" title="Privacy policy">
        The short version: the handbook keeps your work on your own device, and the site does not run analytics or advertising trackers.
      </PageHead>
      <div className="pub-wrap pub-narrow pub-prose">
        <DraftNotice policy="privacy" />

        <h2>What stays on your device</h2>
        <p>
          Your progress and settings (chapters read, checklist ticks, calculator numbers, script practice, scorecard and quiz answers, display choices) are saved in your
          browser’s local storage under the names <code>handbookState</code>, <code>handbookSettings</code> and <code>handbookCoach</code>. <code>handbookCoach</code> holds
          reading-plan quiz answers when that feature is on. They are not sent to the author or to any server. The sample
          lesson’s tools save the same way. You can erase them by clearing the site’s data in your browser, and you can download or restore them from the{' '}
          <Link href="/account">Account page</Link>.
        </p>

        <h2>What the site does not do</h2>
        <ul>
          <li>It has no analytics, advertising or tracking scripts, and does not sell or share personal information.</li>
          <li>It sets no cookies of its own. Local storage is used only for the items above and to remember that you dismissed the email form.</li>
        </ul>

        <h2>The optional email form</h2>
        <p>
          When the follow-up email form is switched on, you may leave an email address. We keep the address, the date, and the exact consent text you were shown, in a database
          the author controls. {CONSENT_DETAILS}
        </p>
        <p>
          To limit abuse of the form, a salted one-way hash of your network address (not the address itself) is kept for a short time to count attempts. Declining the form
          changes nothing about what you can read or do.
        </p>

        <h2>Hosting and server logs</h2>
        <p>The site is served by a hosting provider, which processes ordinary request logs (such as the address and page requested) to deliver pages and keep the service secure.</p>
        <Decision>name the hosting, database and email providers and their locations, and how long logs are kept.</Decision>

        <h2>Payments</h2>
        <p>Purchase is not open, and the site has no payment code. When it opens, card details are handled by a payment provider on its own page, not by this site.</p>
        <Decision>the payment provider, what purchase data (such as name and email) is kept, and for how long.</Decision>

        <h2>Your choices and contact</h2>
        <p>Clear your browser data to remove everything stored on your device. Reply “unsubscribe” to any email note to stop them.</p>
        {OWNER.supportEmail
          ? <p>For other privacy questions, write to <a href={`mailto:${OWNER.supportEmail}`}>{OWNER.supportEmail}</a>.</p>
          : <Decision>a contact address for privacy requests, including deletion of an email address.</Decision>}
        <Decision>whether laws such as those of California or the EU apply to your buyers and what notices they require. This needs a professional’s review.</Decision>
      </div>
    </>
  );
}
