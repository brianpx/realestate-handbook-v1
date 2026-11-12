import { PREVIEW_SESSION_ID, signedInState } from './auth';
import { expect, test } from './fixtures';

// The handbook home body (components/handbook/home/*): what a member sees, a tool card landing on its tool, and the
// phone layout. The free-set view is covered in access.spec.ts.
const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 390, height: 844 };

test.describe('home page for a member', () => {
  test.beforeEach(async ({ page }) => { await page.setViewportSize(DESKTOP); });

  test('shows the continue panel and no free or locked marks', async ({ page }) => {
    await page.goto('/handbook');
    const home = page.locator('.hb-home');
    await expect(home.getByRole('heading', { level: 1 })).toHaveText('Finding, Nurturing, and Keeping Clients');
    await expect(home.locator('.hb-continue')).toBeVisible();
    await expect(home.locator('[data-free-set], .hb-home-pill, .hb-home-locked')).toHaveCount(0);
    await expect(home.locator('.hb-home-step')).toHaveCount(3);
    await expect(home.locator('.hb-home-tool')).toHaveCount(6);
    // the steps sit on one row at this width
    const tops = await home.locator('.hb-home-step').evaluateAll(steps => steps.map(step => Math.round(step.getBoundingClientRect().top)));
    expect(new Set(tops).size).toBe(1);
  });

  test('a tool card still lands on the tool in its chapter', async ({ page }) => {
    await page.goto('/handbook');
    await page.locator('.hb-home-tool', { hasText: 'Weekly planner' }).click();
    await expect(page).toHaveURL(/\/handbook\/ch8$/);
    await expect(page.locator('[data-widget="timeblock-planner"]')).toBeFocused();
  });
});

test.describe('home page on a phone', () => {
  test.use({ storageState: signedInState([], PREVIEW_SESSION_ID) });
  test.beforeEach(async ({ page }) => { await page.setViewportSize(PHONE); });

  test('the home page stacks inside the screen and its buttons take a full row', async ({ page }) => {
    await page.goto('/handbook');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBe(0);
    const row = await page.locator('.hb-home-actions').boundingBox();
    const buttons = await page.locator('.hb-home-actions .hb-home-btn').evaluateAll(all => all.map(b => b.getBoundingClientRect().width));
    expect(buttons.length).toBeGreaterThan(0);
    for (const width of buttons) expect(width).toBeCloseTo(row!.width, 0);
  });
});
