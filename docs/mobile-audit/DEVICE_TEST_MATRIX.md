# Device and route test matrix

Audit date: 2026-11-10. Source snapshot: `2e02de7` plus pre-existing uncommitted edits, hashes in `artifacts/source-snapshot.json`. Tests used an isolated source/dependency copy at `/private/tmp/reh-mobile-audit-20261110`, port 3199, separate file-backed authentication/lead data and existing reader/admin fixtures. No production database or email service was used. No active worktree, shared build output, environment file or branch was changed.

## Executed environments

| Environment | Configuration | Result |
|---|---|---|
| Chromium 156.0.8078.4 | Playwright iPhone 13 preset (touch/mobile, DPR 3), height 844, each requested width | 552 route/width observations; no document horizontal overflow |
| WebKit 27.2 | Same preset, height and width sweep | 552 route/width observations; no document horizontal overflow |
| Firefox | Launch attempted | Not verified: installed browser executable `firefox-1555/firefox/Nightly.app/Contents/MacOS/firefox` absent |
| Chromium desktop | Existing a11y, CSS and semantic suite plus targeted cases | Production: 19/19 passed; development: 18/19 passed, one dev-toolbar focus interference |
| Chromium Pixel 7 preset | Touch, DPR 2.625, unsigned-in public context | Menu → Sample lesson tap navigation and invalid-email constraint check passed |
| Chromium 320×640 | Root font-size 200% simulation | Overflow on /, /preview, /handbook/ch1, /account; /handbook/start fits |
| Chromium 768×320 | Short landscape, opened menu | Navigation bottom 353.53px exceeds viewport; top close remains available |
| Chromium dark + reduced motion | Media preferences set, reload | Dark class and reduced-motion media query confirmed; screenshot captured |
| Physical iOS/iPadOS/Android/desktop Safari | No hardware access | Not verified |

All requested CSS widths were executed: **320, 360, 375, 390, 402, 430, 480, 768, 820, 1024, 1280, 1440**. Wide sweep rows retain touch/mobile emulation; they are layout observations, not desktop OS certification. Existing desktop test cases separately use desktop Chromium. Viewport resizing is not equivalent to actual orientation events, browser chrome, virtual keyboards or tablet multitasking. WebKit is not physical Safari.

## Route-by-route results

Every row below received 24 observations: 12 widths × 2 engines. “No overflow” means document scrollWidth ≤ innerWidth + 1 at default text size after initial rendering. It does not assert absence of clipping, correct internal table scrolling, or completion of every widget. The sweep was against the dev server; production received the focused 19-test subset.

| Route | Fixture/state | Initial response / overflow | Additional findings or gaps |
|---|---|---|---|
| `/` | Public page in signed-in context | 200; no overflow | 200% root-font overflow (MA-01) |
| `/preview` | Public page in signed-in context | 200; no overflow | 200% root-font overflow (MA-01) |
| `/pricing` | Public page in signed-in context | 200; no overflow | Rendering only; full flow not exercised |
| `/signin` | Public page in signed-in context | 200; no overflow | Rendering only; full flow not exercised |
| `/signup` | Public page in signed-in context | 200; no overflow | Rendering only; full flow not exercised |
| `/about` | Public page in signed-in context | 200; no overflow | Rendering only; full flow not exercised |
| `/support` | Public page in signed-in context | 200; no overflow | Rendering only; full flow not exercised |
| `/updates` | Public page in signed-in context | 200; no overflow | Rendering only; full flow not exercised |
| `/terms` | Public page in signed-in context | 200; no overflow | Rendering only; full flow not exercised |
| `/privacy` | Public page in signed-in context | 200; no overflow | Rendering only; full flow not exercised |
| `/refunds` | Public page in signed-in context | 200; no overflow | Rendering only; full flow not exercised |
| `/goodbye` | Public page in signed-in context | 200; no overflow | Rendering only; full flow not exercised |
| `/coming-soon` | Public page in signed-in context | 200; no overflow | Rendering only; full flow not exercised |
| `/auth/verify` | Public page in signed-in context | 200; no overflow | Missing/invalid-token recovery state only |
| `/subscribe/confirm` | Public page in signed-in context | 200; no overflow | Missing/invalid-token recovery state only |
| `/missing-audit-route` | Public page in signed-in context | 404; no overflow | Expected 404 |
| `/handbook` | Pro reader | 200; no overflow | Rendering only; full flow not exercised |
| `/handbook/start` | Pro reader | 200; no overflow | 200% root-font probe fits; full completion not exercised |
| `/handbook/plan` | Pro reader | 200; no overflow | Rendering only; full flow not exercised |
| `/handbook/review` | Pro reader | 200; no overflow | Rendering only; full flow not exercised |
| `/account` | Pro reader | 200; no overflow | 200% root-font overflow (MA-01); profile unavailable without database |
| `/handbook/cover` | Pro reader | 200; no overflow | Rendering only; full flow not exercised |
| `/handbook/pref` | Pro reader | 200; no overflow | Rendering only; full flow not exercised |
| `/handbook/ch1` | Pro reader | 200; no overflow | 200% root-font overflow (MA-01) |
| `/handbook/ch2` | Pro reader | 200; no overflow | Rendering only; full flow not exercised |
| `/handbook/ch3` | Pro reader | 200; no overflow | Rendering only; full flow not exercised |
| `/handbook/ch4` | Pro reader | 200; no overflow | Rendering only; full flow not exercised |
| `/handbook/ch5` | Pro reader | 200; no overflow | Rendering only; full flow not exercised |
| `/handbook/ch6` | Pro reader | 200; no overflow | Rendering only; full flow not exercised |
| `/handbook/ch7` | Pro reader | 200; no overflow | Rendering only; full flow not exercised |
| `/handbook/ch8` | Pro reader | 200; no overflow | Rendering only; full flow not exercised |
| `/handbook/ch9` | Pro reader | 200; no overflow | Rendering only; full flow not exercised |
| `/handbook/ch10` | Pro reader | 200; no overflow | Rendering only; full flow not exercised |
| `/handbook/ch11` | Pro reader | 200; no overflow | Next phrase focus loss confirmed (MA-02) |
| `/handbook/ch12` | Pro reader | 200; no overflow | Rendering only; full flow not exercised |
| `/handbook/ch13` | Pro reader | 200; no overflow | Rendering only; full flow not exercised |
| `/handbook/app-a` | Pro reader | 200; no overflow | Rendering only; full flow not exercised |
| `/handbook/app-b` | Pro reader | 200; no overflow | Rendering only; full flow not exercised |
| `/handbook/app-c` | Pro reader | 200; no overflow | Rendering only; full flow not exercised |
| `/handbook/app-d` | Pro reader | 200; no overflow | Rendering only; full flow not exercised |
| `/handbook/app-e` | Pro reader | 200; no overflow | Rendering only; full flow not exercised |
| `/handbook/app-f` | Pro reader | 200; no overflow | Rendering only; full flow not exercised |
| `/admin` | Admin | 200; no overflow | Small/empty file fixture; populated data/actions unverified |
| `/admin/users` | Admin | 200; no overflow | Small/empty file fixture; populated data/actions unverified |
| `/admin/leads` | Admin | 200; no overflow | Small/empty file fixture; populated data/actions unverified |
| `/admin/audit` | Admin | 200; no overflow | Small/empty file fixture; populated data/actions unverified |

