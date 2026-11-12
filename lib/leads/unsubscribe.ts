import { createHmac, timingSafeEqual } from 'node:crypto';

// The unsubscribe link is `<lead id>.<HMAC of the id>`: the id says who, the MAC proves the link came from us, and
// nothing is stored, so every later note can build a link for any lead from the id alone. The key is derived from
// the lead flow's existing secret (LEAD_IP_SALT) under its own label, so the two uses cannot stand in for each other.
const ID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const SHAPE = new RegExp(`^(${ID})\\.([A-Za-z0-9_-]{43})$`, 'i');

const mac = (id: string, secret: string): string => createHmac('sha256', `lead-unsubscribe:${secret}`).update(id.toLowerCase()).digest('base64url');

export const signUnsubscribe = (id: string, secret: string): string => `${id.toLowerCase()}.${mac(id, secret)}`;
export const isUnsubscribeShape = (value: unknown): value is string => typeof value === 'string' && SHAPE.test(value);

/** The lead id inside a genuine token, or null for anything malformed or signed with another key. */
export function verifyUnsubscribe(token: unknown, secret: string): string | null {
  if (!isUnsubscribeShape(token)) return null;
  const [, id, given] = SHAPE.exec(token)!;
  const expected = Buffer.from(mac(id!, secret));
  const actual = Buffer.from(given!);
  return actual.length === expected.length && timingSafeEqual(actual, expected) ? id!.toLowerCase() : null;
}
