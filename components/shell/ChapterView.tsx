import type { ReactNode } from 'react';
import { readPageHtml, splitSegments, type Segment } from '@/lib/content';
import { NO_GLOSSARY_PAGES, wrapGlossary } from '@/lib/glossary';
import { collectOutline, introCut } from '@/lib/outline';
import { glossaryDefs } from '@/lib/page-html';
import { toolOpen, type Entitlement } from '@/lib/access/entitlement';
import type { PageId } from '@/lib/pages';
import { widgetInstanceId } from '@/lib/widget-markers';
import { LockedWidget, Widget } from '../widgets/registry';
import { Breadcrumbs } from './Breadcrumbs';
import { ChapterEnd } from './ChapterEnd';
import { ChapterOutline } from './ChapterOutline';
import { ReadTracker } from './ReadTracker';

// The page is already open to this reader (the route checked); the entitlement decides which tools are built.
export async function ChapterView({ id, entitlement }: { id: PageId; entitlement: Entitlement }) {
  const html = await readPageHtml(id);
  // The first use of each glossary term on the page gets a popover. Checkpoint boxes are tool markup and are skipped.
  const defs = NO_GLOSSARY_PAGES.includes(id) ? null : await glossaryDefs();
  const used = new Set<string>();
  const gloss = (raw: string) => (defs ? wrapGlossary(raw, defs, used) : raw);
  const render = (segments: Segment[]) => segments.map((s, i) => {
    if (s.kind === 'html') return <div key={i} style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: gloss(s.html) }} />;
    const inner = s.html !== undefined && s.name !== 'checkpoints' ? gloss(s.html) : s.html;
    if (!toolOpen(entitlement, id, s.name)) return <LockedWidget key={i} name={s.name} html={inner} />;
    return <Widget key={i} id={widgetInstanceId(id, s.name, s.slug)} name={s.name} html={inner} />;
  });
  const end = (
    <>
      <ChapterEnd id={id} />
      <ReadTracker id={id} />
    </>
  );
  const items = collectOutline(html);
  if (items.length === 0) {
    return (
      <div className="content-container" id="content-container">
        <Breadcrumbs />
        <article className="chapter-section chapter-body" id={id} data-page={id}>
          {render(splitSegments(id, html))}
          {end}
        </article>
      </div>
    );
  }
  const cut = introCut(html);
  return (
    <ChapterOutline
      pageId={id}
      items={items}
      before={<Breadcrumbs />}
      intro={render(splitSegments(id, html.slice(0, cut)))}
      rest={<OutlineRest segments={render(splitSegments(id, html.slice(cut)))} end={end} />}
    />
  );
}

function OutlineRest({ segments, end }: { segments: ReactNode; end: ReactNode }) {
  return <>{segments}{end}</>;
}
