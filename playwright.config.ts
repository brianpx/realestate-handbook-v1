import { defineConfig } from '@playwright/test';
import { AUTH_FILE, signedInState } from './e2e/auth';
import { BASE_URL as ORIGIN, BYPASS_HEADERS, IS_REMOTE, LOCAL_ONLY_SPECS } from './e2e/target';

const MAILPIT_URL = 'http://localhost:8025';

export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/global-setup.ts',
  testIgnore: IS_REMOTE ? LOCAL_ONLY_SPECS : undefined,
  webServer: IS_REMOTE ? undefined : [
    {
      command: 'pnpm build && pnpm start -p 3187',
      url: ORIGIN,
      reuseExistingServer: false,
      timeout: 180_000,
      // Lead capture is on for the tests, writing to a throwaway file. LEAD_CAPTURE_ENABLED is read at build time.
      // Sign-in uses a throwaway file store too, and Mailpit below as the mail catcher the sign-in spec reads from.
      env: {
        NEXT_PUBLIC_COACH_ENABLED: 'true',
        LEAD_CAPTURE_ENABLED: 'true',
        LEAD_STORE: 'file',
        LEAD_STORE_PATH: '.data/e2e-leads.json',
        LEAD_IP_SALT: 'e2e-only-salt',
        AUTH_STORE: 'file',
        AUTH_STORE_PATH: AUTH_FILE,
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
    // Every test starts as a signed-in reader who has already dismissed the email gate; the gate's and sign-in's own
    // tests override this.
    storageState: signedInState([{ name: 'handbookAccess', value: '1' }]),
  },
});
