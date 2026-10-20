import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CONCEPTS } from '../../content/data/concepts';

const page = (chapter: string) => readFileSync(join(process.cwd(), 'content/pages', `${chapter}.html`), 'utf8');
const headingIds = (html: string) => [...html.matchAll(/<h[23]\s[^>]*\bid="([^"]+)"/g)].map(m => m[1]!);

describe('concept anchors', () => {
  it('points every concept at a heading id that exists in its chapter page', () => {
    for (const c of CONCEPTS) expect(headingIds(page(c.chapter)), `${c.id} -> #${c.anchor}`).toContain(c.anchor);
  });

  it('keeps heading ids unique within a page', () => {
    for (const chapter of new Set(CONCEPTS.map(c => c.chapter))) {
      const html = page(chapter);
      const all = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]!);
      expect(new Set(all).size, chapter).toBe(all.length);
    }
  });
});
