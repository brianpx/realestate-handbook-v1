import type { Metadata } from 'next';
import Link from 'next/link';
import { AutoSubmit } from '@/components/auth/AutoSubmit';
import { PageHead } from '@/components/site/Draft';
import { UNSUBSCRIBE_API } from '@/lib/leads/config';
import { isUnsubscribeShape } from '@/lib/leads/unsubscribe';

export const metadata: Metadata = { title: 'Unsubscribe from handbook notes', robots: { index: false, follow: false } };

type Props = { searchParams: Promise<Record<'token' | 'done' | 'error', string | string[] | undefined>> };
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// Where the unsubscribe link in a note lands. Like the confirmation page, this page changes nothing itself: a
// well-formed token gets the one-button form that posts it to /api/lead/unsubscribe (submitted on arrival when
// JavaScript is on), so a mail scanner that fetches the link unsubscribes nobody. The route comes back here with
// ?done=1 or ?error=1.
export default async function UnsubscribePage({ searchParams }: Props) {
  const params = await searchParams;
  const token = first(params.token);
  if (isUnsubscribeShape(token)) {
    return (
      <>
        <PageHead eyebrow="Handbook notes" title="One moment…" />
        <div className="pub-wrap pub-narrow pub-prose">
          <div className="pub-card signup-card">
            <p>Removing your address from the notes. If nothing happens, press the button.</p>
            <AutoSubmit action={UNSUBSCRIBE_API} token={token} label="Unsubscribe me" busyLabel="Unsubscribing…" />
          </div>
        </div>
      </>
    );
  }
  if (first(params.done)) {
    return (
      <>
        <PageHead eyebrow="Handbook notes" title="You are unsubscribed.">
          No more notes will come to this address. Your account, if you have one, is not affected.
        </PageHead>
        <div className="pub-wrap pub-narrow pub-prose">
          <p><Link href="/">Back to the handbook</Link>.</p>
        </div>
      </>
    );
  }
  return (
    <>
      <PageHead eyebrow="Handbook notes" title="That link did not work.">
        It may be incomplete or belong to an address that was removed. If you are not receiving notes, nothing more is needed. Otherwise reply &ldquo;unsubscribe&rdquo; to any note and they stop.
      </PageHead>
      <div className="pub-wrap pub-narrow pub-prose">
        <p><Link href="/">Back to the handbook</Link>.</p>
      </div>
    </>
  );
}
