import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CONCEPTS } from '../../content/data/concepts';
import { RULES } from '../../content/data/rules';

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

describe('rule anchors', () => {
  const rules = Object.entries(RULES);
  it('points every shared rule at a heading id that exists in the chapter that defines it', () => {
    for (const [id, rule] of rules) expect(headingIds(page(rule.chapter)), `${id} -> ${rule.chapter}#${rule.anchor}`).toContain(rule.anchor);
  });

  it('names only concepts the coach knows for each rule', () => {
    const known = new Set(CONCEPTS.map(c => c.id));
    for (const [id, rule] of rules) for (const concept of rule.concepts) expect(known.has(concept), `${id} -> ${concept}`).toBe(true);
  });

  it('names, for each rule, the concept that lives where the rule is defined', () => {
    for (const [id, rule] of rules) {
      const home = CONCEPTS.filter(c => c.chapter === rule.chapter && c.anchor === rule.anchor).map(c => c.id);
      expect(rule.concepts.some(c => home.includes(c)), `${id} -> ${rule.chapter}#${rule.anchor}`).toBe(true);
    }
  });
});
