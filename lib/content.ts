import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { PageId } from './pages';

// Chapter markup is trusted repo content (content/pages/*.html), never user input.
export async function readPageHtml(id: PageId): Promise<string> {
  return readFile(path.join(process.cwd(), 'content', 'pages', `${id}.html`), 'utf8');
}

// Widget mount points inside a chapter are HTML comments: <!--widget:goal-calculator-->.
const MARKER = /<!--widget:([\w-]+)-->/g;

export type Segment = { kind: 'html'; html: string } | { kind: 'widget'; name: string };

export function splitSegments(html: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of html.matchAll(MARKER)) {
    out.push({ kind: 'html', html: html.slice(last, m.index) });
    out.push({ kind: 'widget', name: m[1]! });
    last = m.index + m[0].length;
  }
  out.push({ kind: 'html', html: html.slice(last) });
  return out.filter(s => s.kind === 'widget' || s.html.trim() !== '');
}
