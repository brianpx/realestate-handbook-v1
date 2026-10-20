import { parseGlossary } from './glossary';
import { tableRows } from './html-text';
import { readPageHtml } from './content';
import type { PageId } from './pages';

/** Body rows (as plain text) of the table on `page` whose first column heading is `firstHeading`. Server only. */
export async function pageTableRows(page: PageId, firstHeading: string): Promise<string[][]> {
  const html = await readPageHtml(page);
  for (const m of html.matchAll(/<table[\s\S]*?<\/table>/gi)) {
    const first = /<th[^>]*>([\s\S]*?)<\/th>/i.exec(m[0])?.[1] ?? '';
    if (first.replace(/<[^>]+>/g, '').trim() === firstHeading) return tableRows(m[0]);
  }
  throw new Error(`${page}: no table whose first heading is "${firstHeading}"`);
}

let glossary: Promise<Map<string, string>> | undefined;
/** Appendix D as term -> definition, read once per build or server start. */
export function glossaryDefs(): Promise<Map<string, string>> {
  glossary ??= readPageHtml('app-d').then(parseGlossary);
  return glossary;
}
