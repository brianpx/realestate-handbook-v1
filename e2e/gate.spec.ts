import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

// The first-visit email gate and /api/lead. Assertions were read off setupGate in legacy/js/app-with-cover.js,
// with the Formspree call replaced by the new route. Each test gets its own fake client address, because the
// route's rate limit is per address.
test.use({ storageState: { cookies: [], origins: [] } });
let n = 0;
test.beforeEach(async ({ context }) => { await context.setExtraHTTPHeaders({ 'x-forwarded-for': `198.51.100.${(++n % 250) + 1}` }); });

const fresh = () => `reader-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
const leads = async () => (JSON.parse(await readFile('.data/e2e-leads.json', 'utf8')) as { leads: { email: string; consentVersion: string; consentText: string; source: string }[] }).leads;
const gate = (page: Page) => page.locator('#gate');

test('shows on the first visit, with the purpose, a skip button, and the page behind it inert', async ({ page }) => {
  await page.goto('/ch1');
  await expect(gate(page)).toBeVisible();
  await expect(gate(page)).toHaveAttribute('aria-modal', 'true');
  await expect(page.locator('#gateTitle')).toHaveText('Finding, Keeping, and Nurturing Clients');
  await expect(page.locator('#gatePurpose')).toHaveText('Leave your email for a follow-up note about the handbook. This form is not a key to the book.');
  await expect(page.locator('#gateEmail')).toBeFocused();
  expect(await page.locator('#main-content').evaluate(el => (el as HTMLElement).inert)).toBe(true);
  expect(await page.locator('#sidebar').evaluate(el => (el as HTMLElement).inert)).toBe(true);
  await page.getByText('How your email is used').click();
  await expect(page.locator('.gate-details')).toContainText('sent through SendGrid');
  await expect(page.locator('.gate-details')).not.toContainText('Formspree');
});

test('Continue without email dismisses it, frees the page and remembers the choice', async ({ page }) => {
  await page.goto('/ch1');
  await page.getByRole('button', { name: 'Continue without email' }).click();
  await expect(gate(page)).toHaveCount(0);
  expect(await page.locator('#main-content').evaluate(el => (el as HTMLElement).inert)).toBe(false);
  await expect(page.locator('#main-content')).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem('handbookAccess'))).toMatch(/^\d+$/);
  await page.reload();
  await expect(gate(page)).toHaveCount(0);
});

test('a valid address is stored once with the consent text, then the gate closes', async ({ page }) => {
  const email = fresh();
  await page.goto('/ch1');
  await page.locator('#gateEmail').fill(email.toUpperCase());
  await page.getByRole('button', { name: 'Send me a note' }).click();
  await expect(gate(page)).toHaveCount(0);
  const saved = (await leads()).filter(l => l.email === email);
  expect(saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({ source: 'gate', consentVersion: 'v1' });
  expect(saved[0]!.consentText).toContain('This form is not a key to the book.');
  expect(await page.evaluate(() => localStorage.getItem('handbookAccess'))).toMatch(/^\d+$/);
});

test('an empty or malformed address is refused in the form, and nothing is sent', async ({ page }) => {
  let posts = 0;
  page.on('request', r => { if (r.url().endsWith('/api/lead')) posts++; });
  await page.goto('/ch1');
  await page.getByRole('button', { name: 'Send me a note' }).click();
  await expect(page.locator('#gateError')).toHaveText('Please enter a valid email address.');
  await page.locator('#gateEmail').fill('not an email');
  await page.getByRole('button', { name: 'Send me a note' }).click();
  await expect(page.locator('#gateError')).toHaveText('Please enter a valid email address.');
  expect(posts).toBe(0);
  await expect(gate(page)).toBeVisible();
});

test('a repeat address looks the same to the reader and adds no second record', async ({ page, context }) => {
  const email = fresh();
  for (let i = 0; i < 2; i++) {
    const p = await context.newPage();
    await p.goto('/ch1');
    await p.locator('#gateEmail').fill(email);
    await p.getByRole('button', { name: 'Send me a note' }).click();
    await expect(p.locator('#gate')).toHaveCount(0);
    await p.evaluate(() => localStorage.clear());
    await p.close();
  }
  expect((await leads()).filter(l => l.email === email)).toHaveLength(1);
  void page;
});

test('the hidden field marks a bot: it sees success but nothing is stored', async ({ page }) => {
  const email = fresh();
  await page.goto('/ch1');
  await page.locator('#gateEmail').fill(email);
  await page.locator('input[name="_gotcha"]').evaluate(el => { (el as HTMLInputElement).value = 'http://spam.example'; });
  await page.getByRole('button', { name: 'Send me a note' }).click();
  await expect(gate(page)).toHaveCount(0);
  expect((await leads().catch(() => [])).filter(l => l.email === email)).toHaveLength(0);
});

test('while it sends, the button says so and cannot be pressed twice', async ({ page }) => {
  let posts = 0;
  await page.route('**/api/lead', async route => { posts++; await new Promise(r => setTimeout(r, 600)); await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
  await page.goto('/ch1');
  await page.locator('#gateEmail').fill(fresh());
  await page.getByRole('button', { name: 'Send me a note' }).click();
  await expect(page.locator('#gateSubmit')).toHaveText('Submitting…');
  await expect(page.locator('#gateSubmit')).toBeDisabled();
  await page.locator('#gateEmail').press('Enter');
  await expect(gate(page)).toHaveCount(0);
  expect(posts).toBe(1);
});

test('a server failure keeps the gate open, explains, and moves focus to Continue without email', async ({ page }) => {
  await page.route('**/api/lead', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"ok":false,"error":"unavailable"}' }));
  await page.goto('/ch1');
  await page.locator('#gateEmail').fill(fresh());
  await page.getByRole('button', { name: 'Send me a note' }).click();
  await expect(page.locator('#gateError')).toHaveText('Something went wrong. Please try again in a moment, or continue without email.');
  await expect(page.locator('#gateSkip')).toBeFocused();
  await expect(page.locator('#gateSubmit')).toBeEnabled();
  expect(await page.evaluate(() => localStorage.getItem('handbookAccess'))).toBeNull();
});

test('a network failure is handled the same way', async ({ page }) => {
  await page.route('**/api/lead', route => route.abort());
  await page.goto('/ch1');
  await page.locator('#gateEmail').fill(fresh());
  await page.getByRole('button', { name: 'Send me a note' }).click();
  await expect(page.locator('#gateError')).toContainText('Something went wrong.');
});

test('too many tries from one address get a rate-limit message, from the real route', async ({ page }) => {
  await page.goto('/ch1');
  for (let i = 0; i < 6; i++) {
    await page.locator('#gateEmail').fill(`not-valid-${i}@`);
    await page.evaluate(() => { (document.getElementById('gateEmail') as HTMLInputElement).setCustomValidity(''); });
    // bypass the browser check so the server sees the bad address and counts the attempt
    await page.evaluate(async () => { await fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"email":"x","consentVersion":"v1"}' }); });
  }
  await page.locator('#gateEmail').fill(fresh());
  await page.getByRole('button', { name: 'Send me a note' }).click();
  await expect(page.locator('#gateError')).toContainText('Too many tries');
});

test('the route refuses another site, bad bodies and the wrong method', async ({ request }) => {
  const url = '/api/lead';
  expect((await request.post(url, { data: { email: 'a@b.co', consentVersion: 'v1' }, headers: { Origin: 'https://evil.example' } })).status()).toBe(403);
  expect((await request.post(url, { data: '{nope', headers: { 'Content-Type': 'application/json' } })).status()).toBe(400);
  expect((await request.get(url)).status()).toBe(405);
});
