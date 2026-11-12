import { expect, test } from './fixtures';

for (const route of ['/', '/preview', '/handbook/ch1', '/account']) {
  test(`200% text reflows at 320px: ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(route);
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}

test('ordinary prose retains markers while custom navigation lists do not', async ({ page }) => {
  await page.goto('/handbook/ch1');
  await expect(page.locator('.chapter-body ul:not([class])').first()).toHaveCSS('list-style-type', 'disc');
  await expect(page.locator('.chapter-body .key-takeaways ol').first()).toHaveCSS('list-style-type', 'decimal');
  await expect(page.locator('.chapter-outline ul').first()).toHaveCSS('list-style-type', 'none');
});

test('long glossary definitions remain scrollable inside a short viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 320 });
  await page.goto('/handbook/ch1');
  const term = page.locator('.term').first();
  await term.evaluate(el => { (el as HTMLElement).dataset.definition = 'A longer glossary definition. '.repeat(100); });
  await term.focus();
  await page.keyboard.press('Enter');
  const popover = page.locator('#termPop');
  await expect(popover).toBeVisible();
  const geometry = await popover.evaluate(el => {
    const rect = el.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, viewport: innerHeight, scrollable: el.scrollHeight > el.clientHeight };
  });
  expect(geometry.top).toBeGreaterThanOrEqual(8);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewport - 8);
  expect(geometry.scrollable).toBe(true);
  await expect(term).toBeFocused();
  await page.keyboard.press('End');
  await expect.poll(() => popover.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await expect(popover).toBeHidden();
  await expect(term).toBeFocused();
});

test.describe('touch controls', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  test('shared buttons meet the mobile target policy', async ({ page }) => {
    await page.goto('/account');
    const button = page.locator('main [data-slot="button"]').first();
    await expect(button).toBeVisible();
    const bounds = await button.boundingBox();
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
    expect(bounds?.width).toBeGreaterThanOrEqual(44);
  });
});

test('short landscape menu and its close control stay within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 320 });
  await page.goto('/handbook/ch1');
  await page.locator('#menuToggle').click();
  await expect(page.locator('#navList')).toBeVisible();
  await expect.poll(() => page.locator('#navList').evaluate(el => el.getBoundingClientRect().bottom)).toBeLessThanOrEqual(320);
  const close = page.locator('.menu-close button');
  await expect(close).toBeVisible();
  expect((await close.boundingBox())!.y + (await close.boundingBox())!.height).toBeLessThanOrEqual(320);
  await close.click();
  await expect(page.locator('#navList')).toBeHidden();
});
