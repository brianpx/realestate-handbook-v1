import { readdirSync, readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { parseGlossary, wrapGlossary } from './glossary';
import { htmlText } from './html-text';

// A data table needs a <caption> so a screen reader names it when the reader lands on it (CR-L21). Where a heading
// above already shows the title, the caption is visually hidden rather than printed twice.
const page = (file: string) => readFileSync(`content/pages/${file}`, 'utf8');
const tables = readdirSync('content/pages')
  .filter(f => f.endsWith('.html'))
  .flatMap(file => [...page(file).matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)].map((m, i) => ({ table: `${file} #${i + 1}`, body: m[1]! })));
const captions = (html: string) => [...html.matchAll(/<caption\b[^>]*>([\s\S]*?)<\/caption>/gi)].map(m => m[1]!);

it('finds the reference tables in Appendices B, E and F and Chapters 2 and 9', () => {
  const count = (prefix: string) => tables.filter(t => t.table.startsWith(`${prefix}.html`)).length;
  for (const [prefix, atLeast] of [['app-b', 6], ['app-e', 1], ['app-f', 1], ['ch2', 1], ['ch9', 2]] as const) {
    expect(count(prefix), prefix).toBeGreaterThanOrEqual(atLeast);
  }
});

it.each(tables)('$table opens with a non-empty caption', ({ body }) => {
  const caption = /^\s*<caption\b[^>]*>([\s\S]*?)<\/caption>/i.exec(body)?.[1];
  expect(htmlText(caption ?? '')).not.toBe('');
});

// A glossary term becomes a focusable button, and inside a visually hidden caption that is an invisible tab stop.
it.each(['app-b.html', 'ch2.html'])('%s has no glossary term inside a hidden caption', file => {
  const defs = parseGlossary(page('app-d.html'));
  for (const caption of captions(wrapGlossary(page(file), defs, new Set()))) expect(caption).not.toContain('class="term"');
  // each caption on its own too, so a term already marked earlier on the page cannot hide one
  for (const caption of captions(page(file))) expect(wrapGlossary(`<p>${caption}</p>`, defs, new Set()), caption).not.toContain('class="term"');
});
