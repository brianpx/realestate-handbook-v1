import { afterEach, expect, it, vi } from 'vitest';
import { MemoryAuthStore } from './memory-store';
import { tokenExpiry } from './session';
import { hashSecret, newSecret } from './token';
import { checkLink } from './verify-link';

const NOW = new Date('2026-11-08T12:00:00Z');

afterEach(() => vi.restoreAllMocks());

async function storeWith(raw: string, issuedAt = NOW) {
  const store = new MemoryAuthStore();
  await store.createToken({ tokenHash: hashSecret(raw), email: 'a@example.com', nextPath: null, termsVersion: 'v1', source: null, expiresAt: tokenExpiry(issuedAt), createdIpHash: null, createdAt: issuedAt });
  return store;
}

it('calls a live token usable and leaves it unconsumed', async () => {
  const raw = newSecret();
  const store = await storeWith(raw);
  expect(await checkLink(store, raw, NOW)).toBe('usable');
  expect(store.tokens[0]?.consumedAt).toBeNull();
});

it('calls a missing, malformed or expired token unusable', async () => {
  const raw = newSecret();
  const store = await storeWith(raw, new Date(NOW.getTime() - 3600 * 1000));
  expect(await checkLink(store, raw, NOW)).toBe('unusable');
  expect(await checkLink(store, newSecret(), NOW)).toBe('unusable');
  expect(await checkLink(store, 'not-a-token', NOW)).toBe('unusable');
  expect(await checkLink(store, undefined, NOW)).toBe('unusable');
});

it('reports a store failure as unavailable instead of throwing, logging only the error name', async () => {
  const raw = newSecret();
  const store = await storeWith(raw);
  store.failWith = Object.assign(new Error('password authentication failed for user x'), { name: 'NeonDbError' });
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  expect(await checkLink(store, raw, NOW)).toBe('unavailable');
  expect(log).toHaveBeenCalledWith('auth: verify page lookup failed', 'NeonDbError');
});
