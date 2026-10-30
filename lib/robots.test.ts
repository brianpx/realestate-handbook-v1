import { afterEach, describe, expect, it } from 'vitest';
import robots from '@/app/robots';
import { SITE_URL } from '@/lib/site';

describe('robots', () => {
  const previous = process.env.SITE_INDEXABLE;

  afterEach(() => {
    if (previous === undefined) delete process.env.SITE_INDEXABLE;
    else process.env.SITE_INDEXABLE = previous;
  });

  it('disallows the whole site until indexing is on', () => {
    delete process.env.SITE_INDEXABLE;
    expect(robots()).toEqual({ rules: { userAgent: '*', disallow: '/' } });
  });

  it('disallows the search index with the handbook, account, and API once indexing is on', () => {
    process.env.SITE_INDEXABLE = 'true';
    expect(robots()).toEqual({
      rules: { userAgent: '*', allow: '/', disallow: ['/handbook', '/account', '/api/', '/search-index.json'] },
      sitemap: `${SITE_URL}/sitemap.xml`,
    });
  });
});
