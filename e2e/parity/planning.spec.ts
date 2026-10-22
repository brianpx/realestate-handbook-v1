import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

// Parity checks for the 90-day roadmap (ch12), time-block planner (ch8) and post-close scheduler (ch10).
// Assertions were read off legacy/js/widgets-plan.js, not observed by running the static site. Today is pinned
// so the date text is stable; calendar files are read back from the download.
const widgets = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('handbookState') ?? '{}').widgets ?? {});
const unfold = (text: string) => text.replace(/\r\n /g, '');
async function downloaded(page: Page, click: () => Promise<void>) {
  const [download] = await Promise.all([page.waitForEvent('download'), click()]);
  return { name: download.suggestedFilename(), text: unfold(readFileSync((await download.path())!, 'utf8')) };
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 10, 20, 12, 0)); // Fri 20 Nov 2026, local time
});

test.describe('90-day roadmap', () => {
  test('waits for a start date, then dates each phase and counts ticks', async ({ page }) => {
    await page.goto('/handbook/ch12');
    await expect(page.locator('[data-widget="roadmap"]')).toBeVisible();
    await expect(page.locator('.roadmap-status')).toHaveText('Pick a start date to see your three milestone dates.');
    await expect(page.getByRole('button', { name: /Add reviews and milestones/ })).toBeDisabled();
    await expect(page.locator('.phase-dates')).toHaveCount(0);
    await page.getByLabel('Day 1 (your start date)').fill('2026-11-02');
    await expect(page.locator('.roadmap-status')).toHaveText('Today is day 19 of 90.');
    await expect(page.locator('.phase-dates')).toHaveText([
      ' Nov 2 – Dec 1 · 0 of 6 done · 6 open, 11 days left',
      ' Dec 2 – Dec 31 · 0 of 4 done · not started',
      ' Jan 1 – Jan 30 · 0 of 4 done · not started',
    ]);
    for (const box of await page.locator('[data-checklist="ch12-d1"] input').all()) await box.check();
    await expect(page.locator('.phase-dates').first()).toHaveText(' Nov 2 – Dec 1 · 6 of 6 done · complete');
    expect((await widgets(page)).roadmap).toEqual({ start: '2026-11-02' });
    await page.reload();
    await expect(page.getByLabel('Day 1 (your start date)')).toHaveValue('2026-11-02');
    await expect(page.locator('.phase-dates').first()).toContainText('6 of 6 done');
  });

  test('says when Day 1 is still ahead and when the 90 days are over', async ({ page }) => {
    await page.goto('/handbook/ch12');
    await page.getByLabel('Day 1 (your start date)').fill('2026-11-23');
    await expect(page.locator('.roadmap-status')).toHaveText('Day 1 is in 3 days.');
    await page.getByLabel('Day 1 (your start date)').fill('2026-06-01');
    await expect(page.locator('.roadmap-status')).toHaveText('The 90 days are complete. Plan the next 90 from your own ratios.');
    await expect(page.locator('.phase-dates').first()).toContainText('6 open, past the target date');
  });

  test('exports three milestones, a weekly Friday review and three monthly reviews', async ({ page }) => {
    await page.goto('/handbook/ch12');
    await page.getByLabel('Day 1 (your start date)').fill('2026-11-02');
    const file = await downloaded(page, () => page.getByRole('button', { name: /Add reviews and milestones/ }).click());
    expect(file.name).toBe('handbook-90-day-plan.ics');
    expect(file.text.match(/BEGIN:VEVENT/g)).toHaveLength(7);
    expect(file.text).toContain('SUMMARY:Handbook milestone\\, day 30: Install the system');
    expect(file.text).toContain('DTSTART;VALUE=DATE:20261201');
    expect(file.text).toContain('DESCRIPTION:- CRM setup\\n- Contacts tagged');
    expect(file.text).toContain('DTSTART:20261106T160000');
    expect(file.text).toContain('RRULE:FREQ=WEEKLY;BYDAY=FR;COUNT=13');
    expect(file.text.match(/SUMMARY:Monthly review/g)).toHaveLength(3);
    expect(file.text).toContain('DTSTART:20261201T090000');
    expect(file.text.split('\r\n').every(l => new TextEncoder().encode(l).length <= 75 || /^ /.test(l) === false)).toBe(true);
  });

  test('Essential tools only turns the lists back into plain checkboxes with no roadmap', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('handbookSettings', JSON.stringify({ essentialOnly: true })));
    await page.goto('/handbook/ch12');
    await expect(page.locator('.roadmap-panel')).toHaveCount(0);
    await expect(page.locator('.check-item')).toHaveCount(14);
  });
});

