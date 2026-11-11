import { expect, test } from './fixtures';

for (const width of [390, 1280]) {
  test(`browser Back preserves reading position at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/handbook/ch1');
    const readingTop = () => page.evaluate(() => innerWidth <= 900 ? scrollY : document.getElementById('main-content')!.scrollTop);
    await page.evaluate(() => {
      if (innerWidth <= 900) scrollTo(0, 800);
      else document.getElementById('main-content')!.scrollTop = 800;
    });
    await expect.poll(readingTop).toBe(800);
    // Activate the existing link without scrolling it into view, preserving the reading position under test.
    await page.locator('.nav-item[data-page="ch2"]').evaluate(el => { if (el instanceof HTMLElement) el.click(); });
    await expect(page).toHaveURL(/\/handbook\/ch2$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/handbook\/ch1$/);
    await expect.poll(readingTop).toBe(800);
  });
}

test('a mistaken progress import can be recovered through the previous-backup control', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('handbookState')) localStorage.setItem('handbookState', JSON.stringify({ read: { ch9: true }, calc: { goal: 12345 } }));
  });
  await page.goto('/handbook/ch1');
  await page.locator('details.settings summary').click();
  await page.setInputFiles('#settingImportFile', {
    name: 'wrong-progress.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ format: 'handbook-progress', version: 1, handbookState: { read: { ch2: true }, calc: { goal: 999 } } })),
  });
  await page.getByRole('button', { name: 'Replace my progress' }).click();
  await expect(page.locator('#settingTransferNote')).toHaveText('Progress restored.');
  await page.getByRole('button', { name: 'Restore previous backup' }).click();
  await expect(page.getByRole('group', { name: 'Confirm restoring progress' })).toContainText('The previous backup');
  await page.getByRole('button', { name: 'Restore this backup' }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('handbookState')!).calc.goal)).toBe(12345);
});
