import { readFileSync } from 'node:fs';
import { expect, test, type Locator, type Page } from './fixtures';
import { waitForHydration } from './hydration';
import { chapterCheck } from '../lib/coach/check';

// The reading-plan coach: /handbook/plan, the coach version of ch4's "Test your knowledge", and /handbook/review.
// Today is pinned to Fri 20 Nov 2026 so the schedule and the review due dates are stable. Assertions were read off
// the running pages (the e2e server is built with NEXT_PUBLIC_COACH_ENABLED=true); e2e/coach-off.spec.ts covers
// the build without the flag.
const DAY1 = new Date(2026, 10, 20, 12, 0); // Fri 20 Nov 2026, local time
const DAY2 = new Date(2026, 10, 21, 12, 0);
const coach = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('handbookCoach') ?? 'null'));

// Default pace from a Friday start, Mon to Fri: four sessions in each 7-day block, in the preface's reading order.
const SCHEDULE = [
  'Fri, Nov 20: 1. Mindset & Foundations', 'Mon, Nov 23: 2. Finding Clients', 'Tue, Nov 24: 3. Marketing & Brand Presence',
  'Wed, Nov 25: 4. Your CRM and daily operating system', 'Fri, Nov 27: 5. Nurturing Leads', 'Mon, Nov 30: 6. Scripts & Conversations',
  'Tue, Dec 1: 7. Common Errors & Pitfalls', 'Wed, Dec 2: 8. Staying Organized & Motivated', 'Fri, Dec 4: 9. Client Consultations & Objections',
  'Mon, Dec 7: 10. Keeping Clients', 'Tue, Dec 8: 11. Legal Protection & Standards', 'Wed, Dec 9: 12. Execution Plans (90 Days)',
  'Fri, Dec 11: 13. Resources & Next Steps',
];
const nextCard = (page: Page) => page.locator('aside.box.try-it');
const steps = (page: Page) => nextCard(page).locator('li');

async function startPlan(page: Page) {
  await page.goto('/handbook/plan');
  await page.getByRole('button', { name: 'Start my plan' }).click();
  await expect(nextCard(page).locator('.box-title')).toHaveText('TODAY');
}

// Every chapter has tagged questions, so the third step is a link to the chapter check, which ticks it once every
// question is answered.
async function answerCh1Check(page: Page) {
  const quiz = page.locator('aside.box.quiz');
  const items = quiz.locator('.quiz-item');
  for (const [i, q] of chapterCheck('ch1').entries()) {
    if (q.kind === 'mcq') {
      await answer(items.nth(i), 'Sure', q.answer);
    } else {
      await items.nth(i).getByRole('button', { name: 'Sure' }).click();
      await items.nth(i).getByLabel('Your answer for the blank').fill(q.answer);
      await items.nth(i).getByRole('button', { name: 'Check answer' }).click();
    }
  }
  await expect(quiz.locator('.quiz-score')).toHaveText('You got 3 of 3 multiple-choice questions right. All questions answered.');
}

// Answering ch1's check would also put its concepts in tomorrow's deck, and the tests built on a finished first
// session want a deck holding only the ch4 miss, so this writes the third tick directly.
async function finishFirstSession(page: Page) {
  await page.getByRole('button', { name: 'Mark read' }).click();
  await page.getByRole('button', { name: 'I did this' }).click();
  await expect(steps(page).nth(1)).toHaveText('✓ Do the exercise (“Try it today”).');
  await page.evaluate(at => {
    const saved = JSON.parse(localStorage.getItem('handbookCoach') ?? 'null');
    saved.completions.ch1.checked = at;
    localStorage.setItem('handbookCoach', JSON.stringify(saved));
  }, DAY1.toISOString());
  await page.reload();
  await expect(page.getByText('1 of 13 sessions complete. On pace.')).toBeVisible();
}

// Confidence first, then the option; the first option of ch4's first question is wrong.
async function answer(question: Locator, confidence: 'Guessing' | 'Think so' | 'Sure', option: number) {
  await question.getByRole('button', { name: confidence }).click();
  await question.getByRole('radio').nth(option).check();
  await question.getByRole('button', { name: 'Check answer' }).click(); // a pick commits only on Check answer (CR-M2)
}

