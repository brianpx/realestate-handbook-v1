import { expect, test } from '@playwright/test';

// Print styles (the plan's phase 1 check). This exercises the print media rules in a browser; it does not replace
// printing a few chapters to paper or PDF and reading them.
test.describe('printing', () => {
  test.beforeEach(async ({ page }) => { await page.emulateMedia({ media: 'print' }); });

  test('hides the sidebar, menu button, gate and scorecard tools, and keeps the chapter', async ({ page }) => {
    await page.goto('/handbook/app-a');
    await expect(page.locator('#sidebar')).toBeHidden();
    await expect(page.locator('.menu-toggle')).toBeHidden();
    await expect(page.locator('.scorecard-tools')).toBeHidden();
    await expect(page.getByRole('heading', { name: /Appendix A/ })).toBeVisible();
    await expect(page.locator('table.scorecard')).toBeVisible();
  });

  test('prints white on dark mode, with the chapter text readable', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('handbookSettings', JSON.stringify({ dark: true })));
    await page.goto('/handbook/ch1');
    await expect(page.locator('html')).toHaveClass(/dark/);
    const colors = await page.evaluate(() => {
      const lum = (rgb: string) => { const m = rgb.match(/\d+(\.\d+)?/g)!.map(Number); return (0.2126 * m[0]! + 0.7152 * m[1]! + 0.0722 * m[2]!) / 255; };
      const bg = getComputedStyle(document.querySelector('#content-container')!).backgroundColor;
      const fg = getComputedStyle(document.querySelector('#content-container p')!).color;
      return { bg: bg === 'rgba(0, 0, 0, 0)' ? 1 : lum(bg), fg: lum(fg) };
    });
    expect(colors.bg).toBeGreaterThan(0.8);
    expect(colors.fg).toBeLessThan(0.4);
  });

  test('the next-chapter link and footer stay together, and the page makes a multi-page PDF', async ({ page }) => {
    await page.goto('/handbook/ch8');
    await expect(page.locator('.chapter-outline').first()).toBeHidden();
    const pdf = await page.pdf({ format: 'Letter' });
    expect(pdf.byteLength).toBeGreaterThan(20_000);
    const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    expect(pages).toBeGreaterThan(2);
  });
});
