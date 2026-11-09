import { getViewer } from '@/lib/auth/dal';
import { buildSearchIndex } from '@/lib/search-index';

export const dynamic = 'force-dynamic';

// The sidebar fetches this the first time the search box gets focus. The proxy only checks the cookie's shape, so
// the session is checked here before the index (every chapter's text) goes out; Phase 2 narrows it to the free
// pages for preview readers. The content is static, so the index is built once per server instance.
let index: ReturnType<typeof buildSearchIndex> | null = null;

export async function GET() {
  if (!(await getViewer())) return Response.json({ ok: false, error: 'unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  index ??= buildSearchIndex().catch(err => { index = null; throw err; });
  return Response.json(await index, { headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'private, no-store' } });
}
