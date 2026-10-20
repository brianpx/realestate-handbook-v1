import { expect, test, type Page } from '@playwright/test';
import { KNOWLEDGE_CHECKS } from '../../content/data/knowledge-checks';

// Parity checks for Checkpoint self-tests (chapters 1-12), the sidebar roll-up and "Test your knowledge"
// (chapters 1-13). Assertions were read off setupCheckpoints / renderCheckpointRollup / setupKnowledgeCheck in
// legacy/js/widgets-practice.js, not observed by running the static site.
const checkpoints = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('handbookState') ?? '{}').widgets?.checkpoints ?? {});

test.describe('checkpoint self-tests', () => {
  test('turn the Checkpoint box into questions with an answer box, key points and a confidence count', async ({ page }) => {
    await page.goto('/ch1');
    const box = page.locator('.box.checkpoint');
    await expect(box.locator('[data-widget="checkpoint"]')).toBeVisible();
    await expect(box.locator('.cp-count')).toHaveText('0 of 3 confident');
    await expect(box.locator('.cp-item')).toHaveCount(3);
    await expect(box.locator('.cp-q').nth(1)).toHaveText('How many conversations do you need per week to reach your income goal?');
    await expect(box.locator('.cp-key').first()).toBeHidden();
    await expect(box.getByRole('group', { name: 'How did you do?' }).first()).toBeHidden();
  });

  test('checking against the book shows key points and the rating buttons; ratings save and count', async ({ page }) => {
    await page.goto('/ch1');
    const item = page.locator('.cp-item').nth(1);
    await item.getByRole('button', { name: 'Check against the book' }).click();
    await expect(item.getByRole('button', { name: 'Hide key points' })).toHaveAttribute('aria-expanded', 'true');
    await expect(item.locator('.cp-key')).toContainText('Key points from the chapter');
    await expect(item.locator('.cp-key')).toContainText('Work backward: goal ÷ average commission = closings');
    await item.getByRole('button', { name: "I've got it" }).click();
    await expect(item.getByRole('button', { name: "I've got it" })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.cp-count')).toHaveText('1 of 3 confident');
    await expect(page.locator('#checkpointRollup')).toHaveText('1 of 38 checkpoint questions confident');
    await item.getByRole('button', { name: 'Review this' }).click();
    await expect(page.locator('.cp-count')).toHaveText('0 of 3 confident');
    await item.getByRole('button', { name: "I've got it" }).click();
    expect(await checkpoints(page)).toEqual({ 'ch1:1': { status: 'got' } });
    await page.reload();
    await expect(page.locator('.cp-item').nth(1).getByRole('button', { name: "I've got it" })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.cp-item').nth(1).getByRole('group', { name: 'How did you do?' })).toBeVisible();
  });

  test('typed answers are saved per question', async ({ page }) => {
    await page.goto('/ch1');
    await page.locator('.cp-item').first().locator('.practice-text').fill('calls, appointments, follow-ups');
    expect(await checkpoints(page)).toEqual({ 'ch1:0': { text: 'calls, appointments, follow-ups' } });
    await page.reload();
    await expect(page.locator('.cp-item').first().locator('.practice-text')).toHaveValue('calls, appointments, follow-ups');
  });

  test('a personal question offers a tip instead of key points', async ({ page }) => {
    await page.goto('/ch6');
    const item = page.locator('.cp-item').nth(2);
    await item.getByRole('button', { name: 'Show a tip' }).click();
    await expect(item.locator('.cp-key')).toContainText('Reading is not rehearsal.');
    await expect(item.locator('.cp-key')).not.toContainText('Key points from the chapter');
  });

  test('answers saved on the static site for Chapter 4 follow their questions after one was added at the front', async ({ page }) => {
    await page.addInitScript(() => {
      if (!localStorage.getItem('handbookState')) localStorage.setItem('handbookState', JSON.stringify({ widgets: { checkpoints: { 'ch4:0': { status: 'got', text: 'six parts' } } } }));
    });
    await page.goto('/ch4');
    await expect(page.locator('.cp-item')).toHaveCount(4);
    await expect(page.locator('.cp-item').first().locator('.practice-text')).toHaveValue('');
    await expect(page.locator('.cp-item').nth(1).locator('.cp-q')).toHaveText('What are the six parts of the CRM setup?');
    await expect(page.locator('.cp-item').nth(1).locator('.practice-text')).toHaveValue('six parts');
    await expect(page.locator('.cp-item').nth(1).getByRole('button', { name: "I've got it" })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#checkpointRollup')).toHaveText('1 of 38 checkpoint questions confident');
  });

  test('the roll-up sits under the progress bar and goes when progress tracking is off', async ({ page }) => {
    await page.goto('/ch2');
    await expect(page.locator('.progress-item #checkpointRollup')).toHaveText('0 of 38 checkpoint questions confident');
    await page.locator('details.settings summary').click();
    await page.locator('#settingTrack').uncheck();
    await expect(page.locator('#checkpointRollup')).toHaveCount(0);
  });

  test('Essential tools only leaves the Checkpoint box as plain text', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('handbookSettings', JSON.stringify({ essentialOnly: true })));
    await page.goto('/ch1');
    await expect(page.locator('.box.checkpoint')).toBeVisible();
    await expect(page.locator('.box.checkpoint .cp-item')).toHaveCount(0);
    await expect(page.locator('.box.checkpoint')).toContainText('Pick three leading indicators to track every week');
    await expect(page.locator('.box.quiz')).toHaveCount(0);
  });
});

test.describe('test your knowledge', () => {
  const ch1 = KNOWLEDGE_CHECKS.ch1!;

  test('adds three questions and a blank after the key takeaways, saving nothing', async ({ page }) => {
    await page.goto('/ch1');
    const quiz = page.locator('.box.quiz');
    await expect(quiz.locator('[data-widget="knowledge-check"]')).toBeVisible();
    await expect(quiz.locator('fieldset.quiz-item')).toHaveCount(3);
    await expect(quiz.locator('legend').first()).toHaveText(`1. ${ch1.mcq[0]!.q}`);
    const takeaways = await page.locator('.key-takeaways').boundingBox();
    const quizBox = await quiz.boundingBox();
    expect(quizBox!.y).toBeGreaterThan(takeaways!.y + takeaways!.height - 1); // the quiz follows the key takeaways
    await quiz.locator('fieldset').first().getByRole('radio').first().check();
    expect(await page.evaluate(() => localStorage.getItem('handbookState'))).toBeNull();
  });

  test('marks right and wrong picks, locks the question and scores after the third', async ({ page }) => {
    await page.goto('/ch1');
    const quiz = page.locator('.box.quiz');
    const wrongFor = (answer: number) => (answer === 0 ? 1 : 0);
    // first question wrong, the other two right
    const fs = quiz.locator('fieldset.quiz-item');
    await fs.nth(0).getByRole('radio').nth(wrongFor(ch1.mcq[0]!.answer)).check();
    await expect(fs.nth(0).locator('.quiz-opt.is-wrong .quiz-mark')).toHaveText('✗ Your answer');
    await expect(fs.nth(0).locator('.quiz-opt.is-right .quiz-mark')).toHaveText('✓ Correct answer');
    await expect(fs.nth(0).locator('.drill-feedback strong')).toHaveText('✗ Not quite.');
    await expect(fs.nth(0).getByRole('radio').first()).toBeDisabled();
    await expect(quiz.locator('.quiz-score')).toHaveText('');
    await fs.nth(1).getByRole('radio').nth(ch1.mcq[1]!.answer).check();
    await fs.nth(2).getByRole('radio').nth(ch1.mcq[2]!.answer).check();
    await expect(fs.nth(1).locator('.drill-feedback strong')).toHaveText('✓ Correct.');
    await expect(quiz.locator('.quiz-score')).toHaveText('You got 2 of 3 multiple-choice questions right.');
  });

  test('the blank is graded when the answer is shown, and Start over clears everything', async ({ page }) => {
    await page.goto('/ch1');
    const quiz = page.locator('.box.quiz');
    await quiz.getByRole('button', { name: 'Show answer' }).click();
    await expect(quiz.locator('.cp-key')).toContainText(`The answer is "${ch1.blank.answer}".`);
    await expect(quiz.locator('.cp-key strong')).not.toContainText('Correct');
    await quiz.getByRole('button', { name: 'Hide answer' }).click();
    await quiz.getByLabel('Your answer for the blank').fill(` ${ch1.blank.accept[0]!.toUpperCase()} `);
    await quiz.getByRole('button', { name: 'Show answer' }).click();
    await expect(quiz.locator('.cp-key strong')).toContainText('✓ Correct.');
    await quiz.locator('fieldset').first().getByRole('radio').first().check();
    await quiz.getByRole('button', { name: 'Start over' }).click();
    await expect(quiz.getByLabel('Your answer for the blank')).toHaveValue('');
    await expect(quiz.locator('fieldset').first().getByRole('radio').first()).not.toBeChecked();
    await expect(quiz.locator('fieldset').first().getByRole('radio').first()).toBeEnabled();
    await expect(quiz.locator('.cp-key')).toBeHidden();
  });

  test('every chapter from 1 to 13 has one, and the Settings toggle hides and shows them', async ({ page }) => {
    for (let n = 1; n <= 13; n++) {
      await page.goto(`/ch${n}`);
      await expect(page.locator('.box.quiz'), `ch${n}`).toHaveCount(1);
    }
    await page.locator('details.settings summary').click();
    await page.locator('#settingQuiz').uncheck();
    await expect(page.locator('.box.quiz')).toBeHidden();
    await page.locator('#settingQuiz').check();
    await expect(page.locator('.box.quiz')).toBeVisible();
  });
});
