import { expect, test, type Page } from '@playwright/test';

// Parity checks for script practice (ch6, ch9, ch11, preface) and the objection trainer (ch9). Assertions were
// read off setupScriptPractice and setupObjectionTrainer in legacy/js/interactive.js, not observed by running
// the static site.
const KEY = '● SCRIPT · NEW LEAD BY PHONE (SPEED-TO-LEAD)';
const state = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('handbookState') ?? '{}'));
const firstBox = (page: Page) => page.locator('.box.script').first();

test.describe('script practice', () => {
  test('every script box gets Copy and Practice, and keeps its words visible', async ({ page }) => {
    await page.goto('/handbook/ch6');
    await expect(page.locator('.box.script')).toHaveCount(11);
    await expect(page.locator('.script-actions .interactive-pill')).toHaveCount(11);
    const box = firstBox(page);
    await expect(box.locator('.box-title')).toHaveText(KEY);
    await expect(box.locator('.script-body')).toContainText('Hi [Name], this is [Your Name] with [Your Brokerage].');
    await expect(box.getByRole('button', { name: 'Copy script' })).toBeVisible();
    await expect(box.locator('.practice-area')).toBeHidden();
    await expect(page.locator('[data-widget="script-practice"]').first()).toBeAttached();
  });

  test('also wraps the scripts in chapters 9 and 11 and the preface sample', async ({ page }) => {
    for (const [path, count] of [['/ch9', 1], ['/ch11', 1], ['/pref', 1]] as const) {
      await page.goto(path);
      await expect(page.locator('.box.script')).toHaveCount(count);
    }
  });

  test('Practice hides the script, focuses the textarea and saves what is typed under the title', async ({ page }) => {
    await page.goto('/handbook/ch6');
    const box = firstBox(page);
    await box.getByRole('button', { name: 'Practice' }).click();
    await expect(box).toHaveClass(/practicing/);
    await expect(box.locator('.script-body')).toBeHidden();
    await expect(box.locator('.practice-text')).toBeFocused();
    await expect(box.getByRole('button', { name: 'Stop practicing' })).toBeVisible();
    await box.locator('.practice-text').fill('Hi, I saw your inquiry.');
    expect((await state(page)).scripts).toEqual({ [KEY]: 'Hi, I saw your inquiry.' });
    await page.reload();
    await firstBox(page).getByRole('button', { name: 'Practice' }).click();
    await expect(firstBox(page).locator('.practice-text')).toHaveValue('Hi, I saw your inquiry.');
  });

  test('Reveal brings the script back beside the answer; Stop practicing tucks the answer away', async ({ page }) => {
    await page.goto('/handbook/ch6');
    const box = firstBox(page);
    await box.getByRole('button', { name: 'Practice' }).click();
    await box.getByRole('button', { name: 'Reveal script to compare' }).click();
    await expect(box.locator('.script-body')).toBeVisible();
    await expect(box.locator('.practice-area')).toBeVisible();
    await expect(box.getByRole('button', { name: 'Reveal script to compare' })).toBeHidden();
    await expect(box.getByRole('button', { name: 'Practice again' })).toBeVisible();
    await box.getByRole('button', { name: 'Practice again' }).click();
    await expect(box.locator('.script-body')).toBeHidden();
    await box.getByRole('button', { name: 'Stop practicing' }).click();
    await expect(box.locator('.practice-area')).toBeHidden();
    await expect(box.locator('.script-body')).toBeVisible();
    await expect(box.getByRole('button', { name: 'Practice' })).toBeVisible();
  });

  test('practice text saved by the static site is picked up', async ({ page }) => {
    await page.addInitScript(([k]) => {
      if (!localStorage.getItem('handbookState')) localStorage.setItem('handbookState', JSON.stringify({ scripts: { [k!]: 'from the old site' } }));
    }, [KEY]);
    await page.goto('/handbook/ch6');
    await firstBox(page).getByRole('button', { name: 'Practice' }).click();
    await expect(firstBox(page).locator('.practice-text')).toHaveValue('from the old site');
  });

  test('Copy script puts only the words to say on the clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/handbook/ch6');
    const box = firstBox(page);
    await box.getByRole('button', { name: 'Copy script' }).click();
    await expect(box.getByRole('button', { name: 'Copied' })).toBeVisible();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied.startsWith('"Hi [Name], this is [Your Name]')).toBe(true);
    expect(copied).not.toContain('Purpose:');
    await expect(box.getByRole('button', { name: 'Copy script' })).toBeVisible({ timeout: 4000 });
  });
});

