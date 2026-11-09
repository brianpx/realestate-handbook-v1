import { expect, test } from './fixtures';

// The coach-off branch: /handbook/plan and /handbook/review call notFound() unless NEXT_PUBLIC_COACH_ENABLED is 'true'
// at BUILD time (lib/coach/enabled.ts), and the chapter check then records nothing. The suite's one webServer is
// built with the flag on, so this spec needs a second build on its own port and is skipped unless pointed at it:
//   env LEAD_STORE=file LEAD_STORE_PATH=.data/e2e-leads.json LEAD_IP_SALT=e2e-only-salt \
//     NEXT_PUBLIC_SITE_URL=http://localhost:3206 pnpm build && pnpm start -p 3206
//   COACH_OFF_BASE_URL=http://localhost:3206 PLAYWRIGHT_BASE_URL=http://localhost:3206 pnpm exec playwright test e2e/coach-off.spec.ts
// (PLAYWRIGHT_BASE_URL only keeps the config from building and starting the coach-on server; every URL here is absolute.)
const COACH_OFF = process.env.COACH_OFF_BASE_URL?.replace(/\/+$/, '');
const at = (path: string) => `${COACH_OFF}${path}`;

test.skip(!COACH_OFF, 'COACH_OFF_BASE_URL is not set: these tests need a build without NEXT_PUBLIC_COACH_ENABLED, see the comment at the top of e2e/coach-off.spec.ts');

test('the coach pages are 404s while the chapters still serve', async ({ request }) => {
  for (const path of ['/handbook/plan', '/handbook/review']) {
    const response = await request.get(at(path));
    expect(response.status(), path).toBe(404);
    expect(await response.text(), path).toContain('Page not found');
  }
  expect((await request.get(at('/handbook/ch4'))).status()).toBe(200);
});

test('the chapter check says nothing is saved, and saves nothing', async ({ page }) => {
  await page.goto(at('/handbook/ch4'));
  const quiz = page.locator('aside.box.quiz');
  await expect(quiz).toContainText('Say how sure you are, then answer. Nothing here is saved.');
  const first = quiz.locator('fieldset.quiz-item').first();
  await first.getByRole('button', { name: 'Sure' }).click();
  await first.getByRole('radio').nth(2).check();
  await expect(first.locator('.drill-feedback')).toContainText('✓ Correct.');
  expect(await page.evaluate(() => localStorage.getItem('handbookCoach'))).toBeNull();
});
