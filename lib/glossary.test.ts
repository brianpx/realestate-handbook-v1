import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GLOSSARY_TERMS, parseGlossary, wrapGlossary } from './glossary';

const defs = parseGlossary('<dl class="glossary"><dt>CRM</dt><dd>The system &amp; <em>database</em> you work from.</dd><dt>Follow-up plan</dt><dd>A set of timed touches.</dd><dt>Speed-to-lead</dt><dd>How fast you reply.</dd><dt>IDX</dt><dd>Listing feed.</dd><dt>Opportunities</dt><dd>Active leads.</dd></dl>');
const wrap = (html: string, used = new Set<string>()) => wrapGlossary(html, defs, used);
const btn = (term: string, shown: string, def: string) => `<button type="button" class="term" aria-expanded="false" data-term="${term}" data-definition="${def}">${shown}</button>`;

describe('parseGlossary', () => {
  it('reads term and definition as plain text, keyed in lower case', () => {
    expect(defs.get('crm')).toBe('The system & database you work from.');
    expect(defs.size).toBe(5);
  });
  it('finds every term the handbook marks in Appendix D', () => {
    const real = parseGlossary(readFileSync('content/pages/app-d.html', 'utf8'));
    const missing = GLOSSARY_TERMS.filter(t => !real.has(t.term.toLowerCase())).map(t => t.term);
    expect(missing).toEqual([]);
  });
});

describe('wrapGlossary', () => {
  it('wraps the first use only, and keeps the matched text as written', () => {
    const out = wrap('<p>Open your CRM. The CRM is key. A follow-up plan helps.</p>');
    expect(out).toBe(`<p>Open your ${btn('CRM', 'CRM', 'The system &amp; database you work from.')}. The CRM is key. A ${btn('Follow-up plan', 'follow-up plan', 'A set of timed touches.')} helps.</p>`);
  });
  it('shares the used set across pieces, so a term is marked once per page', () => {
    const used = new Set<string>();
    expect(wrap('<p>CRM</p>', used)).toContain('class="term"');
    expect(wrap('<p>CRM again</p>', used)).toBe('<p>CRM again</p>');
  });
  it('honors exact case and word boundaries', () => {
    expect(wrap('<p>crm and CRMs and MyCRM</p>')).toBe('<p>crm and CRMs and MyCRM</p>');
    expect(wrap('<p>speed-to-lead and Speed-To-Lead</p>')).toMatch(/data-term="Speed-to-lead"[^>]*>speed-to-lead<\/button> and Speed-To-Lead/);
    expect(wrap('<p>the follow-up plans</p>')).toContain('>follow-up plans</button>'); // plural allowed
    expect(wrap('<p>one Opportunity here</p>')).toMatch(/data-term="Opportunities"[^>]*>Opportunity<\/button>/);
  });
  it('skips headings, links, buttons, labels, table headings and tool markup', () => {
    for (const html of [
      '<h3>The CRM</h3>', '<a href="/x">CRM</a>', '<button>CRM</button>', '<label>CRM</label>', '<table><thead><tr><th>CRM</th></tr></thead></table>',
      '<div class="box-title">CRM</div>', '<div class="diagram-title">CRM</div>', '<span data-widget="x">CRM</span>', '<table class="scorecard"><tr><td>CRM</td></tr></table>',
      '<dl class="glossary"><dt>CRM</dt></dl>', '<div class="x iw"><p>CRM</p></div>',
    ]) expect(wrap(html), html).toBe(html);
  });
  it('resumes after a skipped element closes, even with unclosed paragraphs and list items inside', () => {
    const out = wrap('<ul><li>no CRM here</li></ul><a href="#">one<br>two</a> then the IDX feed');
    expect(out).toContain(`${btn('CRM', 'CRM', 'The system &amp; database you work from.')}`);
    expect(out).toContain('then the <button');
    expect(wrap('<h3>Title <em>CRM</em></h3><p>CRM</p>')).toBe(`<h3>Title <em>CRM</em></h3><p>${btn('CRM', 'CRM', 'The system &amp; database you work from.')}</p>`);
  });
  it('ignores comments, void tags and attribute text', () => {
    expect(wrap('<!--widget:crm--><p title="CRM"><img alt="CRM"><br>CRM</p>')).toContain('<br>' + btn('CRM', 'CRM', 'The system &amp; database you work from.'));
    expect(wrap('<!--widget:crm--><p title="CRM"></p>')).toBe('<!--widget:crm--><p title="CRM"></p>');
  });
  it('leaves a term with no definition unmarked', () => {
    expect(wrap('<p>Fair Housing</p>')).toBe('<p>Fair Housing</p>');
  });
  it('can find two different terms in one text node', () => {
    const out = wrap('<p>IDX and the CRM</p>');
    expect(out.match(/<button/g)).toHaveLength(2);
    expect(out.indexOf('data-term="IDX"')).toBeLessThan(out.indexOf('data-term="CRM"'));
  });
});
