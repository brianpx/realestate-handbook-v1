import { readPageHtml, splitSegments } from '@/lib/content';
import { NO_GLOSSARY_PAGES, wrapGlossary } from '@/lib/glossary';
import { glossaryDefs } from '@/lib/page-html';
import type { PageId } from '@/lib/pages';
import { ReadTracker } from './ReadTracker';
import { ChapterEnd } from './ChapterEnd';
import { widgetInstanceId } from '@/lib/widget-markers';
import { Widget } from '../widgets/registry';

export async function ChapterView({ id }: { id: PageId }) {
  const segments = splitSegments(id, await readPageHtml(id));
  // The first use of each glossary term on the page gets a popover. Checkpoint boxes are tool markup and are skipped.
  const defs = NO_GLOSSARY_PAGES.includes(id) ? null : await glossaryDefs();
  const used = new Set<string>();
  const gloss = (html: string) => (defs ? wrapGlossary(html, defs, used) : html);
  return (
    <div className="chapter-section" id={id} data-page={id}>
      {segments.map((s, i) =>
        s.kind === 'html' ? (
          <div key={i} style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: gloss(s.html) }} />
        ) : (
          <Widget key={i} id={widgetInstanceId(id, s.name, s.slug)} name={s.name} html={s.html !== undefined && s.name !== 'checkpoints' ? gloss(s.html) : s.html} />
        ),
      )}
      <ChapterEnd id={id} />
      <ReadTracker id={id} />
    </div>
  );
}
