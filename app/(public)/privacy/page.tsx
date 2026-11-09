import Link from 'next/link';
import { Decision, DraftNotice, PageHead, policyMetadata } from '@/components/site/Draft';
import { CONSENT_DETAILS } from '@/lib/leads/config';
import { OWNER } from '@/lib/offer';

export const metadata = policyMetadata('privacy', 'Privacy policy', 'What the site and the handbook do with your information.', '/privacy');

export default function PrivacyPage() {
  return (
    <>
      <PageHead eyebrow="Policy" title="Privacy policy">
        The short version: the handbook keeps your work on your own device, an account is an email address and a sign-in, and the site does not run analytics or advertising trackers.
      </PageHead>
      <div className="pub-wrap pub-narrow pub-prose">
        <DraftNotice policy="privacy" />

        <h2>What stays on your device</h2>
        <p>
          Your progress and settings (chapters read, checklist ticks, calculator numbers, script practice, scorecard and quiz answers, display choices) are saved in your
          browser’s local storage under the names <code>handbookState</code>, <code>handbookSettings</code> and <code>handbookCoach</code>. <code>handbookCoach</code> holds
          reading-plan quiz answers when that feature is on. They are not sent to the author or to any server, and they are not part of your account. The sample
          lesson’s tools save the same way. You can erase them by clearing the site’s data in your browser, and you can download or restore them from the{' '}
          <Link href="/account">Account page</Link>.
        </p>

        <h2>What the site does not do</h2>
        <ul>
          <li>It has no analytics, advertising or tracking scripts, and does not sell or share personal information.</li>
          <li>It sets no cookies of its own until you sign in, and none that track you. Local storage is used only for the items above.</li>
        </ul>

        <h2>Cookies</h2>
        <p>
          Signing in sets two cookies. Both are strictly necessary to keep you signed in, so there is no cookie banner: neither one tracks you, measures you or is read by
          anyone but this site. Nothing else on the site sets a cookie.
        </p>
        <ul>
          <li>
            <code>hb_session</code> (named <code>__Host-hb_session</code> over https) holds a random session id, which the server matches against its record of your sign-in.
            Scripts on the page cannot read it. It lasts 90 days from your last visit, extended at most once a day, and never more than one year from the sign-in itself;
            signing out removes it.
          </li>
          <li>
            <code>hb_signed_in</code> is set beside it with the fixed value <code>1</code> and the same lifetime. It holds no personal data: the public pages read it to show
            “Welcome back” instead of the sign-in form. It is removed with the session cookie.
          </li>
        </ul>

        <h2>Accounts and sign-in</h2>
        <p>
          You sign in with your email address and a link we email you; there is no password. The account record is your address, the dates of your first and last sign-in,
          the version of the sign-in terms you were shown, your status and what your plan opens. It is kept in a database the author controls for as long as the account
          exists.
        </p>
        <p>
          Each sign-in link is stored as a one-way hash, with the address it went to, the page you were heading for and a salted hash of your network address; it works once
          and expires after 15 minutes. Each sign-in is a session record: when it began, when it was last used, when it expires and whether you ended it. The{' '}
          <Link href="/account">Account page</Link> shows how many are live and can end all of them at once. Ended and expired records stay until you delete the account.
        </p>
        <p>The only email an account sends you is the sign-in link you asked for. Signing in does not add you to the notes list below.</p>
        <p>
          To limit abuse, requests for a sign-in link are counted against a salted one-way hash of your network address and of the address you typed; the counts are deleted
          after a day. Changes to an account (ending every sign-in, a deletion, a change to what you may read) are logged with the date, the account id and a salted hash
          of the network address the change was made from, never the address itself.
        </p>
        <p>
          To delete your account, type your address on the <Link href="/account">Account page</Link>. That replaces your address in the account record with a placeholder,
          deletes every session and sign-in link, and removes your address from the notes list. What stays: the anonymised account record, the record of any access you were
          granted, and any purchase record, kept with no address on it for seven years for accounting. What you saved while reading is only in your browser, so clear this
          site’s data there as well if you want it gone.
        </p>

        <h2>The optional notes list</h2>
        <p>
          You may leave an email address for occasional notes about the handbook: with the separate checkbox under a sign-in form (unticked unless you tick it), after the
          sample lesson, or from the card on a chapter outside your plan. We keep the address, the date, which form it came through and the exact consent text you were
          shown, in the same database, and email you a link to confirm. The address counts as subscribed only once you open that link, which expires after seven days; until
          then nothing else is sent to it. {CONSENT_DETAILS}
        </p>
        <p>
          To limit abuse of the form, a salted one-way hash of your network address (not the address itself) is kept for a day to count attempts. Declining the form
          changes nothing about what you can read or do.
        </p>

        <h2>Hosting and server logs</h2>
        <p>
          The site runs on Vercel, which processes ordinary request logs (such as the network address and the page requested) to deliver pages and keep the service secure.
          The database that holds accounts, sign-ins and the notes list is Postgres hosted by Neon. Sign-in links and notes are sent through SendGrid, which handles the
          address and the message to deliver them.
        </p>
        <Decision>the regions the Vercel and Neon data live in, and how long each provider keeps its logs.</Decision>

        <h2>Payments</h2>
        <p>
          Purchase is not open, and the site has no payment code. When it opens, checkout will be on the page of Lemon Squeezy, the merchant of record, which takes the
          payment and handles card details; this site never sees your card. The site will keep a record of each purchase (the plan, the order reference, the dates and the
          address used at checkout) to grant access and for accounting, for seven years; deleting your account replaces the address on it with a hash.
        </p>
        <Decision>the seven-year retention of purchase records is the owner’s choice and still needs an accountant’s confirmation.</Decision>

        <h2>Your choices and contact</h2>
        <p>
          Clear your browser data to remove everything stored on your device. Sign out everywhere, or delete your account, from the <Link href="/account">Account page</Link>.
          Reply “unsubscribe” to any note to stop them.
        </p>
        {OWNER.supportEmail
          ? <p>For other privacy questions, write to <a href={`mailto:${OWNER.supportEmail}`}>{OWNER.supportEmail}</a>.</p>
          : <Decision>a contact address for privacy requests, including removal of an address from the notes list without an account.</Decision>}
        <Decision>whether laws such as those of California or the EU apply to your buyers and what notices they require. This needs a professional’s review.</Decision>
      </div>
    </>
  );
}
