import { describe, expect, it } from 'vitest';
import { isIndexable, resolveSiteUrl } from './site';

describe('resolveSiteUrl', () => {
  it('falls back to localhost with no configuration', () => {
    expect(resolveSiteUrl({})).toBe('http://localhost:3000');
  });

  it('prefers an explicit address and strips trailing slashes', () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'https://handbook.example.com//', VERCEL_BRANCH_URL: 'x.vercel.app' })).toBe('https://handbook.example.com');
  });

  it('ignores a blank explicit address', () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: '  ', VERCEL_BRANCH_URL: 'b.vercel.app' })).toBe('https://b.vercel.app');
  });

  it('uses the branch address on a preview, then the deployment address', () => {
    expect(resolveSiteUrl({ VERCEL_ENV: 'preview', VERCEL_BRANCH_URL: 'b.vercel.app', VERCEL_URL: 'd.vercel.app' })).toBe('https://b.vercel.app');
    expect(resolveSiteUrl({ VERCEL_ENV: 'preview', VERCEL_URL: 'd.vercel.app' })).toBe('https://d.vercel.app');
  });

  it('uses the production address on Production, not the branch address', () => {
    expect(resolveSiteUrl({ VERCEL_ENV: 'production', VERCEL_PROJECT_PRODUCTION_URL: 'p.vercel.app', VERCEL_BRANCH_URL: 'b.vercel.app' })).toBe('https://p.vercel.app');
  });

  it('stays on localhost for production with no production address', () => {
    expect(resolveSiteUrl({ VERCEL_ENV: 'production', VERCEL_BRANCH_URL: 'b.vercel.app' })).toBe('http://localhost:3000');
  });
});

describe('isIndexable', () => {
  it('is off unless SITE_INDEXABLE is exactly "true"', () => {
    expect(isIndexable({})).toBe(false);
    expect(isIndexable({ SITE_INDEXABLE: '1' })).toBe(false);
    expect(isIndexable({ SITE_INDEXABLE: 'true' })).toBe(true);
  });
});
