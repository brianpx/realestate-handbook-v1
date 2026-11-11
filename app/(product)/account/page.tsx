import type { Metadata } from 'next';
import Link from 'next/link';
import { ProfileForm } from '@/components/account/ProfileForm';
import { SavedProgress } from '@/components/handbook/AccountPanels';
import { ProductCard } from '@/components/shell/ProductCard';
import { requireViewer } from '@/lib/auth/dal';
import { sessionLive } from '@/lib/auth/session';
import { authStoresFromEnv } from '@/lib/auth/store';
import { billingAdapterFromEnv, billingStoreFromEnv } from '@/lib/billing/env';
import { UPGRADE_PRODUCT_KEY, type BillingRecord } from '@/lib/billing/types';
import { OWNER, purchaseOpen, upgradeFor } from '@/lib/offer';
import { pageHref } from '@/lib/routes';
import { tierById } from '@/lib/tiers';
import { EMPTY_PROFILE, profileFields, type Profile } from '@/lib/users/profile';
import { profileStoreFromEnv } from '@/lib/users/profile-store';

export const metadata: Metadata = { title: 'Account and saved progress', alternates: { canonical: '/account' } };

type Props = { searchParams: Promise<{ error?: string | string[] }> };

type PurchaseRow = {
  id: string;
  label: string;
  status: string;
  providerStatus: string | null;
  paidAt: Date | null;
  refundedAt: Date | null;
  manageHref: string | null;
  /** `failed` is a refetch error. `absent` is an order with no https receipt or portal link. */
  manageGap: 'none' | 'absent' | 'failed' | 'unconfigured';
};
type Purchases = { kind: 'off' } | { kind: 'failed' } | { kind: 'empty' } | { kind: 'rows'; rows: PurchaseRow[] };

const day = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' });
const moment = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });

// The profile as the form first shows it: no row is the normal case (empty fields); a store that fails to answer
// hides the form for this render rather than failing the page, which has more on it than the profile.
async function loadProfile(userId: string): Promise<{ kind: 'none' } | { kind: 'failed' } | { kind: 'ok'; profile: Profile | null }> {
  const profiles = profileStoreFromEnv(process.env);
  if (!profiles) return { kind: 'none' };
  try {
    return { kind: 'ok', profile: await profiles.find(userId) };
  } catch (err) {
    console.error('account: profile read failed', err instanceof Error ? err.name : 'error');
    return { kind: 'failed' };
  }
}

/** The account's billing rows. No store means the panel stays off, so a setup without billing does not claim "no purchase". */
async function loadPurchases(userId: string): Promise<Purchases> {
  const store = billingStoreFromEnv(process.env);
  if (!store) return { kind: 'off' };
  try {
    const records = await store.listRecordsForUser(userId);
    if (records.length === 0) return { kind: 'empty' };
    const adapter = process.env.BILLING_API_KEY ? billingAdapterFromEnv(process.env) : null;
    const rows: PurchaseRow[] = [];
    for (const record of records) rows.push(await purchaseRow(record, adapter));
    return { kind: 'rows', rows };
  } catch (err) {
    console.error('account: billing read failed', err instanceof Error ? err.name : 'error');
    return { kind: 'failed' };
  }
}

async function purchaseRow(record: BillingRecord, adapter: ReturnType<typeof billingAdapterFromEnv>): Promise<PurchaseRow> {
  const stored = record.manageUrl?.startsWith('https://') ? record.manageUrl : null;
  if (stored) return { ...rowFacts(record), manageHref: stored, manageGap: 'none' };
  if (!adapter) return { ...rowFacts(record), manageHref: null, manageGap: 'unconfigured' };
  try {
    const mapped = await adapter.fetch(record.kind === 'subscription' ? { type: 'subscriptions', id: record.providerObjectId } : { type: 'orders', id: record.providerObjectId });
    const href = mapped.outcome === 'order' ? mapped.order.manageUrl : null;
    return { ...rowFacts(record), manageHref: href, manageGap: href ? 'none' : 'absent' };
  } catch (err) {
    console.error('account: billing link failed', err instanceof Error ? err.name : 'error');
    return { ...rowFacts(record), manageHref: null, manageGap: 'failed' };
  }
}

function rowFacts(record: BillingRecord): Pick<PurchaseRow, 'id' | 'label' | 'status' | 'providerStatus' | 'paidAt' | 'refundedAt'> {
  const label = record.productKey === UPGRADE_PRODUCT_KEY ? 'Pro upgrade' : tierById(record.tier).name;
  return { id: record.id, label, status: record.status, providerStatus: record.providerStatus, paidAt: record.paidAt, refundedAt: record.refundedAt };
}