async function missDailyRhythm(page: Page) {
  await page.goto('/handbook/ch4');
  const first = page.locator('aside.box.quiz fieldset.quiz-item').first();
  await expect(first.locator('legend')).toHaveText('1. In the daily rhythm, why do follow-ups come before prospecting?');
  await answer(first, 'Sure', 0);
  await expect(first.locator('.drill-feedback')).toHaveText(
    '✗ Not quite. The day opens and closes in your CRM, and the order matters because of this reason. You were sure about this one, which makes it the most useful one to get straight.',
  );
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(DAY1);
});

test.describe('starting a plan', () => {
  test('previews the schedule from today, saves it, and shows only the first session', async ({ page }) => {
    await page.goto('/handbook/plan');
    const form = page.locator('form.box');
    await expect(form.locator('.box-title')).toHaveText('START YOUR READING PLAN');
    await expect(page.getByLabel('Start date')).toHaveValue('2026-11-20');
    await expect(page.getByLabel('Start date')).toHaveAttribute('min', '2026-11-20');
    await expect(page.getByRole('radio', { name: '4-week plan (recommended)' })).toBeChecked();
    await expect(form).toContainText('This pace needs up to 4 study days a week.');
    for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']) await expect(page.getByRole('checkbox', { name: day })).toBeChecked();
    for (const day of ['Sat', 'Sun']) await expect(page.getByRole('checkbox', { name: day })).not.toBeChecked();
    await expect(form).toContainText('13 sessions, Fri, Nov 20 to Fri, Dec 11.');
    await expect(form).not.toContainText('Heads up');

    await page.getByRole('button', { name: 'Start my plan' }).click();
    await expect(nextCard(page).locator('.box-title')).toHaveText('TODAY');
    await expect(nextCard(page)).toContainText('1. Mindset & Foundations');
    await expect(steps(page)).toHaveText([
      '○ Read the chapter. Open it Mark read',
      '○ Do the exercise (“Try it today”). I did this',
      '○ Answer the questions at the end of the chapter. Go to the questions',
    ]);
    await expect(page.getByText('0 of 13 sessions complete. On pace.')).toBeVisible();
    await expect(page.getByText('Nothing is due for review.')).toBeVisible();
    await page.locator('details.box summary').click();
    await expect(page.locator('details.box li')).toHaveText(SCHEDULE.map((line, i) => (i === 0 ? `${line} ← next` : line)));

    const saved = await coach(page);
    expect(saved.plan).toMatchObject({ startDate: '2026-11-20', pace: 'default', studyDays: [1, 2, 3, 4, 5], time: '08:00' });
    expect(saved.plan.sessions.map((s: { id: string }) => s.id)).toEqual(['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch8', 'ch9', 'ch10', 'ch11', 'ch12', 'ch13']);
    await page.reload();
    await expect(nextCard(page).locator('.box-title')).toHaveText('TODAY');
  });

  test('a sprint on two days a week warns and stretches; no study day means no plan', async ({ page }) => {
    await page.goto('/handbook/plan');
    const form = page.locator('form.box');
    await page.getByRole('radio', { name: '2-week sprint (nearly every day)' }).check();
    await expect(form).toContainText('This pace needs up to 7 study days a week.');
    for (const day of ['Mon', 'Wed', 'Fri']) await page.getByRole('checkbox', { name: day }).uncheck();
    await expect(form).toContainText('13 sessions, Tue, Nov 24 to Tue, Jan 5.');
    await expect(form).toContainText('Heads up: This pace needs 7 study days a week and you chose 2, so it will take longer.');
    await expect(form).toContainText('Heads up: At this pace the plan finishes in week 7, not week 2.');
    for (const day of ['Tue', 'Thu']) await page.getByRole('checkbox', { name: day }).uncheck();
    await expect(form).toContainText('Choose at least one study day to see your schedule.');
    await expect(page.getByRole('button', { name: 'Start my plan' })).toBeDisabled();
    expect(await coach(page)).toBeNull();
  });
});

