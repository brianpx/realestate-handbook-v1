import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHead } from '@/components/site/Draft';

export const metadata: Metadata = { title: 'Account deleted', robots: { index: false, follow: false } };

// Where /api/account/delete lands. The page itself knows nothing about who was deleted; it only says what the
// deletion did, in the terms the privacy policy will use.
export default function GoodbyePage() {
  return (
    <>
      <PageHead eyebrow="Account" title="Your account has been deleted.">
        You are signed out everywhere, and the address you signed in with is no longer attached to anything here.
      </PageHead>
      <div className="pub-wrap pub-narrow pub-prose">
        <div className="pub-card">
          <p>What was removed: your account record, every sign-in session and link, and your entry on the mailing list if you had one.</p>
          <p>What stays: records of any purchase, kept for the accounting period the law requires, with no address on them. Anything you saved while reading (progress, calculator entries, scorecards) was only ever in your browser; clear this site's data there if you want it gone too.</p>
          <p>If you come back one day, signing in with the same address starts a fresh account.</p>
        </div>
        <p className="pub-small"><Link href="/">Back to the website</Link></p>
      </div>
    </>
  );
}
