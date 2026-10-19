import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  webServer: { command: 'pnpm build && pnpm start -p 3187', url: 'http://localhost:3187', reuseExistingServer: false, timeout: 180_000 },
  use: { baseURL: 'http://localhost:3187' },
});
