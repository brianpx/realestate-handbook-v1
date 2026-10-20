import { expect, test } from '@playwright/test';

// Parity checks for the Chapter 5 nurture timeline. Assertions were read off setupNurtureTimeline in
// legacy/js/widgets.js, not observed by running the static site.
test.describe('nurture timeline', () => {
  test('opens on touch 5, inside the conversion zone, with 13 touch buttons', async ({ page }) => {
    await page.goto('/ch5');
    await expect(page.locator('[data-widget="nurture-timeline"]')).toBeVisible();
    await expect(page.locator('.touch-btn')).toHaveCount(13);
    await expect(page.locator('.touch-btn[aria-pressed="true"]')).toHaveAttribute('data-n', '5');
    await expect(page.locator('.nurture-head strong')).toHaveText('Touch 5 of 13 · Day 7');
    await expect(page.locator('.nurture-note')).toHaveText('Inside touches 5 to 12, where the handbook says most conversions happen.');
    await expect(page.locator('.touch-btn.in-zone')).toHaveCount(8);
    await expect(page.locator('.touch-btn.value')).toHaveCount(4);
  });

  test('describes every touch to a screen reader', async ({ page }) => {
    await page.goto('/ch5');
    await expect(page.getByRole('button', { name: 'Touch 6, day 10, Email, value touch, in the conversion zone' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Touch 1, day 0, Text + email' })).toBeVisible();
  });

  test('selecting a touch shows its plan, sample wording and note', async ({ page }) => {
    await page.goto('/ch5');
    await page.locator('.touch-btn[data-n="2"]').click();
    await expect(page.locator('.nurture-head strong')).toHaveText('Touch 2 of 13 · Day 0');
    await expect(page.locator('.nurture-tag')).toHaveText(['Call', 'Connect']);
    await expect(page.locator('.nurture-detail p').first()).toContainText('You call. Speed-to-lead script.');
    await expect(page.locator('.nurture-sample')).toContainText('"Hi Jordan, Sam with [Brokerage].');
    await expect(page.locator('.nurture-note')).toHaveText(/^This is where most new agents stop/);
    await page.locator('.touch-btn[data-n="3"]').click();
    await expect(page.locator('.nurture-tag')).toHaveText(['Email', 'Give value', 'Value touch']);
  });

  test('Previous and Next step through the plan and stop at the ends', async ({ page }) => {
    await page.goto('/ch5');
    const prev = page.getByRole('button', { name: '← Previous touch' });
    const next = page.getByRole('button', { name: 'Next touch →' });
    await next.click();
    await expect(page.locator('.nurture-head strong')).toHaveText('Touch 6 of 13 · Day 10');
    await page.locator('.touch-btn[data-n="1"]').click();
    await expect(prev).toBeDisabled();
    await page.locator('.touch-btn[data-n="13"]').click();
    await expect(next).toBeDisabled();
    await expect(page.locator('.nurture-note')).toHaveText(/^After touch 13/);
    await prev.click();
    await expect(page.locator('.nurture-head strong')).toHaveText('Touch 12 of 13 · Day 75');
  });

  test('filters dim touches that do not match', async ({ page }) => {
    await page.goto('/ch5');
    await expect(page.getByRole('button', { name: 'All touches' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Calls' }).click();
    await expect(page.getByRole('button', { name: 'Calls' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.touch-btn.dim')).toHaveCount(8);
    await expect(page.locator('.nurture-dot.dim')).toHaveCount(8);
    await page.getByRole('button', { name: 'Value touches' }).click();
    await expect(page.locator('.touch-btn:not(.dim)')).toHaveCount(4);
    await page.getByRole('button', { name: 'All touches' }).click();
    await expect(page.locator('.touch-btn.dim')).toHaveCount(0);
  });

  test('touches can be chosen from the keyboard', async ({ page }) => {
    await page.goto('/ch5');
    await page.locator('.touch-btn[data-n="7"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.touch-btn[aria-pressed="true"]')).toHaveAttribute('data-n', '7');
    await expect(page.locator('.nurture-dot.selected')).toHaveAttribute('data-n', '7');
  });

  test('the plain list of touches is in the server HTML for readers without JavaScript', async ({ request }) => {
    const html = await (await request.get('/ch5')).text();
    expect(html).toContain('<noscript><div class="nurture-static">');
    expect(html).toContain('Day 90. Call. Final check-in, then the quarterly plan.');
  });
});
