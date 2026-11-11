import type { Metadata } from 'next';
import Link from 'next/link';
import { ChapterList, ContinuePanel, HeroActions, ProgressCard } from '@/components/handbook/HomePanels';
import { ProductCard } from '@/components/shell/ProductCard';
import { pageOpen } from '@/lib/access/entitlement';
import { requireViewer } from '@/lib/auth/dal';
import { purchaseOpen } from '@/lib/offer';
import { BOOK_TITLE, PAGE_IDS } from '@/lib/pages';
import { HANDBOOK, pageHref } from '@/lib/routes';

export const metadata: Metadata = { title: 'Handbook home', alternates: { canonical: HANDBOOK } };

// Tool shortcuts use the same data-goto links as Appendix E, so DeepLinks moves to the chapter and lands on the tool.
const TOOLS = [
  { page: 'ch1', widget: 'goal-calculator', name: 'Income goal calculator', task: 'Turn a yearly goal into a daily conversation target.' },
  { page: 'ch2', widget: 'lead-sources', name: 'Lead source comparison', task: 'Work out what each source costs you per closing.' },
  { page: 'ch6', widget: 'script-practice', name: 'Script practice', task: 'Rehearse the words for your first contacts.' },
  { page: 'ch8', widget: 'timeblock-planner', name: 'Weekly planner', task: 'Protect your prospecting block and export it to a calendar.' },
  { page: 'ch12', widget: 'roadmap', name: '90-day roadmap', task: 'Put dates on the day 30, 60 and 90 milestones.' },
  { page: 'app-a', widget: 'scorecard', name: 'Weekly scorecard', task: 'Review your numbers every Friday.' },
] as const;

export default async function HandbookHome() {
  const { entitlement } = await requireViewer();
  const locked = PAGE_IDS.filter(id => !pageOpen(entitlement, id));
  const member = entitlement.level === 'member';
  const paused = entitlement.level === 'preview' && entitlement.suspended;
  return (
    <ProductCard>
      <div className="hb-home">
        <section className="hb-block">
          <div className="hb-hero">
            <div className="hb-hero-text">
              <h1 className="hb-title">{BOOK_TITLE}</h1>
              <p className="hb-lead">A practical 90-day plan for your first year: find conversations, follow up on a plan, and keep clients so they send you the next ones. Work through it in order, and do each exercise the day you read the chapter.</p>
              <HeroActions locked={locked} />
            </div>
            <ProgressCard />
          </div>

          {!member && (
            <div className="hb-notice" data-free-set>
              <span className="hb-free">Free set</span>
              <p>
                <strong>{paused ? 'Your access is paused.' : 'You are reading the free set.'}</strong>{' '}
                The overview, Chapter 1 and Chapter 7 are open in full, with their tools. The other chapters, the appendices and the guided setup are part of the paid handbook
                {purchaseOpen() ? '.' : ', which is not on sale yet.'}
              </p>
              <Link href="/pricing">{purchaseOpen() ? 'See plans and buy' : 'Pricing and availability'}</Link>
            </div>
          )}

          {member && <ContinuePanel />}
        </section>

        <section className="hb-block" aria-labelledby="howTitle">
          <h2 id="howTitle">How to use the handbook</h2>
          <ol className="hb-grid3" role="list">
            <li className="hb-step">
              <span className="hb-step-num" aria-hidden="true">1</span>
              <h3>Do the guided setup once</h3>
              <p>It gives you a daily number, two lead sources and a scheduled week. <Link href={`${HANDBOOK}/start`}>Start here</Link></p>
            </li>
            <li className="hb-step">
              <span className="hb-step-num" aria-hidden="true">2</span>
              <h3>Follow the first-week reading</h3>
              <p>Chapters 1, 2 and 3 set your daily number, build your sphere list and set up your home base. The overview has the four-week reading plan.</p>
            </li>
            <li className="hb-step">
              <span className="hb-step-num" aria-hidden="true">3</span>
              <h3>Review every Friday</h3>
              <p>Fill in the scorecard, check your pipeline and decide one thing to do differently next week.</p>
            </li>
          </ol>
        </section>

        <section className="hb-block" aria-labelledby="toolsTitle">
          <div className="hb-block-head">
            <h2 id="toolsTitle">Tools</h2>
            <Link className="hb-more" href={pageHref('app-e')}>See every interactive tool</Link>
          </div>
          <div className="hb-grid3">
            {TOOLS.map(t => (
              <a key={t.widget} className="hb-card" href={pageHref(t.page)} data-goto={t.page} data-widget={t.widget}>
                <strong>{t.name}</strong>
                <span>{t.task}</span>
              </a>
            ))}
          </div>
        </section>

        <ChapterList locked={locked} />
      </div>
    </ProductCard>
  );
}
