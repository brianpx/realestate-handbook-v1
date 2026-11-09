import type { Metadata } from 'next';
import Link from 'next/link';
import { AutoSubmit } from '@/components/auth/AutoSubmit';
import { PageHead } from '@/components/site/Draft';
import { SignupForm } from '@/components/site/SignupForm';
import { tokenUsable } from '@/lib/auth/session';
import { authStoresFromEnv } from '@/lib/auth/store';
import { hashSecret, isSecretShape } from '@/lib/auth/token';

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

  let usable = false;
  if (stores && isSecretShape(raw)) {
    const token = await stores.auth.peekToken(hashSecret(raw));
    usable = token !== null && tokenUsable(token, new Date());
  }

  if (usable && raw) {
    return (
      <>
        <PageHead eyebrow="Sign in" title="One more step." />
        <div className="pub-wrap pub-narrow pub-prose">
          <div className="pub-card signup-card">
            <p>Press the button to finish signing in. It happens on its own when JavaScript is on.</p>
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
