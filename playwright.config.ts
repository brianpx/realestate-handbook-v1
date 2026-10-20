import { defineConfig } from '@playwright/test';

const ORIGIN = 'http://localhost:3187';

export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/global-setup.ts',
  webServer: {
    command: 'pnpm build && pnpm start -p 3187',
    url: ORIGIN,
    reuseExistingServer: false,
    timeout: 180_000,
    // Lead capture is on for the tests, writing to a throwaway file. LEAD_CAPTURE_ENABLED is read at build time.
    env: { NEXT_PUBLIC_COACH_ENABLED: 'true', LEAD_CAPTURE_ENABLED: 'true', LEAD_STORE: 'file', LEAD_STORE_PATH: '.data/e2e-leads.json', LEAD_IP_SALT: 'e2e-only-salt', NEXT_PUBLIC_SITE_URL: ORIGIN },
  },
  use: {
    baseURL: ORIGIN,
    // Every test starts as a reader who has already dismissed the email gate; the gate's own tests clear this.
    storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: [{ name: 'handbookAccess', value: '1' }] }] },
  },
});
