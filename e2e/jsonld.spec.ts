import { expect, test } from '@playwright/test';

test('the home page declares the Book and every chapter a Chapter that belongs to it', async ({ page }) => {
  await page.goto('/');
  const cover = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(cover).toHaveLength(1);
  const book = JSON.parse(cover[0]!);
  expect(book['@type']).toBe('Book');
  await page.goto('/handbook/ch5');
  const ch = JSON.parse((await page.locator('script[type="application/ld+json"]').allTextContents())[0]!);
  expect(ch).toMatchObject({ '@type': 'Chapter', isPartOf: { '@id': book['@id'] } });
  expect(new URL(ch.url).pathname.endsWith('/ch5')).toBe(true);
});
