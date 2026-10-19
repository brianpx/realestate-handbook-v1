import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { PAGE_IDS } from '@/lib/pages';

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGE_IDS.map(id => ({ url: id === 'cover' ? SITE_URL : `${SITE_URL}/${id}` }));
}
