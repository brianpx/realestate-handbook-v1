import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { BASE_URL } from './target';

// The page that replaces the old address at cutover (docs/cutover/pages-stub-index.html). The old address is
// stood in for by an intercepted fake host; the "new site" is this app.
const NEW = BASE_URL;
const OLD = 'https://old-host.test/realestate-handbook-v1/';
const stub = readFileSync('docs/cutover/pages-stub-index.html', 'utf8').replaceAll('__NEW_ORIGIN__', NEW);

test.beforeEach(async ({ page }) => {
  await page.route('https://old-host.test/**', route => route.fulfill({ contentType: 'text/html', body: stub }));
});

const PAGES = ['pref', ...Array.from({ length: 13 }, (_, i) => `ch${i + 1}`), ...'abcdef'.split('').map(l => `app-${l}`)];

test.describe('a reader with no saved progress', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const id of PAGES) {
    test(`/#${id} goes to the same chapter on the new site`, async ({ page }) => {
      await page.goto(`${OLD}#${id}`);
      await expect(page).toHaveURL(`${NEW}/handbook/${id}`);
    });
  }

  test('the title page, an empty hash and an unknown hash go to the new home page', async ({ page }) => {
    for (const hash of ['#cover', '', '#nonsense', '#ch99', '#CH5']) {
      await page.goto(`${OLD}${hash}`);
      await expect(page).toHaveURL(`${NEW}/`);
    }
  });
});

test.describe('a reader with saved progress', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  const progress = { read: { ch1: true, ch2: true }, checks: { 'ch12-d1:0': true }, widgets: { checkpoints: { 'ch4:0': { status: 'got' } } } };

  test('is offered the file first, and nothing is redirected until they continue', async ({ page }) => {
    await page.addInitScript(p => { localStorage.setItem('handbookState', JSON.stringify(p)); localStorage.setItem('handbookSettings', '{"dark":true}'); }, progress);
    await page.goto(`${OLD}#ch5`);
    await expect(page.getByText('You have saved progress on this device.')).toBeVisible();
    await page.waitForTimeout(1200);
    expect(page.url()).toBe(`${OLD}#ch5`);
    await expect(page.locator('#go')).toHaveAttribute('href', `${NEW}/handbook/ch5`);
  });

  test('the file it writes restores on the new site, migrated, and Continue lands on the same chapter', async ({ page }) => {
    await page.addInitScript(p => { localStorage.setItem('handbookState', JSON.stringify(p)); localStorage.setItem('handbookSettings', '{"dark":true}'); }, progress);
    await page.goto(`${OLD}#ch5`);
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download my progress' }).click()]);
    const file = download.suggestedFilename();
    expect(file).toMatch(/^handbook-progress-\d{4}-\d{2}-\d{2}\.json$/);
    const path = (await download.path())!;
    expect(JSON.parse(readFileSync(path, 'utf8'))).toMatchObject({ format: 'handbook-progress', version: 1, handbookState: progress, handbookSettings: { dark: true } });
    await expect(page.locator('#saved')).toHaveText('Progress downloaded. Now continue to the new handbook.');
    await page.locator('#go').click();
    await expect(page).toHaveURL(`${NEW}/handbook/ch5`);
    // the new site starts empty (a different origin), then restores the file
    await page.evaluate(() => localStorage.setItem('handbookAccess', '1'));
    await page.reload();
    await page.locator('details.settings summary').click();
    await page.setInputFiles('#settingImportFile', path);
    await page.getByRole('button', { name: 'Replace my progress' }).click();
    await expect(page.locator('#progressLabel')).toHaveText('2 of 20 sections read');
    const widgets = await page.evaluate(() => JSON.parse(localStorage.getItem('handbookState')!).widgets);
    expect(widgets.checkpoints).toEqual({ 'ch4:1': { status: 'got' } });
  });

  test('a reader whose storage holds only empty objects is treated as having none', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('handbookState', '{}'); });
    await page.goto(`${OLD}#ch2`);
    await expect(page).toHaveURL(`${NEW}/handbook/ch2`);
  });
});

test('without JavaScript the page sends the reader to the new home page by meta refresh', async ({ browser }) => {
  // a hash cannot be mapped without a script, so the chapter is lost but the reader still lands on the new handbook
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.route('https://old-host.test/**', route => route.fulfill({ contentType: 'text/html', body: stub }));
  await page.goto(`${OLD}#ch5`);
  await expect(page).toHaveURL(`${NEW}/`);
  await context.close();
});
