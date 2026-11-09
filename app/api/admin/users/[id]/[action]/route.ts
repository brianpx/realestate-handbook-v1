import { handleAdminAction } from '@/lib/admin/handler';
import { authDepsFromEnv, authRequestFrom, toResponse } from '@/lib/auth/env';

// One route for the nine admin state-setters: /api/admin/users/<id>/<action>. The handler checks the Origin, the
// administrator, the id and the action itself; an unknown action is a 404 from there, not a missing file.
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string; action: string }> }) {
  const { id, action } = await params;
  return toResponse(await handleAdminAction(await authRequestFrom(request), { userId: id, action }, authDepsFromEnv(process.env)));
}
