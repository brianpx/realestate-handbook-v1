import { describe, expect, test } from 'vitest';
import { labelParts, NAV, PAGES, partParts } from './pages';

describe('labelParts', () => {
  test('a chapter gives its number and its title', () => {
    expect(labelParts('5. Nurturing Leads')).toEqual({ before: '', mark: '5', after: '. ', title: 'Nurturing Leads' });
    expect(labelParts('12. Execution Plans (90 Days)')).toEqual({ before: '', mark: '12', after: '. ', title: 'Execution Plans (90 Days)' });
  });

  test('an appendix gives its letter and its title', () => {
    expect(labelParts('App D: Glossary')).toEqual({ before: 'App ', mark: 'D', after: ': ', title: 'Glossary' });
  });

  test('a page without a number has no parts', () => {
    expect(labelParts('Title Page')).toBeNull();
    expect(labelParts('Handbook Overview & Plan')).toBeNull();
  });

  test('the pieces of every label join back into the label', () => {
    for (const { label } of PAGES) {
      const parts = labelParts(label);
      if (parts) expect(parts.before + parts.mark + parts.after + parts.title).toBe(label);
    }
    expect(PAGES.filter(p => labelParts(p.label)).length).toBe(19);
  });
});

describe('partParts', () => {
  test('a numbered part gives "Part N" and its name', () => {
    expect(partParts('PART IV: Nurture')).toEqual({ eyebrow: 'Part IV', name: 'Nurture' });
    expect(partParts('PART VI: Serve and Keep')).toEqual({ eyebrow: 'Part VI', name: 'Serve and Keep' });
  });

  test('the appendices are reference', () => {
    expect(partParts('APPENDICES')).toEqual({ eyebrow: 'Reference', name: 'Appendices' });
  });

  test('every part in the menu has an eyebrow and a name', () => {
    for (const group of NAV) {
      if (!group.part) continue;
      const { eyebrow, name } = partParts(group.part);
      expect(eyebrow).toMatch(/^(Part [IVX]+|Reference)$/);
      expect(name.length).toBeGreaterThan(0);
    }
  });
});
