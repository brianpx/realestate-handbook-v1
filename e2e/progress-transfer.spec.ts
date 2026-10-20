import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

// Moving progress as a file, for readers who change device or web address at cutover.
const open = async (page: Page) => { await page.locator('details.settings summary').click(); };
const stored = (page: Page, key: string) => page.evaluate(k => localStorage.getItem(k), key);

// What the static site writes: its two localStorage objects, as they are, in the file wrapper.
const staticSiteFile = JSON.stringify({
  format: 'handbook-progress', version: 1, exportedAt: '2026-11-02T12:00:00.000Z',
  handbookState: {
    read: { pref: true, ch1: true, ch2: true },
    checks: { 'ch12-d1:0': true, 'app-c-profile:1': true },
    calc: { goal: 80000, commission: 6500 },
    widgets: { checkpoints: { 'ch4:0': { status: 'got', text: 'six parts' } }, roadmap: { start: '2026-11-02' } },
  },
  handbookSettings: { dark: true, fullWidth: true },
});

test('Download my progress writes a file the static site\'s format can round-trip', async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('handbookState')) localStorage.setItem('handbookState', JSON.stringify({ read: { ch1: true }, calc: { goal: 50000 } })); });
  await page.goto('/ch1');
  await open(page);
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download my progress' }).click()]);
  expect(download.suggestedFilename()).toMatch(/^handbook-progress-\d{4}-\d{2}-\d{2}\.json$/);
  const file = JSON.parse(readFileSync((await download.path())!, 'utf8'));
  expect(file).toMatchObject({ format: 'handbook-progress', version: 1, handbookState: { read: { ch1: true }, calc: { goal: 50000 } } });
  await expect(page.locator('#settingTransferNote')).toHaveText('Progress downloaded.');
});

test('restoring asks first, shows what is in the file, and replaces progress only when confirmed', async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('handbookState')) localStorage.setItem('handbookState', JSON.stringify({ read: { ch9: true } })); });
  await page.goto('/ch1');
  await open(page);
  await page.setInputFiles('#settingImportFile', { name: 'progress.json', mimeType: 'application/json', buffer: Buffer.from(staticSiteFile) });
  const confirm = page.getByRole('group', { name: 'Confirm restoring progress' });
  await expect(confirm).toContainText('3 sections read, 2 checklist ticks, 0 scorecard entries, 1 checkpoint answer, 2 tools with saved work');
  await expect(page.locator('#progressLabel')).toHaveText('1 of 20 sections read'); // nothing changed yet
  await confirm.getByRole('button', { name: 'Cancel' }).click();
  await expect(confirm).toHaveCount(0);
  expect(JSON.parse((await stored(page, 'handbookState'))!).read).toEqual({ ch9: true });

  await page.setInputFiles('#settingImportFile', { name: 'progress.json', mimeType: 'application/json', buffer: Buffer.from(staticSiteFile) });
  await page.getByRole('button', { name: 'Replace my progress' }).click();
  await expect(page.locator('#settingTransferNote')).toHaveText('Progress restored.');
  await expect(page.locator('#progressLabel')).toHaveText('3 of 20 sections read');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.locator('html')).toHaveClass(/wide/);
  // what was there is kept, and the restored state is migrated like a reload would
  expect(JSON.parse((await stored(page, 'handbookState.pre-import'))!).read).toEqual({ ch9: true });
  const now = JSON.parse((await stored(page, 'handbookState'))!);
  expect(now.version).toBe(1);
  expect(now.widgets.checkpoints).toEqual({ 'ch4:1': { status: 'got', text: 'six parts' } });
  await page.reload();
  await expect(page.locator('#progressLabel')).toHaveText('3 of 20 sections read');
});

test('restored answers show up in the tools', async ({ page }) => {
  await page.goto('/ch12');
  await open(page);
  await page.setInputFiles('#settingImportFile', { name: 'progress.json', mimeType: 'application/json', buffer: Buffer.from(staticSiteFile) });
  await page.getByRole('button', { name: 'Replace my progress' }).click();
  await expect(page.getByLabel('Day 1 (your start date)')).toHaveValue('2026-11-02');
  await expect(page.locator('[data-checklist="ch12-d1"] input').first()).toBeChecked();
});

test.describe('files that are not progress files', () => {
  for (const [name, content, message] of [
    ['notes.json', '{"hello":"world"}', 'That file is not a handbook progress file.'],
    ['broken.json', '{nope', 'That file is not a handbook progress file (it is not valid JSON).'],
    ['future.json', '{"format":"handbook-progress","version":2}', 'That file is not a handbook progress file.'],
  ] as const) {
    test(`${name} is refused with a reason and changes nothing`, async ({ page }) => {
      await page.addInitScript(() => { if (!localStorage.getItem('handbookState')) localStorage.setItem('handbookState', JSON.stringify({ read: { ch9: true } })); });
      await page.goto('/ch1');
      await open(page);
      await page.setInputFiles('#settingImportFile', { name, mimeType: 'application/json', buffer: Buffer.from(content) });
      await expect(page.locator('#settingTransferNote')).toHaveText(message);
      await expect(page.getByRole('button', { name: 'Replace my progress' })).toHaveCount(0);
      expect(JSON.parse((await stored(page, 'handbookState'))!).read).toEqual({ ch9: true });
    });
  }
});
