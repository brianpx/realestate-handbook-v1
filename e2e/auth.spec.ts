import { extraSession, signedInState } from './auth';
import { expect, test, type APIRequestContext } from './fixtures';
import { BASE_URL } from './target';

// Sign-in with an emailed link, read back from Mailpit, and the gate in front of the handbook. Each test gets its
// own fake client address because the routes limit per connection, and its own reader address because they limit
// per address too.
const MAILPIT = 'http://localhost:8025';
let n = 0;
test.beforeEach(async ({ context }) => { await context.setExtraHTTPHeaders({ 'x-forwarded-for': `203.0.113.${(++n % 250) + 1}` }); });
const fresh = () => `reader-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.test`;

async function linkFor(request: APIRequestContext, email: string): Promise<string> {
  let link = '';
  await expect.poll(async () => {
    const search = (await (await request.get(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`)).json()) as { messages: { ID: string }[] };
    const id = search.messages[0]?.ID;
    if (!id) return null;
    const message = (await (await request.get(`${MAILPIT}/api/v1/message/${id}`)).json()) as { Text: string };
    link = /https?:\/\/\S+/.exec(message.Text)?.[0] ?? '';
    return link || null;
  }, { timeout: 10_000 }).not.toBeNull();
  return link;
}

test.describe('signed out', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('the handbook, the account page and the search index send you to sign in; the sample stays open', async ({ page, request }) => {
    await page.goto('/handbook/ch1');
    await expect(page).toHaveURL(`${BASE_URL}/signup?next=%2Fhandbook%2Fch1`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Open the handbook with a link we email you.');
    for (const path of ['/handbook', '/account', '/search-index.json']) {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status(), path).toBe(307);
      expect(new URL(res.headers().location!, BASE_URL).pathname).toBe('/signup');
    }
    expect((await request.get('/preview')).status()).toBe(200);
  });

  test('a link signs you in: looking at it consumes nothing, opening it lands on the page you wanted, and it works once', async ({ page, request, context }) => {
    const email = fresh();
    await page.goto('/signup?next=/handbook/ch2');
    await page.getByLabel('Email address').fill(email.toUpperCase());
    await page.getByRole('button', { name: 'Email me a sign-in link' }).click();
    await expect(page.getByText('Check your inbox.')).toBeVisible();

    const link = await linkFor(request, email);
    expect(link.startsWith(`${BASE_URL}/auth/verify?token=`)).toBe(true);

    // a mail scanner's fetch: the page offers the button and the link is still good afterwards
    const preview = await request.get(link);
    expect(preview.status()).toBe(200);
    expect(await preview.text()).toContain('Sign me in');

    await page.goto(link);
    await expect(page).toHaveURL(`${BASE_URL}/handbook/ch2`);
    await expect(page.locator('#content-container')).toBeVisible();
    const cookie = (await context.cookies()).find(c => c.name === 'hb_session');
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'Lax', path: '/' });
    expect(cookie!.value).toMatch(/^[A-Za-z0-9_-]{43}$/);

    // the same link again, from a fresh visitor, is spent
    const again = await context.browser()!.newPage();
    await again.goto(link);
    await expect(again.getByRole('heading', { level: 1 })).toContainText('That link has expired or was already used.');
    await expect(again.getByLabel('Email address')).toBeVisible();
    await again.close();
  });

  test('a malformed or unknown token shows the same card, and the routes refuse other sites', async ({ page, request }) => {
    await page.goto('/auth/verify?token=not-a-token');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('That link has expired or was already used.');
    await page.goto(`/auth/verify?token=${'x'.repeat(43)}`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('That link has expired or was already used.');
    const body = { email: 'a@b.co', termsVersion: 'v1', source: 'hero' };
    expect((await request.post('/api/auth/request-link', { data: body })).status()).toBe(403); // no Origin
    expect((await request.post('/api/auth/request-link', { data: body, headers: { Origin: 'https://evil.example' } })).status()).toBe(403);
    expect((await request.post('/api/auth/verify', { form: { token: 'x'.repeat(43) }, headers: { Origin: 'https://evil.example' } })).status()).toBe(403);
    expect((await request.get('/api/auth/request-link')).status()).toBe(405);
  });
});

test.describe('signed in', () => {
  test('a reader opens a chapter, and signing out closes the handbook again', async ({ browser }) => {
    // its own session, so revoking it leaves the shared one every other test uses untouched
    const context = await browser.newContext({ storageState: signedInState([{ name: 'handbookAccess', value: '1' }], await extraSession()) });
    const page = await context.newPage();
    await page.goto('/handbook/ch1');
    await expect(page.locator('#content-container')).toBeVisible();
    const res = await page.request.post('/api/auth/sign-out', { headers: { Origin: BASE_URL }, maxRedirects: 0 });
    expect(res.status()).toBe(303);
    expect(res.headers()['set-cookie']).toContain('hb_session=;');
    await page.goto('/handbook/ch1');
    await expect(page).toHaveURL(`${BASE_URL}/signup?next=%2Fhandbook%2Fch1`);
    await context.close();
  });
});
