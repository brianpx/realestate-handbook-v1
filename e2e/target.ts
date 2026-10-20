// Which site the suite tests. Unset: a local production build on port 3187 (see playwright.config.ts).
// PLAYWRIGHT_BASE_URL=https://<preview>.vercel.app tests a deployment instead. Previews sit behind Vercel login, so
// also set VERCEL_AUTOMATION_BYPASS_SECRET (the project's "Protection Bypass for Automation" secret).
const LOCAL = 'http://localhost:3187';

export const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL ?? LOCAL).replace(/\/+$/, '');
export const IS_REMOTE = BASE_URL !== LOCAL;

export const BYPASS_HEADERS: Record<string, string> = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  ? { 'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET, 'x-vercel-set-bypass-cookie': 'true' }
  : {};

// Specs that need a server built with lead capture on and a throwaway store, or that stage a fake old host.
// A deployment is not built that way, so they run only locally.
export const LOCAL_ONLY_SPECS = ['**/gate.spec.ts', '**/cutover-stub.spec.ts'];
