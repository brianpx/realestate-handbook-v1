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
    await box.fill('zzzq'); // no matches: the results are short, so the backdrop shows below them
    await expect(page.locator('html')).toHaveClass(/scroll-locked/);
    await page.locator('.menu-backdrop').click({ position: { x: 5, y: 700 } });
    await expect(page.locator('html')).not.toHaveClass(/scroll-locked/);
    await expect(box).toHaveValue('');
  });

  test('the open menu scrolls to the current page', async ({ page }) => {
    await page.goto('/handbook/ch13');
    await page.locator('#menuToggle').click();
    const inside = await page.evaluate(() => {
      const list = document.getElementById('sidebarBody')!.getBoundingClientRect();
      const row = document.querySelector('#sidebar .nav-item.active')!.getBoundingClientRect();
      return row.top >= list.top && row.bottom <= list.bottom;
    });
    expect(inside).toBe(true);
  });

  test('a chapter chosen from the open menu gets focus on its heading, with the page no longer inert', async ({ page }) => {
    await page.goto('/handbook/ch1');
    await page.locator('#menuToggle').click();
    await expect(page.locator('#sidebar')).toHaveClass(/menu-open/);
    await page.getByRole('button', { name: /^PART II:/i }).click(); // Part II is folded while Chapter 1 is open
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

test.describe('desktop sidebar layout', () => {
  test('the list has room on a short window, and nothing moves when the page scrolls', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 600 });
    await page.goto('/handbook/ch1');
    const measure = () => page.evaluate(() => ({
      list: document.getElementById('navList')!.clientHeight,
      header: document.querySelector('.sidebar-header')!.getBoundingClientRect().height,
      row: Math.round(document.querySelector('#sidebar a[data-page="ch1"]')!.getBoundingClientRect().top),
    }));
    const before = await measure();
    expect(before.list).toBeGreaterThanOrEqual(300);
    expect(before.header).toBeLessThan(160);
    await page.evaluate(() => { document.getElementById('main-content')!.scrollTop = 300; });
    await page.waitForTimeout(400);
    expect(await measure()).toEqual(before);
  });

  for (const height of [600, 700]) {
    test(`twelve search results scroll in their own region under a pinned box at ${height}px tall`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height });
      await page.goto('/handbook/ch1');
      await page.getByLabel('Search the handbook').fill('client');
      await expect(page.locator('.search-result')).toHaveCount(12);
      const more = page.locator('.search-more');
      await more.scrollIntoViewIfNeeded();
      const geometry = await page.evaluate(() => {
        const box = document.getElementById('navSearch')!.getBoundingClientRect();
        const list = document.getElementById('searchResults')!;
        const last = [...list.querySelectorAll('li')].at(-1)!.getBoundingClientRect();
        return { boxTop: box.top, boxBottom: box.bottom, lastBottom: last.bottom, listScrolls: list.scrollHeight > list.clientHeight, viewport: innerHeight };
      });
      expect(geometry.boxTop).toBeGreaterThanOrEqual(0);
      expect(geometry.lastBottom).toBeLessThanOrEqual(geometry.viewport);
      expect(geometry.listScrolls).toBe(true);
    });
  }

  test('the rail narrows to 260px between 901 and 1100px, and is 320px above that', async ({ page }) => {
    const rail = () => page.evaluate(() => Math.round(document.getElementById('sidebar')!.getBoundingClientRect().width));
    await page.setViewportSize({ width: 1000, height: 800 });
    await page.goto('/handbook/ch1');
    expect(await rail()).toBe(260);
    await page.setViewportSize({ width: 1101, height: 800 });
    await expect.poll(rail).toBe(320);
  });

  test('opening Settings does not change the list, and the panel stays inside the window', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 600 });
    await page.goto('/handbook/ch1');
    const listHeight = () => page.evaluate(() => document.getElementById('navList')!.clientHeight);
    const before = await listHeight();
    await page.locator('details.settings summary').click();
    expect(await listHeight()).toBe(before);
    const panel = await page.locator('.settings-panel').boundingBox();
    expect(panel!.y).toBeGreaterThanOrEqual(0);
    expect(panel!.y + panel!.height).toBeLessThanOrEqual(600);
  });
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

