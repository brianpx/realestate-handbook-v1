import { SEARCH_MAX_RESULTS } from '../lib/search-query';
import { PREVIEW_SESSION_ID, signedInState } from './auth';
import { expect, test } from './fixtures';

// The shell's layout: a white rail with the logo and search pinned, numbered rows that carry a padlock or a read
// tick, the home page's panels, the previous and next cards, and on a phone one bar with a drawer under it.
const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 390, height: 844 };

test.describe('sidebar', () => {
  test.beforeEach(async ({ page }) => { await page.setViewportSize(DESKTOP); });

  test('a row sets the number in its own column and keeps the whole label as its text', async ({ page }) => {
    await page.goto('/handbook/ch1');
    const chapter = page.locator('.nav-item[data-page="ch5"]');
    await expect(chapter).toHaveText('5. Nurturing Leads');
    await expect(chapter).toHaveAccessibleName('5. Nurturing Leads');
    await expect(page.locator('.nav-item[data-page="app-d"]')).toHaveText('App D: Glossary');
    const mark = await chapter.locator('.page-mark').boundingBox();
    const title = await chapter.locator('.page-title').boundingBox();
    expect(mark!.width).toBeCloseTo(22, 0);
    expect(title!.x).toBeGreaterThanOrEqual(mark!.x + mark!.width);
    // the title page and the overview sit in the first group, above the study links
    const order = await page.locator('#navList .nav-item').evaluateAll(rows => rows.slice(0, 5).map(row => row.getAttribute('data-page')));
    expect(order).toEqual(['home', 'start', 'tools', 'cover', 'pref']);
  });

  test('the logo and the search stay put while the list scrolls under them', async ({ page }) => {
    await page.goto('/handbook/ch1');
    await expect(page.locator('#sidebar')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    const logo = page.locator('.sidebar-logo.logo-light');
    const before = await logo.boundingBox();
    expect(before!.width).toBe(48);
    await expect(page.locator('.sidebar-brand')).toHaveAttribute('href', '/handbook');
    await page.locator('#navList').evaluate(list => list.scrollTo(0, list.scrollHeight));
    await expect(page.locator('#sidebar')).toHaveClass(/list-scrolled/);
    await page.locator('#main-content').evaluate(main => main.scrollTo(0, 800)); // reading down the chapter moves nothing in the rail
    await expect(page.getByRole('heading', { level: 1 })).not.toBeInViewport();
    expect((await logo.boundingBox())!.y).toBe(before!.y);
    await expect(page.getByLabel('Search the handbook')).toBeInViewport();
    await expect(page.locator('.settings-legal')).toHaveText('v1.0 · October 2026 · All rights reserved.');
    // progress and the pricing page sit with the account links at the foot of the list
    const foot = await page.locator('#navList > li').evaluateAll(items => items.map(li => li.className || li.querySelector('a')?.getAttribute('data-page') || ''));
    const help = foot.indexOf('nav-section-title', foot.indexOf('app-f'));
    expect(foot.slice(help + 1, help + 4)).toEqual(['progress-item', 'account', 'pricing']);
    await expect(page.locator('.nav-item[data-page="pricing"]')).toHaveAttribute('href', '/pricing');
  });

  test('a page that has been read carries a tick, and tracking off takes it away', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('handbookState', JSON.stringify({ read: { ch1: true } })));
    await page.goto('/handbook/ch2');
    const row = page.locator('.nav-item[data-page="ch1"]');
    await expect(row.locator('.nav-read svg')).toBeVisible();
    await expect(row).toHaveText('1. Mindset & Foundations (read)');
    await expect(page.locator('.nav-item[data-page="ch3"] .nav-read')).toHaveCount(0);
    await page.locator('details.settings summary').click();
    await page.locator('#settingTrack').click();
    await expect(row.locator('.nav-read')).toBeHidden();
  });

  test('the search field shows its shortcut, then a clear button once it holds a query', async ({ page }) => {
    await page.goto('/handbook/ch1');
    const box = page.getByLabel('Search the handbook');
    await expect(page.locator('.nav-search-field kbd')).toHaveText(/^(⌘K|Ctrl K)$/);
    await page.keyboard.press('ControlOrMeta+K');
    await expect(box).toBeFocused();
    await box.fill('crm');
    await expect(page.locator('.nav-search-field kbd')).toHaveCount(0);
    await page.getByRole('button', { name: 'Clear search' }).click();
    await expect(box).toHaveValue('');
    await expect(box).toBeFocused();
    await expect(page.locator('#navList')).toBeVisible();
  });

  test('search results scroll inside the rail, so the last one can be reached', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 600 });
    await page.goto('/handbook/ch1');
    await page.getByLabel('Search the handbook').fill('client'); // a word with more matches than the list shows
    const results = page.locator('#searchResults');
    await expect(results.locator('a')).toHaveCount(SEARCH_MAX_RESULTS);
    const box = await results.boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(600);
    expect(await results.evaluate(list => list.scrollHeight > list.clientHeight)).toBe(true);
    await results.locator('a').last().scrollIntoViewIfNeeded();
    await expect(results.locator('a').last()).toBeInViewport();
    await expect(page.getByLabel('Search the handbook')).toBeInViewport();
  });
});

