import { expect, test } from './fixtures';

test.use({ storageState: { cookies: [], origins: [] } });

for (const width of [1440, 390, 320]) {
  test(`home confirmation stays readable and supports recovery at ${width}px`, async ({ page }) => {
    const requests: unknown[] = [];
    const email = 'a-long-email-address-for-layout-checks@example.com';
    await page.setViewportSize({ width, height: 1000 });
    await page.route('**/api/auth/request-link', async route => {
      requests.push(route.request().postDataJSON());
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
    await page.goto('/');
    const form = page.locator('form[data-source="hero"]');
    await expect(form).toHaveAttribute('data-ready', 'true');
    await page.clock.install();
    await form.getByLabel('Email address').fill(email);
    await form.getByRole('button', { name: 'Send me the free chapters' }).click();

    const notice = page.getByRole('region', { name: 'Check your inbox.' });
    await expect(notice).toBeVisible();
    await expect(notice.locator('.signup-notice-email')).toHaveText(email);
    await expect(notice).toContainText('expires in 15 minutes');
    await expect(notice).toContainText('Check spam or promotions.');
    await expect(notice.locator('..').getByRole('status')).toHaveText(`Check your inbox at ${email}.`);
    await expect(notice.getByRole('button', { name: /Send again in/ })).toBeDisabled();
    expect(await notice.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (width <= 420) {
      const buttons = notice.getByRole('button');
      const first = await buttons.nth(0).boundingBox();
      const second = await buttons.nth(1).boundingBox();
      expect(second!.y).toBeGreaterThanOrEqual(first!.y + first!.height);
    }
    await notice.screenshot({ path: test.info().outputPath(`confirmation-${width}.png`) });

    await page.clock.fastForward(31_000);
    expect(requests).toHaveLength(1);
    await expect(notice.getByRole('button').first()).toBeEnabled();
    await notice.getByRole('button', { name: 'Use a different email' }).click();
    await expect(form.getByLabel('Email address')).toBeFocused();
    await expect(form.getByLabel('Email address')).toHaveValue('');
  });
}
