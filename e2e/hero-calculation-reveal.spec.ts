import { expect, test } from './fixtures';

test.use({ storageState: { cookies: [], origins: [] } });

for (const width of [1440, 1024, 900, 390, 320]) {
  test(`calculation reveals upward without resizing the hero at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    const card = page.getByRole('region', { name: 'Your daily conversation target' });
    const toggle = card.getByRole('button', { name: 'How it’s calculated' });
    const panel = card.locator('.pub-calc-details');
    await expect(page.locator('form[data-source="hero"]')).toHaveAttribute('data-ready', 'true');
    await toggle.focus();
    const before = await card.boundingBox();
    const toggleBefore = await toggle.boundingBox();
    const scrollBefore = await page.evaluate(() => window.scrollY);
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle.locator('.lucide-chevron-down')).toBeVisible();
    await expect(panel).toBeVisible();
    await expect.poll(() => panel.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42)).toBe(0);
    await expect(card.getByRole('heading')).toBeVisible();
    await expect(page.locator('#heroGoal')).toBeHidden();
    await expect(card.locator('.pub-device-calculator')).toHaveAttribute('inert', '');
    await expect(panel.locator('tbody tr td:last-child')).toHaveText(['13', '39', '780', '16.25', '3.25']);
    const after = await card.boundingBox();
    const toggleAfter = await toggle.boundingBox();
    const panelBox = await panel.boundingBox();
    const titleBox = await card.getByRole('heading').boundingBox();
    expect(after).toEqual(before);
    expect(toggleAfter).toEqual(toggleBefore);
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
    expect(panelBox!.y).toBeGreaterThanOrEqual(titleBox!.y + titleBox!.height);
    expect(panelBox!.y - (titleBox!.y + titleBox!.height)).toBeLessThanOrEqual(5);
    expect(panelBox!.y + panelBox!.height).toBeLessThanOrEqual(toggleAfter!.y);
    expect(await panel.evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.keyboard.press('Tab');
    await expect(panel.getByRole('link')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle.locator('.lucide-chevron-up')).toBeVisible();
    await expect(panel).toBeHidden();
    await expect(page.locator('#heroGoal')).toBeVisible();
    expect(await card.boundingBox()).toEqual(before);
    await page.keyboard.press('Space');
    await expect(panel).toBeVisible();
    await toggle.click();
    await expect(panel).toBeHidden();
    expect(await card.boundingBox()).toEqual(before);
    await toggle.click();
    await expect.poll(() => panel.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42)).toBe(0);
    await card.screenshot({ path: test.info().outputPath(`calculation-open-${width}.png`) });
  });
}

test('the calculation moves through multiple upward positions and respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('form[data-source="hero"]')).toHaveAttribute('data-ready', 'true');
  const panel = page.locator('.pub-calc-details');
  const animation = await page.locator('.pub-calc-toggle').evaluate(async toggle => {
    if (!(toggle instanceof HTMLButtonElement)) throw new Error('Calculation toggle must be a button');
    const panel = document.getElementById('heroCalculationDetails')!;
    // Establish the closed style before starting and sampling the real transition.
    getComputedStyle(panel).display;
    toggle.click();
    const samples: number[] = [];
    const opacities: string[] = [];
    const backgrounds: string[] = [];
    const deadline = performance.now() + 2000;
    do {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      samples.push(new DOMMatrixReadOnly(getComputedStyle(panel).transform).m42);
      opacities.push(getComputedStyle(panel).opacity);
      backgrounds.push(getComputedStyle(panel).backgroundColor);
    } while ((samples.length < 2 || samples.at(-1)! > 0) && performance.now() < deadline);
    return { positions: samples, opacities, backgrounds };
  });
  const { positions } = animation;
  expect(new Set(animation.opacities)).toEqual(new Set(['1']));
  const surface = await page.locator('.pub-card.pub-device').evaluate(el => getComputedStyle(el).backgroundColor);
  expect(new Set(animation.backgrounds)).toEqual(new Set([surface]));
  await expect(page.locator('.pub-calc-viewport')).toHaveCSS('background-color', surface);
  expect(positions[0]).toBeGreaterThan(20);
  expect(positions.at(-1)).toBe(0);
  expect(new Set(positions.map(y => Math.round(y))).size).toBeGreaterThan(3);
  for (let i = 1; i < positions.length; i++) expect(positions[i]).toBeLessThanOrEqual(positions[i - 1]!);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('.pub-calc-toggle').focus();
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(page.locator('.pub-calc-viewport')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await page.locator('.pub-calc-toggle').click();
  await expect(panel).toBeVisible();
  await expect(panel).toHaveCSS('transition-duration', '0s');
  await expect(panel).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
});
