import { expect, test } from './fixtures';
import { contentSecurityPolicy, PERMISSIONS_POLICY } from '../lib/security-headers';

// The security headers from next.config.ts (M8 step 1, CR-L1) on every kind of response, and no policy violation on
// the pages that run the most code: the home page, the sample, the sign-in form, a chapter with its tools and a coach
// page. A violation fires securitypolicyviolation whether the policy enforces or only reports, and an enforced one
// also prints a console error, so both are collected: a directive that a page quietly trips in DevTools fails here.
const PAGES = ['/', '/preview', '/signin', '/handbook/ch1', '/handbook/plan'];

const EXPECTED = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': PERMISSIONS_POLICY,
  'content-security-policy': contentSecurityPolicy(false),
};

declare global {
  interface Window { __cspViolations: string[] }
}

for (const path of PAGES) {
  test(`${path} carries the headers and trips no CSP directive`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', m => { if (m.type() === 'error' || m.text().includes('Content Security Policy')) consoleErrors.push(m.text()); });
    await page.addInitScript(() => {
      window.__cspViolations = [];
      document.addEventListener('securitypolicyviolation', e => window.__cspViolations.push(`${e.disposition} ${e.violatedDirective} ${e.blockedURI}`));
    });
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    const headers = response!.headers();
    for (const [name, value] of Object.entries(EXPECTED)) expect(headers[name], name).toBe(value);
    await expect(page.locator('main, #content-container').first()).toBeVisible();
    // a moment for hydration and the first client requests, so a blocked script or fetch has fired its event
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 250)));
    expect(await page.evaluate(() => window.__cspViolations)).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}

test('the API and a static file carry the same headers', async ({ request }) => {
  const api = await request.get('/api/lead');
  expect(api.status()).toBe(405);
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  for (const res of [api, robots]) for (const [name, value] of Object.entries(EXPECTED)) expect(res.headers()[name], name).toBe(value);
});
