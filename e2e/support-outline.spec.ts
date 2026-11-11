import { expect, test } from './fixtures';

test.describe('support page outline', () => {
  test('wide: a sticky rail beside the text; clicking a link scrolls, sets the hash and highlights it', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/support');
    const rail = page.locator('nav.pub-outline-rail');
    await expect(rail).toBeVisible();
    await expect(page.locator('nav.pub-outline-stacked')).toBeHidden();
    expect(await rail.evaluate(el => getComputedStyle(el).position)).toBe('sticky');
    await expect(rail.getByRole('link', { name: 'Finding your way' })).toHaveAttribute('aria-current', 'location');

    await rail.getByRole('link', { name: 'Backup and restore' }).click();
    await expect(page).toHaveURL(/#backup$/);
    await expect(rail.getByRole('link', { name: 'Backup and restore' })).toHaveAttribute('aria-current', 'location');
    await expect(rail.locator('[aria-current="location"]')).toHaveCount(1);
    // The heading lands just below the sticky header, not under it and not far down the page.
    await expect.poll(async () => {
      const [headingTop, headerBottom] = await page.evaluate(() => [
        document.getElementById('backup')!.getBoundingClientRect().top,
        document.querySelector('.pub-header')!.getBoundingClientRect().bottom,
      ]);
      return headingTop >= headerBottom - 1 && headingTop - headerBottom < 80;
    }).toBe(true);
    // The rail stays in view after the page has scrolled.
    await expect(rail).toBeInViewport();
  });

  test('wide: scrolling to the end highlights the last section', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/support');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(page.locator('nav.pub-outline-rail [aria-current="location"]')).toHaveText(/Access and recovery|Contact/);
  });

  test('phone: the list stacks above the text, the rail is hidden and nothing scrolls sideways', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/support');
    await expect(page.locator('nav.pub-outline-stacked')).toBeVisible();
    await expect(page.locator('nav.pub-outline-rail')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
    await page.locator('nav.pub-outline-stacked').getByRole('link', { name: 'Contact' }).click();
    await expect(page).toHaveURL(/#contact$/);
    await expect(page.locator('nav.pub-outline-stacked').getByRole('link', { name: 'Contact' })).toHaveAttribute('aria-current', 'location');
  });
});
