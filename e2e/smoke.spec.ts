import { expect, test } from './fixtures';
import { PAGES } from '../lib/pages';

for (const { id, label } of PAGES) {
  test(`${id} loads with content and no console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(`/handbook/${id}`);
    await expect(page.locator('#content-container')).toBeVisible();
    await expect(page.locator(`.nav-item[data-page="${id}"]`)).toHaveAttribute('aria-current', 'page');
    await expect(page).toHaveTitle(new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    expect(errors).toEqual([]);
  });
}

test('old hash links redirect to the chapter route', async ({ page }) => {
  await page.goto('/#ch5');
  await expect(page).toHaveURL(/\/handbook\/ch5$/);
});

test('unknown route is a 404 inside the public chrome', async ({ page }) => {
  expect((await page.goto('/nope'))?.status()).toBe(404);
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('contentinfo')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open the handbook' }).first()).toHaveAttribute('href', '/handbook');
});
