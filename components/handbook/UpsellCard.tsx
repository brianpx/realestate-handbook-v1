import Link from 'next/link';
import { CHAPTER_BLURBS } from '@/content/site/chapter-blurbs';
import { Breadcrumbs } from '@/components/shell/Breadcrumbs';
import type { Entitlement } from '@/lib/access/entitlement';
import { partLabel } from '@/lib/breadcrumbs';
import { OWNER, purchaseOpen } from '@/lib/offer';
import { FREE_PAGE_IDS, pageById, type PageId } from '@/lib/pages';
import { HANDBOOK, pageHref } from '@/lib/routes';
import { paidTiers } from '@/lib/tiers';

type Locked =
  | { page: PageId }
  | { feature: 'start' | 'coach' };
type Props = Locked & { entitlement: Entitlement };

const FEATURES = {
  start: {
    eyebrow: 'Guided setup',
    title: 'Set up your first week',
    blurb: 'Six short steps from an income goal to a daily conversation target, two lead sources and a scheduled first week.',
    tiers: 'Basic and Pro',
  },
  coach: {
    eyebrow: 'Reading-plan coach',
    title: 'My plan and Review',
    blurb: 'A reading plan at your own pace, and a short review deck of the ideas due for another look, mixed across chapters.',
    tiers: 'Pro',
  },
} as const;

/**
 * What a reader meets on a page their plan does not include: the page's title and what it teaches, where the
 * handbook stands on sale, one action, and the way back to what they can read. It is a product surface, not an
 * error: nothing here should read as a page that failed to load.
 */
export function UpsellCard(props: Props) {
  const { entitlement } = props;
  const locked = 'page' in props
    ? { eyebrow: partLabel(props.page) ?? 'Handbook', title: pageById(props.page).label, blurb: CHAPTER_BLURBS[props.page] ?? '', tiers: 'Basic and Pro' }
    : FEATURES[props.feature];
  const open = purchaseOpen();
  const suspended = entitlement.level === 'preview' && entitlement.suspended;
  const basic = entitlement.level === 'member' && entitlement.tier === 'basic';
  const free = FREE_PAGE_IDS.filter(id => id !== 'cover');

  return (
    <div className="content-container" id="content-container">
      <Breadcrumbs />
      <article className="hb-upsell" data-upsell={'page' in props ? props.page : props.feature} aria-labelledby="upsellTitle">
        <p className="part-label">{locked.eyebrow}</p>
        <h1 className="hb-title" id="upsellTitle">{locked.title}</h1>
        {locked.blurb && <p className="hb-upsell-lede">{locked.blurb}</p>}

        <section className="hb-upsell-status" aria-label="Your access">
          {suspended ? (
            <>
              <p><strong>Your access is paused.</strong> The free chapters and your account page are still open.</p>
              <p>{OWNER.supportEmail ? <>To ask about it, write to <a href={`mailto:${OWNER.supportEmail}`}>{OWNER.supportEmail}</a>.</> : <>To ask about it, see <Link href="/support">the support page</Link>.</>}</p>
            </>
          ) : (
            <>
              <p>
                <strong>{basic ? `This is part of the ${locked.tiers} plan.` : `This is part of the paid handbook (${locked.tiers}).`}</strong>{' '}
                {basic ? 'Your plan is Basic, which includes every chapter and the essential tools.' : 'You are signed in with the free set: the overview, Chapter 1 and Chapter 7.'}
              </p>
              {open ? (
                <p>{paidTiers().map(t => `${t.name} ${t.priceDisplay}`).join(' · ')}, each a one-time purchase.</p>
              ) : (
                <p>The handbook is not on sale yet. The pricing page says where things stand and what each plan includes.</p>
              )}
              <div className="hb-actions">
                <Link className="btn-nav hb-primary" href="/pricing">{open ? 'See plans and buy' : 'Pricing and availability'}</Link>
              </div>
            </>
          )}
        </section>

        <section className="hb-upsell-free" aria-labelledby="upsellFreeTitle">
          <h2 className="hb-h2" id="upsellFreeTitle">What you can read now</h2>
          <ul>
            {basic
              ? <li>Every chapter and appendix, from the <Link href={HANDBOOK}>handbook home</Link>, with the five essential tools.</li>
              : <>
                  {free.map(id => <li key={id}><Link href={pageHref(id)}>{pageById(id).label}</Link></li>)}
                  <li><Link href={HANDBOOK}>Handbook home</Link></li>
                </>}
          </ul>
        </section>
      </article>
    </div>
  );
}
