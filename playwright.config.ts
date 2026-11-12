import { defineConfig } from '@playwright/test';
import { AUTH_FILE, signedInState } from './e2e/auth';
import { BASE_URL as ORIGIN, BYPASS_HEADERS, IS_REMOTE, LOCAL_ONLY_SPECS, SEED_DATABASE_URL, SEEDING_SPECS } from './e2e/target';

const MAILPIT_URL = 'http://localhost:8025';

export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/global-setup.ts',
  testIgnore: IS_REMOTE ? [...LOCAL_ONLY_SPECS, ...(SEED_DATABASE_URL ? [] : SEEDING_SPECS)] : undefined,
  webServer: IS_REMOTE ? undefined : [
    {
      command: 'pnpm build && pnpm start -p 3187',
      url: ORIGIN,
      reuseExistingServer: false,
      timeout: 180_000,
      // The lead and sign-in stores are throwaway files, and Mailpit below is the mail catcher the specs read from.
      env: {
        NEXT_PUBLIC_COACH_ENABLED: 'true',
        LEAD_STORE: 'file',
        LEAD_STORE_PATH: '.data/e2e-leads.json',
        LEAD_IP_SALT: 'e2e-only-salt',
        AUTH_STORE: 'file',
        AUTH_STORE_PATH: AUTH_FILE,
        // A local signed webhook. The secret and the API key are fixtures, not Lemon Squeezy credentials.
        BILLING_PROVIDER: 'lemonsqueezy',
        BILLING_WEBHOOK_SECRET: 'e2e-billing-webhook-secret',
        BILLING_API_KEY: 'e2e',
        BILLING_ORDER_FIXTURE: '.data/e2e-orders.json',
        BILLING_STORE: 'file',
        BILLING_STORE_PATH: '.data/e2e-billing.json',
        CRON_SECRET: 'e2e-cron-secret',
        MAILPIT_URL,
        NEXT_PUBLIC_SITE_URL: ORIGIN,
      },
    },
    // Mailpit (a local mail catcher): an instance already running is reused, otherwise the installed binary starts.
    { command: 'mailpit', url: `${MAILPIT_URL}/api/v1/info`, reuseExistingServer: true, timeout: 20_000 },
  ],
  use: {
    baseURL: ORIGIN,
    // A failure on CI is otherwise only a line of log; the trace goes into the uploaded HTML report.
    trace: 'retain-on-failure',
    extraHTTPHeaders: BYPASS_HEADERS,
    // Every test starts as a signed-in member; the sign-in, lead and admin specs override this.
    storageState: signedInState([]),
  },
});
