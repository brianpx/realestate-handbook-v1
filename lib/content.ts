import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { PageId } from './pages';
import { tokenizeMarkers, validateMarkers } from './widget-markers';

// Chapter markup is trusted repo content (content/pages/*.html), never user input.
export async function readPageHtml(id: PageId): Promise<string> {
  return readFile(path.join(process.cwd(), 'content', 'pages', `${id}.html`), 'utf8');
}

export type Segment =
  | { kind: 'html'; html: string }
  | { kind: 'widget'; name: string; slug?: string; /** page HTML a wrapping marker encloses */ html?: string };

// Throws on a bad marker so `next build` fails instead of shipping a page with a dead widget slot.
export function splitSegments(pageId: string, html: string): Segment[] {
  const problems = validateMarkers(pageId, html);
  if (problems.length) throw new Error(`Invalid widget markers:\n${problems.join('\n')}`);
  const tokens = tokenizeMarkers(html);
  const out: Segment[] = [];
  let last = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    out.push({ kind: 'html', html: html.slice(last, t.index) });
    const close = tokens[i + 1];
    if (close?.kind === 'close') {
      out.push({ kind: 'widget', name: t.name, slug: t.slug, html: html.slice(t.index + t.text.length, close.index) });
      last = close.index + close.text.length;
      i++;
    } else {
      out.push({ kind: 'widget', name: t.name, slug: t.slug });
      last = t.index + t.text.length;
    }
  }
  out.push({ kind: 'html', html: html.slice(last) });
  return out.filter(s => s.kind === 'widget' || s.html.trim() !== '');
}
