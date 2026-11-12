import type { AuthStore } from './store';
import { tokenUsable } from './session';
import { hashSecret, isSecretShape } from './token';

/**
 * What the verify page learns by looking at an emailed link. "unavailable" is a store failure, kept apart from
 * "unusable" so an outage is not reported to the reader as an expired link.
 */
export type LinkCheck = 'usable' | 'unusable' | 'unavailable';

export async function checkLink(auth: AuthStore, raw: unknown, now: Date): Promise<LinkCheck> {
  if (!isSecretShape(raw)) return 'unusable';
  try {
    const token = await auth.peekToken(hashSecret(raw));
    return token !== null && tokenUsable(token, now) ? 'usable' : 'unusable';
  } catch (err) {
    console.error('auth: verify page lookup failed', err instanceof Error ? err.name : 'error');
    return 'unavailable';
  }
}
