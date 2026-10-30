import { BOOK_DESCRIPTION, BOOK_TITLE, pageById, type PageId } from './pages';
import { SITE_URL } from './site';

// Structured data for search engines. The cover carries the Book (the same facts the static site declared); each
// chapter is a Chapter that points back to it.
const root = SITE_URL.replace(/\/$/, '');

export function bookJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    '@id': `${root}/#book`,
    name: BOOK_TITLE,
    alternateName: `${BOOK_TITLE}: a practical guide for new agents`,
    description: BOOK_DESCRIPTION,
    url: `${root}/`,
    image: `${root}/images/og-image.png`,
    inLanguage: 'en',
    bookEdition: '1.0',
    datePublished: '2026-10',
    genre: 'Real estate training',
    audience: { '@type': 'Audience', audienceType: 'New real estate agents' },
    about: ['Real estate lead generation', 'Client follow-up', 'Client retention', 'Real estate sales scripts'],
  };
}

export function chapterJsonLd(id: PageId) {
  const { label } = pageById(id);
  return {
    '@context': 'https://schema.org',
    '@type': 'Chapter',
    name: label,
    url: `${root}/handbook/${id}`,
    isPartOf: { '@type': 'Book', '@id': `${root}/#book`, name: BOOK_TITLE, url: `${root}/` },
    inLanguage: 'en',
  };
}

/** JSON for a <script type="application/ld+json">. "<" is escaped so no text can close the script tag. */
export const jsonLdScript = (data: object): string => JSON.stringify(data).replace(/</g, '\\u003c');
