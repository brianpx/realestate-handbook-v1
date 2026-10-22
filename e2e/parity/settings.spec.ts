import { expect, test, type Page } from '@playwright/test';

// Parity checks for the settings panel, progress reset and chapter end. Each assertion was read off
// legacy/js/interactive.js (setupSettingsUi, setupProgressUi, setupChapterEnd), not observed by running the
// static site: an attempt to run this spec against it failed on its continuous-scroll layout (several
// .chapter-next links at once) and an unstable Settings summary. PARITY_TARGET=legacy is therefore unsupported
// until the locators are scoped to the current section.
const open = async (page: Page, id: string) => {
  await page.goto(`/${id}`);
  await page.locator('details.settings summary').waitFor();
};
const openSettings = (page: Page) => page.locator('details.settings summary').click();
const settings = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('handbookSettings') ?? '{}'));

test.describe('settings parity', () => {
  test('essential-only and quiz choices persist across a reload', async ({ page }) => {
    await open(page, 'ch1');
    await openSettings(page);
    await page.locator('#settingEssential').check();
    await page.locator('#settingQuiz').uncheck();
    expect(await settings(page)).toMatchObject({ essentialOnly: true, hideQuizzes: true });
    await page.reload();
    await openSettings(page);
    await expect(page.locator('#settingEssential')).toBeChecked();
    await expect(page.locator('#settingQuiz')).not.toBeChecked();
  });

  test('a blocked write leaves the checkbox as it was', async ({ page }) => {
    await page.addInitScript(() => {
      const real = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k: string, v: string) {
        if (k === 'handbookSettings') throw new Error('blocked');
        return real.call(this, k, v);
      };
    });
    await open(page, 'ch1');
    await openSettings(page);
    const wide = page.locator('#settingWide');
    await expect(wide).not.toBeChecked();
    await wide.click();
    await expect(wide).not.toBeChecked();
    await expect(page.locator('html')).not.toHaveClass(/wide/);
  });

  test('reset says so when there is nothing to reset, and its group hides when tracking is off', async ({ page }) => {
    await open(page, 'ch1');
    await openSettings(page);
    await page.locator('#settingReset').click();
    await expect(page.locator('#settingResetNote')).toHaveText('Nothing to reset.');
    await expect(page.locator('#settingResetGroup')).toBeVisible();
    await page.locator('#settingTrack').uncheck();
    await expect(page.locator('#settingResetGroup')).toBeHidden();
    await page.locator('#settingTrack').check();
    await expect(page.locator('#settingResetGroup')).toBeVisible();
    await expect(page.locator('#settingResetNote')).toHaveText('');
  });

  test('the controls work from the keyboard', async ({ page }) => {
    await open(page, 'ch1');
    await page.locator('details.settings summary').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('details.settings')).toHaveAttribute('open', '');
    await page.locator('#settingDark').focus();
    await page.keyboard.press('Space');
    await expect(page.locator('html')).toHaveClass(/dark/);
    expect(await settings(page)).toMatchObject({ dark: true });
  });

  test('scrolling up folds Settings away', async ({ page }) => {
    await open(page, 'ch1');
    await openSettings(page);
    await expect(page.locator('details.settings')).toHaveAttribute('open', '');
    await page.mouse.move(700, 400);
    await page.mouse.wheel(0, -200);
    await expect(page.locator('details.settings')).not.toHaveAttribute('open', '');
  });
});

test.describe('chapter end parity', () => {
  test('a chapter ends with a Next link and the shared footer', async ({ page }) => {
    await open(page, 'ch1');
    const next = page.locator('.chapter-next a');
    await expect(next).toHaveText(/^Next: /);
    await expect(page.locator('.chapter-foot p')).toHaveText([
      'Not legal advice. Confirm forms, compensation, and prospecting rules with your broker.',
      'For new agents. Worked examples use Keller Williams Command names. In another CRM, use your website, client search app, pipeline stages, and drip campaigns.',
      'v1.0 · October 2026',
    ]);
  });

  test('the last page links back to the handbook home', async ({ page }) => {
    await open(page, 'app-f');
    await expect(page.locator('.chapter-next a')).toHaveText('Back to the handbook home');
  });
});
