import { expect, test } from './fixtures';

// Heading levels changed. These checks keep the chapter looking like it did, and the landmarks real.
test('a chapter has one h1, real landmarks, and the previous heading sizes', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/handbook/ch1');

  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText('1. Mindset and business foundations');
  await expect(page.locator('article.chapter-section')).toHaveCount(1);
  await expect(page.locator('p.sidebar-title')).toHaveText('Finding, Nurturing, and Keeping Clients');
  await expect(page.locator('search.nav-search')).toHaveCount(1);
  // a searchbox is not a disclosure: the result count in #searchStatus is what announces the results
  await expect(page.locator('#navSearch')).not.toHaveAttribute('aria-controls');
  await expect(page.locator('#navSearch')).not.toHaveAttribute('aria-expanded');

  const objectives = page.locator('.learning-objectives h2');
  await expect(objectives).toHaveCSS('text-transform', 'uppercase');
  await expect(objectives).toHaveCSS('font-size', '13.6px');

  const section = page.locator('#you-own-a-business-now');
  await expect(section).toHaveCSS('font-size', '21.6px');
  await expect(section).toHaveCSS('border-bottom-width', '0px');
  await expect(page.locator('h1')).toHaveCSS('font-size', '32px');
  await expect(page.locator('h1')).toHaveCSS('border-bottom-width', '2px');

  const note = page.locator('aside.box.field-note');
  await expect(note.locator('h3.box-title')).toHaveCSS('font-size', '12px');
  await expect(note.locator('h3.box-title')).toHaveCSS('color', 'rgb(3, 105, 161)');
  // the marker is drawn, not announced: the heading is named by its words alone
  await expect(note.getByRole('heading', { level: 3, name: 'FIELD NOTE', exact: true })).toBeVisible();
  expect(await note.locator('h3.box-title').evaluate(el => getComputedStyle(el, '::before').content)).toContain('●');
  await expect(page.locator('aside.box.try-it ul li')).toHaveCount(5);

  await expect(page.locator('table caption').first()).toContainText('Table 1.1');
  await expect(page.locator('figure.diagram-box img')).toBeVisible();
});

test('every reference table is named by a caption, including the sortable ones', async ({ page }) => {
  for (const [id, tables] of [['app-b', 6], ['app-e', 1], ['app-f', 1], ['ch2', 1], ['ch9', 2]] as const) {
    await page.goto(`/handbook/${id}`);
    const table = page.locator('#content-container table');
    await expect(table).toHaveCount(tables);
    for (let i = 0; i < tables; i++) await expect(table.nth(i).locator('caption')).not.toBeEmpty();
  }
});

test('the plan page title is the only h1 and keeps the old title size', async ({ page }) => {
  await page.goto('/handbook/plan');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText('My reading plan');
  await expect(page.locator('h1')).toHaveCSS('font-size', '32px');
});
