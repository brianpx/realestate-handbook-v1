import Link from 'next/link';
import { FreePill, MembersOnlyText } from '@/components/handbook/home/access-marks';
import type { PageId } from '@/lib/pages';
import { pageHref } from '@/lib/routes';

// Tool shortcuts use the same data-goto links as Appendix E, so DeepLinks moves to the chapter and lands on the tool.
const TOOLS = [
  { page: 'ch1', chapter: 'Chapter 1', widget: 'goal-calculator', name: 'Income goal calculator', task: 'Turn a yearly goal into a daily conversation target.' },
  { page: 'ch2', chapter: 'Chapter 2', widget: 'lead-sources', name: 'Lead source comparison', task: 'Work out what each source costs you per closing.' },
  { page: 'ch6', chapter: 'Chapter 6', widget: 'script-practice', name: 'Script practice', task: 'Rehearse the words for your first contacts.' },
  { page: 'ch8', chapter: 'Chapter 8', widget: 'timeblock-planner', name: 'Weekly planner', task: 'Protect your prospecting block and export it to a calendar.' },
  { page: 'ch12', chapter: 'Chapter 12', widget: 'roadmap', name: '90-day roadmap', task: 'Put dates on the day 30, 60 and 90 milestones.' },
  { page: 'app-a', chapter: 'Appendix A', widget: 'scorecard', name: 'Weekly scorecard', task: 'Review your numbers every Friday.' },
] as const satisfies readonly { page: PageId; chapter: string; widget: string; name: string; task: string }[];

export function ToolCards({ locked, free }: { locked: readonly string[]; free: boolean }) {
  return (
    <section className="hb-home-section" aria-labelledby="toolsTitle">
      <div className="hb-home-head">
        <h2 id="toolsTitle" className="hb-h2 hb-home-h2">Tools</h2>
        <Link className="hb-home-head-link" href={pageHref('app-e')}>See every interactive tool</Link>
      </div>
      <div className="hb-home-tools">
        {TOOLS.map(t => {
          const isLocked = locked.includes(t.page);
          const muted = free && isLocked;
          return (
            <a
              key={t.widget}
              className={muted ? 'hb-home-tool hb-home-locked' : 'hb-home-tool'}
              href={pageHref(t.page)}
              data-goto={t.page}
              data-widget={isLocked ? undefined : t.widget}
            >
              <span className="hb-home-tool-top">
                <strong className="hb-home-tool-name">{t.name}</strong>
                {free && !isLocked && <FreePill />}
                {muted && <MembersOnlyText />}
              </span>
              <span className="hb-home-tool-task">{t.task}</span>
              <span className="hb-home-tool-where">{t.chapter}</span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