test.describe('for a preview reader', () => {
  test.use({ storageState: signedInState([], PREVIEW_SESSION_ID) });
  test.beforeEach(async ({ page }) => { await page.setViewportSize(DESKTOP); });

  test('a locked row shows a padlock and says so to a screen reader', async ({ page }) => {
    await page.goto('/handbook');
    const row = page.locator('#sidebar .nav-item[data-page="ch2"]');
    await expect(row.locator('.nav-lock svg')).toBeVisible();
    await expect(row).toHaveText('2. Finding Clients (Members only)');
    await expect(page.locator('#sidebar .nav-item[data-page="ch1"] svg')).toHaveCount(0);
    // a row that needs the Pro plan says so beside its padlock; a members row is the padlock alone
    await expect(page.locator('#sidebar .nav-item[data-page="plan"] .nav-lock-plan')).toHaveText('Pro');
    await expect(row.locator('.nav-lock-plan')).toHaveCount(0);
  });

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

  test('a locked page is one card with the padlock, the notice form and what is open', async ({ page }) => {
    await page.goto('/handbook/ch2');
    const card = page.locator('.hb-upsell-status');
    await expect(card.locator('.hb-lock-badge svg')).toBeVisible();
    await expect(card).toHaveCSS('border-radius', '12px');
    await expect(card.getByRole('heading', { level: 2, name: 'What you can read now' })).toBeVisible();
    await expect(card.getByRole('list', { name: 'What you can read now' }).getByRole('link')).toHaveCount(4);
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

test.describe('on a phone', () => {
  test.beforeEach(async ({ page }) => { await page.setViewportSize(PHONE); });

  test('the bar is one row: menu button, logo, search', async ({ page }) => {
    await page.goto('/handbook/ch1');
    const bar = await page.locator('#sidebar').boundingBox();
    const toggle = await page.locator('#menuToggle').boundingBox();
    const logo = await page.locator('.sidebar-logo.logo-light').boundingBox();
    const search = await page.locator('.nav-search-field').boundingBox();
    expect(bar!.y).toBe(0);
    expect(bar!.height).toBeLessThanOrEqual(66);
    expect(toggle!.x + toggle!.width).toBeLessThanOrEqual(logo!.x);
    expect(logo!.x + logo!.width).toBeLessThanOrEqual(search!.x);
    expect(search!.x + search!.width).toBeLessThanOrEqual(PHONE.width);
    for (const box of [toggle!, logo!, search!]) expect(box.y + box.height).toBeLessThanOrEqual(bar!.height);
    expect(toggle!.width).toBeGreaterThanOrEqual(44);
    // the title is not drawn, but the logo link still says where it goes
    await expect(page.locator('.sidebar-brand')).toHaveAccessibleName(/Finding, Nurturing, and Keeping Clients/);
    await expect(page.locator('.nav-search-field kbd')).toBeHidden();
    // the bar stays at the top as the page scrolls
    await page.evaluate(() => window.scrollTo(0, 600));
    expect((await page.locator('#sidebar').boundingBox())!.y).toBe(0);
  });

  test('the menu opens as a drawer under the bar, over the dimmed page', async ({ page }) => {
    await page.goto('/handbook/ch1');
    const list = page.locator('#navList');
    await expect(list).toBeHidden();
    await page.locator('#menuToggle').click();
    await expect(list).toBeVisible();
    await expect(page.locator('.menu-backdrop')).toHaveCSS('background-color', 'rgba(15, 23, 42, 0.4)');
    await expect.poll(async () => (await list.boundingBox())!.x).toBe(0); // the slide has ended
    const drawer = await list.boundingBox();
    const bar = await page.locator('#sidebar').boundingBox();
    expect(drawer!.width).toBe(320);
    expect(drawer!.y).toBeCloseTo(bar!.height, 0);
    expect(drawer!.y + drawer!.height).toBeCloseTo(PHONE.height, 0);
    await expect(list.getByRole('button', { name: 'Close menu' })).toBeInViewport();
    await list.getByRole('button', { name: 'Close menu' }).click();
    await expect(list).toBeHidden();
  });

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
