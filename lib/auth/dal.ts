import 'server-only';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { entitlement, type Entitlement } from '@/lib/access/entitlement';
import { membershipStale, recomputeMembership } from '@/lib/access/membership';
import type { Role, User } from '@/lib/users/types';
import { DEFAULT_NEXT_PATH, PATH_HEADER, SIGN_IN_PATH } from './config';
import { sessionIdFrom } from './cookie';
import { sessionDueForRenewal, sessionLive } from './session';
import { authStoresFromEnv } from './store';
import { hashSecret, isSecretShape } from './token';

export type Viewer = { user: User; role: Role; entitlement: Entitlement };

/**
 * The gate's second layer, called by every product page before it renders. Reads the cookie, looks the session
 * up, slides its expiry at most once a day, loads the user and works out what they may open. Null means not signed
 * in, whatever the proxy let through: a revoked session is turned away here on its very next request, and a revoked
 * grant shows the upsell card on the very next request, with no sign-out in between. One lookup per render, however
 * many components ask; route handlers get no such caching and read the stores themselves.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const stores = authStoresFromEnv(process.env);
  if (!stores) return null;
  const jar = await cookies();
  const raw = sessionIdFrom(name => jar.get(name)?.value);
  if (!isSecretShape(raw)) return null;
  const now = new Date();
  const idHash = hashSecret(raw);
  const session = await stores.auth.findSession(idHash);
  if (!session || !sessionLive(session, now)) return null;
  if (sessionDueForRenewal(session, now)) await stores.auth.renewSession(idHash, now);
  const user = await stores.users.findById(session.userId);
  if (!user || user.status !== 'active') return null;
  const snapshot = await stores.access.loadAccess(user.id);
  // the cached membership row is for admin lists; a read that finds it stale refreshes it, so no cron is needed
  if (membershipStale(snapshot.membership, now)) snapshot.membership = await recomputeMembership(stores.access, user.id, now);
  return { user, role: user.role, entitlement: entitlement({ status: user.status, snapshot, now }) };
});

/** The viewer, or a redirect to the sign-in page that comes back to the page asked for. */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (viewer) return viewer;
  const path = (await headers()).get(PATH_HEADER) ?? DEFAULT_NEXT_PATH;
  redirect(`${SIGN_IN_PATH}?next=${encodeURIComponent(path)}`);
}

/** An administrator, or the handbook home for anyone else who is signed in. */
export async function requireAdmin(): Promise<Viewer> {
  const viewer = await requireViewer();
  if (viewer.role !== 'admin') redirect(DEFAULT_NEXT_PATH);
  return viewer;
}

/**
 * Whether the request carries a well-formed session cookie: the public site's hint for "Welcome back" and the
 * header's "Open the handbook", with no database access. A stale cookie shows the hint once; the handbook link
 * then lands on sign-in, as every gated page does.
 */
export async function hasSessionCookie(): Promise<boolean> {
  const jar = await cookies();
  return isSecretShape(sessionIdFrom(name => jar.get(name)?.value));
}
