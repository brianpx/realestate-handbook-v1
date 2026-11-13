import { describe, expect, it, vi } from 'vitest';
import { MemoryAccessStore } from '@/lib/access/memory-store';
import { MemoryAuthStore } from '@/lib/auth/memory-store';
import { sessionExpiry } from '@/lib/auth/session';
import { hashSecret, newSecret } from '@/lib/auth/token';
import { EMPTY_BILLING } from '@/lib/users/billing-info';
import { MemoryBillingInfoStore } from '@/lib/users/billing-info-store';
import { MemoryUserStore } from '@/lib/users/store';
import { handleSaveBillingInfo, type BillingInfoDeps } from './billing-info-handler';

const NOW = new Date('2026-11-08T12:00:00Z');
const ORIGIN = 'https://handbook.example';

async function setup() {
  const users = new MemoryUserStore();
  const auth = new MemoryAuthStore();
  const access = new MemoryAccessStore({ users, auth });
  const billingInfo = new MemoryBillingInfoStore();
  const deps: BillingInfoDeps = { stores: { users, auth, access }, allowedOrigins: [ORIGIN], now: () => NOW, billingInfo };
  const { user } = await users.upsertVerified({ email: 'reader@example.com', termsVersion: 'v1', at: NOW });
  const { user: other } = await users.upsertVerified({ email: 'other@example.com', termsVersion: 'v1', at: NOW });
  const session = newSecret();
  await auth.createSession({ idHash: hashSecret(session), userId: user.id, createdAt: NOW, expiresAt: sessionExpiry(NOW) });
  const req = (body: unknown = '', extra: { origin?: string | null; sessionId?: string } = {}) => ({
    url: `${ORIGIN}/api/account/billing-info`,
    origin: extra.origin === undefined ? ORIGIN : extra.origin,
    ip: '203.0.113.9',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    sessionId: 'sessionId' in extra ? extra.sessionId : session,
  });
  return { users, auth, billingInfo, deps, user, other, req };
}

const bad = { status: 400, body: { ok: false, error: 'invalid_billing_info' } };

