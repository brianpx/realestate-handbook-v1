import { readFile } from 'node:fs/promises';
import { extraSession, signedInState } from './auth';
import { expect, test } from './fixtures';
import { linkFor } from './mail';
import { BASE_URL } from './target';

// Sign-in with an emailed link, read back from Mailpit, and the gate in front of the handbook. Each test gets its
// own fake client address because the routes limit per connection, and its own reader address because they limit
// per address too.
let n = 0;
test.beforeEach(async ({ context }) => { await context.setExtraHTTPHeaders({ 'x-forwarded-for': `203.0.113.${(++n % 250) + 1}` }); });
const fresh = () => `reader-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.test`;
const leads = async () => (JSON.parse(await readFile('.data/e2e-leads.json', 'utf8')) as { leads: { email: string; source: string; confirmedAt: string | null }[] }).leads;

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

  test('the hero form sends the link; the notes box, ticked, sends a separate confirmation that subscribes only when opened', async ({ page, request }) => {
    const email = fresh();
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/signin');
    await expect(page.getByText('No password, no card. The link we email also signs you in next time.').first()).toBeVisible();
    const hero = page.locator('form[data-source="hero"]');
    await expect(hero).toHaveAttribute('data-ready', 'true'); // hydrated: the submit reaches React, not the server
    await hero.getByLabel('Email address').fill(email);
    await hero.getByLabel(/Also email me occasional notes/).check();
    await hero.getByRole('button', { name: 'Send me the free chapters' }).click();
    const sent = page.locator('.signup-sent[data-source="hero"]');
    await expect(sent).toContainText('Check your inbox.');
    await expect(sent).toContainText('a second email asks you to confirm it');
    await expect(sent.getByRole('button', { name: /Send again in \d+s/ })).toBeDisabled();

    // stored at once, subscribed to nothing yet
    await expect.poll(async () => (await leads()).find(l => l.email === email)).toMatchObject({ source: 'signup', confirmedAt: null });
    const signIn = await linkFor(request, email, 'Your sign-in link');
    expect(signIn.startsWith(`${BASE_URL}/auth/verify?token=`)).toBe(true);
    const confirm = await linkFor(request, email, 'Confirm your email');
    expect(confirm.startsWith(`${BASE_URL}/subscribe/confirm?token=`)).toBe(true);

    // a scanner's fetch confirms nothing; the reader's visit posts the token and lands on the success state
    const preview = await request.get(confirm);
    expect(preview.status()).toBe(200);
    expect(await preview.text()).toContain('Confirm my email');
    expect((await leads()).find(l => l.email === email)!.confirmedAt).toBeNull();
    await page.goto(confirm);
    await expect(page).toHaveURL(`${BASE_URL}/subscribe/confirm?done=1`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('You are on the list.');
    expect((await leads()).find(l => l.email === email)!.confirmedAt).not.toBeNull();

    // "Use a different email" brings the form back
    await page.goto('/');
    await page.locator('form[data-source="final"]').getByLabel('Email address').fill(email);
    await page.locator('form[data-source="final"]').getByRole('button', { name: 'Send me the free chapters' }).click();
    await page.locator('.signup-sent[data-source="final"]').getByRole('button', { name: 'Use a different email' }).click();
    await expect(page.locator('form[data-source="final"]').getByLabel('Email address')).toBeFocused();
  });

  test('/signin is the same form with return-visit copy, and the home page welcomes a signed-in reader back', async ({ page, request }) => {
    const email = fresh();
    await page.goto('/signin');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome back.');
    const form = page.locator('form[data-source="signin"]');
    await expect(form).toHaveAttribute('data-ready', 'true');
    await form.getByLabel('Email address').fill(email);
    await form.getByRole('button', { name: 'Email me a sign-in link' }).click();
    await expect(page.getByText('Check your inbox.')).toBeVisible();
    await page.goto(await linkFor(request, email));
    await expect(page).toHaveURL(`${BASE_URL}/handbook`);

    await page.goto('/');
    await expect(page.locator('[data-welcome-back]')).toContainText('Welcome back.');
    await expect(page.locator('[data-welcome-back]').getByRole('link', { name: 'Open the handbook' })).toHaveAttribute('href', '/handbook');
    await expect(page.locator('form[data-source="hero"]')).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Open handbook' })).toHaveAttribute('href', '/handbook');
    // the notes form after the sample is for everyone: signing in never implied marketing consent
    await page.goto('/preview');
    await expect(page.locator('form[data-source="sample"]')).toContainText('Tell me when purchase opens');
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
    const context = await browser.newContext({ storageState: signedInState([], await extraSession()) });
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