test('marking read, exercise and questions completes the session and moves on to the next', async ({ page }) => {
  await startPlan(page);
  await page.getByRole('button', { name: 'Mark read' }).click();
  await expect(steps(page).first()).toHaveText('✓ Read the chapter. Open it');
  await page.getByRole('button', { name: 'I did this' }).click();
  await expect(steps(page).nth(1)).toHaveText('✓ Do the exercise (“Try it today”).');
  await expect(page.getByRole('link', { name: 'Go to the questions' })).toHaveAttribute('href', '/handbook/ch1');
  await page.getByRole('link', { name: 'Go to the questions' }).click();
  await expect(page).toHaveURL(/\/handbook\/ch1$/);
  await answerCh1Check(page);
  await page.goto('/handbook/plan');

  await expect(nextCard(page).locator('.box-title')).toHaveText('NEXT · MON, NOV 23');
  await expect(nextCard(page)).toContainText('2. Finding Clients');
  await expect(steps(page).last()).toHaveText('○ Answer the questions at the end of the chapter. Go to the questions'); // ch2 has tagged questions
  await expect(page.getByRole('link', { name: 'Go to the questions' })).toHaveAttribute('href', '/handbook/ch2');
  await expect(page.getByText('1 of 13 sessions complete. On pace.')).toBeVisible();
  await page.locator('details.box summary').click();
  await expect(page.locator('details.box li').first()).toHaveText('Fri, Nov 20: 1. Mindset & Foundations ✓');
  await expect(page.locator('details.box li').nth(1)).toHaveText('Mon, Nov 23: 2. Finding Clients ← next');
  const at = DAY1.toISOString();
  expect((await coach(page)).completions).toEqual({ ch1: { read: at, did: at, checked: at } });
});

test.describe('the review deck', () => {
  test('a ch4 question missed today is due tomorrow and comes back in the deck', async ({ page }) => {
    await startPlan(page);
    await finishFirstSession(page);
    await page.goto('/handbook/ch4');
    const quiz = page.locator('aside.box.quiz');
    await expect(quiz).toContainText('Say how sure you are, then answer. Your answers are saved on this device so the ideas you miss can come back later.');
    const first = quiz.locator('fieldset.quiz-item').first();
    await answer(first, 'Sure', 0);
    await expect(first.locator('.drill-feedback')).toContainText('✗ Not quite.');
    expect((await coach(page)).attempts).toMatchObject([
      { questionId: 'ch4.daily-rhythm.followups-first', conceptId: 'ch4.daily-rhythm', correct: false, confidence: 'sure', kind: 'chapter_check', answeredAt: DAY1.toISOString() },
    ]);

    await page.goto('/handbook/review');
    await expect(page.locator('aside.box')).toHaveText('Nothing is due today. Your next review is tomorrow.');

    await page.clock.setFixedTime(DAY2);
    await page.goto('/handbook/plan');
    await page.getByRole('link', { name: '1 idea is due for review' }).click();
    await expect(page).toHaveURL(/\/handbook\/review$/);
    const card = page.locator('aside.box');
    await expect(card.locator('.box-title')).toHaveText('REVIEW · 1 OF 1');
    await expect(card.locator('.quiz-sentence em')).toHaveText('The daily rhythm: open and close in the CRM, follow-ups before prospecting');
    await expect(card.locator('legend')).toHaveText('In the daily rhythm, why do follow-ups come before prospecting?');
    await answer(card, 'Think so', 2);
    await expect(card.locator('.drill-feedback')).toHaveText('✓ Correct. The day opens and closes in your CRM, and the order matters because of this reason.');
    await expect(card).toContainText('Next review: in 3 days.');
    await page.getByRole('button', { name: 'Finish' }).click();
    await expect(card.locator('.box-title')).toHaveText('DONE FOR NOW');
    await expect(card).toContainText('1 of 1 right on the first try.');
    await expect(card).toContainText('Nothing else is due. Your next review is in 3 days.');
    const attempts = (await coach(page)).attempts;
    expect(attempts).toHaveLength(2);
    expect(attempts[1]).toMatchObject({ conceptId: 'ch4.daily-rhythm', correct: true, confidence: 'think', kind: 'review', answeredAt: DAY2.toISOString() });
  });

  test('a miss in the deck is asked once more in the same sitting and listed to look at again', async ({ page }) => {
    await startPlan(page);
    await missDailyRhythm(page);
    await page.clock.setFixedTime(DAY2);
    await page.goto('/handbook/review');
    const card = page.locator('aside.box');
    await expect(card.locator('.box-title')).toHaveText('REVIEW · 1 OF 1');
    await answer(card, 'Guessing', 1);
    await expect(card.locator('.drill-feedback')).toContainText('✗ Not quite.');
    await expect(card.getByRole('link', { name: 'Read the passage in 4. Your CRM and daily operating system' })).toHaveAttribute('href', '/handbook/ch4#the-daily-rhythm');
    await expect(card).toContainText('Next review: tomorrow.');
    await expect(card).toContainText('You will see this idea again in a few questions.');
    await page.getByRole('button', { name: 'Next question' }).click();

    await expect(card.locator('.box-title')).toHaveText('REVIEW · 2 OF 2 · ONE MORE TRY');
    await answer(card, 'Sure', 2);
    await expect(card.locator('.drill-feedback')).toContainText('✓ Correct.');
    await expect(card).not.toContainText('Next review:'); // the retest is practice and does not move the due date
    await page.getByRole('button', { name: 'Finish' }).click();
    await expect(card.locator('.box-title')).toHaveText('DONE FOR NOW');
    await expect(card).toContainText('0 of 1 right on the first try.');
    await expect(card).toContainText('Ideas to look at again:');
    await expect(card.getByRole('link', { name: 'The daily rhythm: open and close in the CRM, follow-ups before prospecting' })).toHaveAttribute('href', '/handbook/ch4#the-daily-rhythm');
    await expect(card).toContainText('Nothing else is due. Your next review is tomorrow.');
    expect((await coach(page)).attempts.map((a: { kind: string; correct: boolean }) => [a.kind, a.correct])).toEqual([['chapter_check', false], ['review', false], ['retest', true]]);
  });
});

