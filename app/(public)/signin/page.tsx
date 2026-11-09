import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHead } from '@/components/site/Draft';
import { SignupForm } from '@/components/site/SignupForm';
import { safeNextPath } from '@/lib/auth/validate';

// Out of search results and out of the sitemap, like /signup, until the sender is verified (UD-D15).
export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to the handbook with an emailed link. There is no password.',
  alternates: { canonical: '/signin' },
  robots: { index: false, follow: true },
};

type Props = { searchParams: Promise<{ next?: string | string[] }> };

// The same form as /signup with return-visit copy, for the header link and for readers who already have an
// account. There is nothing to remember: the emailed link is the sign-in.
export default async function SignInPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(Array.isArray(next) ? next[0] : next);
  return (
    <>
      <PageHead eyebrow="Sign in" title="Welcome back. We email you a link; there is no password.">
        Enter the address you used before and open the link we send. It signs you in on this device for 90 days.
      </PageHead>
      <div className="pub-wrap pub-narrow pub-prose">
        <div className="pub-card signup-card">
          <SignupForm source="signin" next={nextPath} />
        </div>
        <p className="pub-small">
          First time here? The same form <Link href="/signup">opens the free chapters</Link>. <Link href="/preview">Try the sample lesson</Link> without an email.
        </p>
      </div>
    </>
  );
}
