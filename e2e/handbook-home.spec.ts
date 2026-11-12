import { PREVIEW_SESSION_ID, signedInState } from './auth';
import { expect, test } from './fixtures';

// The handbook home: progress beside the title, steps and tool cards as panels, and the chapters grouped by part.
const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 390, height: 844 };

test.describe('home page for a preview reader', () => {
  test.use({ storageState: signedInState([], PREVIEW_SESSION_ID) });
  test.beforeEach(async ({ page }) => { await page.setViewportSize(DESKTOP); });

  test('the home page marks the free chapters, locks the rest and offers the next free chapter', async ({ page }) => {
    await page.goto('/handbook');
    const home = page.locator('.hb-home');
    await expect(home.getByRole('heading', { level: 1 })).toHaveText('Finding, Nurturing, and Keeping Clients');
    await expect(home.locator('.hb-legend')).toContainText('Open to everyone');
    await expect(home.locator('.hb-ch[href="/handbook/ch1"] .hb-free')).toHaveText('Free');
    await expect(home.locator('.hb-ch[href="/handbook/ch7"] .hb-free')).toHaveText('Free');
    const locked = home.locator('.hb-ch[href="/handbook/ch2"]');
    await expect(locked.locator('.hb-lock svg')).toBeVisible();
    await expect(locked).toHaveText('2. Finding Clients (members only)');
    await expect(locked.locator('.hb-free')).toHaveCount(0);
    await expect(home.locator('.hb-ch')).toHaveCount(21);
    await expect(home.getByRole('heading', { level: 3, name: 'Operating System' })).toBeVisible();

    const next = home.locator('.hb-btn-primary');
    await expect(next).toHaveText('Read Chapter 1');
    await expect(next).toHaveAttribute('href', '/handbook/ch1');
    await expect(home.locator('.hb-btn-ghost')).toHaveText('Handbook overview & plan');
    await expect(home.locator('.hb-btn-ghost')).toHaveAttribute('href', '/handbook/pref');
    // Chapter 1 read: the next one this reader can open is Chapter 7, not the locked Chapter 2
    await page.evaluate(() => localStorage.setItem('handbookState', JSON.stringify({ read: { ch1: true } })));
    await page.reload();
    await expect(next).toHaveText('Continue: Chapter 7');
    await expect(next).toHaveAttribute('href', '/handbook/ch7');
    await expect(home.locator('.hb-ch[href="/handbook/ch1"] .hb-read svg')).toBeVisible();
  });
});

test.describe('home page for a member', () => {
  test.beforeEach(async ({ page }) => { await page.setViewportSize(DESKTOP); });

  test('shows progress beside the title and no free or locked marks', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('handbookState', JSON.stringify({ read: { pref: true, ch1: true } })));
    await page.goto('/handbook');
    const home = page.locator('.hb-home');
    const progress = home.getByRole('complementary', { name: 'Your progress' });
    await expect(progress.getByRole('progressbar', { name: 'Sections read' })).toHaveAttribute('aria-valuenow', '2');
    await expect(progress).toContainText('2 / 20');
    await expect(progress.getByRole('link', { name: 'Back it up or move it' })).toHaveAttribute('href', '/account');
    await expect(home.locator('.hb-btn-primary')).toHaveText('Continue: Chapter 2');
    await expect(home.locator('.hb-legend, .hb-free, .hb-lock, [data-free-set]')).toHaveCount(0);
    await expect(home.locator('.hb-step')).toHaveCount(3);
    await expect(home.locator('.hb-card')).toHaveCount(6);
    // the panels sit on the page background: three cards to a row at this width
    const cards = await home.locator('.hb-step').evaluateAll(steps => steps.map(step => Math.round(step.getBoundingClientRect().top)));
    expect(new Set(cards).size).toBe(1);
  });

  test('a tool card still lands on the tool in its chapter', async ({ page }) => {
    await page.goto('/handbook');
    await page.locator('.hb-card', { hasText: 'Weekly planner' }).click();
    await expect(page).toHaveURL(/\/handbook\/ch8$/);
    await expect(page.locator('[data-widget="timeblock-planner"]')).toBeFocused();
  });
});

test.describe('home page on a phone', () => {
  test.beforeEach(async ({ page }) => { await page.setViewportSize(PHONE); });

  test('the home page stacks its panels inside the screen', async ({ page }) => {
    await page.goto('/handbook');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBe(0);
    const row = await page.locator('.hb-btns').boundingBox();
    const buttons = await page.locator('.hb-btns .hb-btn').evaluateAll(all => all.map(b => b.getBoundingClientRect().width));
    expect(buttons).toHaveLength(2);
    for (const width of buttons) expect(width).toBeCloseTo(row!.width, 0); // each button is a full row
    const progress = await page.locator('.hb-progress').boundingBox();
    const hero = await page.locator('.hb-hero').boundingBox();
    expect(progress!.width).toBeCloseTo(hero!.width, 0);
  });
});

