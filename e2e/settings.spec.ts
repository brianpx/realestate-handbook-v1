import { expect, test } from '@playwright/test';

test.describe('settings and progress', () => {
  test('dark mode and full width persist across reloads and set html classes', async ({ page }) => {
    await page.goto('/handbook/ch1');
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

  test('text size defaults to medium, applies, and persists across reloads', async ({ page }) => {
    const rootSize = () => page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
    await page.goto('/handbook/ch1');
    await expect(page.locator('html')).not.toHaveClass(/text-(small|large)/);
    expect(await rootSize()).toBe('16px');
    await page.locator('details.settings summary').click();
    await expect(page.locator('#settingText-medium')).toBeChecked();

    await page.locator('#settingText-large').check();
    await expect(page.locator('html')).toHaveClass(/text-large/);
    expect(await rootSize()).toBe('19.2px');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('handbookSettings')!))).toMatchObject({ textSize: 'large' });

    await page.reload();
    await expect(page.locator('html')).toHaveClass(/text-large/);
    expect(await rootSize()).toBe('19.2px');
    await page.locator('details.settings summary').click();
    await expect(page.locator('#settingText-large')).toBeChecked();

    await page.locator('#settingText-small').check();
    await expect(page.locator('html')).toHaveClass(/text-small/);
    expect(await rootSize()).toBe('14.4px');
    await page.locator('#settingText-medium').check();
    await expect(page.locator('html')).not.toHaveClass(/text-(small|large)/);
    expect(await rootSize()).toBe('16px');
  });

  test('large text does not make the page scroll sideways on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.addInitScript(() => localStorage.setItem('handbookSettings', JSON.stringify({ textSize: 'large' })));
    for (const slug of ['ch1', 'ch5', 'app-e']) {
      await page.goto(`/${slug}`);
      await expect(page.locator('html')).toHaveClass(/text-large/);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, slug).toBeLessThanOrEqual(0);
    }
  });

  test('a chapter counts as read once its end is reached, and reset clears it', async ({ page }) => {
    await page.goto('/handbook/ch1');
    await page.locator('.read-sentinel').scrollIntoViewIfNeeded();
    await expect(page.locator('.nav-item[data-page="ch1"]')).toHaveClass(/read/);
    await expect(page.locator('#progressLabel')).toHaveText('1 of 20 sections read');
    await page.locator('details.settings summary').click();
    await page.locator('#settingReset').click();
    await expect(page.locator('#settingResetNote')).toHaveText('Progress reset.');
    await expect(page.locator('#progressLabel')).toHaveText('0 of 20 sections read');
  });

  test('turning tracking off hides progress and stops marking chapters read', async ({ page }) => {
    await page.goto('/handbook/ch2');
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
    await page.goto('/handbook/ch1');
    await expect(page.locator('#progressLabel')).toHaveText('2 of 20 sections read');
  });
});
