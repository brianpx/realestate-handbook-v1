import { tableRows } from '@/lib/html-text';
import { ObjectionCard, type Objection } from './ObjectionCard';

// Wraps the Table 9.2 quick reference. The table stays in the page HTML; the trainer is built from its rows.
export function ObjectionTrainer({ id, html }: { id: string; html?: string }) {
  if (html === undefined) throw new Error(`${id}: objection-trainer must wrap the objection table's HTML`);
  const items: Objection[] = tableRows(html).map(([objection, response, goal]) => ({ objection: objection ?? '', response: response ?? '', goal: goal ?? '' }));
  if (items.length === 0 || items.some(i => !i.objection || !i.response || !i.goal)) throw new Error(`${id}: objection table has no usable rows`);
  return (
    <>
      <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: html }} />
      <ObjectionCard items={items} />
    </>
  );
}