describe('saving the billing information', () => {
  it('stores one card’s fields against the session user and answers the whole row back', async () => {
    const { billingInfo, deps, user, req } = await setup();
    const res = await handleSaveBillingInfo(req({ companyName: '  Example LLC ' }), deps);
    expect(res).toEqual({ status: 200, body: { ok: true, billingInfo: { ...EMPTY_BILLING, companyName: 'Example LLC' }, updatedAt: NOW.toISOString() } });
    expect((await billingInfo.find(user.id))?.companyName).toBe('Example LLC');
  });
  it('leaves the other cards’ fields as they were, and clears a field sent blank', async () => {
    const { billingInfo, deps, user, req } = await setup();
    await handleSaveBillingInfo(req({ companyName: 'Example LLC' }), deps);
    await handleSaveBillingInfo(req({ taxIdType: 'us_ein', taxIdValue: '12-3456789' }), deps);
    await handleSaveBillingInfo(req({ invoiceEmail: 'billing@example.com' }), deps);
    expect(await billingInfo.find(user.id)).toMatchObject({ companyName: 'Example LLC', taxIdType: 'us_ein', taxIdValue: '12-3456789', invoiceEmail: 'billing@example.com' });
    await handleSaveBillingInfo(req({ invoiceEmail: '  ' }), deps);
    expect(await billingInfo.find(user.id)).toMatchObject({ companyName: 'Example LLC', taxIdType: 'us_ein', invoiceEmail: null });
  });
  it('writes only the session user’s row, whatever the body says', async () => {
    const { billingInfo, deps, user, other, req } = await setup();
    await billingInfo.save(other.id, { companyName: 'Theirs' }, NOW);
    expect((await handleSaveBillingInfo(req({ companyName: 'Mine', userId: other.id }), deps)).status).toBe(400);
    expect((await handleSaveBillingInfo(req({ companyName: 'Mine' }), deps)).status).toBe(200);
    expect((await billingInfo.find(other.id))?.companyName).toBe('Theirs');
    expect((await billingInfo.find(user.id))?.companyName).toBe('Mine');
  });
  it('answers 400 with the names of the failing fields, never their values, and writes nothing', async () => {
    const { billingInfo, deps, req } = await setup();
    const address = { addressCountry: 'US', addressLine1: '1 Main St', addressLine2: '', addressCity: 'Austin', addressRegion: 'Texas', addressPostalCode: '78701' };
    const cases: [unknown, string[]][] = [
      [{}, []],
      [[], []],
      [{ companyName: 'x'.repeat(65) }, ['companyName']],
      [{ companyName: 'a‮b' }, ['companyName']],
      [{ invoiceEmail: 'not-an-address' }, ['invoiceEmail']],
      [{ unknown: 'x' }, []],
      [{ taxIdType: 'us_ein', taxIdValue: 'SECRET-123' }, ['taxIdValue']],
      [address, ['addressRegion']],
      [{ addressCity: 'Austin' }, ['addressCountry', 'addressLine1', 'addressLine2', 'addressRegion', 'addressPostalCode']],
      [{ invoiceLanguage: 'fr' }, ['invoiceLanguage']],
    ];
    for (const [body, fields] of cases) {
      const res = await handleSaveBillingInfo(req(body), deps);
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ ...bad.body, fields: fields.length ? expect.arrayContaining(fields) : expect.any(Array) });
      expect(JSON.stringify(res.body)).not.toMatch(/SECRET|Texas|Main St/);
    }
    expect(await handleSaveBillingInfo(req('not json'), deps)).toEqual({ status: 400, body: { ok: false, error: 'invalid_request' } });
    expect(billingInfo.rows).toHaveLength(0);
  });
  it('refuses a body over the size limit', async () => {
    const { billingInfo, deps, req } = await setup();
    expect((await handleSaveBillingInfo(req({ companyName: 'x'.repeat(5000) }), deps)).status).toBe(413);
    expect(billingInfo.rows).toHaveLength(0);
  });
  it('checks the origin first, then the stores, then the session', async () => {
    const { auth, deps, req } = await setup();
    const body = { companyName: 'Example LLC' };
    expect((await handleSaveBillingInfo(req(body, { origin: 'https://evil.example', sessionId: undefined }), deps)).status).toBe(403);
    expect((await handleSaveBillingInfo(req(body, { origin: null }), deps)).status).toBe(403);
    expect((await handleSaveBillingInfo(req(body, { sessionId: undefined }), { ...deps, stores: null })).status).toBe(503);
    expect((await handleSaveBillingInfo(req(body, { sessionId: undefined }), { ...deps, billingInfo: null })).status).toBe(503);
    expect((await handleSaveBillingInfo(req(body, { sessionId: undefined }), deps)).status).toBe(401);
    expect((await handleSaveBillingInfo(req(body, { sessionId: newSecret() }), deps)).status).toBe(401);
    expect(auth.sessions).toHaveLength(1);
  });
  it('answers 401 for a deleted account and writes nothing', async () => {
    const { users, billingInfo, deps, user, req } = await setup();
    users.users.find(u => u.id === user.id)!.status = 'deleted';
    expect((await handleSaveBillingInfo(req({ companyName: 'Example LLC' }), deps)).status).toBe(401);
    expect(billingInfo.rows).toHaveLength(0);
  });
  it('answers 503 and logs only the error name when the store fails', async () => {
    const { billingInfo, deps, req } = await setup();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      billingInfo.failWith = new Error('db down: SECRET-123');
      expect(await handleSaveBillingInfo(req({ companyName: 'Example LLC' }), deps)).toEqual({ status: 503, body: { ok: false, error: 'unavailable' } });
      expect(spy).toHaveBeenCalledWith('account: billing info save failed', 'Error');
    } finally {
      spy.mockRestore();
    }
  });
});
