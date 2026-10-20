import { CHECKLISTS } from '@/content/data/checklists';
import { GOAL_CAPTION } from '@/content/data/goal';
import { decodeEntities } from './html-text';
import { readPageHtml } from './content';
import { PAGE_IDS, type PageId } from './pages';
import type { SearchEntry } from './search-query';

// What the sidebar search looks through. Same rules as the static site (legacy/js/search.js): headings, glossary
// terms, figure titles, paragraphs and list items, with the footer, next-chapter link and plain fallbacks left
// out. It is built from the page HTML at build time instead of fetching and parsing every chapter in the browser.

const SELECT_TAGS = new Set(['h2', 'h3', 'h4', 'dt', 'p', 'li']);
const HEADING_TAGS = new Set(['h2', 'h3', 'h4', 'dt']);
const BLOCK_TAGS = new Set(['p', 'li', 'h2', 'h3', 'h4']);
const EXCLUDED_CLASSES = new Set(['chapter-foot', 'chapter-next', 'nurture-static']);
const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

type Frame = { tag: string; order: number; candidate: boolean; heading: boolean; excluded: boolean; hasBlockChild: boolean; text: string };
type Found = { order: number; text: string; isTerm: boolean; isHeading: boolean };

/** Searchable blocks of an HTML fragment, in document order, as plain text with whitespace collapsed. */
export function extractSearchable(html: string): { text: string; isTerm: boolean; isHeading: boolean }[] {
  const stack: Frame[] = [];
  const found: Found[] = [];
  let order = 0;

  const finish = (f: Frame) => {
    if (!f.candidate || f.excluded) return;
    if ((f.tag === 'p' || f.tag === 'li') && f.hasBlockChild) return; // it only wraps other searchable blocks
    const text = f.text.replace(/\s+/g, ' ').trim();
    if (text) found.push({ order: f.order, text, isTerm: f.tag === 'dt', isHeading: f.heading });
  };

  for (const piece of html.split(/(<!--[\s\S]*?-->|<[^>]+>)/)) {
    if (!piece || piece.startsWith('<!--')) continue;
    if (!piece.startsWith('<')) {
      const decoded = decodeEntities(piece);
      for (const f of stack) if (f.candidate) f.text += decoded;
      continue;
    }
    const close = /^<\/\s*([a-z][a-z0-9]*)/i.exec(piece);
    if (close) {
      const tag = close[1]!.toLowerCase();
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i]!.tag === tag) { stack.splice(i).reverse().forEach(finish); break; }
      }
      continue;
    }
    const open = /^<([a-z][a-z0-9]*)/i.exec(piece);
    if (!open) continue;
    const tag = open[1]!.toLowerCase();
    if (tag === 'br') { for (const f of stack) if (f.candidate) f.text += ' '; continue; }
    if (VOID_TAGS.has(tag) || piece.endsWith('/>')) continue;
    const classes = (/\sclass\s*=\s*"([^"]*)"/i.exec(piece)?.[1] ?? '').split(/\s+/);
    if (BLOCK_TAGS.has(tag)) for (const f of stack) if (f.tag === 'p' || f.tag === 'li') f.hasBlockChild = true;
    const diagramTitle = classes.includes('diagram-title');
    stack.push({
      tag,
      order: order++,
      candidate: SELECT_TAGS.has(tag) || diagramTitle,
      heading: HEADING_TAGS.has(tag) || diagramTitle,
      excluded: tag === 'dialog' || classes.some(c => EXCLUDED_CLASSES.has(c)) || stack.some(f => f.excluded),
      hasBlockChild: false,
      text: '',
    });
  }
  stack.reverse().forEach(finish);
  return found.sort((a, b) => a.order - b.order).map(({ text, isTerm, isHeading }) => ({ text, isTerm, isHeading }));
}

/** Text that the page's tools draw themselves but that used to be static page text. */
function toolText(pageId: PageId): string {
  const parts: string[] = [];
  if (pageId === 'ch1') parts.push(`<p><em>${GOAL_CAPTION}</em></p>`);
  const checklist = CHECKLISTS[pageId];
  if (checklist) for (const g of checklist.groups) parts.push(`<${checklist.titleTag}>${g.title}</${checklist.titleTag}>`);
  return parts.join('\n');
}

export function indexPage(pageId: PageId, html: string): SearchEntry[] {
  const seen = new Map<string, number>();
  return extractSearchable(`${html}\n${toolText(pageId)}`).map(e => {
    // the nth block with this exact text on the page, so repeated titles jump to the right one
    const occurrence = seen.get(e.text) ?? 0;
    seen.set(e.text, occurrence + 1);
    return { pageId, ...e, occurrence };
  });
}

export async function buildSearchIndex(): Promise<SearchEntry[]> {
  const perPage = await Promise.all(PAGE_IDS.map(async id => indexPage(id, await readPageHtml(id))));
  return perPage.flat();
}
