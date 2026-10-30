import type { ComponentType } from 'react';
import { GoalCalculator } from '@/components/widgets/GoalCalculator';
import { ScriptPractice } from '@/components/widgets/ScriptPractice';
import { TimeBlockPlanner } from '@/components/widgets/TimeBlockPlanner';
import { readPageHtml, splitSegments } from '@/lib/content';
import type { PageId } from '@/lib/pages';
import { widgetInstanceId } from '@/lib/widget-markers';

// The handful of tools the public preview runs. Importing only these keeps the public bundle from carrying every
// handbook widget. They are the real components, so what a visitor tries is what a buyer gets.
type WidgetProps = { page: string; id: string; html?: string };
const PREVIEW_WIDGETS: Record<string, ComponentType<WidgetProps>> = {
  'goal-calculator': GoalCalculator,
  'script-practice': ScriptPractice,
  'timeblock-planner': TimeBlockPlanner,
};

/**
 * A slice of a real chapter, straight from content/pages, from the first `from` marker up to `to`, with the tools
 * inside it live. A marker that is not found fails the build, so a rewritten chapter cannot silently empty the preview.
 */
export async function Excerpt({ page, from, to }: { page: PageId; from: string; to: string }) {
  const html = await readPageHtml(page);
  const start = html.indexOf(from);
  const end = html.indexOf(to, start + from.length);
  if (start < 0 || end < 0) throw new Error(`Excerpt of ${page}: could not find ${start < 0 ? from : to}`);
  const segments = splitSegments(page, html.slice(start, end));
  return (
    <>
      {segments.map((s, i) => {
        if (s.kind === 'html') return <div key={i} style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: s.html }} />;
        const Tool = PREVIEW_WIDGETS[s.name];
        if (!Tool) throw new Error(`Excerpt of ${page}: the preview does not include the "${s.name}" tool`);
        return <Tool key={i} page={page} id={widgetInstanceId(page, s.name, s.slug)} html={s.html} />;
      })}
    </>
  );
}
