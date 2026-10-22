import { expect, test, type Page } from '@playwright/test';

// Parity checks for the practice tools of items 6: qualifying drill (ch5), pitfall cycle and six-errors
// self-score (ch7), consultation lab (ch9) and Fair Housing drill (ch11). Assertions were read off
// legacy/js/widgets-practice.js, not observed by running the static site.
const widgets = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('handbookState') ?? '{}').widgets ?? {});

test.describe('qualifying drill', () => {
  test('starts on lead 1, asks for a stage before grading, and grades a correct answer', async ({ page }) => {
    await page.goto('/handbook/ch5');
    await expect(page.locator('[data-widget="qualifying-drill"]')).toBeVisible();
    await expect(page.locator('.drill-progress')).toHaveText('Lead 1 of 4 · 0 done');
    await page.getByRole('button', { name: 'Check my answer' }).click();
    await expect(page.locator('.drill .drill-feedback')).toHaveText('Choose a stage first.');
    for (const f of ['Timeline', 'Motivation', 'Financing']) await page.getByLabel(f, { exact: true }).check();
    await page.getByLabel('Active opportunity (gets calls)').check();
    await page.getByRole('button', { name: 'Check my answer' }).click();
    await expect(page.locator('.drill .drill-feedback strong')).toHaveText('✓ Correct.');
    await expect(page.locator('.drill .drill-feedback li')).toHaveText(['Timeline: answered', 'Motivation: answered', 'Financing: answered', 'Representation: still to ask']);
    await expect(page.locator('.drill .drill-feedback .nurture-sample')).toHaveText('Ask next (Representation): "Are you working with anyone on this yet?"');
    await expect(page.getByRole('button', { name: 'Check my answer' })).toBeDisabled();
    expect((await widgets(page)).qualify).toEqual({ '0': true });
  });

  test('flags fields marked the wrong way and a wrong stage, then moves on and wraps around', async ({ page }) => {
    await page.goto('/handbook/ch5');
    await page.getByLabel('Nurture (follow-up plan)').check();
    await page.getByRole('button', { name: 'Check my answer' }).click();
    await expect(page.locator('.drill .drill-feedback strong')).toHaveText('✗ Not quite.');
    await expect(page.locator('.drill .drill-feedback li').first()).toHaveText('Timeline: answered (you marked this the other way)');
    await expect(page.locator('.drill .drill-feedback')).toContainText('Stage: active opportunity.');
    expect((await widgets(page)).qualify).toEqual({ '0': false });
    for (let n = 2; n <= 4; n++) {
      await page.getByRole('button', { name: 'Next lead →' }).click();
      await expect(page.locator('.drill-progress')).toHaveText(`Lead ${n} of 4 · ${n - 1} done`);
      await page.getByLabel('Nurture (follow-up plan)').check();
      await page.getByRole('button', { name: 'Check my answer' }).click();
    }
    await page.locator('.drill').getByRole('button', { name: 'Start over' }).click();
    await expect(page.locator('.drill-progress')).toHaveText('Lead 1 of 4 · 4 done');
    await expect(page.getByLabel('Timeline', { exact: true })).not.toBeChecked();
  });

  test('a lead with all four answered has nothing left to ask', async ({ page }) => {
    await page.goto('/handbook/ch5');
    for (let n = 0; n < 2; n++) {
      await page.getByLabel('Nurture (follow-up plan)').check();
      await page.getByRole('button', { name: 'Check my answer' }).click();
      await page.getByRole('button', { name: 'Next lead →' }).click();
    }
    for (const f of ['Timeline', 'Motivation', 'Financing', 'Representation']) await page.getByLabel(f, { exact: true }).check();
    await page.getByLabel('Active opportunity (gets calls)').check();
    await page.getByRole('button', { name: 'Check my answer' }).click();
    await expect(page.locator('.drill .drill-feedback strong')).toHaveText('✓ Correct.');
    await expect(page.locator('.drill .drill-feedback .nurture-sample')).toHaveCount(0);
  });
});

test.describe('pitfall cycle', () => {
  test('switching the four parts on and off marks which links they interrupt', async ({ page }) => {
    await page.goto('/handbook/ch7');
    await expect(page.locator('.cycle-status')).toHaveText('With nothing installed, the loop runs on its own: each link causes the next.');
    const crm = page.getByRole('button', { name: 'CRM + follow-up plans' });
    await expect(crm).toHaveAttribute('aria-pressed', 'false');
    await crm.click();
    await expect(crm).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.cycle-node.is-broken')).toHaveCount(2);
    await expect(page.locator('.cycle-badge').first()).toHaveText('Interrupted by CRM + follow-up plans');
    await expect(page.locator('.cycle-status')).toContainText('Interrupted at 2 of 5 links.');
    for (const name of ['Protected daily block', 'Activity tracking', 'Friday review']) await page.getByRole('button', { name }).click();
    await expect(page.locator('.cycle-node.is-broken')).toHaveCount(5);
    await expect(page.locator('.cycle-badge').first()).toHaveText('Interrupted by CRM + follow-up plans and Protected daily block');
    await crm.click();
    await expect(page.locator('.cycle-status')).toContainText('Interrupted at 5 of 5 links.');
  });

  test('the plain figure text is in the server HTML for readers without JavaScript', async ({ request }) => {
    const html = await (await request.get('/ch7')).text();
    expect(html).toContain('<noscript><p>Slow follow-up ➔ Lost leads');
  });
});

