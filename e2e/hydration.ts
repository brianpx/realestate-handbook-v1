import { expect, type Page } from '@playwright/test';

// The handbook shell marks <html data-hydrated="true"> once React has mounted (components/shell/HydrationMark.tsx).
// The page fixture in e2e/fixtures.ts calls this after every handbook page.goto; call it directly only in a spec
// that still imports from @playwright/test. Handbook pages only; the public site does not render the mark.
export const waitForHydration = (page: Page) => expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
