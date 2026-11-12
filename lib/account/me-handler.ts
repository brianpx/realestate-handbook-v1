import type { AuthDeps, AuthReply, AuthRequest } from '@/lib/auth/handler';
import { signedInUser } from '@/lib/auth/request-user';
import { accountSummary } from './me';

export type MeDeps = Pick<AuthDeps, 'stores' | 'now'>;

/** GET: the signed-in reader's own summary for the user menu; 401 when there is no live session. */
export async function handleReadMe(req: AuthRequest, deps: MeDeps): Promise<AuthReply> {
  if (!deps.stores) return { status: 503, body: { ok: false, error: 'unavailable' } };
  try {
    const user = await signedInUser(req.sessionId, deps.stores, deps.now());
    if (!user) return { status: 401, body: { ok: false, error: 'unauthorized' } };
    return { status: 200, body: { ok: true, ...accountSummary(user) } };
  } catch (err) {
    console.error('account: me read failed', err instanceof Error ? err.name : 'error');
    return { status: 503, body: { ok: false, error: 'unavailable' } };
  }
}
