import { readFile } from 'node:fs/promises';
import { expect, test, type APIRequestContext } from './fixtures';
import { BASE_URL } from './target';

// /api/lead, the marketing list's route, on the local build with a throwaway file store. The first-visit dialog
// that used to post here is gone (OD-18); the home page forms (M5 Phase 3) are its callers now. Each test gets its
// own fake client address, because the route limits per address.
let n = 0;
test.beforeEach(async ({ context }) => { await context.setExtraHTTPHeaders({ 'x-forwarded-for': `198.51.100.${(++n % 250) + 1}` }); });

const fresh = () => `reader-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
const leads = async () => (JSON.parse(await readFile('.data/e2e-leads.json', 'utf8')) as { leads: { email: string; consentVersion: string; consentText: string; source: string }[] }).leads;
const post = (request: APIRequestContext, data: unknown, headers: Record<string, string> = {}) =>
  request.post('/api/lead', { data, headers: { Origin: BASE_URL, ...headers } });

test('a valid address is stored once, lower-cased, with the consent text of the version named', async ({ request }) => {
  const email = fresh();
  expect((await post(request, { email: email.toUpperCase(), consentVersion: 'v1' })).status()).toBe(200);
  const saved = (await leads()).filter(l => l.email === email);
  expect(saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({ consentVersion: 'v1' });
  expect(saved[0]!.consentText).toContain('This form is not a key to the book.');
});

test('a repeat address looks the same to the sender and adds no second record', async ({ request }) => {
  const email = fresh();
  const first = await post(request, { email, consentVersion: 'v1' });
  const second = await post(request, { email, consentVersion: 'v1' });
  expect(second.status()).toBe(first.status());
  expect(await second.text()).toBe(await first.text());
  expect((await leads()).filter(l => l.email === email)).toHaveLength(1);
});

test('the hidden field marks a bot: it sees success but nothing is stored', async ({ request }) => {
  const email = fresh();
  expect((await post(request, { email, consentVersion: 'v1', _gotcha: 'http://spam.example' })).status()).toBe(200);
  expect((await leads().catch(() => [])).filter(l => l.email === email)).toHaveLength(0);
});

test('a malformed address is refused by name', async ({ request }) => {
  const res = await post(request, { email: 'not an email', consentVersion: 'v1' });
  expect(res.status()).toBe(400);
  expect(await res.json()).toMatchObject({ error: 'invalid_email' });
});

test('too many tries from one address are refused with a retry hint', async ({ request }) => {
  const headers = { 'x-forwarded-for': '198.51.100.251' };
  for (let i = 0; i < 6; i++) await post(request, { email: 'x', consentVersion: 'v1' }, headers);
  const limited = await post(request, { email: fresh(), consentVersion: 'v1' }, headers);
  expect(limited.status()).toBe(429);
  expect(limited.headers()['retry-after']).toMatch(/^\d+$/);
});

test('the route refuses another site, bad bodies and the wrong method', async ({ request }) => {
  const url = '/api/lead';
  expect((await request.post(url, { data: { email: 'a@b.co', consentVersion: 'v1' }, headers: { Origin: 'https://evil.example' } })).status()).toBe(403);
  expect((await request.post(url, { data: '{nope', headers: { 'Content-Type': 'application/json' } })).status()).toBe(400);
  expect((await request.get(url)).status()).toBe(405);
});
