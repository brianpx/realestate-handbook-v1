import { readdirSync, readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { htmlText } from './html-text';

// A data table needs a <caption> so a screen reader names it when the reader lands on it (CR-L21). Where a heading
// above already shows the title, the caption is visually hidden rather than printed twice.
const tables = readdirSync('content/pages')
  .filter(f => f.endsWith('.html'))
  .flatMap(file => [...readFileSync(`content/pages/${file}`, 'utf8').matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)].map((m, i) => ({ table: `${file} #${i + 1}`, body: m[1]! })));

it('finds the reference tables, including the ten in Appendices B, E and F and Chapters 2 and 9', () => {
  const count = (prefix: string) => tables.filter(t => t.table.startsWith(`${prefix}.html`)).length;
  expect([count('app-b'), count('app-e'), count('app-f'), count('ch2'), count('ch9')]).toEqual([6, 1, 1, 1, 2]);
});

it.each(tables)('$table opens with a non-empty caption', ({ body }) => {
  const caption = /^\s*<caption\b[^>]*>([\s\S]*?)<\/caption>/i.exec(body)?.[1];
  expect(htmlText(caption ?? '')).not.toBe('');
});
