import { expect, test } from './fixtures';

// Exercise the reference screens without sending email or creating accounts.
test.use({ storageState: { cookies: [], origins: [] } });

for (const width of [1440, 390, 320]) {
  test(`sign-in layout, field errors and policy links at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/signin?next=%2Fhandbook%2Fch2');
    const form = page.locator('form[data-source="signin"]');
    await expect(form).toHaveAttribute('data-ready', 'true');
    await expect(page).toHaveTitle(/^Sign in/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sign in to the handbook');
    await expect(page.locator('.pub-nav-cta')).toHaveCount(0);
    await expect(form.getByRole('checkbox')).not.toBeChecked();
    await expect(form.getByRole('link', { name: 'Terms of Use' })).toHaveAttribute('href', '/terms');
    await expect(form.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy');
    const button = form.getByRole('button', { name: 'Email me a sign-in link' });
    const input = form.getByLabel('Email address');
    await button.click();
    await expect(form.getByRole('alert')).toHaveText('Enter your email address to get a sign-in link.');
    await expect(input).toBeFocused();
    await input.fill('jordan@example');
    await button.click();
    await expect(form.getByRole('alert')).toHaveText('That doesn’t look like an email address. Check for a typo.');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(await input.evaluate(el => getComputedStyle(el).borderTopColor)).toBe('rgb(185, 28, 28)');
    const inputBox = await input.boundingBox();
    const errorBox = await form.getByRole('alert').boundingBox();
    const buttonBox = await button.boundingBox();
    expect(errorBox!.y).toBeGreaterThanOrEqual(inputBox!.y + inputBox!.height);
    expect(errorBox!.y + errorBox!.height).toBeLessThanOrEqual(buttonBox!.y);
    expect(Math.abs(inputBox!.width - buttonBox!.width)).toBeLessThan(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`signin-${width}.png`), fullPage: true });
  });
}

test('confirmation preserves the destination, supports explicit resend, and lets the reader change address', async ({ page }) => {
  const requests: unknown[] = [];
  await page.route('**/api/auth/request-link', async route => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.goto('/signup?next=%2Fhandbook%2Fch2');
  await expect(page.locator('form')).toHaveAttribute('data-ready', 'true');
  await page.clock.install();
  await page.getByLabel('Email address').fill('jordan@example.com');
  await page.getByRole('button', { name: 'Email me a sign-in link' }).click();
  const heading = page.getByRole('heading', { name: 'Check your email', exact: true });
  await expect(heading).toBeVisible();
  await expect(heading).not.toBeFocused();
  await expect(heading).not.toHaveAttribute('tabindex');
  await expect(page.locator('.signup [role="status"]')).toContainText('Check your inbox at jordan@example.com.');
  await expect(page).toHaveTitle(/^Check your email/);
  await expect(page.locator('.signup-sent')).toContainText('We sent a sign-in link to jordan@example.com.');
  await expect(page.locator('.signup-sent')).toContainText('expires after 15 minutes');
  await expect(page.getByRole('button', { name: /Resend link in/ })).toBeDisabled();
  await expect(page.getByRole('link', { name: 'Contact support' })).toHaveAttribute('href', '/support');
  expect(requests).toEqual([{ email: 'jordan@example.com', termsVersion: 'v1', source: 'signup-page', next: '/handbook/ch2', _gotcha: '' }]);
  await page.screenshot({ path: test.info().outputPath('signin-confirmation.png'), fullPage: true });
  await page.clock.fastForward(31_000);
  expect(requests).toHaveLength(1);
  await page.getByRole('button', { name: 'Resend link', exact: true }).click();
  await expect.poll(() => requests.length).toBe(2);
  await expect(page.getByRole('button', { name: /Resend link in/ })).toBeDisabled();
  await page.getByRole('button', { name: 'Use a different email' }).click();
  await expect(page.getByLabel('Email address')).toBeFocused();
  await expect(page.getByLabel('Email address')).toHaveValue('');
  await expect(page).toHaveTitle(/^Sign in/);
});
