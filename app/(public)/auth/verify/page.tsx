import type { Metadata } from 'next';
import Link from 'next/link';
import { AutoSubmit } from '@/components/auth/AutoSubmit';
import { PageHead } from '@/components/site/Draft';
import { SignupForm } from '@/components/site/SignupForm';
import { authStoresFromEnv } from '@/lib/auth/store';
import { checkLink } from '@/lib/auth/verify-link';

export const metadata: Metadata = { title: 'Signing you in', robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ token?: string | string[] }> };

// Where the emailed link lands (and where a failed POST comes back to, with ?error=1 so the address bar says so).
// This page only looks: a usable token gets the one-button form that consumes it
// (components/auth/AutoSubmit.tsx), anything else gets the same card with a fresh form. Fetching this URL, as mail
// scanners and link previews do, changes nothing.
export default async function VerifyPage({ searchParams }: Props) {
  const params = await searchParams;
  const raw = Array.isArray(params.token) ? params.token[0] : params.token;
  const stores = authStoresFromEnv(process.env);

  const check = stores ? await checkLink(stores.auth, raw, new Date()) : 'unusable';

  if (check === 'unavailable') {
    return (
      <>
        <PageHead eyebrow="Sign in" title="Sign-in is not available right now." />
        <div className="pub-wrap pub-narrow pub-prose">
          <div className="pub-card signup-card">
            <p role="alert">Your link has not been used up. Please open it again in a few minutes.</p>
          </div>
        </div>
      </>
    );
  }

  if (check === 'usable' && raw) {
    return (
      <>
        <PageHead eyebrow="Sign in" title="One moment…" />
        <div className="pub-wrap pub-narrow pub-prose">
          <div className="pub-card signup-card">
            <p>Finishing sign-in. If nothing happens, press the button.</p>
            <AutoSubmit action="/api/auth/verify" token={raw} />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead eyebrow="Sign in" title="That link has expired or was already used.">
        Sign-in links work once and expire after 15 minutes. Ask for a new one below.
      </PageHead>
      <div className="pub-wrap pub-narrow pub-prose">
        <div className="pub-card signup-card">
          {stores ? <SignupForm source="signin" /> : <p role="alert">Sign-in is not available right now. Please try again later.</p>}
        </div>
        <p className="pub-small"><Link href="/preview">Try the sample lesson</Link> without an email.</p>
      </div>
    </>
  );
}
