import { PREVIEW_SESSION_ID, signedInState } from './auth';
import { expect, test } from './fixtures';

// The locked page as one card with a padlock, and the previous and next cards under a chapter.
const DESKTOP = { width: 1280, height: 800 };

test.describe('for a preview reader', () => {
  test.use({ storageState: signedInState([], PREVIEW_SESSION_ID) });
  test.beforeEach(async ({ page }) => { await page.setViewportSize(DESKTOP); });

  test('a locked page is one card with the padlock, the notice form and what is open', async ({ page }) => {
    await page.goto('/handbook/ch2');
    const card = page.locator('.hb-upsell-status');
    await expect(card.locator('.hb-lock-badge svg')).toBeVisible();
    await expect(card).toHaveCSS('border-radius', '12px');
    await expect(card.getByRole('heading', { level: 2, name: 'What you can read now' })).toBeVisible();
    await expect(card.getByRole('list', { name: 'What you can read now' }).getByRole('link')).toHaveCount(4);
  });
});

test.describe('previous and next', () => {
  test('a chapter ends with a card for each neighbour', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/handbook/ch2');
    const pager = page.getByRole('navigation', { name: 'Previous and next page' });
    const prev = pager.locator('.chapter-prev a');
    const next = pager.locator('.chapter-next a');
    await expect(prev).toHaveText('Previous: 1. Mindset & Foundations');
    await expect(prev).toHaveAccessibleName('Previous: 1. Mindset & Foundations');
    await expect(prev).toHaveAttribute('href', '/handbook/ch1');
    await expect(next).toHaveText('Next: 3. Marketing & Brand Presence');
    await expect(next).toHaveAttribute('href', '/handbook/ch3');
    const [left, right] = [await prev.boundingBox(), await next.boundingBox()];
    expect(left!.x + left!.width).toBeLessThan(right!.x);
    expect(Math.abs(left!.y - right!.y)).toBeLessThan(2);

    await page.goto('/handbook/cover');
    await expect(page.locator('.chapter-prev')).toHaveCount(0);
    await expect(page.locator('.chapter-next a')).toHaveText('Next: Handbook Overview & Plan');
  });
});