const OBJECTIONS = ['"I\'m just looking."', '"We\'re not ready yet."', '"I already have an agent."', '"Your fee is too high."',
  '"I want to wait for the market to improve."', '"I need to think about it."', '"Can you just send me listings?"', '"You\'re new, aren\'t you?"'];

test.describe('objection trainer', () => {
  test('keeps the quick-reference table and adds a card with a prompt and a score', async ({ page }) => {
    await page.goto('/handbook/ch9');
    await expect(page.locator('[data-widget="objection-trainer"]')).toBeVisible();
    await expect(page.locator('table', { has: page.getByRole('columnheader', { name: 'OBJECTION' }) }).locator('tbody tr')).toHaveCount(8);
    await expect(page.locator('.trainer-prompt')).toHaveText(/^Client says: ".+"$/);
    await expect(page.locator('.trainer-score')).toHaveText('0 of 8 objections mastered');
    await expect(page.locator('.trainer-answer')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Nailed it' })).toBeHidden();
  });

  test('Show framework reveals the answer and the rating buttons, and moves focus to the answer', async ({ page }) => {
    await page.goto('/handbook/ch9');
    await page.getByRole('button', { name: 'Show framework' }).click();
    await expect(page.locator('.trainer-answer')).toBeVisible();
    await expect(page.locator('.trainer-answer')).toBeFocused();
    await expect(page.locator('.trainer-answer p').first()).toContainText('Framework:');
    await expect(page.locator('.trainer-answer p').nth(1)).toContainText('Goal:');
    await expect(page.getByRole('button', { name: 'Show framework' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Nailed it' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Needs work' })).toBeVisible();
  });

  test('Nailed it saves under the objection text, moves on, and focuses the next Show framework', async ({ page }) => {
    await page.goto('/handbook/ch9');
    await page.waitForLoadState('networkidle'); // the card re-picks its objection at random once hydrated
    const before = await page.locator('.trainer-prompt').innerText();
    await page.locator('.objection-trainer .practice-text').fill('my answer');
    await page.getByRole('button', { name: 'Show framework' }).click();
    await page.getByRole('button', { name: 'Nailed it' }).click();
    await expect(page.locator('.trainer-score')).toHaveText('1 of 8 objections mastered');
    const objection = before.replace(/^Client says: /, '');
    expect(OBJECTIONS).toContain(objection);
    expect((await state(page)).objections).toEqual({ [objection]: true });
    await expect(page.locator('.trainer-prompt')).not.toHaveText(before);
    await expect(page.locator('.objection-trainer .practice-text')).toHaveValue('');
    await expect(page.locator('.trainer-answer')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Show framework' })).toBeFocused();
  });

  test('Needs work un-masters an objection', async ({ page }) => {
    await page.addInitScript(o => {
      if (!localStorage.getItem('handbookState')) localStorage.setItem('handbookState', JSON.stringify({ objections: Object.fromEntries(o.map(x => [x, true])) }));
    }, OBJECTIONS.slice(0, 7));
    await page.goto('/handbook/ch9');
    // seven mastered, so the only open objection is the last one
    await expect(page.locator('.trainer-prompt')).toHaveText(`Client says: ${OBJECTIONS[7]}`);
    await expect(page.locator('.trainer-score')).toHaveText('7 of 8 objections mastered');
    await page.getByRole('button', { name: 'Show framework' }).click();
    await page.getByRole('button', { name: 'Needs work' }).click();
    await expect(page.locator('.trainer-score')).toHaveText('7 of 8 objections mastered');
    await page.getByRole('button', { name: 'Show framework' }).click();
    await page.getByRole('button', { name: 'Nailed it' }).click();
    await expect(page.locator('.trainer-score')).toHaveText('8 of 8 objections mastered');
    // all mastered: it keeps cycling through everything
    await page.getByRole('button', { name: 'Next objection' }).click();
    await expect(page.locator('.trainer-prompt')).toHaveText(/^Client says: /);
  });

  test('Next objection never repeats the one on screen', async ({ page }) => {
    await page.goto('/handbook/ch9');
    await page.waitForLoadState('networkidle'); // the card re-picks its objection at random once hydrated
    for (let i = 0; i < 6; i++) {
      const before = await page.locator('.trainer-prompt').innerText();
      await page.getByRole('button', { name: 'Next objection' }).click();
      await expect(page.locator('.trainer-prompt')).not.toHaveText(before);
    }
  });
});
