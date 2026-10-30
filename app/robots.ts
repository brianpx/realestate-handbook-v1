import type { MetadataRoute } from 'next';
import { isIndexable, SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  if (!isIndexable(process.env)) return { rules: { userAgent: '*', disallow: '/' } };
  return { rules: { userAgent: '*', allow: '/', disallow: ['/handbook', '/account', '/api/', '/search-index.json'] }, sitemap: `${SITE_URL}/sitemap.xml` };
}
