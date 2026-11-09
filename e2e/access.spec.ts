import { readFile } from 'node:fs/promises';
import { AUTH_FILE, extraReader, extraSessionFor, PREVIEW_SESSION_ID, revokeGrant, signedInState } from './auth';
import { expect, test } from './fixtures';
import { BASE_URL } from './target';

// What each plan opens (M5 Phase 2): the free set for a signed-in reader with no grant, everything for a member,
// the Pro-only tools, the media route, and the account page's two actions. Revocation is proven at the data-access
// layer: a grant taken away shows the upsell card on the member's very next request, session untouched.
const VIDEO = '/api/media/downloads/The_Blueprint_for_New_Real_Estate_Agents.mp4';
const AUDIO = '/api/media/audio/objection-just-looking-role-play.mp3';
const upsell = (page: import('@playwright/test').Page) => page.locator('[data-upsell]');

test.describe('a preview reader (signed in, no grant)', () => {
  test.use({ storageState: signedInState([], PREVIEW_SESSION_ID) });

  test('reads the free chapters and meets the upsell card everywhere else', async ({ page }) => {
    await page.goto('/handbook/ch1');
    await expect(page.locator('#content-container article.chapter-body')).toBeVisible();
    await expect(upsell(page)).toHaveCount(0);

    await page.goto('/handbook/ch2');
    await expect(upsell(page)).toHaveAttribute('data-upsell', 'ch2');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('2. Finding Clients');
    await expect(page.getByText('part of the paid handbook')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Pricing and availability' })).toHaveAttribute('href', '/pricing');
    await expect(page.getByRole('link', { name: '1. Mindset & Foundations' }).first()).toBeVisible();
    await expect(page.locator('article.chapter-body')).toHaveCount(0);

    await page.goto('/handbook/start');
    await expect(upsell(page)).toHaveAttribute('data-upsell', 'start');
    await page.goto('/handbook/plan');
    await expect(upsell(page)).toHaveAttribute('data-upsell', 'coach');
  });

  test('the home page says so, and the sidebar marks what is locked', async ({ page }) => {
    await page.goto('/handbook');
    await expect(page.locator('[data-free-set]')).toContainText('You are reading the free set');
    const nav = page.locator('#sidebar');
    await expect(nav.locator('a[data-page="ch2"] .nav-lock')).toHaveText(/Members/);
    await expect(nav.locator('a[data-page="ch1"] .nav-lock')).toHaveCount(0);
    await expect(nav.locator('a[data-page="pref"] .nav-lock')).toHaveCount(0);
    await expect(nav.locator('a[data-page="start"] .nav-lock')).toHaveText(/Members/);
    await expect(nav.locator('a[data-page="plan"] .nav-lock')).toHaveText(/Pro/);
  });

  test('the search index holds only the free pages', async ({ request }) => {
    const res = await request.get('/search-index.json');
    expect(res.status()).toBe(200);
    const pages = [...new Set(((await res.json()) as { pageId: string }[]).map(e => e.pageId))];
    expect(pages.length).toBeGreaterThan(0);
    expect(pages.every(id => ['cover', 'pref', 'ch1', 'ch7'].includes(id))).toBe(true);
    expect(pages).toContain('ch1');
  });

  test('gets the overview video (a free page) but not the Chapter 6 recording', async ({ request }) => {
    const video = await request.head(VIDEO);
    expect(video.status()).toBe(200);
    expect(video.headers()['content-type']).toBe('video/mp4');
    expect(video.headers()['accept-ranges']).toBe('bytes');
    const part = await request.get(VIDEO, { headers: { Range: 'bytes=0-99' } });
    expect(part.status()).toBe(206);
    expect(part.headers()['content-range']).toMatch(/^bytes 0-99\/\d+$/);
    expect((await part.body()).length).toBe(100);
    expect((await request.get(AUDIO)).status()).toBe(403);
    expect((await request.get('/api/media/audio/nope.mp3')).status()).toBe(404);
  });

  test('the account page shows the free set and no admin', async ({ page }) => {
    await page.goto('/account');
    await expect(page.locator('[data-account-plan]')).toHaveText('Free set');
    await expect(page.locator('[data-account-email]')).toHaveText('preview@e2e.test');
    await page.goto('/admin');
    await expect(page).toHaveURL(`${BASE_URL}/handbook`);
  });
});

test.describe('signed out', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('the media route refuses without a session', async ({ request }) => {
    expect((await request.get(VIDEO)).status()).toBe(401);
    expect((await request.get(AUDIO)).status()).toBe(401);
  });
});

