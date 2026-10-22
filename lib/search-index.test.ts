import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { extractSearchable, indexPage } from './search-index';
import { searchEntries, type SearchEntry } from './search-query';
import { PAGE_IDS } from './pages';

describe('extractSearchable', () => {
  it('takes headings, terms, figure titles, paragraphs and list items in document order', () => {
    const html = '<h2>Title</h2><p>Intro <em>text</em>.</p><div class="diagram-title">Figure 1</div><ul><li>One</li><li>Two <strong>bold</strong></li></ul><dl><dt>CRM</dt><dd>skip me</dd></dl><h5>no</h5>';
    expect(extractSearchable(html)).toEqual([
      { text: 'Title', isTerm: false, isHeading: true }, { text: 'Intro text.', isTerm: false, isHeading: false },
      { text: 'Figure 1', isTerm: false, isHeading: true }, { text: 'One', isTerm: false, isHeading: false },
      { text: 'Two bold', isTerm: false, isHeading: false }, { text: 'CRM', isTerm: true, isHeading: true },
    ]);
  });
  it('collapses whitespace, decodes entities and treats <br> as a space', () => {
    expect(extractSearchable('<p>a\n   b&amp;c<br>d</p>').map(e => e.text)).toEqual(['a b&c d']);
  });
  it('skips the footer, next-chapter link, plain fallbacks and dialogs, and everything inside them', () => {
    const html = '<footer class="chapter-foot"><p>Not legal advice</p></footer><p class="chapter-next">Next</p><div class="nurture-static"><ol><li>x</li></ol></div><dialog><p>d</p></dialog><p>kept</p>';
    expect(extractSearchable(html).map(e => e.text)).toEqual(['kept']);
  });
  it('drops a paragraph or item that only wraps other searchable blocks', () => {
    expect(extractSearchable('<ul><li>Outer<ul><li>Inner</li></ul></li></ul>').map(e => e.text)).toEqual(['Inner']);
    expect(extractSearchable('<li><p>Para in item</p></li>').map(e => e.text)).toEqual(['Para in item']);
  });
  it('ignores widget markers and comments', () => {
    expect(extractSearchable('<!--widget:x--><p>hi</p><!--/widget:x-->').map(e => e.text)).toEqual(['hi']);
  });
});

describe('indexPage', () => {
  it('numbers repeated texts so a jump can find the right one', () => {
    const e = indexPage('ch1', '<h3>Same</h3><p>x</p><h3>Same</h3>').filter(x => x.text === 'Same');
    expect(e.map(x => x.occurrence)).toEqual([0, 1]);
  });
  it('adds the text the tools draw themselves: the Table 1.1 caption and the checklist titles', () => {
    expect(indexPage('ch1', '').map(e => e.text)).toContain('Table 1.1. The goal ladder. The example numbers are fixed. Fill in your own in the last column.');
    expect(indexPage('app-a', '').map(e => e.text)).toContain('Table A.1. Weekly scorecard. The rows match Table 8.2.');
    expect(indexPage('app-c', '').filter(e => e.isHeading).map(e => e.text)).toEqual(['Profile', 'Contacts', 'Follow-up plans', 'Pipeline and routing', 'Mobile and testing']);
    expect(indexPage('ch12', '').map(e => e.text)).toContain('Days 31 to 60 (Build Rhythm)');
  });
});

describe('searchEntries', () => {
  const index: SearchEntry[] = [
    { pageId: 'ch1', text: 'Your CRM is the single source of truth', occurrence: 0, isTerm: false, isHeading: false },
    { pageId: 'ch4', text: 'Your CRM is your headquarters', occurrence: 0, isTerm: false, isHeading: true },
    { pageId: 'app-d', text: 'CRM', occurrence: 0, isTerm: true, isHeading: true },
    { pageId: 'ch2', text: 'Sphere of influence', occurrence: 0, isTerm: false, isHeading: true },
  ];
  it('needs every word, in any order, ignoring case', () => {
    expect(searchEntries(index, 'TRUTH crm').map(e => e.pageId)).toEqual(['ch1']);
    expect(searchEntries(index, 'xyz')).toEqual([]);
    expect(searchEntries(index, '   ')).toEqual([]);
  });
  it('ranks headings above paragraphs, and entries that start with the first word above those that do not', () => {
    expect(searchEntries(index, 'crm').map(e => e.pageId)).toEqual(['app-d', 'ch4', 'ch1']);
  });
  it('caps results at 12', () => {
    const many: SearchEntry[] = Array.from({ length: 30 }, (_, i) => ({ pageId: 'ch1', text: `thing ${i}`, occurrence: 0, isTerm: false, isHeading: false }));
    expect(searchEntries(many, 'thing')).toHaveLength(12);
  });
});

describe('the shipped pages', () => {
  it('yield entries on every page except none, and a good number overall', () => {
    let total = 0;
    for (const id of PAGE_IDS) {
      const n = indexPage(id, readFileSync(`content/pages/${id}.html`, 'utf8')).length;
      if (id !== 'cover') expect(n, id).toBeGreaterThan(0);
      total += n;
    }
    expect(total).toBeGreaterThan(500);
  });
});
