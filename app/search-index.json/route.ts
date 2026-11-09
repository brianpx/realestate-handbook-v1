import { pageOpen } from '@/lib/access/entitlement';
import { getViewer } from '@/lib/auth/dal';
import { buildSearchIndex } from '@/lib/search-index';

export const dynamic = 'force-dynamic';

// The sidebar fetches this the first time the search box gets focus. The proxy only checks the cookie's shape, so
// the session is checked here before any chapter text goes out, and a reader gets the pages their plan opens: the
// free set for a preview reader, everything for a member. The content is static, so the index is built once per
// server instance and filtered per request.
let index: ReturnType<typeof buildSearchIndex> | null = null;

export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return Response.json({ ok: false, error: 'unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  index ??= buildSearchIndex().catch(err => { index = null; throw err; });
  const entries = (await index).filter(entry => pageOpen(viewer.entitlement, entry.pageId));
  return Response.json(entries, { headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'private, no-store' } });
}
