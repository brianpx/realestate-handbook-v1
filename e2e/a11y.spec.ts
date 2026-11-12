import { expect, test, type Page } from './fixtures';

// Keyboard and focus behaviour from the November code review (CR-M2, M3, L17, L18, L20).

const isInert = (page: Page, selector: string) => page.locator(selector).evaluate(el => (el as HTMLElement).inert);
const focusInfo = (page: Page) => page.evaluate(() => {
  const el = document.activeElement;
  return { isBody: el === document.body, inSidebar: el?.closest('#sidebar') !== null };
});

test.describe('quiz keyboard', () => {
  // The plain KnowledgeCheck, which only the /preview sample still serves (Chapter 1's quiz comes first).
  test('the /preview plain quiz commits only on Check answer, and keeps focus after it', async ({ page }) => {
    await page.goto('/preview');
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

  test('touch listeners that block swipes exist only while the menu is open', async ({ page }) => {
    // only blocking (non-passive) touchmove listeners count: Settings has a passive one on the document by design
    await page.addInitScript(() => {
      const blocking = new Set<EventListenerOrEventListenerObject>();
      (window as unknown as { __blocking: Set<unknown> }).__blocking = blocking;
      const add = document.addEventListener.bind(document);
      const remove = document.removeEventListener.bind(document);
      document.addEventListener = ((type: string, fn: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
        if (type === 'touchmove' && typeof options === 'object' && options.passive === false) blocking.add(fn);
        return add(type, fn, options);
      }) as typeof document.addEventListener;
      document.removeEventListener = ((type: string, fn: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) => {
        if (type === 'touchmove') blocking.delete(fn);
        return remove(type, fn, options);
      }) as typeof document.removeEventListener;
    });
    const live = () => page.evaluate(() => (window as unknown as { __blocking: Set<unknown> }).__blocking.size);
    await page.goto('/handbook/ch1');
    expect(await live()).toBe(0);
    await page.locator('#menuToggle').click();
    await expect(page.locator('html')).toHaveClass(/scroll-locked/);
    expect(await live()).toBe(1);
    await page.locator('#menuToggle').click();
    await expect(page.locator('html')).not.toHaveClass(/scroll-locked/);
    expect(await live()).toBe(0);
  });

  test('tapping the backdrop closes open search results and clears the box', async ({ page }) => {
    await page.goto('/handbook/ch1');
    const box = page.getByLabel('Search the handbook');
    await box.fill('crm');
    await expect(page.locator('html')).toHaveClass(/scroll-locked/);
    await page.locator('.menu-backdrop').click({ position: { x: 5, y: 700 } });
    await expect(page.locator('html')).not.toHaveClass(/scroll-locked/);
    await expect(box).toHaveValue('');
  });

  test('the open menu scrolls to the current page', async ({ page }) => {
    await page.goto('/handbook/ch13');
    await page.locator('#menuToggle').click();
    const inside = await page.evaluate(() => {
      const list = document.getElementById('navList')!.getBoundingClientRect();
      const row = document.querySelector('#sidebar .nav-item.active')!.getBoundingClientRect();
      return row.top >= list.top && row.bottom <= list.bottom;
    });
    expect(inside).toBe(true);
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

test('on desktop the list scrolls the current page into view, and Appendix E also marks the tools row', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/handbook/app-e');
  const inside = await page.evaluate(() => {
    const list = document.getElementById('navList')!.getBoundingClientRect();
    const row = document.querySelector('#sidebar a[data-page="app-e"]')!.getBoundingClientRect();
    return row.top >= list.top && row.bottom <= list.bottom;
  });
  expect(inside).toBe(true);
  await expect(page.locator('#sidebar a[aria-current="page"]')).toHaveCount(2);
  await expect(page.locator('#sidebar a[data-page="tools"]')).toHaveAttribute('aria-current', 'page');
});

test('the current row is back in view after search closes on the same page', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/handbook/app-e');
  const box = page.getByLabel('Search the handbook');
  await box.fill('crm');
  await expect(page.locator('#sidebar')).toHaveClass(/searching/);
  await box.press('Escape');
  await expect(page.locator('#sidebar')).not.toHaveClass(/searching/);
  await expect.poll(() => page.evaluate(() => {
    const list = document.getElementById('navList')!.getBoundingClientRect();
    const row = document.querySelector('#sidebar a[data-page="app-e"]')!.getBoundingClientRect();
    return row.top >= list.top && row.bottom <= list.bottom;
  })).toBe(true);
});

test('the page announcement leaves out the read tick', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('handbookState', JSON.stringify({ read: { ch2: true } })));
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/handbook/ch1');
  const row = page.locator('#sidebar a[data-page="ch2"]');
  await row.click();
  await expect(page).toHaveURL(/\/handbook\/ch2$/);
  await expect(row.locator('.nav-read')).toHaveCount(1);
  await expect(page.locator('#pageStatus')).toHaveText('2. Finding Clients');
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

// M6 step 14: the sidebar names the product, and lists drawn without bullets keep their list role (Safari and
// VoiceOver drop it from a list-style: none list unless role="list" says otherwise).
test('the sidebar is the Handbook navigation and its bullet-less lists keep the list role', async ({ page }) => {
  await page.goto('/handbook/ch1');
  const sidebar = page.getByRole('navigation', { name: 'Handbook' });
  await expect(sidebar).toHaveCount(1);
  await expect(sidebar).toHaveId('sidebar');
  await expect(sidebar.locator('#navList')).toHaveAttribute('role', 'list');
  await expect(sidebar.locator('#searchResults')).toHaveAttribute('role', 'list');
  await expect(page.getByRole('navigation', { name: 'On this page' }).locator('ul')).toHaveAttribute('role', 'list');
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
