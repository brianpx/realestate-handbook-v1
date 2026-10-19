import { expect, test } from '@playwright/test';
import { PAGES } from '../lib/pages';

for (const { id, label } of PAGES) {
  test(`${id} loads with content and no console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(id === 'cover' ? '/' : `/${id}`);
    await expect(page.locator('#content-container')).toBeVisible();
    await expect(page.locator(`.nav-item[data-page="${id}"]`)).toHaveAttribute('aria-current', 'page');
    await expect(page).toHaveTitle(new RegExp(id === 'cover' ? 'Interactive Book' : label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    expect(errors).toEqual([]);
  });
}

test('old hash links redirect to the chapter route', async ({ page }) => {
  await page.goto('/#ch5');
  await expect(page).toHaveURL(/\/ch5$/);
});

test('unknown route is a 404', async ({ page }) => {
  expect((await page.goto('/nope'))?.status()).toBe(404);
});
