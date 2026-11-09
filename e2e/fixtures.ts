import { test as base, type Page } from '@playwright/test';
import { waitForHydration } from './hydration';

export * from '@playwright/test';

// page.goto on a handbook page also waits for the shell's hydration mark. A fill or click straight after goto then
// reaches React's handlers instead of the server HTML, where a controlled input would be reset on hydration and a
// data-goto link would do a full reload. Slow runners (CI) hit that race; fast ones rarely do. A page with
// JavaScript off never hydrates, so it is not waited for.
export const test = base.extend<{ page: Page }>({
  page: async ({ page, javaScriptEnabled }, use) => {
    const goto = page.goto.bind(page);
    page.goto = async (url, options) => {
      const response = await goto(url, options);
      if (javaScriptEnabled && new URL(page.url()).pathname.startsWith('/handbook')) await waitForHydration(page);
      return response;
    };
    await use(page);
  },
});