test.describe('weekly time-block planner', () => {
  test('starts with the sample day: 2h 45m protected, done before noon', async ({ page }) => {
    await page.goto('/handbook/ch8');
    await expect(page.locator('[data-widget="timeblock-planner"]')).toBeVisible();
    await expect(page.locator('.planner-legend li')).toHaveText([
      '8:00 am: CRM dashboard (15 min)', '8:15 am: Follow-up plan tasks (60 min)', '9:15 am: Prospecting (90 min)',
      '10:45 am: Appointments and client work (405 min)', '5:30 pm: End-of-day CRM update (15 min)',
    ]);
    await expect(page.locator('.planner-bar')).toHaveAttribute('aria-label', 'Day from 8:00 am to 5:45 pm');
    await expect(page.locator('.planner-bar .alloc-seg')).toHaveCount(5);
    await expect(page.locator('.alloc-verdict').last()).toHaveText(/^2h 45m protected, finishing at 10:45 am\. ✓ Lead generation is done before noon\./);
    await expect(page.getByLabel('Start the week of')).toHaveValue('2026-11-23'); // next Monday after Fri 20 Nov
  });

  test('a late start fails the noon test; an early end-of-day update is rejected and blocks the export', async ({ page }) => {
    await page.goto('/handbook/ch8');
    await page.getByLabel('Day starts').fill('10:30');
    await expect(page.locator('.alloc-verdict').last()).toHaveText(/^2h 45m protected, finishing at 1:15 pm\. ✗ Prospecting runs past noon/);
    await expect(page.locator('.alloc-verdict').last()).toHaveClass(/no/);
    await page.getByLabel('End-of-day CRM update').fill('12:00');
    await expect(page.locator('.alloc-verdict').last()).toHaveText('✗ Your end-of-day update (12:00 pm) comes before prospecting ends (1:15 pm). Move it later.');
    await expect(page.getByRole('button', { name: /Add these blocks to my calendar/ })).toBeDisabled();
  });

  test('the sliders, day boxes and Friday option feed the plan and are saved', async ({ page }) => {
    await page.goto('/handbook/ch8');
    await page.getByLabel('Prospecting (60 to 90 min)').fill('60');
    await expect(page.locator('.alloc-out').nth(1)).toHaveText('60 min');
    await expect(page.locator('.planner-legend li').nth(2)).toHaveText('9:15 am: Prospecting (60 min)');
    await page.getByLabel('Fri', { exact: true }).uncheck();
    await expect(page.getByLabel('Mon', { exact: true })).toBeChecked();
    expect((await widgets(page)).timeblock).toMatchObject({ prospecting: 60, days: [1, 2, 3, 4], start: '08:00', followUps: 60, endOfDay: '17:30', friday: true });
    await page.reload();
    await expect(page.getByLabel('Prospecting (60 to 90 min)')).toHaveValue('60');
    await expect(page.getByLabel('Fri', { exact: true })).not.toBeChecked();
    for (const d of ['Mon', 'Tue', 'Wed', 'Thu']) await page.getByLabel(d, { exact: true }).uncheck();
    await expect(page.getByRole('button', { name: /Add these blocks to my calendar/ })).toBeDisabled();
  });

  test('exports twelve weeks of the chosen days, with the Friday review', async ({ page }) => {
    await page.goto('/handbook/ch8');
    const file = await downloaded(page, () => page.getByRole('button', { name: /Add these blocks to my calendar/ }).click());
    expect(file.name).toBe('handbook-weekly-time-blocks.ics');
    expect(file.text.match(/BEGIN:VEVENT/g)).toHaveLength(5);
    expect(file.text).toContain('DTSTART:20261123T080000');
    expect(file.text).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;COUNT=60');
    expect(file.text).toContain('SUMMARY:Weekly pipeline review');
    expect(file.text).toContain('DTSTART:20261127T104500');
    expect(file.text).toContain('RRULE:FREQ=WEEKLY;BYDAY=FR;COUNT=12');
    expect(file.text).not.toContain('Appointments and client work');
  });
});

