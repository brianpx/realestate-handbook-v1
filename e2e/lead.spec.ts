import { readFile } from 'node:fs/promises';
import { expect, test, type APIRequestContext } from './fixtures';
import { linkFor } from './mail';
import { BASE_URL } from './target';

// /api/lead, the marketing list's route, on the local build with a throwaway file store. The first-visit dialog
// that used to post here is gone (OD-18); the home page forms (M5 Phase 3) are its callers now. Every request names
// its own fake client address, because the route limits per address and the request fixture sends no header of its own.
let n = 0;
const ip = () => `198.51.100.${(++n % 250) + 1}`;
const fresh = () => `reader-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
const leads = async () => (JSON.parse(await readFile('.data/e2e-leads.json', 'utf8')) as { leads: { email: string; consentVersion: string; consentText: string; source: string; confirmedAt: string | null }[] }).leads;
const post = (request: APIRequestContext, data: unknown, headers: Record<string, string> = {}) =>
  request.post('/api/lead', { data, headers: { Origin: BASE_URL, 'x-forwarded-for': ip(), ...headers } });

test('a valid address is stored once, lower-cased, with the consent text of the version named', async ({ request }) => {
  const email = fresh();
  expect((await post(request, { email: email.toUpperCase(), consentVersion: 'v2', source: 'sample' })).status()).toBe(200);
  const saved = (await leads()).filter(l => l.email === email);
  expect(saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({ consentVersion: 'v2', source: 'sample' });
  expect(saved[0]!.consentText).toContain('Signing in does not add you to this list.');
});

test('a repeat address looks the same to the sender and adds no second record', async ({ request }) => {
  const email = fresh();
  const first = await post(request, { email, consentVersion: 'v2', source: 'sample' });
  const second = await post(request, { email, consentVersion: 'v2', source: 'sample' });
  expect(second.status()).toBe(first.status());
  expect(await second.text()).toBe(await first.text());
  expect((await leads()).filter(l => l.email === email)).toHaveLength(1);
});

test('the hidden field marks a bot: it sees success but nothing is stored', async ({ request }) => {
  const email = fresh();
  expect((await post(request, { email, consentVersion: 'v2', source: 'sample', _gotcha: 'http://spam.example' })).status()).toBe(200);
  expect((await leads().catch(() => [])).filter(l => l.email === email)).toHaveLength(0);
});

test('a malformed address is refused by name', async ({ request }) => {
  const res = await post(request, { email: 'not an email', consentVersion: 'v2', source: 'sample' });
  expect(res.status()).toBe(400);
  expect(await res.json()).toMatchObject({ error: 'invalid_email' });
});

test('too many tries from one address are refused with a retry hint', async ({ request }) => {
  const same = { 'x-forwarded-for': '198.51.100.251' };
  for (let i = 0; i < 6; i++) await post(request, { email: 'x', consentVersion: 'v2', source: 'sample' }, same);
  const limited = await post(request, { email: fresh(), consentVersion: 'v2', source: 'sample' }, same);
  expect(limited.status()).toBe(429);
  expect(limited.headers()['retry-after']).toMatch(/^\d+$/);
});

test('the route refuses another site, bad bodies and the wrong method', async ({ request }) => {
  expect((await post(request, { email: 'a@b.co', consentVersion: 'v2', source: 'sample' }, { Origin: 'https://evil.example' })).status()).toBe(403);
  expect((await post(request, '{nope', { 'Content-Type': 'application/json' })).status()).toBe(400);
  expect((await request.get('/api/lead')).status()).toBe(405);
});

test('a new address gets a confirmation link; looking at it confirms nothing, posting it confirms once, a bad token does not', async ({ request }) => {
  const email = fresh();
  expect((await post(request, { email, consentVersion: 'v2', source: 'upsell' })).status()).toBe(200);
  const link = await linkFor(request, email, 'Confirm your email');
  expect(link.startsWith(`${BASE_URL}/subscribe/confirm?token=`)).toBe(true);
  expect((await request.get(link)).status()).toBe(200);
  expect((await leads()).find(l => l.email === email)!.confirmedAt).toBeNull();

  const token = new URL(link).searchParams.get('token')!;
  const confirm = (data: Record<string, string>, headers: Record<string, string> = { Origin: BASE_URL }) =>
    request.post('/api/lead/confirm', { form: data, headers: { 'x-forwarded-for': ip(), ...headers }, maxRedirects: 0 });
  const done = await confirm({ token });
  expect(done.status()).toBe(303);
  expect(done.headers().location).toBe('/subscribe/confirm?done=1');
  const confirmedAt = (await leads()).find(l => l.email === email)!.confirmedAt;
  expect(confirmedAt).not.toBeNull();
  expect((await confirm({ token })).headers().location).toBe('/subscribe/confirm?done=1'); // a second click: same page, same time
  expect((await leads()).find(l => l.email === email)!.confirmedAt).toBe(confirmedAt);
  expect((await confirm({ token: 'x'.repeat(43) })).headers().location).toBe('/subscribe/confirm?error=1');
  const refused = await confirm({ token }, {});
  expect(refused.status()).toBe(303);
  expect(refused.headers().location).toBe('/subscribe/confirm?error=1');
});