function PurchasePanel({ purchases }: { purchases: Purchases }) {
  if (purchases.kind === 'off') return null;
  if (purchases.kind === 'failed') return <p className="setup-error" role="alert">Your purchase could not be loaded just now. Reload the page to try again.</p>;
  if (purchases.kind === 'empty') {
    return (
      <section data-billing-purchase="none">
        <h2 className="hb-h2">Your purchase</h2>
        <p>You have no purchase on file. <Link href="/pricing">See pricing</Link>.</p>
      </section>
    );
  }
  const first = purchases.rows[0];
  return (
    <section data-billing-purchase={first ? first.status : 'none'}>
      <h2 className="hb-h2">Your purchase</h2>
      {purchases.rows.map(row => (
        <dl className="account-facts" key={row.id}>
          <div><dt>Purchase</dt><dd>{row.label}</dd></div>
          <div><dt>Status</dt><dd>{row.providerStatus ?? row.status}</dd></div>
          {row.paidAt && <div><dt>Paid</dt><dd>{day.format(row.paidAt)} UTC</dd></div>}
          {row.refundedAt && <div><dt>Refunded</dt><dd>{day.format(row.refundedAt)} UTC</dd></div>}
          <div>
            <dt>Manage</dt>
            <dd>
              {row.manageHref
                ? <a href={row.manageHref} data-billing-manage>Open the receipt</a>
                : row.manageGap === 'failed'
                  ? 'The receipt link could not be loaded just now.'
                  : row.manageGap === 'absent'
                    ? 'The provider did not include a receipt or customer portal link.'
                    : 'A manage link is not on file.'}
            </dd>
          </div>
        </dl>
      ))}
    </section>
  );
}

// Who the reader is to the handbook, what their plan opens, their realtor profile (optional, every field), where they
// are signed in, and the two things only they can do: sign out everywhere and delete the account (OD-21: typed
// address). Those two are plain form posts, so they work without JavaScript and carry the Origin header the routes
// insist on; the profile form is a client component that saves with a fetch. Progress stays in the browser.
export default async function AccountPage({ searchParams }: Props) {
  const { user, entitlement } = await requireViewer();
  const { error } = await searchParams;
  const stores = authStoresFromEnv(process.env);
  const now = new Date();
  const liveSessions = stores ? (await stores.auth.listSessions(user.id)).filter(s => sessionLive(s, now)).length : 0;
  const loaded = await loadProfile(user.id);
  const purchases = await loadPurchases(user.id);

  const upgrade = upgradeFor(entitlement, user);
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
      {upgrade && (
        <p data-upgrade-offer>
          Want the reading-plan coach and every tool? <a href={upgrade.href} rel="noopener" data-upgrade>Upgrade to Pro for {upgrade.price}</a>: you pay only the difference from Basic, once.
        </p>
      )}

      <PurchasePanel purchases={purchases} />

      <h2 className="hb-h2" id="profile">Your profile</h2>
      <p>
        Where you practice and how far along you are, if you care to say: it lets the handbook and its tools speak to your situation later on. Every field is optional, nothing here is shared, and it is yours to change or clear at any time.
        Your license and any REALTOR® membership are separate facts; neither is assumed from the other.
      </p>
      {loaded.kind === 'none' && <p className="setup-hint">Profile editing needs the account database, which this setup does not have.</p>}
      {loaded.kind === 'failed' && <p className="setup-error" role="alert">Your profile could not be loaded just now. Reload the page to try again.</p>}
      {loaded.kind === 'ok' && <ProfileForm initial={loaded.profile ? profileFields(loaded.profile) : EMPTY_PROFILE} updatedAt={loaded.profile?.updatedAt.toISOString() ?? null} />}

      <h2 className="hb-h2" id="sessions">Where you are signed in</h2>
      <p>{liveSessions === 1 ? 'This is the only browser signed in to your account.' : `Your account is signed in on ${liveSessions} browsers or devices, this one included.`} A sign-in lasts 90 days from your last visit, or until you sign out.</p>
      <form method="post" action="/api/account/sign-out-all" className="account-form">
        <button type="submit" className="btn-nav btn-secondary">Sign out everywhere</button>
        <span className="setup-hint">Ends every sign-in, this one too. You get a fresh link by email next time.</span>
      </form>

      <SavedProgress />

      <h2 className="hb-h2" id="delete">Delete your account</h2>
      <p>
        Deleting removes your account, your profile and every sign-in, and then removes your entry from the mailing list (if that last step fails, write to us). Purchase records, if any, are kept for seven years for accounting, with no address on them.
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
