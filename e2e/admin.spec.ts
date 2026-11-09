import { ADMIN_EMAIL, ADMIN_SESSION_ID, extraReader, signedInState, stores } from './auth';
import { expect, test } from './fixtures';
import { BASE_URL } from './target';

// The admin area behind requireAdmin(): a reader is sent to the handbook, a stranger to sign-in, and the seeded
// administrator sees the overview and the leads table, which pick up a lead posted through the real route.
const fresh = () => `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;

test('a signed-in reader is sent to the handbook', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(`${BASE_URL}/handbook`);
});

test.describe('signed out', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('is sent to sign in, to come back to /admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(`${BASE_URL}/signup?next=%2Fadmin`);
  });
});

test.describe('as an administrator', () => {
  test.use({ storageState: signedInState([], ADMIN_SESSION_ID) });
  // the lead route limits per connection; this spec's posts get their own fake address
  test.beforeEach(async ({ context }) => { await context.setExtraHTTPHeaders({ 'x-forwarded-for': '192.0.2.77' }); });

  test('the overview opens with its navigation', async ({ page }) => {
    expect((await page.goto('/admin'))?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Leads' })).toHaveAttribute('href', '/admin/leads');
    await expect(page.getByRole('link', { name: 'Back to the handbook' })).toHaveAttribute('href', '/handbook');
    await expect(page.getByText('admin@e2e.test')).toBeVisible();
    // the seeded readers never requested a link, so the placement table may be empty; the card itself is there
    await expect(page.getByText('Sign-in placements')).toBeVisible();
  });

  test('a lead posted through the route shows up in the table and the count', async ({ page, request }) => {
    const email = fresh();
    const posted = await request.post('/api/lead', { data: { email, consentVersion: 'v2', source: 'sample' }, headers: { Origin: BASE_URL, 'x-forwarded-for': '192.0.2.78' } });
    expect(posted.status()).toBe(200);

    await page.goto('/admin/leads');
    await expect(page.getByRole('heading', { level: 1, name: 'Leads' })).toBeVisible();
    await expect(page.getByRole('cell', { name: email })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export CSV' })).toBeEnabled();
    // the admin shell has no hydration mark, so a fill that lands before React mounts is retried (see e2e/fixtures.ts)
    await expect(async () => {
      await page.getByRole('textbox', { name: 'Search leads' }).fill(email);
      await expect(page.getByRole('row')).toHaveCount(2, { timeout: 1000 }); // the header and the one match
    }).toPass();

    await page.goto('/admin');
    const total = page.getByRole('group', { name: 'Total leads' });
    await expect(total).toBeVisible();
    const shown = await total.getByText(/^[\d,]+$/).textContent();
    expect(Number(shown?.replace(/,/g, ''))).toBeGreaterThanOrEqual(1);
    await expect(page.getByRole('cell', { name: email })).toBeVisible();
  });

  test('the user list opens a reader, a suspension made in the form is logged once, and the API refuses a self-change', async ({ page, request }) => {
    const reader = await extraReader('basic');
    const admin = await stores().users.findByEmail(ADMIN_EMAIL);
    if (!admin) throw new Error('the seeded administrator is missing; did global setup run?');

    await page.goto('/admin/users');
    await expect(page.getByRole('heading', { level: 1, name: 'Users' })).toBeVisible();
    await page.getByRole('link', { name: reader.email }).click(); // newest first, so on the first page
    await expect(page).toHaveURL(`${BASE_URL}/admin/users/${reader.userId}`);
    await expect(page.getByRole('heading', { level: 1, name: reader.email })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'live' })).toBeVisible();

    // the admin shell has no hydration mark, so a submit that lands before React mounts is retried (see e2e/fixtures.ts);
    // a submit that went through refreshes the page, and the suspend form gives way to the lift form
    const suspend = page.getByRole('form', { name: 'Suspend the membership' });
    const lift = page.getByRole('form', { name: 'Lift the suspension' });
    await expect(async () => {
      await suspend.getByLabel('Reason').fill('e2e hold');
      await suspend.getByRole('button', { name: 'Suspend' }).click();
      await expect(lift).toBeVisible({ timeout: 2000 });
    }).toPass();
    await expect(lift.getByRole('status')).toHaveCount(0); // the lift form starts with no note of its own
    await expect(page.getByText('suspended', { exact: true })).toBeVisible();

    // the same action through the route: already suspended, so nothing changes and nothing more is logged
    const again = await request.post(`/api/admin/users/${reader.userId}/suspend`, { data: { reason: 'again' }, headers: { Origin: BASE_URL } });
    expect(again.status()).toBe(200);
    expect(await again.json()).toEqual({ ok: true, changed: false });
    const self = await request.post(`/api/admin/users/${admin.id}/set-role`, { data: { role: 'reader' }, headers: { Origin: BASE_URL } });
    expect(self.status()).toBe(400);
    expect(await self.json()).toMatchObject({ ok: false, error: 'self_change' });
    expect((await request.post(`/api/admin/users/${reader.userId}/suspend`, { data: { reason: 'x' }, headers: { Origin: 'https://evil.example' } })).status()).toBe(403);

    // the user page's history is unpaged, so the one suspend row is counted there rather than in a page of the global log
    await page.reload();
    await expect(page.getByRole('row').filter({ hasText: 'membership.suspend' })).toHaveCount(1);

    await page.goto(`/admin/users/${admin.id}`);
    await expect(page.getByRole('form', { name: 'Role' }).getByRole('combobox', { name: 'Role' })).toBeDisabled();

    await page.goto('/admin/audit');
    await expect(page.getByRole('heading', { level: 1, name: 'Audit log' })).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: 'membership.suspend' }).first()).toBeVisible();
  });

  test('a user page with a long address does not scroll sideways at 360px', async ({ page }) => {
    const reader = await extraReader();
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(`/admin/users/${reader.userId}`);
    await expect(page.getByRole('heading', { level: 1, name: reader.email })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
  });

  // the tables scroll inside their cards; the page itself must not, or the sidebar trigger drifts off-screen
  for (const path of ['/admin', '/admin/leads', '/admin/users', '/admin/audit']) {
    test(`${path} does not scroll sideways at 360px`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
    });
  }
});
