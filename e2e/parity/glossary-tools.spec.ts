import { expect, test } from '@playwright/test';

// Parity checks for glossary popovers (every chapter) and the Appendix E tool index. Assertions were read off
// setupGlossary / openTermPop in legacy/js/widgets-plan.js and goToWidget / trimToolIndex in the other legacy
// scripts, not observed by running the static site.
test.describe('glossary popovers', () => {
  test('marks the first use of a term on a page, once', async ({ page }) => {
    await page.goto('/ch4');
    const crm = page.locator('button.term[data-term="CRM"]');
    await expect(crm).toHaveCount(1);
    await expect(crm).toHaveAttribute('aria-expanded', 'false');
    // later uses of the same term stay plain text
    expect(await page.locator('#content-container').innerText()).toMatch(/CRM[\s\S]*CRM/);
  });

  test('does not mark headings, links, the glossary page or the title page', async ({ page }) => {
    await page.goto('/ch4');
    await expect(page.locator('h2 .term, h3 .term, a .term, th .term, .box-title .term')).toHaveCount(0);
    await page.goto('/app-d');
    await expect(page.locator('.term')).toHaveCount(0);
    await page.goto('/');
    await expect(page.locator('.term')).toHaveCount(0);
  });

  test('clicking a term opens a tooltip with its definition, and clicking again, Escape or elsewhere closes it', async ({ page }) => {
    await page.goto('/ch4');
    await page.waitForLoadState('networkidle'); // the popover listens once the page has hydrated
    const term = page.locator('button.term[data-term="CRM"]');
    await term.click();
    const pop = page.locator('#termPop');
    await expect(pop).toBeVisible();
    await expect(pop.locator('strong')).toHaveText('CRM');
    await expect(pop).toContainText('Full list: Appendix D');
    await expect(term).toHaveAttribute('aria-expanded', 'true');
    await expect(term).toHaveAttribute('aria-describedby', 'termPop');
    await expect(page.locator('#pageStatus')).toContainText('CRM:');
    await term.click();
    await expect(pop).toBeHidden();
    await expect(term).toHaveAttribute('aria-expanded', 'false');
    await term.click();
    await page.keyboard.press('Escape');
    await expect(pop).toBeHidden();
    await expect(term).toBeFocused();
    await term.click();
    await page.locator('h2').first().click();
    await expect(pop).toBeHidden();
  });

  test('keeps the popover inside the viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/ch4');
    await page.waitForLoadState('networkidle'); // the popover listens once the page has hydrated
    await page.locator('button.term[data-term="CRM"]').click();
    const box = (await page.locator('#termPop').boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  });

  test('a term can be opened from the keyboard', async ({ page }) => {
    await page.goto('/ch4');
    await page.waitForLoadState('networkidle'); // the popover listens once the page has hydrated
    await page.locator('button.term[data-term="CRM"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#termPop')).toBeVisible();
  });

  test('every term in the glossary list has a definition from Appendix D', async ({ page }) => {
    // across all chapters, any wrapped term must carry a non-empty definition
    for (const id of ['ch1', 'ch2', 'ch5', 'ch9', 'ch11']) {
      await page.goto(`/${id}`);
      for (const btn of await page.locator('button.term').all()) expect((await btn.getAttribute('data-definition'))!.length).toBeGreaterThan(10);
    }
  });
});

test.describe('tool index (Appendix E)', () => {
  test('lists the 20 tools and links to each', async ({ page }) => {
    await page.goto('/app-e');
    await expect(page.locator('table a[data-widget]')).toHaveCount(20);
  });

  test('every linked tool exists on its page', async ({ page }) => {
    await page.goto('/app-e');
    const links = await page.locator('table a[data-widget]').evaluateAll(els => els.map(e => ({ page: (e as HTMLElement).dataset.goto!, key: (e as HTMLElement).dataset.widget! })));
    for (const { page: id, key } of links) {
      await page.goto(`/${id}`);
      await expect(page.locator(`#content-container [data-widget="${key}"]`).first(), `${id} ${key}`).toBeAttached();
    }
  });

  test('choosing a tool goes to its page and focuses it, without a full reload', async ({ page }) => {
    await page.goto('/app-e');
    await page.evaluate(() => { (window as unknown as { marker: string }).marker = 'same page load'; });
    await page.getByRole('link', { name: 'Objection trainer' }).click();
    await expect(page).toHaveURL(/\/ch9$/);
    await expect(page.locator('[data-widget="objection-trainer"]')).toBeFocused();
    expect(await page.evaluate(() => (window as unknown as { marker?: string }).marker)).toBe('same page load');
  });

  test('a tool on the page you are already on is focused in place', async ({ page }) => {
    await page.goto('/app-e');
    await page.getByRole('link', { name: 'Appendix D' }).click();
    await expect(page).toHaveURL(/\/app-d$/);
  });

  test('with Essential tools only, the rows for tools that are not built are removed', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('handbookSettings', JSON.stringify({ essentialOnly: true })));
    await page.goto('/app-e');
    await expect(page.locator('table tbody tr:visible')).toHaveCount(5);
    await expect(page.locator('table tbody tr:visible a')).toHaveText(['Income goal calculator', 'Speed-to-lead explorer', 'Script practice', 'Objection trainer', 'Weekly activity scorecard']);
  });

  test('reports a tool that cannot be found, naming the setting when it is the cause', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('handbookSettings', JSON.stringify({ essentialOnly: true })));
    await page.goto('/app-e');
    await page.evaluate(() => {
      const a = document.querySelector('a[data-widget="lead-sources"]') as HTMLElement;
      a.closest('tr')!.hidden = false; // the link is hidden by the setting; click it directly
      a.click();
    });
    await expect(page).toHaveURL(/\/ch2$/);
    await expect(page.locator('#pageStatus')).toHaveText('That tool is off while Essential tools only is on. Turn it off in Settings to open this one.');
  });
});
