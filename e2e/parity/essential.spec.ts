import { expect, test } from '@playwright/test';

// "Essential tools only" (ESSENTIAL_WIDGETS in legacy/js/interactive.js) keeps five tools; every other tool is
// not built and the page shows its plain text.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('handbookSettings', JSON.stringify({ essentialOnly: true })));
});

test('the five essential tools are still built', async ({ page }) => {
  await page.goto('/handbook/ch1');
  await expect(page.locator('.calc-panel')).toBeVisible();
  await page.goto('/handbook/ch4');
  await expect(page.locator('.speed-widget')).toBeVisible();
  await page.goto('/handbook/ch6');
  await expect(page.locator('.box.script .interactive-pill').first()).toBeVisible();
  await page.goto('/handbook/ch9');
  await expect(page.locator('.objection-trainer')).toBeVisible();
  await page.goto('/handbook/app-a');
  await expect(page.locator('table.scorecard .score-input').first()).toBeVisible();
});

test('the other tools are not built, and the figures they replace read as before', async ({ page }) => {
  await page.goto('/handbook/ch5');
  await expect(page.locator('.nurture-widget')).toHaveCount(0);
  await expect(page.locator('.nurture-static')).toBeVisible();
  await expect(page.locator('.nurture-static li')).toHaveCount(13);
  await expect(page.locator('.drill-fieldset')).toHaveCount(0);
  await page.goto('/handbook/ch7');
  await expect(page.locator('.cycle-widget')).toHaveCount(0);
  await expect(page.getByText('Slow follow-up ➔ Lost leads')).toBeVisible();
  await expect(page.locator('.score-row')).toHaveCount(0);
  await page.goto('/handbook/ch9');
  await expect(page.locator('.alloc')).toHaveCount(0);
  await page.goto('/handbook/ch11');
  await expect(page.locator('.drill')).toHaveCount(0);
});

test('turning the setting off brings the tools back without a reload', async ({ page }) => {
  await page.goto('/handbook/ch5');
  await expect(page.locator('.nurture-widget')).toHaveCount(0);
  await page.locator('details.settings summary').click();
  await page.locator('#settingEssential').uncheck();
  await expect(page.locator('.nurture-widget')).toBeVisible();
  await expect(page.locator('.nurture-static')).toHaveCount(0);
});
