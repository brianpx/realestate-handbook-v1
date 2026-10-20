import { expect, test, type Page } from '@playwright/test';

// Parity checks for the goal calculator (ch1), speed-to-lead explorer and response timer (ch4). Assertions were
// read off setupGoalCalculator, setupSpeedToLead and setupResponseTimer in legacy/js/widgets.js, not observed
// by running the static site.
const calc = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('handbookState') ?? '{}').calc ?? {});
const goal = (page: Page) => page.getByLabel('Income goal for the year');
const commission = (page: Page) => page.getByLabel('Average commission per closed side after splits');
const weeks = (page: Page) => page.getByLabel('Working weeks');
const outputCell = (page: Page, step: string) => page.locator('tr', { hasText: step }).locator('td').nth(2);

test.describe('goal calculator', () => {
  test('starts with the default ratios filled in and waits for a goal', async ({ page }) => {
    await page.goto('/ch1');
    await expect(page.locator('[data-widget="goal-calculator"]')).toBeVisible();
    await expect(page.getByLabel(/^Appointments needed per closing/)).toHaveValue('3');
    await expect(page.getByLabel(/^Conversations needed per appointment/)).toHaveValue('20');
    await expect(weeks(page)).toHaveValue('48');
    await expect(outputCell(page, 'Closings needed')).toHaveText('—');
    await expect(page.locator('.calc-empty')).toHaveText('Enter your income goal and average commission to see your daily conversation target.');
  });

  test('reproduces the worked example and saves it', async ({ page }) => {
    await page.goto('/ch1');
    await goal(page).fill('$80,000');
    await commission(page).fill('6500');
    await expect(outputCell(page, 'Closings needed')).toHaveText('13');
    await expect(outputCell(page, 'Appointments needed')).toContainText('= 39 appointments');
    await expect(outputCell(page, 'Conversations needed per appointment')).toContainText('≈ 780 conversations');
    await expect(outputCell(page, 'Conversations per week')).toHaveText('≈ 16');
    await expect(outputCell(page, 'Conversations per working day')).toHaveText('3 to 4');
    await expect(page.locator('.calc-stat-value')).toHaveText(['13', '16', '3 to 4']);
    await expect(page.locator('.calc-verdict')).toHaveText(/^That sits inside the 15 to 25 conversations a week/);
    await goal(page).blur();
    await expect(goal(page)).toHaveValue('80,000');
    expect(await calc(page)).toMatchObject({ goal: 80000, commission: 6500 });
    await page.reload();
    await expect(goal(page)).toHaveValue('80,000');
    await expect(outputCell(page, 'Closings needed')).toHaveText('13');
  });

  test('picks up numbers saved by the static site', async ({ page }) => {
    await page.addInitScript(() => {
      if (!localStorage.getItem('handbookState')) localStorage.setItem('handbookState', JSON.stringify({ calc: { goal: 80000, commission: 6500, apc: 3, cpa: 20, weeks: 48 } }));
    });
    await page.goto('/ch1');
    await expect(outputCell(page, 'Conversations per week')).toHaveText('≈ 16');
  });

  test('the stress test raises the weekly target and says so', async ({ page }) => {
    await page.goto('/ch1');
    await goal(page).fill('80000');
    await commission(page).fill('6500');
    const asEntered = page.getByRole('button', { name: 'Ratios as entered' });
    await expect(asEntered).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: '50% more conversations' }).click();
    await expect(asEntered).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('.calc-verdict')).toHaveText(/^At 50% more conversations than planned you would need 24 a week, up from 16\./);
    await expect(outputCell(page, 'Conversations per week')).toHaveText('≈ 24');
  });

  test('explains bad input and drops the stored value', async ({ page }) => {
    await page.goto('/ch1');
    await goal(page).fill('80000');
    await goal(page).fill('abc');
    await expect(goal(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(outputCell(page, 'Income goal').locator('.calc-error')).toHaveText('Numbers only, for example 1500.');
    expect(await calc(page)).toEqual({});
    await goal(page).fill('0');
    await expect(outputCell(page, 'Income goal').locator('.calc-error')).toHaveText('Enter 1 or more.');
    await weeks(page).fill('60');
    await expect(outputCell(page, 'Working weeks').locator('.calc-error')).toHaveText('Enter 52 or fewer.');
  });

  test('a cleared ratio stays empty this visit and returns to its default next visit', async ({ page }) => {
    await page.goto('/ch1');
    await goal(page).fill('80000');
    await commission(page).fill('6500');
    await weeks(page).fill('');
    await expect(outputCell(page, 'Conversations per week')).toHaveText('—');
    await page.reload();
    await expect(weeks(page)).toHaveValue('48');
  });

  test('the footnote opens as a dialog and closes again', async ({ page }) => {
    await page.goto('/ch1');
    await page.getByRole('button', { name: 'Read the footnote' }).click();
    await expect(page.getByRole('dialog', { name: 'How the example numbers were derived' })).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.locator('#calc-footnote')).toBeHidden();
  });

  test('without JavaScript the ladder still reads, with its example column', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('http://localhost:3187/ch1');
    await expect(page.locator('tr', { hasText: 'Income goal for the year' }).locator('td').nth(1)).toHaveText('$80,000');
    await context.close();
  });
});

