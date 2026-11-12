import { expect, test } from '../fixtures';

// Parity checks for the sidebar search. Assertions were read off legacy/js/search.js, not observed by running
// the static site.
test.describe('sidebar search', () => {
  test('Enter opens the top result, and a capped list says how many more matched', async ({ page }) => {
    await page.goto('/handbook/ch1');
    const box = page.getByLabel('Search the handbook');
    await box.fill('crm');
    await expect(page.locator('.search-result').first()).toBeVisible();
    await expect(page.locator('.search-more')).toHaveText(/^Showing 12 of \d+\./);
    const href = await page.locator('.search-result').first().getAttribute('href');
    await box.press('Enter');
    await expect(page).toHaveURL(new RegExp(`${href}(#.*)?$`));
    await expect(page.locator('#sidebar')).not.toHaveClass(/searching/);
    await expect(box).toHaveValue('');
  });

  test('loads its index only when the box is first focused', async ({ page }) => {
    const hits: string[] = [];
    page.on('request', r => { if (r.url().endsWith('/search-index.json')) hits.push(r.url()); });
    await page.goto('/handbook/ch1');
    expect(hits).toHaveLength(0);
    await page.getByLabel('Search the handbook').focus();
    await expect.poll(() => hits.length).toBe(1);
    await expect(page.locator('#searchResults')).toBeHidden();
  });

  test('lists up to 12 results, headings first, each with where it is', async ({ page }) => {
    await page.goto('/handbook/ch1');
    await page.getByLabel('Search the handbook').fill('crm');
    const results = page.locator('.search-result');
    await expect(results.first()).toBeVisible();
    expect(await results.count()).toBe(12);
    await expect(page.locator('#sidebar')).toHaveClass(/searching/);
    await expect(page.locator('.nav-list')).toBeHidden();
    await expect(page.locator('#searchStatus')).toHaveText('12 results');
    // a glossary term is named as one
    await expect(page.locator('.search-result-where', { hasText: 'Glossary term ·' }).first()).toBeVisible();
    // the first result is a heading or term, not a paragraph
    await expect(results.first().locator('.search-result-title')).toHaveText(/^.{1,70}$/);
  });

  test('needs every word, in any order', async ({ page }) => {
    await page.goto('/handbook/ch1');
    await page.getByLabel('Search the handbook').fill('truth single crm');
    await expect(page.locator('.search-result-title').first()).toContainText('single source of truth');
    await page.getByLabel('Search the handbook').fill('qzxwv');
    await expect(page.locator('.search-empty')).toHaveText('No matches.');
    await expect(page.locator('#searchStatus')).toHaveText('No matches');
  });

  test('says how many results there are', async ({ page }) => {
    await page.goto('/handbook/ch1');
    await page.getByLabel('Search the handbook').fill('Days 31 to 60');
    await expect(page.locator('#searchStatus')).toHaveText(/^\d+ results?$/);
  });

  test('finds text the tools draw themselves, and jumps to it', async ({ page }) => {
    await page.goto('/handbook/ch1');
    await page.getByLabel('Search the handbook').fill('Days 31 to 60 (Build Rhythm)');
    const result = page.locator('.search-result', { hasText: 'Days 31 to 60 (Build Rhythm)' }).first();
    await expect(result).toBeVisible();
    await result.click();
    await expect(page).toHaveURL(/\/handbook\/ch12$/);
    const heading = page.locator('h3.checklist-title', { hasText: 'Days 31 to 60 (Build Rhythm)' });
    await expect(heading).toBeFocused();
    await expect(heading).toHaveClass(/widget-found/);
    await expect(page.getByLabel('Search the handbook')).toHaveValue('');
    await expect(page.locator('#sidebar')).not.toHaveClass(/searching/);
  });

  test('a result on the page you are already reading scrolls to it in place', async ({ page }) => {
    await page.goto('/handbook/ch1');
    await page.getByLabel('Search the handbook').fill('Working backward from an income goal');
    await page.locator('.search-result').first().click();
    await expect(page).toHaveURL(/\/handbook\/ch1$/);
    await expect(page.getByRole('heading', { name: 'Working backward from an income goal' })).toBeFocused();
  });

  test('works from the keyboard: Ctrl/Cmd+K, arrows, Escape', async ({ page }) => {
    await page.goto('/handbook/ch1');
    await page.keyboard.press('ControlOrMeta+K');
    await expect(page.getByLabel('Search the handbook')).toBeFocused();
    await page.keyboard.type('crm');
    await expect(page.locator('.search-result').first()).toBeVisible(); // results arrive once the index has loaded
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.search-result').first()).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.search-result').nth(1)).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await expect(page.getByLabel('Search the handbook')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByLabel('Search the handbook')).toHaveValue('');
    await expect(page.locator('#searchResults')).toBeHidden();
  });

  test('Escape from a result returns to the box', async ({ page }) => {
    await page.goto('/handbook/ch1');
    await page.getByLabel('Search the handbook').fill('crm');
    await expect(page.locator('.search-result').first()).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');
    await expect(page.getByLabel('Search the handbook')).toBeFocused();
  });

  test('on a phone the menu button becomes a cross that closes the results, then goes back to the menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/handbook/ch1');
    const toggle = page.locator('#menuToggle');
    await expect(toggle).toHaveText('☰');
    await expect(toggle).toHaveAttribute('aria-label', 'Handbook menu');
    await page.getByLabel('Search the handbook').fill('crm');
    await expect(toggle).toHaveText('✕');
    await expect(toggle).toHaveAttribute('aria-label', 'Close search results');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).toHaveAttribute('aria-controls', 'searchResults');
    await expect(page.locator('html')).toHaveClass(/scroll-locked/);
    await toggle.click();
    await expect(page.getByLabel('Search the handbook')).toHaveValue('');
    await expect(toggle).toHaveText('☰');
    await expect(toggle).toHaveAttribute('aria-label', 'Handbook menu');
    await expect(toggle).toHaveAttribute('aria-controls', 'sidebarBody');
    await expect(page.locator('html')).not.toHaveClass(/scroll-locked/);
    await expect(page.locator('#sidebar')).not.toHaveClass(/menu-open/);
  });

  test('choosing a result closes the phone menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/handbook/ch1');
    await page.getByLabel('Search the handbook').fill('Fair Housing');
    await page.locator('.search-result').first().click();
    await expect(page.locator('#sidebar')).not.toHaveClass(/menu-open|searching/);
    await expect(page.locator('html')).not.toHaveClass(/scroll-locked/);
  });

  test('says so when the index cannot be loaded, and recovers on the next try', async ({ page }) => {
    let fail = true;
    await page.route('**/search-index.json', route => (fail ? route.fulfill({ status: 500, body: 'no' }) : route.continue()));
    await page.goto('/handbook/ch1');
    await page.getByLabel('Search the handbook').fill('crm');
    await expect(page.locator('.search-empty')).toContainText('Search could not load.');
    await expect(page.getByRole('button', { name: 'Retry search' })).toBeVisible();
    fail = false;
    await page.getByLabel('Search the handbook').fill('crm ');
    await page.getByLabel('Search the handbook').fill('crm');
    await page.getByLabel('Search the handbook').blur();
    await page.getByLabel('Search the handbook').focus();
    await expect(page.locator('.search-result').first()).toBeVisible({ timeout: 8000 });
  });
});
