import { expect, test } from '@playwright/test';

// The in-page outline. The rail needs about 1160px in the main column, which is a viewport near 1680
// with the 320px sidebar and the main padding. Narrower widths keep the same list inside the card.
test.describe('on this page', () => {
  test('on a wide window the list is a rail beside a card that stays at most 900px', async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 900 });
    await page.goto('/handbook/ch2');
    const rail = page.locator('.outline-rail');
    await expect(rail).toBeVisible();
    await expect(page.locator('.outline-stacked')).toBeHidden();
    await expect(page.getByRole('navigation', { name: 'On this page' })).toHaveCount(1);
    const width = await page.locator('#content-container').evaluate(el => el.getBoundingClientRect().width);
    expect(width).toBeLessThanOrEqual(901);
    const card = await page.locator('#content-container').boundingBox();
    const aside = await rail.boundingBox();
    expect(card && aside && aside.x >= card.x + card.width - 1).toBe(true);

    const link = rail.getByRole('link', { name: 'Open houses' });
    await link.click();
    const heading = page.getByRole('heading', { name: 'Open houses' });
    await expect(heading).toBeFocused();
    await expect(heading).toBeInViewport();
    await expect(page).toHaveURL(/\/handbook\/ch2#open-houses$/);
    // The rail stays put while the chapter moves.
    await expect(rail).toBeVisible();
    const stuck = await rail.boundingBox();
    expect(stuck && stuck.y).toBeLessThan(80);

    const first = rail.getByRole('link', { name: 'Sphere of influence and referrals' });
    await first.focus();
    await expect(first).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(rail.getByRole('link', { name: 'Online leads' })).toBeFocused();
  });

  test('a heading hash lands on the section, and full width stays one column until the rail fits', async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 900 });
    await page.goto('/handbook/ch2#open-houses');
    await expect(page.getByRole('heading', { name: 'Open houses' })).toBeInViewport();

    await page.addInitScript(() => localStorage.setItem('handbookSettings', JSON.stringify({ fullWidth: true })));
    await page.goto('/handbook/ch2');
    await expect(page.locator('html')).toHaveClass(/wide/);
    await expect(page.locator('.outline-stacked')).toBeVisible();
    await expect(page.locator('.outline-rail')).toBeHidden();
    const width = await page.locator('#content-container').evaluate(el => el.getBoundingClientRect().width);
    expect(width).toBeGreaterThan(1000);
  });

  // Sidebar 320px plus 120px of main padding. The 1400px sheet and the 200px rail need a
  // chapter slot of 1628px, which is a viewport of about 2068px.
  test('full width shows the rail once the column can hold the 1400px card', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('handbookSettings', JSON.stringify({ fullWidth: true })));
    await page.setViewportSize({ width: 2100, height: 900 });
    await page.goto('/handbook/ch2');
    await expect(page.locator('html')).toHaveClass(/wide/);
    const rail = page.locator('.outline-rail');
    await expect(rail).toBeVisible();
    await expect(page.locator('.outline-stacked')).toBeHidden();
    const width = await page.locator('#content-container').evaluate(el => el.getBoundingClientRect().width);
    expect(width).toBeGreaterThan(1300);
    expect(width).toBeLessThanOrEqual(1401);
    const card = await page.locator('#content-container').boundingBox();
    const aside = await rail.boundingBox();
    expect(card && aside && aside.x >= card.x + card.width - 1).toBe(true);
  });

  test('at 1280px the list is inside the card and the rail is gone', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/handbook/ch2');
    const stacked = page.locator('.outline-stacked');
    await expect(stacked).toBeVisible();
    await expect(page.locator('.outline-rail')).toBeHidden();
    await expect(page.locator('.menu-toggle')).toBeHidden();

    await stacked.getByRole('link', { name: 'Open houses' }).click();
    const heading = page.getByRole('heading', { name: 'Open houses' });
    await expect(heading).toBeFocused();
    await expect(heading).toBeInViewport();
    await expect(page).toHaveURL(/\/handbook\/ch2#open-houses$/);
  });

  // Sidebar is 320px and the main column has 60px of padding on each side, so the
  // chapter slot crosses 1160px at a viewport of about 1600px.
  test('the rail appears when the main column crosses 1160px', async ({ page }) => {
    await page.setViewportSize({ width: 1590, height: 900 });
    await page.goto('/handbook/ch2');
    await expect(page.locator('.outline-stacked')).toBeVisible();
    await expect(page.locator('.outline-rail')).toBeHidden();

    await page.setViewportSize({ width: 1610, height: 900 });
    await expect(page.locator('.outline-rail')).toBeVisible();
    await expect(page.locator('.outline-stacked')).toBeHidden();
  });

  test('on a phone the list is in the card and a jump clears the search row', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/handbook/ch2#open-houses');
    await expect(page.locator('.outline-stacked')).toBeVisible();
    await expect(page.locator('.outline-rail')).toBeHidden();
    await expect(page.locator('.menu-toggle')).toBeVisible();

    const heading = page.getByRole('heading', { name: 'Open houses' });
    await expect(heading).toBeInViewport();
    const search = await page.locator('.nav-search').boundingBox();
    const target = await heading.boundingBox();
    expect(search && target && target.y >= search.y + search.height - 1).toBe(true);
  });

  test('a short chapter has no outline', async ({ page }) => {
    await page.setViewportSize({ width: 1680, height: 900 });
    await page.goto('/handbook/ch6');
    await expect(page.getByRole('navigation', { name: 'On this page' })).toHaveCount(0);
  });

  test('the Chapter 4 setup is one procedure of six steps and its figure', async ({ page }) => {
    await page.goto('/handbook/ch4');
    const procedure = page.locator('.procedure');
    await expect(procedure).toBeVisible();
    await expect(procedure.locator('ol > li')).toHaveCount(6);
    await expect(procedure.locator('img[src$="fig-crm-setup.svg"]')).toBeVisible();
    await expect(procedure.getByRole('heading', { name: 'The one-time setup' })).toBeVisible();
  });
});
