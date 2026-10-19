import { readPageHtml, splitSegments } from '@/lib/content';
import type { PageId } from '@/lib/pages';
import { ChapterEnd } from './ChapterEnd';
import { Widget } from '../widgets/registry';

export async function ChapterView({ id }: { id: PageId }) {
  const segments = splitSegments(await readPageHtml(id));
  return (
    <div className="chapter-section" id={id} data-page={id}>
      {segments.map((s, i) =>
        s.kind === 'html' ? <div key={i} style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: s.html }} /> : <Widget key={i} name={s.name} />,
      )}
      <ChapterEnd id={id} />
    </div>
  );
}