test('moving to another page focuses its heading and does not also write the name to the status line', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/handbook/ch1');
  await page.getByRole('button', { name: /^PART II:/i }).click();
  await page.locator('#sidebar a[data-page="ch2"]').click();
  await expect(page).toHaveURL(/\/handbook\/ch2$/);
  await expect(page.locator('#content-container h1')).toBeFocused();
  await page.waitForTimeout(300); // the status line used to be written 50ms after the move; give that write time to show
  await expect(page.locator('#pageStatus')).toHaveText('');
});

test.describe('grouped navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  const partButton = (page: import('@playwright/test').Page, name: RegExp) => page.locator('#sidebar').getByRole('button', { name });

  test('sections are headings over nested lists, and only the current part of the book starts open', async ({ page }) => {
    await page.goto('/handbook/ch5');
    const nav = page.getByRole('navigation', { name: 'Handbook' });
    await expect(nav.getByRole('heading', { level: 2 })).toHaveCount(await nav.locator('li.nav-group > h2').count());
    expect(await nav.locator('li.nav-group > h2').count()).toBeGreaterThan(8);
    await expect(partButton(page, /^PART IV:/i)).toHaveAttribute('aria-expanded', 'true');
    await expect(partButton(page, /^PART II:/i)).toHaveAttribute('aria-expanded', 'false');
    await expect(nav.getByRole('link', { name: /^5\. Nurturing/ })).toBeVisible();
    // a folded part's links are out of the accessibility tree, not just out of sight
    await expect(nav.getByRole('link', { name: /^2\. Finding/ })).toHaveCount(0);
    await expect(nav.locator('ul[role="list"] ul[role="list"]').first()).toBeAttached();
  });

  test('a part opens and folds from the keyboard, except the one holding the current page', async ({ page }) => {
    await page.goto('/handbook/ch5');
    const part2 = partButton(page, /^PART II:/i);
    await part2.focus();
    await page.keyboard.press('Enter');
    await expect(part2).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#sidebar a[data-page="ch2"]')).toBeVisible();
    await page.keyboard.press('Space');
    await expect(part2).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#sidebar a[data-page="ch2"]')).toBeHidden();

    const here = partButton(page, /^PART IV:/i);
    await expect(here).toHaveAttribute('aria-disabled', 'true');
    await here.click({ force: true }); // Playwright waits forever on aria-disabled; a reader can still press it
    await expect(here).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#sidebar a[data-page="ch5"]')).toBeVisible();
  });

  test('going to another part opens it, and the list is far shorter than all rows', async ({ page }) => {
    await page.goto('/handbook/ch1');
    const rows = () => page.locator('#navList a.nav-item:visible').count();
    expect(await rows()).toBeLessThan(15);
    await page.goto('/handbook/ch9');
    await expect(partButton(page, /^PART VI:/i)).toHaveAttribute('aria-expanded', 'true');
    await expect(partButton(page, /^PART I:/i)).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#sidebar a[data-page="ch9"]')).toBeVisible();
  });
});

// M6 step 14: the sidebar names the product, and lists drawn without bullets keep their list role (Safari and
// VoiceOver drop it from a list-style: none list unless role="list" says otherwise).
test('the sidebar is the Handbook navigation and its bullet-less lists keep the list role', async ({ page }) => {
  await page.goto('/handbook/ch1');
  const nav = page.getByRole('navigation', { name: 'Handbook' });
  await expect(nav).toHaveCount(1);
  await expect(page.locator('#sidebar').getByRole('navigation', { name: 'Handbook' })).toHaveCount(1);
  await expect(nav.locator('#navList')).toHaveAttribute('role', 'list');
  await expect(page.locator('#sidebar #searchResults')).toHaveAttribute('role', 'list');
  // Settings is a control panel, not navigation, so it sits outside the landmark
  await expect(nav.locator('details.settings')).toHaveCount(0);
  await expect(page.locator('#sidebar details.settings')).toHaveCount(1);
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