test.describe('post-close scheduler', () => {
  test('asks for a date, then lists the seven dated touches and the note about annual events', async ({ page }) => {
    await page.goto('/handbook/ch10');
    await expect(page.locator('[data-widget="postclose-scheduler"]')).toBeVisible();
    await expect(page.locator('.postclose-result')).toHaveText('Enter a closing date to see your schedule.');
    await expect(page.getByRole('button', { name: /Add these touches to my calendar/ })).toBeDisabled();
    await page.getByLabel('Closing date').fill('2026-08-31');
    await expect(page.locator('.postclose-item')).toHaveCount(7);
    await expect(page.locator('.postclose-head strong')).toHaveText([
      'Mon, Aug 31, 2026', 'Mon, Sep 7, 2026', 'Wed, Sep 30, 2026', 'Mon, Nov 30, 2026', 'Sun, Feb 28, 2027', 'Mon, May 31, 2027', 'Tue, Aug 31, 2027',
    ]);
    await expect(page.locator('.postclose-head .nurture-tag')).toHaveText(['Closing day', '1 week', '30 days', 'Quarter 1 (3 months)', 'Quarter 2 (6 months)', 'Quarter 3 (9 months)', 'Home anniversary']);
    await expect(page.locator('.postclose-item').first()).toContainText('Handwritten note and a small closing gift');
    await expect(page.locator('.postclose-result .calc-note')).toContainText('After the first year:');
  });

  test('multiplies touches by expected closings and saves the date and count but not the client name', async ({ page }) => {
    await page.goto('/handbook/ch10');
    await page.getByLabel('Closing date').fill('2026-08-31');
    await page.getByLabel('Client name (optional, not saved)').fill('Sam');
    await page.getByLabel('Closings you expect this year').fill('12');
    await expect(page.getByText(/7 dated touches per client in the first year × 12 closings = 84 touches/)).toBeVisible();
    expect((await widgets(page)).postClose).toEqual({ date: '2026-08-31', closings: 12 });
    await page.reload();
    await expect(page.getByLabel('Closing date')).toHaveValue('2026-08-31');
    await expect(page.getByLabel('Client name (optional, not saved)')).toHaveValue('');
  });

  test('exports one all-day entry per touch, naming the client when given', async ({ page }) => {
    await page.goto('/handbook/ch10');
    await page.getByLabel('Closing date').fill('2026-08-31');
    await page.getByLabel('Client name (optional, not saved)').fill('Sam');
    const file = await downloaded(page, () => page.getByRole('button', { name: /Add these touches to my calendar/ }).click());
    expect(file.name).toBe('handbook-post-close-plan.ics');
    expect(file.text.match(/BEGIN:VEVENT/g)).toHaveLength(7);
    expect(file.text).toContain('SUMMARY:Post-close (Sam): Closing day');
    expect(file.text).toContain('DTSTART;VALUE=DATE:20270228');
    expect(file.text).toContain('SUMMARY:Post-close (Sam): Home anniversary');
  });
});
