import type { Metadata } from 'next';
import Link from 'next/link';
import { ChapterList, ContinuePanel } from '@/components/handbook/HomePanels';
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
  return (
    <ProductCard>
      <p className="part-label">Your handbook</p>
      <h1 className="hb-title">{BOOK_TITLE}</h1>
      <p>A practical 90-day plan for your first year: find conversations, follow up on a plan, and keep clients so they send you the next ones. Work through it in order, and do each exercise the day you read the chapter.</p>

      {entitlement.level !== 'member' && (
        <section className="hb-continue" aria-labelledby="freeSetTitle" data-free-set>
          <h2 id="freeSetTitle">{entitlement.level === 'preview' && entitlement.suspended ? 'Your access is paused' : 'You are reading the free set'}</h2>
          <p>
            The overview, Chapter 1 and Chapter 7 are open in full, with their tools. The other chapters, the appendices and the guided setup are part of the paid handbook
            {purchaseOpen() ? '.' : ', which is not on sale yet.'}
          </p>
          <div className="hb-actions">
            <Link className="btn-nav hb-primary" href="/pricing">{purchaseOpen() ? 'See plans and buy' : 'Pricing and availability'}</Link>
            <Link className="btn-mini" href={pageHref('ch1')}>Read Chapter 1</Link>
          </div>
        </section>
      )}

      {entitlement.level === 'member' && <ContinuePanel />}

      <h2 className="hb-h2">How to use the handbook</h2>
      <ol className="hb-how">
        <li><strong>Do the guided setup once.</strong> It gives you a daily number, two lead sources and a scheduled week. <Link href={`${HANDBOOK}/start`}>Start here</Link>.</li>
        <li><strong>Follow the first-week reading.</strong> Chapters 1, 2 and 3 set your daily number, build your sphere list and set up your home base. The overview has the four-week reading plan.</li>
        <li><strong>Review every Friday.</strong> Fill in the scorecard, check your pipeline and name the one number to move next week.</li>
      </ol>
      <p>Everything you enter is saved in this browser on this device. See <Link href="/account">Account and saved progress</Link> to back it up or move it.</p>

      <h2 className="hb-h2">Tools</h2>
      <div className="hb-tools">
        {TOOLS.map(t => (
          <a key={t.widget} className="hb-tool" href={pageHref(t.page)} data-goto={t.page} data-widget={t.widget}>
            <strong>{t.name}</strong>
            <span>{t.task}</span>
          </a>
        ))}
      </div>
      <p><Link href={pageHref('app-e')}>See every interactive tool</Link></p>

      <h2 className="hb-h2">Chapters</h2>
      <p><Link href={pageHref('cover')}>Title page</Link> · <Link href={pageHref('pref')}>Overview and plan</Link></p>
      <ChapterList locked={locked} />
    </ProductCard>
  );
}
