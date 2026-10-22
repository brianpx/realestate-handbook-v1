import { expect, test } from '@playwright/test';

// Heading levels changed. These checks keep the chapter looking like it did, and the landmarks real.
test('a chapter has one h1, real landmarks, and the previous heading sizes', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/handbook/ch1');

  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText('1. Mindset and business foundations');
  await expect(page.locator('article.chapter-section')).toHaveCount(1);
  await expect(page.locator('p.sidebar-title')).toHaveText('Finding, Keeping, and Nurturing Clients');
  await expect(page.locator('search.nav-search')).toHaveCount(1);
  await expect(page.locator('#navSearch')).toHaveAttribute('aria-controls', 'searchResults');

  const objectives = page.locator('.learning-objectives h2');
  await expect(objectives).toHaveCSS('text-transform', 'uppercase');
  await expect(objectives).toHaveCSS('font-size', '13.6px');

  const section = page.locator('#you-own-a-business-now');
  await expect(section).toHaveCSS('font-size', '21.6px');
  await expect(section).toHaveCSS('border-bottom-width', '0px');
  await expect(page.locator('h1')).toHaveCSS('font-size', '32px');
  await expect(page.locator('h1')).toHaveCSS('border-bottom-width', '2px');

  const note = page.locator('aside.box.field-note');
  await expect(note.locator('h3.box-title')).toHaveCSS('font-size', '12px');
  await expect(note.locator('h3.box-title')).toHaveCSS('color', 'rgb(3, 105, 161)');
  await expect(page.locator('aside.box.try-it ul li')).toHaveCount(4);

  await expect(page.locator('table caption')).toContainText('Table 1.1');
  await expect(page.locator('figure.diagram-box img')).toBeVisible();
});

test('the plan page title is the only h1 and keeps the old title size', async ({ page }) => {
  await page.goto('/handbook/plan');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText('My reading plan');
  await expect(page.locator('h1')).toHaveCSS('font-size', '32px');
});
