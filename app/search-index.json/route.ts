import { buildSearchIndex } from '@/lib/search-index';

// Built once at build time; the sidebar fetches it the first time the search box gets focus.
export const dynamic = 'force-static';

export async function GET() {
  return Response.json(await buildSearchIndex());
}
