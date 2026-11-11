// Which site the suite tests. Unset: a local production build on port 3187 (see playwright.config.ts).
// PLAYWRIGHT_BASE_URL=https://<preview>.vercel.app tests a deployment instead. Previews sit behind Vercel login, so
// also set VERCEL_AUTOMATION_BYPASS_SECRET (the project's "Protection Bypass for Automation" secret).
const LOCAL = 'http://localhost:3187';

export const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL ?? LOCAL).replace(/\/+$/, '');
export const IS_REMOTE = BASE_URL !== LOCAL;

// Against a deployment the product pages need a signed-in reader, and the reader has to exist in the database that
// deployment reads. E2E_DATABASE_URL is that database (a non-production Neon branch, never the production branch);
// with it the suite seeds its readers there (e2e/auth.ts). Without it the product specs redirect to sign-in and fail.
export const SEED_DATABASE_URL = IS_REMOTE ? process.env.E2E_DATABASE_URL : undefined;
export const CAN_SEED = !IS_REMOTE || Boolean(SEED_DATABASE_URL);

export const BYPASS_HEADERS: Record<string, string> = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  ? { 'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET, 'x-vercel-set-bypass-cookie': 'true' }
  : {};

// Specs that need a server built with lead capture on and a throwaway lead file, Mailpit, or a staged fake old host.
// A deployment is not built that way, so they run only locally.
export const LOCAL_ONLY_SPECS = ['**/lead.spec.ts', '**/cutover-stub.spec.ts', '**/auth.spec.ts', '**/admin.spec.ts', '**/billing.spec.ts'];
// Specs that seed readers of their own; against a deployment they need E2E_DATABASE_URL.
export const SEEDING_SPECS = ['**/access.spec.ts'];
