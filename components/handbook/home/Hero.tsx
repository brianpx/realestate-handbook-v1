import Link from 'next/link';
import { BOOK_TITLE } from '@/lib/pages';
import { HeroActions } from './HeroActions';

const LEAD =
  'A practical 90-day plan for your first year: find conversations, follow up on a plan, and keep clients so they send you the next ones. Work through it in order, and do each exercise the day you read the chapter.';

export function Hero({ free, suspended, purchaseOpen, locked }: {
  free: boolean;
  suspended: boolean;
  purchaseOpen: boolean;
  locked: readonly string[];
}) {
  return (
    <>
      <header className="hb-home-hero" data-home-hero>
        <p className="hb-home-kicker">Your handbook</p>
        <h1 className="hb-title hb-home-title">{BOOK_TITLE}</h1>
        <p className="hb-home-lead">{LEAD}</p>
        {free && <HeroActions locked={locked} />}
      </header>
      {free && (
        <section className="hb-home-freeset" data-free-set aria-label="The free set">
          <span className="hb-home-pill hb-home-pill-set">Free set</span>
          <p className="hb-home-freeset-text">
            <strong>{suspended ? 'Your access is paused.' : 'You are reading the free set.'}</strong>{' '}
            The overview, Chapter 1 and Chapter 7 are open in full, with their tools. Everything else is part of the paid handbook
            {purchaseOpen ? '.' : ', which is not on sale yet.'}
          </p>
          <Link className="hb-home-freeset-link" href="/pricing">{purchaseOpen ? 'See plans and buy' : 'Pricing and availability'}</Link>
        </section>
      )}
    </>
  );
}
