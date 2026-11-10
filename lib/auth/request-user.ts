import type { User } from '@/lib/users/types';
import { sessionLive } from './session';
import type { AuthStores } from './store';
import { hashSecret, isSecretShape } from './token';

/**
 * The active account behind a route handler's session cookie, or null. Read here, not through the page's
 * data-access layer: a route handler has no render to share a cache with. A disabled or deleted account is null,
 * whatever its session says.
 */
export async function signedInUser(sessionId: string | undefined, stores: AuthStores, now: Date): Promise<User | null> {
  if (!isSecretShape(sessionId)) return null;
  const session = await stores.auth.findSession(hashSecret(sessionId));
  if (!session || !sessionLive(session, now)) return null;
  const user = await stores.users.findById(session.userId);
  return user && user.status === 'active' ? user : null;
}
