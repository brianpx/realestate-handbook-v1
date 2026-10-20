import { expect, test } from '@playwright/test';

test.describe('settings and progress', () => {
  test('dark mode and full width persist across reloads and set html classes', async ({ page }) => {
    await page.goto('/ch1');
    await page.locator('details.settings summary').click();
    await page.locator('#settingDark').check();
    await page.locator('#settingWide').check();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.locator('html')).toHaveClass(/wide/);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('handbookSettings')!))).toMatchObject({ dark: true, fullWidth: true });
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.locator('html')).toHaveClass(/wide/);
    await page.locator('details.settings summary').click();
    await expect(page.locator('#settingDark')).toBeChecked();
  });

  test('a chapter counts as read once its end is reached, and reset clears it', async ({ page }) => {
    await page.goto('/ch1');
    await page.locator('.read-sentinel').scrollIntoViewIfNeeded();
    await expect(page.locator('.nav-item[data-page="ch1"]')).toHaveClass(/read/);
    await expect(page.locator('#progressLabel')).toHaveText('1 of 20 sections read');
    await page.locator('details.settings summary').click();
    await page.locator('#settingReset').click();
    await expect(page.locator('#settingResetNote')).toHaveText('Progress reset.');
    await expect(page.locator('#progressLabel')).toHaveText('0 of 20 sections read');
  });

  test('turning tracking off hides progress and stops marking chapters read', async ({ page }) => {
    await page.goto('/ch2');
    await page.locator('details.settings summary').click();
    await page.locator('#settingTrack').uncheck();
    await expect(page.locator('#progressBar')).toHaveCount(0);
    await page.locator('.read-sentinel').scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('handbookState') ?? '{}').read ?? {})).toEqual({});
  });

  test('existing static-site progress is picked up', async ({ page }) => {
    await page.addInitScript(() => {
      if (!localStorage.getItem('handbookState')) localStorage.setItem('handbookState', JSON.stringify({ read: { ch3: true, ch4: true } }));
    });
    await page.goto('/ch1');
    await expect(page.locator('#progressLabel')).toHaveText('2 of 20 sections read');
  });
});