test('Download my progress carries the plan, its steps and the attempts to a fresh browser', async ({ page, browser }) => {
  await startPlan(page);
  await finishFirstSession(page);
  await missDailyRhythm(page);
  await page.locator('details.settings summary').click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download my progress' }).click()]);
  expect(download.suggestedFilename()).toBe('handbook-progress-2026-11-20.json');
  const text = readFileSync((await download.path())!, 'utf8');
  const file = JSON.parse(text);
  expect(file).toMatchObject({ format: 'handbook-progress', version: 1, exportedAt: DAY1.toISOString() });
  expect(file.handbookCoach).toEqual(await coach(page));
  expect(file.handbookCoach.plan.sessions).toHaveLength(13);
  expect(Object.keys(file.handbookCoach.completions)).toEqual(['ch1']);
  expect(file.handbookCoach.attempts).toHaveLength(1);

  // A second device: the config's storage state (signed in) and nothing else.
  const { storageState, baseURL, extraHTTPHeaders } = test.info().project.use;
  const fresh = await browser.newContext({ storageState, baseURL, extraHTTPHeaders });
  try {
    const other = await fresh.newPage();
    await other.clock.setFixedTime(DAY1);
    await other.goto('/handbook/plan');
    await waitForHydration(other);
    await expect(other.locator('form.box .box-title')).toHaveText('START YOUR READING PLAN');
    await other.locator('details.settings summary').click();
    await other.setInputFiles('#settingImportFile', { name: download.suggestedFilename(), mimeType: 'application/json', buffer: Buffer.from(text) });
    await other.getByRole('button', { name: 'Replace my progress' }).click();
    await expect(other.locator('#settingTransferNote')).toHaveText('Progress restored.');

    await expect(nextCard(other).locator('.box-title')).toHaveText('NEXT · MON, NOV 23');
    await expect(other.getByText('1 of 13 sessions complete. On pace.')).toBeVisible();
    expect(await coach(other)).toEqual(file.handbookCoach);
    await other.clock.setFixedTime(DAY2);
    await other.goto('/handbook/review');
    await waitForHydration(other);
    await expect(other.locator('aside.box .box-title')).toHaveText('REVIEW · 1 OF 1');
    await expect(other.locator('aside.box .quiz-sentence em')).toHaveText('The daily rhythm: open and close in the CRM, follow-ups before prospecting');
  } finally {
    await fresh.close();
  }
});