test.describe('members', () => {
  test('the seeded Pro member opens a member chapter with its tools, the recording, and the coach', async ({ page, request }) => {
    await page.goto('/handbook/ch2');
    await expect(page.locator('article.chapter-body')).toBeVisible();
    await expect(page.locator('[data-locked-tool]')).toHaveCount(0);
    await expect(page.locator('#sidebar .nav-lock')).toHaveCount(0);
    expect((await request.head(AUDIO)).status()).toBe(200);
    await page.goto('/account');
    await expect(page.locator('[data-account-plan]')).toHaveText('Pro plan');
  });

  test('a Basic member reads every chapter but meets a Pro note where a non-essential tool would be', async ({ browser }) => {
    const basic = await extraReader('basic');
    const context = await browser.newContext({ storageState: signedInState([], basic.sessionId) });
    const page = await context.newPage();
    await page.goto('/handbook/ch2');
    await expect(page.locator('article.chapter-body')).toBeVisible();
    await expect(page.locator('[data-locked-tool="lead-sources"]')).toContainText('built for Pro members');
    await page.goto('/handbook/ch6');
    await expect(page.locator('[data-locked-tool]')).toHaveCount(0); // script practice is essential
    await page.goto('/handbook/review');
    await expect(page.locator('[data-upsell]')).toHaveAttribute('data-upsell', 'coach');
    await expect(page.getByText('Your plan is Basic')).toBeVisible();
    await expect(page.locator('#sidebar a[data-page="plan"] .nav-lock')).toHaveText(/Pro/);
    await context.close();
  });

  test('a grant revoked while the member is signed in shows the upsell card on the very next request', async ({ browser }) => {
    const member = await extraReader('pro');
    const context = await browser.newContext({ storageState: signedInState([], member.sessionId) });
    const page = await context.newPage();
    await page.goto('/handbook/ch2');
    await expect(page.locator('article.chapter-body')).toBeVisible();
    await revokeGrant(member.grantId!);
    await page.reload();
    await expect(page.locator('[data-upsell]')).toHaveAttribute('data-upsell', 'ch2');
    // still signed in: the free set and the account page work, no cookie was touched
    await page.goto('/account');
    await expect(page.locator('[data-account-plan]')).toHaveText('Free set');
    expect((await context.cookies()).find(c => c.name === 'hb_session')?.value).toBe(member.sessionId);
    await context.close();
  });
});

test.describe('the account actions', () => {
  test('sign out everywhere ends a second browser too', async ({ browser }) => {
    const reader = await extraReader('pro');
    const second = await extraSessionFor(reader.userId);

    const one = await browser.newContext({ storageState: signedInState([], reader.sessionId) });
    const two = await browser.newContext({ storageState: signedInState([], second) });
    const pageTwo = await two.newPage();
    await pageTwo.goto('/handbook/ch2');
    await expect(pageTwo.locator('article.chapter-body')).toBeVisible();

    const pageOne = await one.newPage();
    await pageOne.goto('/account');
    await expect(pageOne.getByText('signed in on 2 browsers or devices')).toBeVisible();
    await pageOne.getByRole('button', { name: 'Sign out everywhere' }).click();
    await expect(pageOne).toHaveURL(`${BASE_URL}/signup?next=%2Faccount`);

    await pageTwo.goto('/handbook/ch2');
    await expect(pageTwo).toHaveURL(`${BASE_URL}/signup?next=%2Fhandbook%2Fch2`);
    const file = JSON.parse(await readFile(AUTH_FILE, 'utf8')) as { audit: { action: string; subjectId: string }[] };
    expect(file.audit.filter(a => a.action === 'session.revoke_all' && a.subjectId === reader.userId)).toHaveLength(1);
    await one.close();
    await two.close();
  });

  test('deleting needs the typed address, then signs out, anonymises and lands on the goodbye page', async ({ browser }) => {
    const reader = await extraReader('basic');
    const context = await browser.newContext({ storageState: signedInState([], reader.sessionId) });
    const page = await context.newPage();
    await page.goto('/account');
    await page.getByLabel('Type your email address to confirm').fill('someone-else@e2e.test');
    await page.getByRole('button', { name: 'Delete my account' }).click();
    await expect(page).toHaveURL(`${BASE_URL}/account?error=confirm`);
    await expect(page.locator('p.setup-error[role="alert"]')).toContainText('did not match');

    await page.getByLabel('Type your email address to confirm').fill(reader.email.toUpperCase());
    await page.getByRole('button', { name: 'Delete my account' }).click();
    await expect(page).toHaveURL(`${BASE_URL}/goodbye`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Your account has been deleted.');
    expect((await context.cookies()).find(c => c.name === 'hb_session')).toBeUndefined();
    await page.goto('/account');
    await expect(page).toHaveURL(`${BASE_URL}/signup?next=%2Faccount`);

    const file = JSON.parse(await readFile(AUTH_FILE, 'utf8')) as { users: { id: string; email: string; status: string }[]; sessions: { userId: string }[]; grants: { userId: string }[] };
    const user = file.users.find(u => u.id === reader.userId)!;
    expect(user).toMatchObject({ status: 'deleted', email: `deleted+${reader.userId}@invalid.local` });
    expect(file.sessions.filter(s => s.userId === reader.userId)).toHaveLength(0);
    expect(file.grants.filter(g => g.userId === reader.userId)).toHaveLength(1);
    expect(JSON.stringify(file)).not.toContain(reader.email);
    await context.close();
  });
});
