import type { Metadata } from 'next';
import Link from 'next/link';
import { SavedProgress } from '@/components/handbook/AccountPanels';
import { ProductCard } from '@/components/shell/ProductCard';
import { requireViewer } from '@/lib/auth/dal';
import { sessionLive } from '@/lib/auth/session';
import { authStoresFromEnv } from '@/lib/auth/store';
import { OWNER, purchaseOpen } from '@/lib/offer';
import { pageHref } from '@/lib/routes';
import { tierById } from '@/lib/tiers';

export const metadata: Metadata = { title: 'Account and saved progress', alternates: { canonical: '/account' } };

type Props = { searchParams: Promise<{ error?: string | string[] }> };

const day = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' });
const moment = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });

// Who the reader is to the handbook, what their plan opens, where they are signed in, and the two things only they
// can do: sign out everywhere and delete the account (OD-21: typed address). Both are plain form posts, so they
// work without JavaScript and carry the Origin header the routes insist on. Progress stays in the browser.
export default async function AccountPage({ searchParams }: Props) {
  const { user, entitlement } = await requireViewer();
  const { error } = await searchParams;
  const stores = authStoresFromEnv(process.env);
  const now = new Date();
  const liveSessions = stores ? (await stores.auth.listSessions(user.id)).filter(s => sessionLive(s, now)).length : 0;

  const plan = entitlement.level === 'member' ? `${tierById(entitlement.tier).name} plan` : entitlement.level === 'preview' && entitlement.suspended ? 'Paused' : 'Free set';

  return (
    <ProductCard>
      <p className="part-label">Account</p>
      <h1 className="hb-title">Account and saved progress</h1>

      <h2 className="hb-h2">Who you are signed in as</h2>
      <dl className="account-facts">
        <div><dt>Email</dt><dd data-account-email>{user.email}</dd></div>
        <div><dt>Account since</dt><dd>{day.format(user.createdAt)}</dd></div>
        <div><dt>Last sign-in</dt><dd>{user.lastSignInAt ? `${moment.format(user.lastSignInAt)} UTC` : 'Not recorded'}</dd></div>
        <div><dt>Your plan</dt><dd data-account-plan>{plan}</dd></div>
      </dl>
      <p>
        {entitlement.level === 'member' && <>Every chapter and appendix is open to you{entitlement.tier === 'pro' ? ', with every tool and the reading-plan coach' : ', with the five essential tools'}.</>}
        {entitlement.level === 'preview' && entitlement.suspended && <>Your access is paused: the free chapters and this page stay open. {OWNER.supportEmail ? <>To ask about it, write to <a href={`mailto:${OWNER.supportEmail}`}>{OWNER.supportEmail}</a>.</> : <>To ask about it, see <Link href="/support">the support page</Link>.</>}</>}
        {entitlement.level === 'preview' && !entitlement.suspended && (
          <>
            You have the free set: <Link href={pageHref('pref')}>the overview</Link>, <Link href={pageHref('ch1')}>Chapter 1</Link> and <Link href={pageHref('ch7')}>Chapter 7</Link> in full.{' '}
            {purchaseOpen() ? <><Link href="/pricing">See plans and buy</Link> to open the rest.</> : <>Purchase is not open yet; <Link href="/pricing">the pricing page</Link> says where things stand.</>}
          </>
        )}
      </p>

      <h2 className="hb-h2" id="sessions">Where you are signed in</h2>
      <p>{liveSessions === 1 ? 'This is the only browser signed in to your account.' : `Your account is signed in on ${liveSessions} browsers or devices, this one included.`} A sign-in lasts 90 days from your last visit, or until you sign out.</p>
      <form method="post" action="/api/account/sign-out-all" className="account-form">
        <button type="submit" className="btn-nav btn-secondary">Sign out everywhere</button>
        <span className="setup-hint">Ends every sign-in, this one too. You get a fresh link by email next time.</span>
      </form>

      <SavedProgress />

      <h2 className="hb-h2" id="delete">Delete your account</h2>
      <p>
        Deleting removes your account, every sign-in and your entry on the mailing list. Purchase records, if any, are kept for seven years for accounting, with no address on them.
        What you saved while reading is only in this browser, so clear this site's data there as well if you want it gone.
      </p>
      {error === 'confirm' && <p className="setup-error" role="alert">The address you typed did not match the one on this account. Nothing was deleted.</p>}
      <form method="post" action="/api/account/delete" className="account-form account-danger">
        <label htmlFor="confirmEmail">Type your email address to confirm</label>
        <input id="confirmEmail" name="confirmEmail" type="email" autoComplete="off" inputMode="email" required className="account-input" />
        <button type="submit" className="btn-nav btn-secondary">Delete my account</button>
      </form>

      <h2 className="hb-h2">Recovering your place</h2>
      <ul>
        <li>Lost your place on the same device? Check you are in the same browser and the same web address, and not in a private window.</li>
        <li>Moving to a new device or browser? Download a file here first, then restore it there.</li>
        <li>Restored a file by mistake? The progress that was here before is kept as a backup copy in this browser until your next restore, but there is no button to bring it back yet.</li>
      </ul>
      <p>
        {OWNER.supportEmail
          ? <>Questions: <a href={`mailto:${OWNER.supportEmail}`}>{OWNER.supportEmail}</a>.</>
          : <>A support address has not been published yet; <Link href="/support">the support page</Link> covers the common cases.</>}
      </p>
    </ProductCard>
  );
}
