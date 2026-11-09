import { expect, type Page } from '@playwright/test';

// The handbook shell marks <html data-hydrated="true"> once React has mounted (components/shell/HydrationMark.tsx).
// Call this after page.goto before pressing a shortcut or using a control whose listener exists only after
// hydration. Handbook pages only; the public site does not render the mark.
export const waitForHydration = (page: Page) => expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