Additional source-inventoried route `/admin/users/[id]` was not opened. API routes are supporting endpoints, not user-facing screens: account profile/delete/sign-out-all; admin user actions; auth request-link/verify/sign-out; lead/confirm; media. Metadata/search routes: sitemap, robots, search-index JSON. Legacy root chapter URLs redirect to `/handbook/*`; they were inspected but not rerun in this audit.

## Commands and results

All execution below occurred in the isolated copy, not the active repository build directory.

- `node node_modules/@playwright/test/cli.js test -c audit.config.ts`: **1 collector passed**, 1,104 records; collector gathers observations rather than asserting every UX criterion. Independent validation asserts 1,104 records, each requested width, expected HTTP status, and no default document overflow.
- `node node_modules/@playwright/test/cli.js test -c interaction.config.ts`: **19 passed on production**, saved in `artifacts/production-interaction-tests.json`; same subset had **18 passed / 1 failed on development**, saved separately. Failure: `e2e/a11y.spec.ts:81`, “Tab 32 left the sidebar”; diagnostic active element was `NEXTJS-PORTAL`. Production rerun resolved it without an application change.
- `env -u DATABASE_URL -u E2E_DATABASE_URL NEXT_PUBLIC_COACH_ENABLED=true pnpm build`: **passed** in isolation, including TypeScript and 45 generated pages. Database migration reported DATABASE_URL unset, nothing to do. Initial temporary tooling type error (unsupported defaultBrowserType option) was fixed before successful build. Initial sandbox dependency-fetch failure was retried with permission.
- Initial webpack dev attempt produced “Cannot find the middleware module” and false 404 screens. Those attempts were interrupted and superseded by default Turbopack evidence; not counted as passes or product defects.
- No production code changed; the full Vitest suite and repository `pnpm typecheck` were not run. Successful production build performed TypeScript checking of the copied project and audit scripts.
- `node performance.cjs`: completed three production localhost throttled navigation samples; LCP candidates and raw layout-shift sums recorded in `artifacts/performance.json`, no INP measurement.
- Axe and Lighthouse were not installed/run. No dependency was added to the source repository. Existing pinned dependencies were restored only in the isolated copy.

## Evidence and coverage limits

`artifacts/route-matrix.json` contains route/status/dimensions, offscreen candidates and input-font diagnostics. Candidate offscreen children inside intentionally scrolling tables are not standalone defects. `artifacts/targeted.json` contains production-rerun observations, including the known focus/overflow defects: its passing collector does not mean those behaviors passed an accessibility assertion. `artifacts/diagnostics.json` identifies overflow candidates, removed list markers and the development-toolbar focus destination. Screenshots are evidence captures, not approved visual-regression baselines; only representative captures were visually reviewed.

Gaps: Firefox, real screen readers, physical keyboards/virtual keyboards, safe areas and browser toolbars, native text enlargement/browser zoom, landscape rotation events, all forms and admin mutations, successful email delivery/magic-link handoff, profile persistence, long populated tables, all loading/error/offline states, glossary long-content stress, file import/export on phones, full contrast and target-spacing evaluation, real-user metrics and Lighthouse. Existing fixtures verified access to paid pages; entitlement downgrade/suspension/preview-reader variants were not exercised here. Production route sweep and full business-flow suite remain follow-up work.
