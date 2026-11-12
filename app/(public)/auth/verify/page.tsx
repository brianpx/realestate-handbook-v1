import type { Metadata } from 'next';
import Link from 'next/link';
import { AutoSubmit } from '@/components/auth/AutoSubmit';
import { PageHead } from '@/components/site/Draft';
import { SignupForm } from '@/components/site/SignupForm';
import { tokenUsable } from '@/lib/auth/session';
import { authStoresFromEnv } from '@/lib/auth/store';
import { hashSecret, isSecretShape } from '@/lib/auth/token';

export const metadata: Metadata = { title: 'Signing you in', robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ token?: string | string[]; error?: string | string[] }> };
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// Where the emailed link lands. A usable token gets the one-button form that consumes it
// (components/auth/AutoSubmit.tsx); the error query is ignored then, so a stall retry can still post. Anything else
// gets the failure card. A form POST that cannot finish comes back here with ?error=1, ?error=rate, or
// ?error=unavailable instead of a JSON page. Fetching this URL, as mail scanners and link previews do, changes nothing.
export default async function VerifyPage({ searchParams }: Props) {
  const params = await searchParams;
  const raw = first(params.token);
  const error = first(params.error);
  const stores = authStoresFromEnv(process.env);

  let usable = false;
  if (stores && isSecretShape(raw)) {
    const token = await stores.auth.peekToken(hashSecret(raw));
    usable = token !== null && tokenUsable(token, new Date());
  }

  if (usable && raw) {
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

  const rateLimited = error === 'rate';
  const unavailable = error === 'unavailable' || !stores;
  return (
    <>
      <PageHead eyebrow="Sign in" title="That link has expired or was already used.">
        Sign-in links work once and expire after 15 minutes. Ask for a new one below.
      </PageHead>
      <div className="pub-wrap pub-narrow pub-prose">
        <div className="pub-card signup-card">
          {rateLimited && <p role="alert">Too many tries. Please wait a few minutes and try again.</p>}
          {unavailable && <p role="alert">Sign-in is not available right now. Please try again later.</p>}
          {stores ? <SignupForm source="signin" /> : null}
        </div>
        <p className="pub-small"><Link href="/preview">Try the sample lesson</Link> without an email.</p>
      </div>
    </>
  );
}
