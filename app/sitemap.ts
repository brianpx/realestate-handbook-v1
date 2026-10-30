import type { MetadataRoute } from 'next';
import { POLICY_STATUS } from '@/lib/offer';
import { SITE_URL } from '@/lib/site';

// The public site only. The handbook and account are the product, so they are not offered to crawlers; the free
// sample at /preview is what search engines see of it.
const PUBLIC_PATHS = ['/', '/preview', '/about', '/pricing', '/support'];
const POLICY_PATHS = { privacy: '/privacy', terms: '/terms', refunds: '/refunds', updates: '/updates' } as const;

export default function sitemap(): MetadataRoute.Sitemap {
  // a policy still marked draft is noindex, so it stays out of the sitemap too
  const approved = Object.entries(POLICY_PATHS).filter(([key]) => POLICY_STATUS[key as keyof typeof POLICY_PATHS] === 'approved').map(([, path]) => path);
  return [...PUBLIC_PATHS, ...approved].map(path => ({ url: path === '/' ? SITE_URL : `${SITE_URL}${path}` }));
}
