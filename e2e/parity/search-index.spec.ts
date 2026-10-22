import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { CHECKLISTS } from '../../content/data/checklists';
import { GOAL_CAPTION } from '../../content/data/goal';
import { SCORECARD_CAPTION } from '../../content/data/scorecard';
import { PAGE_IDS } from '../../lib/pages';

// The search index is built from page HTML by a small scanner. This checks it against the browser's own HTML
// parser running the static site's selection rules (searchable() in legacy/js/search.js).
type Row = { text: string; occurrence: number; isTerm: boolean; isHeading: boolean };

test('the build-time index matches what the browser would find in each page', async ({ page, request }) => {
  const index = (await (await request.get('/search-index.json')).json()) as (Row & { pageId: string })[];
  expect(index.length).toBeGreaterThan(500);
  await page.goto('/ch1'); // any page gives us a DOM and DOMParser
  const extras = (id: string): Set<string> => new Set([
    ...(id === 'ch1' ? [GOAL_CAPTION] : []),
    ...(id === 'app-a' ? [SCORECARD_CAPTION] : []),
    ...(CHECKLISTS[id]?.groups.map(g => g.title) ?? []),
  ]);
  const mismatches: string[] = [];
  for (const id of PAGE_IDS) {
    const html = readFileSync(`content/pages/${id}.html`, 'utf8');
    const expected = await page.evaluate((src: string): Row[] => {
      const doc = new DOMParser().parseFromString(src, 'text/html');
      // deliberate difference: a line break is a space, so "House<br>Online" is two words (textContent glued them)
      doc.querySelectorAll('br').forEach(br => br.replaceWith(' '));
      const SELECTOR = 'h1, h2, h3, h4, dt, caption, figcaption, .diagram-title, p, li';
      const HEADING = new Set(['H1', 'H2', 'H3', 'H4', 'DT']);
      const seen: Record<string, number> = {};
      return [...doc.querySelectorAll(SELECTOR)]
        .filter(node => {
          if (node.closest('dialog, .chapter-foot, .chapter-next, .nurture-static')) return false;
          if (node.matches('p, li') && node.querySelector('p, li, h1, h2, h3, h4, caption, figcaption')) return false;
          return true;
        })
        .map(node => {
          const text = (node.textContent ?? '').replace(/\s+/g, ' ').trim();
          const occurrence = (seen[text] = (seen[text] ?? -1) + 1);
          return { text, occurrence, isTerm: node.tagName === 'DT', isHeading: HEADING.has(node.tagName) || node.classList.contains('diagram-title') };
        })
        .filter(e => e.text);
    }, html);
    const skip = extras(id);
    const actual = index.filter(e => e.pageId === id && !skip.has(e.text)).map(({ text, occurrence, isTerm, isHeading }) => ({ text, occurrence, isTerm, isHeading }));
    const want = expected.filter(e => !skip.has(e.text));
    if (JSON.stringify(actual) !== JSON.stringify(want)) {
      const a = actual.map(e => `${e.text}|${e.occurrence}`);
      const w = want.map(e => `${e.text}|${e.occurrence}`);
      mismatches.push(`${id}: scanner has ${a.length}, parser has ${w.length}; only in scanner: ${a.filter(x => !w.includes(x)).slice(0, 3).join(' // ')}; only in parser: ${w.filter(x => !a.includes(x)).slice(0, 3).join(' // ')}`);
    }
  }
  expect(mismatches).toEqual([]);
});
