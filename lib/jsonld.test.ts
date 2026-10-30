import { describe, expect, it } from 'vitest';
import { bookJsonLd, chapterJsonLd, jsonLdScript } from './jsonld';

describe('structured data', () => {
  it('describes the book the way the static site did', () => {
    const book = bookJsonLd();
    expect(book).toMatchObject({ '@type': 'Book', name: 'Finding, Keeping, and Nurturing Clients', inLanguage: 'en', bookEdition: '1.0', datePublished: '2026-10', genre: 'Real estate training' });
    expect(book.audience).toEqual({ '@type': 'Audience', audienceType: 'New real estate agents' });
    expect(book.about).toHaveLength(4);
    expect(book.url).toMatch(/^https?:\/\/[^/]+(\/.*)?\/$/);
    expect(book.image).toMatch(/\/images\/og-image\.png$/);
  });
  it('points each chapter back to the book by the same id', () => {
    const chapter = chapterJsonLd('ch5');
    expect(chapter['@type']).toBe('Chapter');
    expect(chapter.url.endsWith('/ch5')).toBe(true);
    expect(chapter.isPartOf['@id']).toBe(bookJsonLd()['@id']);
  });
  it('cannot be used to close the script tag', () => {
    const out = jsonLdScript({ name: '</script><script>alert(1)</script>' });
    expect(out).not.toContain('<');
    expect(JSON.parse(out).name).toBe('</script><script>alert(1)</script>');
  });
});
