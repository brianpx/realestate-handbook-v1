import { expect, test, type Page } from './fixtures';

// Keyboard and focus behaviour from the November code review (CR-M2, M3, L17, L18, L20).

const isInert = (page: Page, selector: string) => page.locator(selector).evaluate(el => (el as HTMLElement).inert);
const focusInfo = (page: Page) => page.evaluate(() => {
  const el = document.activeElement;
  return { isBody: el === document.body, inSidebar: el?.closest('#sidebar') !== null };
});

test.describe('quiz keyboard', () => {
  // The chapter check without coach questions (plain KnowledgeCheck).
  test('a chapter quiz commits only on Check answer, and keeps focus after it', async ({ page }) => {
    await page.goto('/handbook/ch1');
    const fs = page.locator('.box.quiz fieldset.quiz-item').first();
    const radios = fs.getByRole('radio');
    await radios.first().focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(radios.nth(2)).toBeChecked(); // the arrows only moved the selection
    await expect(fs.locator('.drill-feedback')).toBeEmpty();
    await expect(fs.locator('.quiz-opt.is-right, .quiz-opt.is-wrong')).toHaveCount(0);
    await expect(radios.first()).toBeEnabled();

    await page.keyboard.press('Tab');
    await expect(fs.getByRole('button', { name: 'Check answer' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(fs.locator('.drill-feedback strong')).toHaveText('✓ Correct.');
    await expect(fs.locator('.quiz-opt.is-right .quiz-mark')).toHaveText('✓ Correct answer');
    expect((await focusInfo(page)).isBody).toBe(false);
    await expect(fs.locator('.drill-feedback')).toBeFocused();
    await expect(fs.getByRole('button', { name: 'Check answer' })).toHaveCount(0);
    // the locked options stay readable: aria-disabled, still in the tab order, and a late pick changes nothing
    await expect(radios.first()).toBeDisabled();
    await radios.first().click({ force: true });
    await expect(radios.nth(2)).toBeChecked();
    await expect(fs.locator('.quiz-opt.is-wrong')).toHaveCount(0);
  });

  // Chapter 2 has tagged questions, so it renders the coach version (QuestionItem, shared with /handbook/review).
  test('a coach quiz commits only on Check answer, and keeps focus after it', async ({ page }) => {
    await page.goto('/handbook/ch2');
    const fs = page.locator('.box.quiz fieldset.quiz-item').first();
    await fs.getByRole('button', { name: 'Think so' }).click();
    const radios = fs.getByRole('radio');
    await expect(radios.first()).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(radios.nth(2)).toBeChecked();
    await expect(fs.locator('.drill-feedback')).toBeEmpty();
    await expect(fs.locator('.quiz-opt.is-right, .quiz-opt.is-wrong')).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('handbookCoach'))).toBeNull(); // nothing recorded yet

    await page.keyboard.press('Tab');
    await expect(fs.getByRole('button', { name: 'Check answer' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(fs.locator('.drill-feedback strong')).toHaveText(/^(✓ Correct\. |✗ Not quite\. )$/);
    expect((await focusInfo(page)).isBody).toBe(false);
    await expect(fs.locator('.drill-feedback')).toBeFocused();
    await expect(radios.first()).toBeDisabled();
  });
});

test.describe('phone menu', () => {
  test.beforeEach(async ({ page }) => { await page.setViewportSize({ width: 360, height: 740 }); });

  test('the open menu makes the page behind it inert, so Tab stays in the sidebar', async ({ page }) => {
    await page.goto('/handbook/ch1');
    expect(await isInert(page, '#main-content')).toBe(false);
    await page.locator('#menuToggle').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#sidebar')).toHaveClass(/menu-open/);
    expect(await isInert(page, '#main-content')).toBe(true);
    expect(await isInert(page, '.skip-link')).toBe(true);

    let stops = 0;
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press('Tab');
      const focus = await focusInfo(page);
      if (focus.isBody) break; // ran off the end of the document
      expect(focus.inSidebar, `Tab ${i + 1} left the sidebar`).toBe(true);
      stops++;
    }
    expect(stops).toBeGreaterThan(5);

    await page.keyboard.press('Escape');
    await expect(page.locator('#sidebar')).not.toHaveClass(/menu-open/);
    await expect(page.locator('#menuToggle')).toBeFocused();
    expect(await isInert(page, '#main-content')).toBe(false);
    expect(await isInert(page, '.skip-link')).toBe(false);
  });

  test('open search results make the page behind them inert too', async ({ page }) => {
    await page.goto('/handbook/ch1');
    await page.getByLabel('Search the handbook').fill('crm');
    await expect(page.locator('html')).toHaveClass(/scroll-locked/);
    expect(await isInert(page, '#main-content')).toBe(true);
    expect(await isInert(page, '.skip-link')).toBe(true);
    await page.locator('#menuToggle').click(); // the cross that clears the results
    await expect(page.locator('html')).not.toHaveClass(/scroll-locked/);
    expect(await isInert(page, '#main-content')).toBe(false);
    expect(await isInert(page, '.skip-link')).toBe(false);
  });

  test('a chapter chosen from the open menu gets focus on its heading, with the page no longer inert', async ({ page }) => {
    await page.goto('/handbook/ch1');
    await page.locator('#menuToggle').click();
    await expect(page.locator('#sidebar')).toHaveClass(/menu-open/);
    await page.locator('#sidebar').getByRole('link', { name: /^2\. / }).click();
    await expect(page).toHaveURL(/\/handbook\/ch2$/);
    await expect(page.locator('#content-container h1')).toBeFocused();
    expect(await isInert(page, '#main-content')).toBe(false);
    await expect(page.locator('html')).not.toHaveClass(/scroll-locked/);
  });
});

test('Settings stays open on a wheel-up while one of its controls has focus', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/handbook/ch1');
  const details = page.locator('details.settings');
  await details.locator('summary').click();
  await expect(details).toHaveAttribute('open', '');
  await page.locator('#settingDark').focus();

  const main = await page.locator('#main-content').boundingBox();
  await page.mouse.move(main!.x + main!.width / 2, main!.y + main!.height / 2);
  await page.mouse.wheel(0, -200);
  await expect(details).toHaveAttribute('open', '');
  await expect(page.locator('#settingDark')).toBeFocused();

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.mouse.wheel(0, -200);
  await expect(details).not.toHaveAttribute('open', '');
});

test('the coach pages step from h1 to h2', async ({ page }) => {
  await page.goto('/handbook/plan');
  await expect(page.getByRole('heading', { level: 1, name: 'My reading plan' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: /START YOUR READING PLAN/ })).toBeVisible();
  await expect(page.locator('#content-container h3')).toHaveCount(0);

  await page.goto('/handbook/review');
  await expect(page.getByRole('heading', { level: 1, name: 'Review' })).toBeVisible();
  await expect(page.locator('#content-container h3')).toHaveCount(0);
});
