import sharp from 'sharp';
import { extraReader, extraSessionFor, PREVIEW_SESSION_ID, revokeGrant, signedInState, stores } from './auth';
import { expect, test } from './fixtures';
import { BASE_URL, IS_REMOTE } from './target';

// What each plan opens (M5 Phase 2): the free set for a signed-in reader with no grant, everything for a member,
// the Pro-only tools, the media route, and the account page's two actions. Revocation is proven at the data-access
// layer: a grant taken away shows the upsell card on the member's very next request, session untouched.
const VIDEO = '/api/media/downloads/The_Blueprint_for_New_Real_Estate_Agents.mp4';
const AUDIO = '/api/media/audio/objection-just-looking-role-play.mp3';
const PDF = '/api/media/downloads/Finding-Nurturing-and-Keeping-Clients.pdf';
const upsell = (page: import('@playwright/test').Page) => page.locator('[data-upsell]');
const pdfLink = (page: import('@playwright/test').Page) => page.getByRole('link', { name: 'Download the book as a PDF' });

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
    await expect(upsell(page).locator('form[data-source="upsell"]')).toContainText('Tell me when purchase opens'); // the closed-state action (OD-02)
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
    await expect(page.getByRole('navigation', { name: 'breadcrumb' })).toHaveCount(0);
    const hero = page.locator('[data-home-hero]');
    await expect(hero.getByRole('link', { name: 'Read Chapter 1' })).toHaveAttribute('href', '/handbook/ch1');
    await expect(hero.getByRole('link', { name: 'Read Chapter 7' })).toHaveAttribute('href', '/handbook/ch7');
    await expect(page.locator('[data-free-set]').getByRole('link', { name: 'Pricing and availability' })).toHaveAttribute('href', '/pricing');

    const main = page.locator('.hb-home');
    await expect(main.locator('a[href="/handbook/start"]')).toHaveCount(0);
    await expect(main.locator('svg.lucide-lock')).toHaveCount(0);
    const chapters = main.locator('.hb-home-groups');
    for (const id of ['cover', 'pref', 'ch1', 'ch7']) {
      await expect(chapters.locator(`a[href="/handbook/${id}"]`).locator('.hb-home-pill')).toHaveText('Free');
    }
    const locked = chapters.locator('a[href="/handbook/ch2"]');
    await expect(locked.locator('.hb-home-pill')).toHaveCount(0);
    await expect(locked.locator('.visually-hidden')).toHaveText(/members only/);
    const tools = main.locator('.hb-home-tools');
    await expect(tools.locator('a[data-goto="ch1"]')).toHaveAttribute('data-widget', 'goal-calculator');
    await expect(tools.locator('a[data-goto="ch2"]')).not.toHaveAttribute('data-widget', /.+/);
    const nav = page.locator('#sidebar');
    await expect(nav.locator('a[data-page="ch2"] .nav-lock')).toHaveText(/Members/);
    await expect(nav.locator('a[data-page="ch1"] .nav-lock')).toHaveCount(0);
    await expect(nav.locator('a[data-page="pref"] .nav-lock')).toHaveCount(0);
    await expect(nav.locator('a[data-page="start"] .nav-lock')).toHaveText(/Members/);
    await expect(nav.locator('a[data-page="plan"] .nav-lock')).toHaveText(/Pro/);
    await page.goto('/handbook/ch3');
    await expect(page.locator('[data-slot="breadcrumb-list"]')).toHaveCSS('list-style-type', 'none');
    await expect(page.getByRole('navigation', { name: 'breadcrumb' })).toHaveText(/Handbook\s*\/\s*3\. Marketing & Brand Presence/);
    await expect(page.getByRole('navigation', { name: 'breadcrumb' }).getByRole('link', { name: 'Handbook' })).toHaveAttribute('href', '/handbook');
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

  test('does not get the Pro-only book PDF, and the overview page does not offer it', async ({ page, request }) => {
    await page.goto('/handbook/pref');
    await expect(page.locator('article.chapter-body')).toBeVisible();
    await expect(pdfLink(page)).toHaveCount(0);
    await expect(page.getByText('Prefer paper?')).toHaveCount(0);
    expect((await request.get(PDF)).status()).toBe(403);
  });

  test('the account page shows the free set and no admin', async ({ page }) => {
    await page.goto('/account');
    await expect(page.locator('[data-account-plan]')).toHaveText('Free set');
    await expect(page.locator('[data-account-email]')).toHaveText('preview@e2e.test');
    await page.goto('/admin');
    await expect(page).toHaveURL(`${BASE_URL}/handbook`);
  });

  test('the authentication page lists the sign-in methods, with only the email one working', async ({ page }) => {
    await page.goto('/account/authentication');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Authentication');
    await expect(page.getByRole('region', { name: 'Sign-in Methods' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Two-Factor Authentication' })).toBeVisible();
    await expect(page.locator('[data-auth-email]')).toHaveText('preview@e2e.test');
    await expect(page.getByRole('link', { name: 'Manage' })).toHaveAttribute('href', '/account#email');
    for (const method of ['passkeys', 'google', 'github']) {
      const row = page.locator(`[data-auth-method="${method}"]`);
      await expect(row).toContainText('Coming soon');
      await expect(row.locator('a, button')).toHaveCount(0);
    }
    await expect(page.getByRole('button', { name: 'Set Up Authenticator App' })).toBeDisabled();
    await expect(page.locator('#sidebar [data-page="account/authentication"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('#sidebar [data-page="account"]')).toHaveText('Settings');
  });

  test('the billing page says nothing is charged yet, keeps a saved company name across a reload, and refuses a bad invoice email', async ({ page }) => {
    await page.goto('/account/billing');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Billing Information');
    await expect(page.locator('[data-billing-notice]')).toContainText('no payment method and there are no invoices');
    await expect(page.locator('#sidebar [data-page="account/billing"]')).toHaveAttribute('aria-current', 'page');
    const company = page.getByRole('textbox', { name: 'Company name' });
    const save = page.getByRole('region', { name: 'Company Name' }).getByRole('button', { name: 'Save' });
    const name = `Example Realty ${Date.now()}`;
    await expect(save).toBeDisabled();
    await company.fill(name);
    await save.click();
    await expect(page.getByRole('region', { name: 'Company Name' }).getByRole('status')).toHaveText('Saved.');
    await page.reload();
    await expect(page.getByRole('textbox', { name: 'Company name' })).toHaveValue(name);

    const email = page.getByRole('textbox', { name: 'Invoice email recipient' });
    await email.fill('not-an-address');
    await page.getByRole('region', { name: 'Invoice Email Recipient' }).getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('region', { name: 'Invoice Email Recipient' }).getByRole('alert')).toHaveText('Enter a valid email address, or leave the box blank.');
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await page.reload();
    await expect(page.getByRole('textbox', { name: 'Invoice email recipient' })).toHaveValue('');
  });

  test('the account page offers the profile section; the file store has no profile table, and says so', async ({ page }) => {
    await page.goto('/account');
    await expect(page.getByRole('heading', { level: 2, name: 'Realtor profile' })).toBeVisible();
    await expect(page.getByText('Profile editing needs the account database')).toBeVisible();
  });
});

test.describe('signed out', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('the media route refuses without a session', async ({ request }) => {
    expect((await request.get(VIDEO)).status()).toBe(401);
    expect((await request.get(AUDIO)).status()).toBe(401);
    expect((await request.get(PDF)).status()).toBe(401);
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

  test('the seeded Pro member sees the book PDF link on the overview and downloads the file', async ({ page, request }) => {
    await page.goto('/handbook/pref');
    const link = pdfLink(page);
    await expect(link).toHaveAttribute('href', PDF);
    const [download] = await Promise.all([page.waitForEvent('download'), link.click()]);
    expect(download.suggestedFilename()).toBe('Finding-Nurturing-and-Keeping-Clients.pdf');
    const res = await request.get(PDF);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toBe('application/pdf');
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
    await page.goto('/handbook/pref');
    await expect(page.locator('article.chapter-body')).toBeVisible();
    await expect(pdfLink(page)).toHaveCount(0);
    expect((await context.request.get(PDF)).status()).toBe(403);
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

const redSquare = () => sharp({ create: { width: 40, height: 30, channels: 3, background: '#c33' } }).png().toBuffer();

// The store behind the picture is a throwaway directory next to the auth file (lib/users/avatar-storage.ts); a
// deployment has a real Blob store or none, so this runs against the local build only.
test.describe('the avatar card', () => {
  test.skip(IS_REMOTE, 'needs the local file-backed avatar storage');

  test('uploads, shows in the header and on reload, refuses what is not a picture, and removes it', async ({ browser }) => {
    const reader = await extraReader('basic');
    const other = await extraReader('basic');
    const context = await browser.newContext({ storageState: signedInState([], reader.sessionId) });
    const otherContext = await browser.newContext({ storageState: signedInState([], other.sessionId) });
    const page = await context.newPage();
    await page.goto('/account');
    const card = page.locator('#avatar');
    await expect(card.getByText('An avatar is optional. PNG, JPEG or WebP, up to 2 MB.')).toBeVisible();
    await expect(card.getByRole('button', { name: 'Remove' })).toHaveCount(0);
    const fileInput = card.locator('input[type="file"]');

    // a text file that claims to be a PNG passes the browser's quick check and is refused by the server, from its bytes
    await expect(card.getByRole('button', { name: 'Upload an avatar' })).toBeEnabled();
    await fileInput.setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: Buffer.from('not a picture at all') });
    await expect(card.getByRole('alert')).toHaveText('Choose a PNG, JPEG or WebP image.');

    await fileInput.setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: (await redSquare()).subarray(0, 40) });
    await expect(card.getByRole('alert')).toHaveText('That image could not be read. Try a different one.');

    await fileInput.setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: await redSquare() });
    await expect(card.getByRole('status')).toHaveText('Avatar updated.');
    const shown = card.locator('img');
    await expect(shown).toHaveAttribute('src', /^\/api\/account\/avatar\?v=\d+$/);
    const src = (await shown.getAttribute('src'))!;
    // the header's menu picks the new picture up without a reload
    await expect(page.getByRole('button', { name: /^Account menu for/ }).locator('img')).toHaveAttribute('src', src);

    const own = await context.request.get(src);
    expect(own.status()).toBe(200);
    expect(own.headers()['content-type']).toBe('image/webp');
    expect(own.headers()['cache-control']).toBe('private, no-store');
    expect(own.headers()['x-content-type-options']).toBe('nosniff');
    expect((await otherContext.request.get(src)).status()).toBe(404);

    await page.reload();
    await expect(page.locator('#avatar img')).toHaveAttribute('src', src);

    await page.locator('#avatar').getByRole('button', { name: 'Remove' }).click();
    await expect(page.locator('#avatar').getByRole('status')).toHaveText('Avatar removed.');
    await expect(page.locator('#avatar img')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Account menu for/ }).locator('img')).toHaveCount(0);
    expect((await context.request.get(src)).status()).toBe(404);

    await context.close();
    await otherContext.close();
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
    const logged = await stores().access.listAudit('sessions', reader.userId);
    expect(logged.filter(a => a.action === 'session.revoke_all')).toHaveLength(1);
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
    // the jar is read once nothing is in flight: a sidebar prefetch that left /account before the delete answered
    // must not be able to put a cookie back (the proxy no longer slides on prefetches); /goodbye is public, so
    // there is no hydration mark to wait for instead
    await page.waitForLoadState('networkidle');
    expect((await context.cookies()).find(c => c.name === 'hb_session')).toBeUndefined();
    expect((await context.cookies()).find(c => c.name === 'hb_signed_in')).toBeUndefined();
    await page.goto('/account');
    await expect(page).toHaveURL(`${BASE_URL}/signup?next=%2Faccount`);

    const s = stores();
    expect(await s.users.findById(reader.userId)).toMatchObject({ status: 'deleted', role: 'reader', email: `deleted+${reader.userId}@invalid.local` });
    expect(await s.auth.listSessions(reader.userId)).toHaveLength(0);
    expect(await s.access.listGrants(reader.userId)).toHaveLength(1);
    expect(await s.access.findMembership(reader.userId)).toBeNull();
    expect(JSON.stringify(await s.access.listAudit('users', reader.userId))).not.toContain(reader.email);
    await context.close();
  });
});
