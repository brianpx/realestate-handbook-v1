import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHead } from '@/components/site/Draft';
import { SignupForm } from '@/components/site/SignupForm';
import { safeNextPath } from '@/lib/auth/validate';

// Out of search results and out of the sitemap until the sender is verified and the form sends for real (UD-D15).
export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in with an emailed link to read the free chapters and, once you have bought it, the whole handbook.',
  alternates: { canonical: '/signup' },
  robots: { index: false, follow: true },
};

type Props = { searchParams: Promise<{ next?: string | string[] }> };

// The way into the handbook. There is no password: the link in the email signs the reader in, and the same form
// serves a first visit and a return. The proxy sends readers here with ?next= when they open a handbook page
// without a session.
export default async function SignupPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(Array.isArray(next) ? next[0] : next);
  return (
    <>
      <PageHead eyebrow="Sign in" title="Open the handbook with a link we email you.">
        No password and no card. Chapter 1 and Chapter 7 are free to read once you are signed in; the rest opens when you buy the handbook.
      </PageHead>
      <div className="pub-wrap pub-narrow pub-prose">
        <div className="pub-card signup-card">
          <SignupForm source="signup-page" next={nextPath} />
        </div>
        <p className="pub-small">
          Just want a look first? <Link href="/preview">Try the sample lesson</Link> without an email. <Link href="/pricing">Pricing and availability</Link> says where the purchase stands.
        </p>
      </div>
    </>
  );
}
