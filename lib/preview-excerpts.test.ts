import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Excerpt throws at build time when a from/to marker is missing from its chapter, so a heading edit in a chapter can
// break /preview without failing a unit test. This reads the markers straight from the page source and checks them
// the way Excerpt does: `from` is found, and `to` follows it.
const source = readFileSync(join(process.cwd(), 'app/(public)/preview/page.tsx'), 'utf8');
const chapter = (id: string) => readFileSync(join(process.cwd(), 'content/pages', `${id}.html`), 'utf8');

const attr = (tag: string, name: string): string | undefined => {
  const m = new RegExp(`\\b${name}=(?:"([^"]*)"|\\{'([^']*)'\\}|\\{"([^"]*)"\\})`).exec(tag);
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
};

const excerpts = [...source.matchAll(/<Excerpt\b[\s\S]*?\/>/g)].map(([tag]) => ({
  page: attr(tag, 'page'),
  from: attr(tag, 'from'),
  to: attr(tag, 'to'),
}));

describe('the /preview excerpts', () => {
  it('are all read from the page source', () => {
    expect(excerpts.map(e => e.page)).toEqual(['ch1', 'pref', 'ch7', 'ch6', 'ch8']);
  });

  it.each(excerpts.filter(e => e.from !== undefined || e.to !== undefined))('$page: both markers exist, in order', ({ page, from, to }) => {
    expect(from, `${page} from`).toBeDefined();
    expect(to, `${page} to`).toBeDefined();
    const html = chapter(page!);
    const start = html.indexOf(from!);
    expect(start, `${page}: ${from}`).toBeGreaterThanOrEqual(0);
    expect(html.indexOf(to!, start + from!.length), `${page}: ${to}`).toBeGreaterThan(start);
  });
});
