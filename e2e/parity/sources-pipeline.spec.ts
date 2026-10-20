import { expect, test, type Locator, type Page } from '@playwright/test';

// Parity checks for the lead-source comparison (ch2) and the pipeline calculator (ch12). Assertions were read off
// setupLeadSources and setupPipelineCalculator in legacy/js/widgets-practice.js, not observed by running the
// static site.
const widgets = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('handbookState') ?? '{}').widgets ?? {});
const field = (scope: Locator, label: string) => scope.locator('label', { hasText: label }).locator('input, select').first();

test.describe('lead source comparison', () => {
  test('draws the five illustrative ranges before anything is entered', async ({ page }) => {
    await page.goto('/ch2');
    await expect(page.locator('[data-widget="lead-sources"]')).toBeVisible();
    await expect(page.locator('.range-row')).toHaveCount(5);
    await expect(page.locator('.range-label')).toHaveText(['15–30%+', '1–5%', '2–6%', '5–15%', '3–8%']);
    await expect(page.locator('.range-fill.is-open')).toHaveCount(1);
    await expect(page.locator('.range-axis span')).toHaveText(['0%', '10%', '20%', '30%+']);
    await expect(page.locator('.cost-out').first()).toHaveText('');
    await expect(page.locator('.cost-summary')).toHaveText('');
  });

  test('prices time at the hourly rate, compares sources and nudges for a rate', async ({ page }) => {
    await page.goto('/ch2');
    const zillow = page.locator('fieldset.cost-row', { hasText: 'Zillow Premier Agent' });
    const sphere = page.locator('fieldset.cost-row', { hasText: 'Sphere of influence' });
    await field(zillow, 'Money spent').fill('1000');
    await field(zillow, 'Hours spent').fill('10');
    await expect(zillow.locator('.cost-out')).toHaveText('$1,000 invested, no closings yet');
    await field(zillow, 'Closings').fill('2');
    await expect(zillow.locator('.cost-out')).toHaveText('$1,000 invested → $500 per closed deal');
    await expect(page.locator('.cost-summary')).toHaveText('Enter a second source to compare.');
    await field(sphere, 'Hours spent').fill('20');
    await field(sphere, 'Closings').fill('4');
    await expect(page.locator('.cost-summary')).toHaveText('Lowest cost per closed deal: Sphere of influence and referrals ($0). Highest: Zillow Premier Agent ($500). Add a rate for your time to see the true comparison.');
    await page.getByLabel('Value of your time, $ per hour').fill('25');
    await expect(zillow.locator('.cost-out')).toHaveText('$1,250 invested → $625 per closed deal');
    await expect(sphere.locator('.cost-out')).toHaveText('$500 invested → $125 per closed deal');
    await expect(page.locator('.cost-summary')).toHaveText('Lowest cost per closed deal: Sphere of influence and referrals ($125). Highest: Zillow Premier Agent ($625). ');
  });

  test('numbers save with the static site shape and survive a reload, formatted', async ({ page }) => {
    await page.goto('/ch2');
    await page.getByLabel('Value of your time, $ per hour').fill('1500');
    await page.getByLabel('Value of your time, $ per hour').blur();
    await expect(page.getByLabel('Value of your time, $ per hour')).toHaveValue('1,500');
    const zillow = page.locator('fieldset.cost-row', { hasText: 'Zillow Premier Agent' });
    await field(zillow, 'Closings').fill('3');
    expect((await widgets(page)).sourceCost).toEqual({ rate: 1500, rows: { zillow: { closings: 3 } } });
    await page.reload();
    await expect(page.getByLabel('Value of your time, $ per hour')).toHaveValue('1,500');
    await expect(field(page.locator('fieldset.cost-row', { hasText: 'Zillow Premier Agent' }), 'Closings')).toHaveValue('3');
  });
});

test.describe('pipeline calculator', () => {
  // a new contact is an active opportunity until its type is changed, so the count starts at one
  test('starts with one empty contact: no value yet, and it counts as an active opportunity', async ({ page }) => {
    await page.goto('/ch12');
    await expect(page.locator('[data-widget="pipeline-calculator"]')).toBeVisible();
    await expect(page.locator('.pipe-row')).toHaveCount(1);
    await expect(page.locator('.calc-stat-value')).toHaveText(['$0', '1', '0']);
    await expect(page.locator('.calc-stat-label')).toHaveText(['pipeline value', 'active opportunity (aim for 5+ by day 90)', 'contacts need a Monday call']);
  });

  test('sums commission of active opportunities and flags quiet contacts for a Monday call', async ({ page }) => {
    await page.goto('/ch12');
    const row = page.locator('.pipe-row').first();
    await field(row, 'Likely commission').fill('$5,000');
    await expect(page.locator('.calc-stat-value')).toHaveText(['$5,000', '1', '0']);
    await expect(page.locator('.calc-stat-label').nth(1)).toHaveText('active opportunity (aim for 5+ by day 90)');
    await field(row, 'Days since').fill('14');
    await expect(row.locator('.pipe-flag')).toHaveText('⚑ Call Monday: 14 days quiet, no next step');
    await expect(page.locator('.calc-stat-value').nth(2)).toHaveText('1');
    await expect(page.locator('.calc-stat-label').nth(2)).toHaveText('contact needs a Monday call');
    await row.getByLabel('Next step scheduled').check();
    await expect(row.locator('.pipe-flag')).toHaveText('');
    await expect(page.locator('.calc-stat-value').nth(2)).toHaveText('0');
    await field(row, 'Type').selectOption('Nurture');
    await expect(page.locator('.calc-stat-value')).toHaveText(['$0', '0', '0']);
  });

  test('adds and removes contacts, always leaving one, and saves the rows', async ({ page }) => {
    await page.goto('/ch12');
    await field(page.locator('.pipe-row').first(), 'Contact (initials ok)').fill('J.R.');
    await page.getByRole('button', { name: '+ Add a contact' }).click();
    await expect(page.locator('.pipe-row legend')).toHaveText(['Contact 1', 'Contact 2']);
    await field(page.locator('.pipe-row').nth(1), 'Likely commission').fill('8000');
    expect((await widgets(page)).pipeline.rows).toEqual([{ name: 'J.R.' }, { commission: 8000 }]);
    await page.getByRole('button', { name: 'Remove contact 1' }).click();
    await expect(page.locator('.pipe-row')).toHaveCount(1);
    await expect(field(page.locator('.pipe-row').first(), 'Likely commission')).toHaveValue('8,000');
    await page.getByRole('button', { name: 'Remove contact 1' }).click();
    await expect(page.locator('.pipe-row')).toHaveCount(1);
    await expect(field(page.locator('.pipe-row').first(), 'Likely commission')).toHaveValue('');
    expect((await widgets(page)).pipeline.rows).toEqual([{}]);
  });

  test('contacts survive a reload', async ({ page }) => {
    await page.goto('/ch12');
    const row = page.locator('.pipe-row').first();
    await field(row, 'Contact (initials ok)').fill('Sam');
    await field(row, 'Likely commission').fill('6500');
    await page.reload();
    await expect(field(page.locator('.pipe-row').first(), 'Contact (initials ok)')).toHaveValue('Sam');
    await expect(page.locator('.calc-stat-value').first()).toHaveText('$6,500');
  });

  test('is one of the tools Essential tools only leaves out', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('handbookSettings', JSON.stringify({ essentialOnly: true })));
    await page.goto('/ch12');
    await expect(page.locator('.pipe-row')).toHaveCount(0);
    await page.goto('/ch2');
    await expect(page.locator('.cost-calc')).toHaveCount(0);
  });
});