test.describe('speed-to-lead explorer', () => {
  test('starts at 10 minutes and follows the slider through the three bands', async ({ page }) => {
    await page.goto('/ch4');
    const slider = page.locator('#speedSlider, .speed-slider');
    await expect(page.locator('.speed-when')).toHaveText('If you respond in 10 min');
    await expect(page.locator('.speed-band')).toHaveText('Strong conversion');
    await slider.fill('0');
    await expect(page.locator('.speed-band')).toHaveText('Highest conversion window');
    await expect(slider).toHaveAttribute('aria-valuetext', '1 min: Highest conversion window');
    await slider.fill('8');
    await expect(page.locator('.speed-when')).toHaveText('If you respond in 24 hr');
    await expect(page.locator('.speed-band')).toHaveText('Sharp drop-off');
  });

  test('works from the keyboard', async ({ page }) => {
    await page.goto('/ch4');
    await page.locator('.speed-slider').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.speed-when')).toHaveText('If you respond in 20 min');
  });

  // Chromium with scripting disabled keeps <noscript> content as text, so check the server HTML itself.
  test('the three-band list is in the server HTML for readers without JavaScript', async ({ request }) => {
    const html = await (await request.get('/ch4')).text();
    expect(html).toMatch(/<noscript><p>• <strong>Under 5 Minutes:<\/strong> Highest conversion window\./);
    expect(html).toContain('<strong>After 30 Minutes:</strong> Sharp drop-off.');
  });
});

test.describe('response timer', () => {
  test('replies cannot be stamped before Start, and Reset clears everything', async ({ page }) => {
    await page.goto('/ch4');
    const text = page.getByRole('button', { name: 'Text arrived' });
    await expect(text).toBeDisabled();
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Restart' })).toBeVisible();
    await text.click();
    await expect(page.locator('.timer-results li')).toHaveText(/^Text: 0:0\d\. Meets the standard \(automated first touch within 1 minute\)\.$/);
    await expect(text).toBeDisabled();
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await expect(page.locator('.timer-results li')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeVisible();
    await expect(text).toBeDisabled();
  });

  test('a slow reply names the band', async ({ page }) => {
    await page.clock.install();
    await page.goto('/ch4');
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.clock.fastForward(6 * 60_000);
    await page.getByRole('button', { name: 'Call arrived' }).click();
    await expect(page.locator('.timer-results li')).toHaveText('Call: 6:00. Slower than the standard (live call within 5 minutes). Strong conversion.');
    await expect(page.locator('.timer-slow')).toHaveCount(1);
  });

  test('Essential tools only removes the timer but keeps the explorer and calculator', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('handbookSettings', JSON.stringify({ essentialOnly: true })));
    await page.goto('/ch4');
    await expect(page.locator('.speed-timer')).toHaveCount(0);
    await expect(page.locator('.speed-widget')).toBeVisible();
    await page.goto('/ch1');
    await expect(page.locator('.calc-panel')).toBeVisible();
  });
});
