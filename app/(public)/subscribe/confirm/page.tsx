import type { Metadata } from 'next';
import Link from 'next/link';
import { AutoSubmit } from '@/components/auth/AutoSubmit';
import { PageHead } from '@/components/site/Draft';
import { isSecretShape } from '@/lib/auth/token';

export const metadata: Metadata = { title: 'Confirm your email', robots: { index: false, follow: false } };

type Props = { searchParams: Promise<Record<'token' | 'done' | 'error', string | string[] | undefined>> };
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// Where the confirmation link lands. The page itself subscribes nobody: a well-formed token gets the one-button
// form that posts it to /api/lead/confirm (submitted on arrival when JavaScript is on), so a mail scanner that
// fetches the link changes nothing. The route comes back here with ?done=1 or ?error=1.
export default async function ConfirmPage({ searchParams }: Props) {
  const params = await searchParams;
  const token = first(params.token);
  if (isSecretShape(token)) {
    return (
      <>
        <PageHead eyebrow="Handbook notes" title="One more step." />
        <div className="pub-wrap pub-narrow pub-prose">
          <div className="pub-card signup-card">
            <p>Press the button to confirm your address. It happens on its own when JavaScript is on.</p>
            <AutoSubmit action="/api/lead/confirm" token={token} label="Confirm my email" busyLabel="Confirming…" />
          </div>
        </div>
      </>
    );
  }
  if (first(params.done)) {
    return (
      <>
        <PageHead eyebrow="Handbook notes" title="You are on the list.">
          Thanks. The next note about the handbook comes to this address; reply &ldquo;unsubscribe&rdquo; to any of them and they stop.
        </PageHead>
        <div className="pub-wrap pub-narrow pub-prose">
          <p><Link href="/preview">Read the sample lesson</Link> while you wait, or <Link href="/signup">sign in</Link> to open the free chapters.</p>
        </div>
      </>
    );
  }
  return (
    <>
      <PageHead eyebrow="Handbook notes" title="That link did not work.">
        It may be incomplete, older than a week, or belong to an address that was removed. If you are already on the list, nothing more is needed. Otherwise send the form after the sample lesson again: a new link goes out only if the first email could not be delivered, so the one you have is the one to use.
      </PageHead>
      <div className="pub-wrap pub-narrow pub-prose">
        <p><Link href="/preview">Go to the sample lesson</Link>.</p>
      </div>
    </>
  );
}
