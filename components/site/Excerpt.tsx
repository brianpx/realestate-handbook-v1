import type { ComponentType } from 'react';
import { DemotedHeadings } from '@/components/widgets/BoxTitle';
import { Checkpoints } from '@/components/widgets/Checkpoints';
import { ErrorSelfScore } from '@/components/widgets/ErrorSelfScore';
import { GoalCalculator } from '@/components/widgets/GoalCalculator';
import { KnowledgeCheck } from '@/components/widgets/KnowledgeCheck';
import { PitfallCycle } from '@/components/widgets/PitfallCycle';
import { ScriptPractice } from '@/components/widgets/ScriptPractice';
import { TimeBlockPlanner } from '@/components/widgets/TimeBlockPlanner';
import { readPageHtml, splitSegments } from '@/lib/content';
import type { PageId } from '@/lib/pages';
import { widgetInstanceId } from '@/lib/widget-markers';

// The tools the public sample runs: everything Chapters 1 and 7 use, plus the two teasers. Importing only these keeps
// the public bundle from carrying every handbook widget. They are the real components under the handbook's instance
// ids, so what a visitor tries is what a buyer gets, and their entries are still there after purchase on the same
// browser. The "Essential tools only" switch lives in the handbook's Settings, which the public site cannot reach, so
// the sample does not apply it.
type WidgetProps = { page: string; id: string; html?: string };
const PREVIEW_WIDGETS: Record<string, ComponentType<WidgetProps>> = {
  'goal-calculator': GoalCalculator,
  'script-practice': ScriptPractice,
  'timeblock-planner': TimeBlockPlanner,
  checkpoints: Checkpoints,
  // the plain quiz, not KnowledgeCheckEntry: the sample must never switch to the coach's version, which writes
  // coach attempts, when Chapter 1 or 7 questions gain concept tags
  'knowledge-check': KnowledgeCheck,
  'pitfall-cycle': PitfallCycle,
  // an async server component; the cast only keeps ComponentType, which predates them, from rejecting it
  'error-self-score': ErrorSelfScore as unknown as ComponentType<WidgetProps>,
};

type Range = { from: string; to: string } | { from?: undefined; to?: undefined };

// The sample page owns the h1 and each excerpt sits under one of its h2s, so every chapter heading moves down one
// level: h1 to h2, h2 to h3, h3 to h4. Attributes stay, so the ids lib/outline.ts gives sections keep /preview#… working.
const demoteHeadings = (html: string): string => html.replace(/<(\/?)h([123])\b/gi, (_, slash: string, level: string) => `<${slash}h${Number(level) + 1}`);

/**
 * A real chapter, straight from content/pages, with the tools inside it live. With `from` and `to`, only the slice from
 * the first `from` marker up to `to`. A marker that is not found fails the build, so a rewritten chapter cannot silently
 * empty the preview.
 */
export async function Excerpt({ page, from, to }: { page: PageId } & Range) {
  const html = await readPageHtml(page);
  let slice = html;
  if (from !== undefined) {
    const start = html.indexOf(from);
    const end = html.indexOf(to, start + from.length);
    if (start < 0 || end < 0) throw new Error(`Excerpt of ${page}: could not find ${start < 0 ? from : to}`);
    slice = html.slice(start, end);
  } else if (!/<h1\b/i.test(html)) {
    throw new Error(`Excerpt of ${page}: a whole chapter needs an h1 to become the sample's chapter heading`);
  }
  // A slice with no section heading of its own sits directly under the page's h2, so its boxes stay h3.
  const demoted = /<h[12]\b/i.test(slice);
  const segments = splitSegments(page, demoted ? demoteHeadings(slice) : slice);
  const body = segments.map((s, i) => {
    if (s.kind === 'html') return <div key={i} style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: s.html }} />;
    const Tool = PREVIEW_WIDGETS[s.name];
    if (!Tool) throw new Error(`Excerpt of ${page}: the preview does not include the "${s.name}" tool`);
    return <Tool key={i} page={page} id={widgetInstanceId(page, s.name, s.slug)} html={s.html} />;
  });
  return (
    // .chapter-body carries the handbook's content typography (app/globals.css); .chapter-demoted shifts it one heading level
    <div className={demoted ? 'chapter-body chapter-demoted' : 'chapter-body'} style={{ display: 'contents' }}>
      {demoted ? <DemotedHeadings>{body}</DemotedHeadings> : body}
    </div>
  );
}
