import { expect, test, type Page } from '@playwright/test';

// Parity checks for the checklists (ch12, app-c) and the weekly scorecard (app-a). Assertions were read off
// setupChecklists and setupScorecard in legacy/js/interactive.js, not observed by running the static site.
const checks = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('handbookState') ?? '{}').checks ?? {});
const score = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('handbookState') ?? '{}').scorecard ?? {});
// The activity name is a row header, then the target, then one cell per week.
const cell = (page: Page, row: string, week: number) => page.locator(`tr[data-row="${row}"] td`).nth(1 + week);

test.describe('checklists', () => {
  test('ch12 has three lists with meters and an overall total, and no INTERACTIVE strip', async ({ page }) => {
    await page.goto('/handbook/ch12');
    await expect(page.locator('.checklist')).toHaveCount(3);
    await expect(page.locator('.check-item')).toHaveCount(14);
    await expect(page.locator('.checklist-total')).toHaveText('Overall: 0 of 14 complete (0%)');
    await expect(page.locator('[data-widget="crm-checklists"]')).toHaveCount(0);
    await expect(page.locator('.checklist-count').first()).toHaveText('0 of 6 complete');
  });

  test('ticks update the meters and persist under the same keys as the static site', async ({ page }) => {
    await page.goto('/handbook/ch12');
    await page.locator('[data-checklist="ch12-d1"] .check-item input').first().check();
    await expect(page.locator('[data-checklist="ch12-d1"] .checklist-count')).toHaveText('1 of 6 complete');
    await expect(page.locator('.checklist-total')).toHaveText('Overall: 1 of 14 complete (7%)');
    expect(await checks(page)).toEqual({ 'ch12-d1:0': true });
    await page.reload();
    await expect(page.locator('[data-checklist="ch12-d1"] .check-item input').first()).toBeChecked();
    await expect(page.locator('.checklist-total')).toHaveText('Overall: 1 of 14 complete (7%)');
  });

  test('ticks saved by the static site are picked up', async ({ page }) => {
    await page.addInitScript(() => {
      if (!localStorage.getItem('handbookState')) localStorage.setItem('handbookState', JSON.stringify({ checks: { 'app-c-profile:1': true, 'app-c-profile:2': true } }));
    });
    await page.goto('/handbook/app-c');
    await expect(page.locator('[data-checklist="app-c-profile"] .checklist-count')).toHaveText('2 of 5 complete');
    await expect(page.locator('.checklist-total')).toHaveText('Overall: 2 of 23 complete (9%)');
    await expect(page.locator('[data-widget="crm-checklists"]')).toBeVisible();
  });

  test('a checkbox toggles from the keyboard', async ({ page }) => {
    await page.goto('/handbook/app-c');
    const first = page.locator('[data-checklist="app-c-profile"] .check-item input').first();
    await first.focus();
    await page.keyboard.press('Space');
    await expect(first).toBeChecked();
    expect(await checks(page)).toEqual({ 'app-c-profile:0': true });
  });

  test('Essential tools only turns the checklists back into plain, unsaved checkboxes', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('handbookSettings', JSON.stringify({ essentialOnly: true })));
    await page.goto('/handbook/app-c');
    await expect(page.locator('.check-item')).toHaveCount(23);
    await expect(page.locator('.checklist-meter')).toHaveCount(0);
    await expect(page.locator('.checklist-total')).toHaveCount(0);
    await expect(page.locator('[data-widget="crm-checklists"]')).toHaveCount(0);
    await page.locator('.check-item input').first().check();
    expect(await checks(page)).toEqual({});
  });
});

test.describe('checklists and scorecard without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the lists and the table still read', async ({ page }) => {
    await page.goto('/handbook/ch12');
    await expect(page.locator('.check-item')).toHaveCount(14);
    await page.goto('/handbook/app-a');
    await expect(page.locator('table.scorecard tbody tr[data-row]')).toHaveCount(13);
    await expect(page.locator('table.scorecard tbody tr').first().locator('td').first()).toHaveText('40 to 60');
  });
});

