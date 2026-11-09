import { expect, test } from './fixtures';

// Stylesheet-level guards for the M6 CSS work (CR-M4, M5, L23, L24, L25): the phone scroll root, the dimmed timeline
// buttons, the sidebar rail at the Large text size, range-syntax breakpoints, and the scope of the element rules.
test.describe('css', () => {
  test('on a phone, a focused control scrolls in below the sticky search row', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('/handbook/ch1');
    await expect(page.locator('html')).toHaveCSS('scroll-padding-top', '72px');
    const input = page.locator('.calc-input').first();
    await input.evaluate(el => el.scrollIntoView({ block: 'start' }));
    const clearance = await page.evaluate(() => {
      const control = document.querySelector('.calc-input')!.getBoundingClientRect();
      const rail = document.getElementById('sidebar')!.getBoundingClientRect();
      return control.top - rail.bottom;
    });
    expect(clearance).toBeGreaterThanOrEqual(0);
  });

  test('on a desktop the handbook scroll root has no scroll padding and the public site keeps its own', async ({ page }) => {
    await page.goto('/handbook/ch1');
    await expect(page.locator('html')).toHaveCSS('scroll-padding-top', 'auto');
    await page.goto('/');
    await expect(page.locator('html')).toHaveCSS('scroll-padding-top', '84px');
  });

  test('a filtered-out timeline touch keeps readable text and is not faded by opacity', async ({ page }) => {
    await page.goto('/handbook/ch5');
    await page.getByRole('button', { name: 'Calls' }).click();
    const dim = page.locator('.touch-btn.dim:not([aria-pressed="true"])').first();
    await expect(dim).toHaveCSS('opacity', '1');
    // the text keeps WCAG AA contrast on its own surface whatever the palette tokens are
    expect(await dim.evaluate(el => {
      const lum = (c: string) => { const [r, g, b] = c.match(/\d+/g)!.slice(0, 3).map(v => { const s = Number(v) / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!; };
      const cs = getComputedStyle(el);
      const [hi, lo] = [lum(cs.color), lum(cs.backgroundColor)].sort((a, b) => b - a);
      return (hi! + 0.05) / (lo! + 0.05);
    })).toBeGreaterThanOrEqual(4.5);
    await expect(dim.locator('.touch-day')).toHaveCSS('opacity', '1');
    await expect(page.locator('.touch-btn[aria-pressed="true"]')).toHaveCSS('background-color', 'rgb(18, 48, 74)');
  });

  test('the sidebar subtitle and legal line wrap instead of overrunning the rail at the Large text size', async ({ page }) => {
    await page.goto('/handbook/ch1');
    await page.locator('details.settings summary').click();
    await page.locator('#settingText-large').check();
    await expect(page.locator('html')).toHaveClass(/text-large/);
    await expect(page.locator('.sidebar-header p:not(.sidebar-title)')).toHaveCSS('white-space', 'normal');
    await expect(page.locator('.settings-legal')).toHaveCSS('white-space', 'normal');
    const overflow = await page.evaluate(() => {
      const rail = document.getElementById('sidebar')!;
      const right = rail.getBoundingClientRect().right;
      return [...rail.querySelectorAll<HTMLElement>('.sidebar-header p, .settings-legal')].map(el => el.getBoundingClientRect().right - right);
    });
    for (const px of overflow) expect(px).toBeLessThanOrEqual(0);
  });

  test('no width falls between two sides of the shell breakpoint', async ({ page }) => {
    // The sources use range syntax (`width > 900px` and `width <= 900px`), so 900 and 901 must land on opposite sides.
    await page.setViewportSize({ width: 901, height: 800 });
    await page.goto('/handbook/ch1');
    await expect(page.locator('#menuToggle')).toBeHidden();
    await page.setViewportSize({ width: 900, height: 800 });
    await expect(page.locator('#menuToggle')).toBeVisible();
  });

  test('chapter element rules stay inside the chapter and product cards', async ({ page }) => {
    // chapter text on both surfaces keeps the handbook's paragraph, list and table rules
    for (const path of ['/handbook/ch1', '/preview']) {
      await page.goto(path);
      await expect(page.locator('.chapter-body p:not([class])').first(), path).toHaveCSS('margin-bottom', '16px');
      await expect(page.locator('.chapter-body li').first(), path).toHaveCSS('margin-bottom', '8px');
    }
    await page.goto('/handbook/ch2');
    await expect(page.locator('.chapter-body th').first()).toHaveCSS('background-color', 'rgb(241, 245, 249)');
    // the product's own pages keep their look through the .content-container scope
    await page.goto('/handbook');
    await expect(page.locator('.hb-h2').first()).toHaveCSS('border-bottom-width', '2px');
    await expect(page.locator('.content-container > p:not([class])').first()).toHaveCSS('margin-bottom', '16px');
    // the sidebar is outside both: no 8px gap between menu items
    await expect(page.locator('#navList > li').nth(1)).toHaveCSS('margin-bottom', '0px');
    // the public site styles its own elements: no leaked underline on headings, no zebra rows in the tool index
    await page.goto('/pricing');
    await expect(page.locator('.pub-footer h2').first()).toHaveCSS('border-bottom-width', '0px');
    await expect(page.locator('.pub-footer ul').first()).toHaveCSS('padding-left', '0px');
    await page.locator('.pub-details summary').click();
    await expect(page.locator('.pub-tool-index tbody tr').nth(1)).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  });
});