test.describe('six-errors self-score', () => {
  test('lists six errors with 1 to 5 scores and waits for a rating', async ({ page }) => {
    await page.goto('/handbook/ch7');
    await expect(page.locator('[data-widget="error-self-score"]')).toBeVisible();
    await expect(page.locator('.score-row')).toHaveCount(6);
    await expect(page.locator('.score-row').first().locator('input[type=radio]')).toHaveCount(5);
    await expect(page.locator('.score-result')).toHaveText('Rate at least one error to see where to start.');
  });

  test('ranks the rated errors, starts with the highest and links to the chapter that fixes it', async ({ page }) => {
    await page.goto('/handbook/ch7');
    const legend = (i: number) => page.locator('.score-row legend').nth(i);
    const names = [await legend(0).innerText(), await legend(2).innerText()];
    await page.locator('.score-row').nth(0).locator('label.score-opt', { hasText: /^4$/ }).click();
    await page.locator('.score-row').nth(2).locator('label.score-opt', { hasText: /^5$/ }).click();
    await expect(page.locator('.score-bar-name')).toHaveText([names[1]!, names[0]!]);
    await expect(page.locator('.score-bar-num')).toHaveText(['5', '4']);
    await expect(page.locator('.score-result strong')).toHaveText(`Start with: ${names[1]}`);
    await expect(page.locator('.score-result .calc-note')).toHaveText('You have rated 2 of 6 so far.');
    await expect(page.locator('.score-result .goto')).toHaveText(/^Go to Chapter \d+$/);
    expect((await widgets(page)).selfscore).toEqual({ '0': 4, '2': 5 });
    await page.reload();
    await expect(page.locator('.score-row').nth(2).locator('input:checked')).toHaveValue('5');
  });
});

test.describe('consultation lab', () => {
  test('rebalancing the sliders updates the verdict and the bar description', async ({ page }) => {
    await page.goto('/handbook/ch9');
    await expect(page.locator('.alloc-verdict')).toHaveText('Asking and listening: 15 of 60 minutes (25%). ✗ Below half. Move time from presenting into asking and listening.');
    await expect(page.locator('.alloc-row output').nth(3)).toHaveText('30 min');
    await page.locator('#alloc-3').fill('0');
    await expect(page.locator('.alloc-verdict')).toHaveText('Asking and listening: 15 of 30 minutes (50%). ✓ That meets the "at least half" rule.');
    await expect(page.locator('.alloc-verdict')).toHaveClass(/ok/);
    await expect(page.locator('.alloc-bar')).toHaveAttribute('aria-label', 'Meeting of 30 minutes. Asking and listening take 50 percent.');
  });

  test('the misstep cases grade each pick, then show the score and keep a best', async ({ page }) => {
    await page.goto('/handbook/ch9');
    await expect(page.locator('.drill-progress')).toHaveText('Case 1 of 4 · 0 correct so far');
    await expect(page.locator('.spot .drill-option')).toHaveText(['Frame', 'Ask', 'Listen', 'Present', 'Agree']);
    await page.getByRole('button', { name: 'Frame', exact: true }).click();
    await expect(page.locator('.drill .drill-feedback strong')).toHaveText('✗ Not quite. The answer is "Ask". ');
    await expect(page.locator('.drill-option.is-right')).toHaveText('Ask');
    await expect(page.locator('.drill-option.is-wrong')).toHaveText('Frame');
    await expect(page.locator('.drill-option').first()).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Next case →' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('.drill-progress')).toHaveText('Case 2 of 4 · 0 correct so far');
    for (const [answer, last] of [['Listen', false], ['Agree', false], ['Frame', true]] as const) {
      await page.getByRole('button', { name: answer, exact: true }).click();
      await expect(page.locator('.drill .drill-feedback strong')).toHaveText('✓ Correct. ');
      await page.getByRole('button', { name: last ? 'See your result' : 'Next case →' }).click();
    }
    await expect(page.locator('.drill-score')).toHaveText('3 of 4 correct');
    await expect(page.locator('.spot')).toContainText('Reread the explanations for the ones you missed');
    await expect(page.locator('.spot .calc-note')).toHaveText('Your best score on this device: 3 of 4.');
    expect((await widgets(page)).consultMisstep).toEqual({ best: 3 });
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.locator('.drill-progress')).toHaveText('Case 1 of 4 · 0 correct so far');
  });
});

test.describe('Fair Housing drill', () => {
  test('nine phrases to judge, a clean sweep message and a saved best', async ({ page }) => {
    await page.goto('/handbook/ch11');
    await expect(page.locator('.drill-progress')).toHaveText('Phrase 1 of 9 · 0 correct so far');
    await expect(page.locator('.drill-tag')).toHaveText('In marketing');
    await expect(page.locator('.drill-option')).toHaveText(['Problem', 'Fine as written']);
    // the right answers, in order: problem, fine, problem, problem, fine, problem, problem, fine, problem
    const answers = ['Problem', 'Fine as written', 'Problem', 'Problem', 'Fine as written', 'Problem', 'Problem', 'Fine as written', 'Problem'];
    for (const [n, answer] of answers.entries()) {
      await page.getByRole('button', { name: answer, exact: true }).click();
      await expect(page.locator('.drill .drill-feedback strong')).toHaveText('✓ Correct. ');
      await page.getByRole('button', { name: n === 8 ? 'See your result' : 'Next phrase →' }).click();
    }
    await expect(page.locator('.drill-score')).toHaveText('9 of 9 correct');
    await expect(page.locator('.drill')).toContainText('Clean sweep.');
    expect((await widgets(page)).fairHousing).toEqual({ best: 9 });
  });
});