test.describe('scorecard', () => {
  test('shows each row, with an INTERACTIVE strip, the empty chart message and no total yet', async ({ page }) => {
    await page.goto('/handbook/app-a');
    await expect(page.locator('[data-widget="scorecard"]')).toBeVisible();
    await expect(page.locator('table.scorecard tbody tr[data-row]')).toHaveCount(13);
    await expect(page.locator('.score-chart')).toHaveText('Enter your numbers to see how many weekly targets you hit.');
    await expect(page.locator('.score-total td').nth(1)).toHaveText('');
  });

  test('colours cells against the target and totals the targets hit', async ({ page }) => {
    await page.goto('/handbook/app-a');
    const calls = (w: number) => cell(page, 'calls', w).locator('input');
    await calls(0).fill('45');
    await calls(1).fill('25'); // half of 40 is 20, so 25 is close
    await calls(2).fill('10');
    await expect(cell(page, 'calls', 0)).toHaveAttribute('data-status', 'hit');
    await expect(cell(page, 'calls', 1)).toHaveAttribute('data-status', 'close');
    await expect(cell(page, 'calls', 2)).toHaveAttribute('data-status', 'miss');
    await expect(cell(page, 'calls', 0).locator('.score-status')).toHaveText('✓ Hit');
    await expect(calls(0)).toHaveAttribute('aria-label', 'Outbound calls (sphere, database, new leads), week 1, hit');
    await expect(page.locator('.score-total td').nth(1)).toHaveText('1 of 10');
    await expect(page.locator('.score-total td').nth(2)).toHaveText('0 of 10');
    await expect(page.locator('svg.score-svg')).toHaveAttribute('aria-label', 'Weekly targets hit out of 10');
  });

  test('a growing row compares with the previous week', async ({ page }) => {
    await page.goto('/handbook/app-a');
    await cell(page, 'pipeline-count', 0).locator('input').fill('4');
    await expect(cell(page, 'pipeline-count', 0)).toHaveAttribute('data-status', '');
    await cell(page, 'pipeline-count', 1).locator('input').fill('6');
    await expect(cell(page, 'pipeline-count', 1)).toHaveAttribute('data-status', 'hit');
    await cell(page, 'pipeline-count', 2).locator('input').fill('5');
    await expect(cell(page, 'pipeline-count', 2)).toHaveAttribute('data-status', 'miss');
    await cell(page, 'referrals', 0).locator('input').fill('2');
    await expect(cell(page, 'referrals', 0)).toHaveAttribute('data-status', '');
  });

  test('rejects text, says why, and stores nothing for that cell', async ({ page }) => {
    await page.goto('/handbook/app-a');
    const input = cell(page, 'calls', 0).locator('input');
    await input.fill('40');
    expect(await score(page)).toEqual({ 'calls:0': 40 });
    await input.fill('abc');
    await expect(cell(page, 'calls', 0).locator('.calc-error')).toHaveText('Numbers only.');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(await score(page)).toEqual({});
    await input.fill('$1,5');
    await expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(await score(page)).toEqual({ 'calls:0': 15 });
  });

  test('numbers and the note persist across a reload', async ({ page }) => {
    await page.goto('/handbook/app-a');
    await cell(page, 'calls', 0).locator('input').fill('45');
    await page.locator('#scoreChange').fill('Call earlier');
    await page.reload();
    await expect(cell(page, 'calls', 0).locator('input')).toHaveValue('45');
    await expect(page.locator('#scoreChange')).toHaveValue('Call earlier');
    expect(await score(page)).toEqual({ 'calls:0': 45, change: 'Call earlier' });
  });

  test('Clear asks first, Cancel and Escape keep the numbers, Yes clears numbers and note', async ({ page }) => {
    await page.goto('/handbook/app-a');
    await cell(page, 'calls', 0).locator('input').fill('45');
    await page.locator('#scoreChange').fill('Call earlier');
    const clear = page.getByRole('button', { name: 'Clear scorecard' });
    await clear.click();
    await expect(page.getByRole('group', { name: 'Confirm clearing the scorecard' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(clear).toBeVisible();
    await expect(clear).toBeFocused();
    await expect(cell(page, 'calls', 0).locator('input')).toHaveValue('45');
    await clear.click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(cell(page, 'calls', 0).locator('input')).toHaveValue('45');
    await clear.click();
    await page.getByRole('button', { name: 'Yes, clear it' }).click();
    await expect(cell(page, 'calls', 0).locator('input')).toHaveValue('');
    await expect(page.locator('#scoreChange')).toHaveValue('');
    await expect(page.locator('.score-chart')).toHaveText('Enter your numbers to see how many weekly targets you hit.');
    await expect(clear).toBeFocused();
    expect(await score(page)).toEqual({});
  });

  test('announces the weekly totals after typing settles', async ({ page }) => {
    await page.goto('/handbook/app-a');
    await cell(page, 'calls', 0).locator('input').fill('45');
    await expect(page.locator('#app-a > .visually-hidden[aria-live="polite"]')).toHaveText('week 1: 1 of 10 targets hit');
  });
});
