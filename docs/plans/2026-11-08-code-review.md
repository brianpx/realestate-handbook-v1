# Code review: realestate-handbook-v1

Reviewed 8 November 2026 by six parallel reviewers (architecture, security, accessibility, CSS, TypeScript, tests) and a lead who re-verified every High and most Medium findings against the source, the running app, or the reviewers' screenshots. Review only: no application code was changed, no packages installed, nothing deployed. This file is the only thing written to the repository.

## Baseline, and what moved during the review

- **Reviewed commit: `699d62a` ("feat(site): sample Chapters 1 and 7 in full on /preview"), branch `main`.**
- The review started against `dc3b45e` plus uncommitted work (a `/signup` page, `SignupForm.tsx`, header/footer/sitemap links). At 15:05 another Claude Code session working for the owner committed `699d62a`, which dropped that sign-up work instead of finishing it, made `/preview` render Chapters 1 and 7 whole, and recorded the reasoning in `docs/plans/free-sample-decision.md`. The same session then began moving older docs into `docs/_archive/` (staged renames, still uncommitted when this was written). Nothing in this review changed the tree; the reviewers' own kills and builds were traced and none touched the working tree or the owner's dev server.
- Reviewers 1, 2 and 5 did their source reading on the earlier tree and were re-pointed at `699d62a`; their sign-up findings are recorded as resolved. Reviewers 3, 4 and 6 observed the committed tree (Reviewer 6 ran every command against both). Where a finding is about the new `/preview` code, it is marked "post-699d62a".
- Path note: `docs/launch-handoff.md` is referenced below at its staged new location `docs/_archive/launch-handoff.md`.

## Executive assessment

The codebase is in good shape for its size. There are no confirmed vulnerabilities, no `any`, no suppressed type errors, runtime validation at every persistence boundary, a clean server/client split, and a fast, behaviour-based test suite. The most important risks are not exploits but gaps that will bite at launch:

1. **The e2e suite is red on `main` and nothing runs it.** Seven goal-calculator tests have failed deterministically since commit `581fff3` (a stale locator after an accessibility change), one search test is flaky, and there is no CI. Real regressions are currently invisible. (H1)
2. **Two dark-mode readability failures on pages buyers will see**: the pitfall-cycle explorer on Chapter 7 and `/preview`, and every callout box on `/preview`. Both are small CSS fixes. (H2, H3)
3. **Nothing enforces access to the product.** `/handbook/*` is public by design today; the moment a price or a "free chapters for an email" promise goes live, that becomes a High. The owner's own handoff doc already says so. (M1)
4. **Keyboard and screen-reader users can answer a quiz by accident and lose their place**, and the mobile table-of-contents menu does not keep focus inside itself. (M2, M3, M4)
5. **The new `/preview` page shipped with a flattened heading hierarchy, chapter-title styling on every section heading, and a leak of the handbook's "hide quizzes" setting.** All are small, but the page is the sales sample. (M6, L13)

Confidence: high for everything marked confirmed below (observed in a browser, reproduced from code, or re-verified by the lead). The material gaps are: no screen-reader run, no axe-core (not installed), no production-header check (dev server only), the email gate not observable (feature flag off locally), and Chromium only.

## Architecture and technology

| Item | Value |
|---|---|
| Framework | Next.js 16.4.2, App Router, React 19.3.1; all routes static except `POST /api/lead` |
| Language | TypeScript 5.9.3, `strict` + `noUncheckedIndexedAccess`; no ESLint, no lint script |
| Styling | Tailwind 4.3.3 via `@tailwindcss/postcss`, CSS-first (`@theme`, `@source`, `@custom-variant dark`); nearly all styling is hand-written classes in `app/globals.css` (product) and `app/(public)/site.css` (marketing) |
| Data | Chapters are trusted HTML in `content/pages/*.html`, split on validated widget markers (`lib/widget-markers.ts`) and rendered with `dangerouslySetInnerHTML` plus React widgets (`components/widgets/registry.tsx`). Reader state lives in `localStorage` behind zod schemas (`lib/state/*`) |
| Server | One API route, `app/api/lead/route.ts` → `lib/leads/handler.ts` (email gate lead capture; file store for dev, Neon Postgres in production, SendGrid or Mailpit mail). Build-time search index at `/search-index.json` |
| Auth, sessions, cookies, uploads, admin | None (not applicable). Product access is unenforced |
| Tests | vitest 5 (369 unit tests, happy-dom for four files), Playwright 1.64 (229 e2e tests against a local production build on port 3187) |
| Package manager | pnpm (`/opt/homebrew/bin/pnpm`; the `pnpm` first on this machine's PATH is a broken shim) |

## Coverage

| Reviewer | Scope | Checks performed | Limitations |
|---|---|---|---|
| 1 Architecture | Shell, state, content pipeline, widgets, coach, public site, six user journeys; addendum on `699d62a` | Full read of `app/`, `components/`, state/content/routing/coach/leads libs; marker-to-registry cross-checks; live probes of `/preview` (ids, h1 count, widget state, hide-quizzes) | Journeys traced from source, only `/preview` observed live; no bundle analysis |
| 2 Security | Trust boundaries, XSS, CSRF, SSRF, injection, headers, privacy, dependencies | `rg` sweeps for every sink and env read; `pnpm audit --json`; `.env`/`.data` presence check (contents never read); Next docs for headers/CSP | Runtime probes executed by Reviewer 6 instead (dev server only); Vercel's `x-forwarded-for` handling not verified externally |
| 3 Accessibility | WCAG 2.2 A/AA across 21 routes × 1280/360/320 × light/dark | Scripted sweeps (headings, landmarks, alt, names, 24px targets, overflow, ~450 Tab stops with focus-ring measurement), scripted interaction tests, ~70 contrast pairs, MCP tree snapshot | No axe-core (not installed), no screen reader, no forced-colours, gate modal not observable |
| 4 CSS/Tailwind | Tokens, layers, specificity, breakpoints, dark mode, overflow, stacking, dynamic classes | Compiled both stylesheets with the repo's PostCSS plugin; 200 screenshot loads (19 routes × 5 widths × 2 themes, plus `/preview` re-run); overflow and computed-style probes | Chromium only; no print rendering; no hover/active screenshots |
| 5 TypeScript | Strictness, assertions, narrowing, boundaries, runtime validation | `rg` inventories (0 `any`, 0 ts-ignore, 5 `as unknown as`, 75 `!`), boundary tracing, `node -e` semantics check | `tsc` run by Reviewer 6; one cast-removal question left unverified |
| 6 Tests | Inventory, quality, flakiness, command execution | `typecheck`, `test`, `e2e`, `audit`, curl probes, coach happy-path in browser; all repeated against HEAD | No CI to compare with; parity specs read by header, not line by line |

## Verification summary (against HEAD `699d62a`)

| Command | Status | Notes |
|---|---|---|
| `/opt/homebrew/bin/pnpm typecheck` | PASS | exit 0, ~3 s. Failed once mid-review on stale `.next/dev/types` after the sign-up route was deleted with the dev server down (see M10) |
| `/opt/homebrew/bin/pnpm test` | PASS | 38 files passed, 1 skipped; 369 tests passed, 4 skipped (`lib/leads/neon-store.integration.test.ts`, gated on `TEST_DATABASE_URL`) |
| `PATH=/opt/homebrew/bin:$PATH pnpm e2e` | **FAIL** | build OK; 8 failed / 221 passed in 44 s: 7 deterministic failures in `e2e/parity/calculators.spec.ts`, 1 intermittent in `e2e/parity/search.spec.ts:69`. Same 7 failed in three earlier runs |
| `pnpm exec playwright test e2e/parity/search.spec.ts --repeat-each 2` | PASS | 22/22, confirming the flake is load-dependent |
| `/opt/homebrew/bin/pnpm audit` | 1 advisory | `happy-dom` ≤21.0.3, high, GHSA-834v-8h66-3h79, dev-only (L4) |
| `curl -sS -D - http://localhost:3000/handbook/ch1` | observed | 200; no CSP, X-Frame-Options, X-Content-Type-Options or Referrer-Policy; `X-Powered-By: Next.js` present (dev server) |
| `POST /api/lead` with `Origin: https://evil.example` / without Origin / `GET /api/lead` | observed | 403 / 503 (no store on dev) / 405, as designed |
| `GET /ch5` → `/handbook/ch5`; `GET /handbook/zzz`; `GET /signup` | observed | 308 / 404 / 404 |
| 7 bad POSTs from one `x-forwarded-for` (prod build on 3187) | observed | `400 400 400 400 400 429 429`: limit of 5 holds |
| `next lint`, `vitest --update`, `--update-snapshots`, any `--fix` | not run | on purpose (no ESLint exists; no autofix allowed) |

A passing build and green unit suite are not evidence of security or accessibility; those conclusions rest on the manual checks above.

## Prioritised findings

Severity scale: Critical (none found), High, Medium, Low. Optional improvements are listed separately and are not defects.

| ID | Sev | Conf | Category | Location | Impact | Effort |
|---|---|---|---|---|---|---|
| H1 | High | confirmed | tests/process | `e2e/parity/calculators.spec.ts:11,98`; `e2e/parity/search.spec.ts:70-72`; no `.github/workflows` | e2e has been red since `581fff3`; regressions in the headline calculator, search and anything else are masked; no CI gate | small (tests) + small-medium (CI) |
| H2 | High | confirmed | CSS/contrast | `app/globals.css:959` | Pitfall-cycle "interrupted" nodes are invisible in dark mode on `/handbook/ch7` and `/preview` (≈1.2:1) | small |
| H3 | High | confirmed | CSS/contrast (post-699d62a) | `app/(public)/site.css:53` vs `app/globals.css:1214` | Every callout box on `/preview` in dark mode shows light text on pastel (≈1.3:1) | small |
| M1 | Medium (High once selling) | confirmed | authorization | `app/(product)/layout.tsx:9-25`, `app/(product)/handbook/[slug]/page.tsx:24-32`, `components/shell/Gate.tsx:9-11` | `/handbook/*` is fully public; any paywall or "free chapters for an email" promise is cosmetic until a server-side gate exists | large |
| M2 | Medium | confirmed | a11y keyboard | `components/widgets/KnowledgeCheck.tsx:42`; `components/widgets/QuestionItem.tsx:53-59` | First arrow key or Space commits a quiz answer irreversibly, then focus drops to `<body>` (2.1.1, 2.4.3, 3.2.2) | small |
| M3 | Medium | confirmed | a11y focus | `components/shell/Sidebar.tsx:60-83,203-207`; `app/globals.css:1104-1108` | Open mobile TOC menu lets Tab reach content behind the opaque backdrop (2.4.3, 2.4.7) | small |
| M4 | Medium | confirmed | a11y focus (2.4.11) | `app/globals.css:1057-1061` | On phones Shift+Tab lands inputs and glossary buttons entirely under the sticky search row | small |
| M5 | Medium | confirmed | a11y contrast | `app/globals.css:886`; `components/widgets/NurtureTimeline.tsx:55` | Filtered-out touch buttons stay operable at 35 % opacity (≈2.3:1 text) | small |
| M6 | Medium | confirmed | structure/CSS (post-699d62a) | `components/site/Excerpt.tsx:47`; `app/(public)/preview/page.tsx:41-50`; `app/globals.css:356-362,383-396` | `/preview` heading outline is a flat list of ~30 h2s and section headings render at chapter-title size with underline | small-medium |
| M7 | Medium | confirmed | validation | `lib/leads/validate.ts:7`; `lib/leads/config.ts:9`; `lib/leads/handler.ts:45` | `consentVersion: "constructor"` passes the `in` check; consent record stored with a non-string `consentText` | small |
| M8 | Medium | confirmed (code) | stale state | `components/widgets/AmountInput.tsx:22,39` | Typed text is never replaced when the parent sets a new value (presets on `/handbook/start`, restore from file); UI and saved value disagree | small |
| M9 | Medium | likely | navigation | `components/site/PublicHeader.tsx:12-14,23,32-34` | Phone menu stays open after tapping "How it works" / "What's included" (same-page hash links); `aria-current` never set for them | small |
| M10 | Medium | confirmed | build | `tsconfig.json:30-34`; `package.json` `typecheck` | `tsc` depends on generated `.next/types`; on a clean clone the route validator is skipped, and a stale `.next/dev/types` broke `next build` during this review | small |
| M11 | Medium | confirmed | coverage | `app/(product)/handbook/{plan,review}/page.tsx`, `components/coach/*` | Coach plan/review UI has no e2e coverage (99 unit tests cover the logic; the wiring is untested) | medium |
| M12 | Medium | confirmed | error state | `app/not-found.tsx` | 404 renders bare, unstyled elements with no landmarks, header, skip link or footer | small |
| L1 | Low | confirmed | hardening | `next.config.ts` (no `headers()`) | No CSP / frame-ancestors / nosniff / Referrer-Policy; `X-Powered-By` exposed | small (basic), medium (CSP) |
| L2 | Low (Medium off-Vercel) | likely | abuse | `app/api/lead/route.ts:19` | Rate limit keyed on client-suppliable `x-forwarded-for`; fine on Vercel, bypassable elsewhere; no global send ceiling | small |
| L3 | Low | confirmed | config | `lib/leads/store.ts:119-123`; `.env.example:17` | `LEAD_STORE=file` silently beats `DATABASE_URL` in production, losing leads and consent records to an ephemeral disk | small |
| L4 | Low | confirmed | dependency | `pnpm-lock.yaml` (`happy-dom@21.0.3`) | High advisory, dev-only, no runtime exposure; fix is within semver range | small |
| L5 | Low (Medium once mail is live) | confirmed | privacy | `lib/leads/config.ts:7-8`; `db/migrations/001_leads.sql`; `app/(public)/privacy/page.tsx:44-55`; `lib/offer.ts:20` | "Reply unsubscribe" is promised but nothing records it; no retention period; privacy page still has `Decision` placeholders and no contact | medium |
| L6 | Low | confirmed | state | `lib/state/index.ts:10`; `lib/state/transfer.ts:54` | Settings store runs the handbook-state migration chain; every reader gets a spurious `handbookSettings.backup` and future migrations would hit settings | small |
| L7 | Low | confirmed | validation | `lib/leads/store.ts:23,32` | `JSON.parse(...) as Shape`: a damaged `.data/leads.json` makes every request 503 (dev/test store only) | small |
| L8 | Low | confirmed | narrowing | `components/shell/DeepLinks.tsx:37-44`; `components/shell/SidebarSearch.tsx:17,85,137` | `data-goto` and search-index page ids cast to `PageId` without `isPageId`; a content typo pushes a 404 route | small |
| L9 | Low | likely | validation | `lib/coach/schema.ts:65` | One malformed field drops the reader's whole plan (latent; backup is kept) | small |
| L10 | Low | likely | async | `components/shell/ProgressTransfer.tsx:30,44` | `file.text()` rejection is unhandled, no message to the reader | small |
| L11 | Low | confirmed | coupling | `components/widgets/ErrorScoreCard.tsx:50` | Links to legacy `/chN`, relying on the redirect; now also on `/preview` | small |
| L12 | Low | confirmed | preview hardening (post-699d62a) | `components/site/Excerpt.tsx:47`; `e2e/site.spec.ts:46-55` | h1-demotion regex matches only a bare `<h1>` and fails silently; e2e counts hidden nodes and never asserts one h1 | small |
| L13 | Low | confirmed | settings leak (post-699d62a) | `app/layout.tsx:32`; `app/globals.css:1124` | A reader who hid quizzes in the handbook sees `/preview` promise quizzes and show none, with no way to restore them there | small |
| L14 | Low | likely | latent | `components/site/Excerpt.tsx:24`; `components/widgets/CoachCheck.tsx:16,59-61` | If ch1/ch7 questions ever get concept tags, the public sample would write coach attempts and refer to a Settings panel that is not there | small |
| L15 | Low | confirmed | copy (post-699d62a) | `app/(public)/refunds/page.tsx:21`; `app/(public)/page.tsx:362`; `preview/page.tsx:20`; `pricing/page.tsx:122` | Public copy still describes the old one-section sample, or claims chapters run "exactly" as in the handbook (no glossary, outline, read tracking) | small |
| L16 | Low | confirmed | a11y status (4.1.3) | `lib/announce.ts:4-5`; `app/(public)/layout.tsx` | `announce()` is silent on public pages; "Copy script" on `/preview` announces nothing | small |
| L17 | Low | confirmed | a11y focus | `components/shell/Settings.tsx:54-94` | Settings auto-collapses on wheel-up while a control inside it is focused; focus drops to `<body>` | small |
| L18 | Low | confirmed | ARIA | `components/shell/SidebarSearch.tsx:103-105` | `aria-expanded`/`aria-controls` on a `searchbox` are unsupported attributes | small |
| L19 | Low | confirmed | a11y content | `content/pages/*.html` box titles (e.g. `ch1.html:36`); 16 widget headings | Literal "●" in headings is read as "black circle"; `InteractiveHeader.tsx:7` shows the right pattern | small |
| L20 | Low | confirmed | headings | `components/coach/PlanSetup.tsx:47`, `TodayCard.tsx:31,89`, `ReviewDeck.tsx:98,144` | Coach pages skip h1 → h3 | small |
| L21 | Low | inferred | tables | `content/pages/app-b.html:7,30,48`, `app-e.html:6`, `app-f.html`, `ch2.html:79`, `ch9.html:61` | Seven data tables without `<caption>` | small |
| L22 | Low | likely | a11y forms | `components/shell/Gate.tsx:87-90,98` | Email input never gets `aria-invalid`/`aria-describedby`; Escape permanently dismisses the gate | small |
| L23 | Low | confirmed | CSS overflow | `app/globals.css:166-171,744` | Sidebar `white-space: nowrap` lines run to the rail edge at "Large" text | small |
| L24 | Low | confirmed | CSS breakpoints | `app/globals.css:312,1052` and nine distinct max-widths across both stylesheets | 900–901 px gap where neither shell layout applies; breakpoints defined ad hoc | small-medium |
| L25 | Low | confirmed | CSS scoping | `app/globals.css:356-414,506-531` | Unscoped `h2/h3/p/li/table` rules leak into chrome and the public site (root cause of M6; `li` margin in menus; eight site.css rules exist only to undo them) | medium |
| L26 | Low | confirmed | docs | `lib/routes.ts:15` | Comment points at `e2e/routes.spec.ts`, which does not exist (coverage is in `e2e/site.spec.ts:112-121`) | trivial |
| L27 | Low | medium | test quality | `e2e/parity/{search,glossary-tools,practice}.spec.ts` (`networkidle`), `cutover-stub.spec.ts:43`, `parity/settings.spec.ts:69-76` | Hydration proxied by `networkidle` and fixed waits; same root cause as the H1 flake | small |

## Supporting details

### H1. The e2e suite is red on `main` and nothing runs it

- **Evidence.** `e2e/parity/calculators.spec.ts:11` defines `outputCell` as `page.locator('tr', { hasText: step }).locator('td').nth(2)` and line 98 expects `td.nth(1)` to read `$80,000`. Since commit `581fff3` ("give chapters one h1 and real landmarks") `components/widgets/GoalCalculator.tsx:73` renders the step label as `<th scope="row">` followed by only two `<td>`, so the third cell no longer exists ("element(s) not found") and the second now holds the example column (received `$`). Four full runs reproduced the same 7 failures; the calculator itself works (other specs assert `.calc-stat-value`). The failing seven are the only tests of bad-input messages, the stress-test buttons, persistence to `handbookState.calc` and the no-JS fallback for this tool. Separately, `e2e/parity/search.spec.ts:70-72` presses Ctrl/Cmd+K immediately after `page.goto`, before hydration attaches the listener; it failed once in a full run and passed 22/22 alone. There is no `.github/workflows` directory and no lint script.
- **Impact.** `pnpm e2e` exits 1 on every run, so a real regression would be indistinguishable from the known red. Four commits have landed on a red suite.
- **Fix.** Change the helper to `.locator('td').nth(1)` and line 98 to `.nth(0)` (or use `getByRole('row', { name: /Closings needed/ }).getByRole('cell').nth(1)`). For the flake, wait for a hydration signal before pressing (an `expect.poll` around the keypress, or a `data-hydrated` attribute the shell sets after mount, which would also replace the `networkidle` waits in L27). Then add a workflow that runs `pnpm typecheck`, `pnpm test` and `pnpm e2e` on Node 22 with `playwright install --with-deps chromium`. Adding CI is a new build tool: confirm with the owner first.
- **Verify.** `PATH=/opt/homebrew/bin:$PATH pnpm exec playwright test e2e/parity/calculators.spec.ts` → 14 passed; `pnpm e2e` → 0 failed across three runs; `search.spec.ts --repeat-each 10` green.

### H2. Pitfall-cycle "interrupted" nodes are unreadable in dark mode

- **Evidence.** `app/globals.css:959`: `.cycle-node.is-broken { border-color: #15803d; background: #f0fdf4 }` fixes a near-white background but leaves `color` to inherit the dark theme's `--text-main` (`#f8fafc`). Observed on `/handbook/ch7` after clicking a tool button: computed `color rgb(248,250,252)` on `rgb(240,253,244)`, ≈1.1:1; on `/preview` ≈1.3:1. Screenshot confirmed by the lead: only the green badge is legible.
- **Impact.** The explorer's whole point (which nodes a tool interrupts) disappears for dark-mode readers; WCAG 1.4.3 failure on a product page and on the sales sample.
- **Fix.** Use theme tokens: e.g. `background: var(--color-brand-tint); border-color: var(--color-brand-soft)` (the pair `.setup-source.on` already uses) and `.cycle-badge { color: var(--color-success) }`.
- **Verify.** ch7 and `/preview` in dark mode, click "CRM"; node title and body ≥4.5:1.

### H3. `/preview` dark mode: callout text is light on pastel (post-699d62a)

- **Evidence.** `app/(public)/site.css:53` `.pub p { color: var(--pub-body) }` has the same specificity (0,1,1) as `app/globals.css:1214` `.box p, .box li, … { color: #334155 }` and loads later, so inside the public layout it wins. Observed at 1440 dark: `.box.try-it p`, `.box.field-note p`, `.box.quiz p` are `rgb(203,213,225)` on `rgb(236,253,245)`/`rgb(240,249,255)`/`rgb(238,242,255)`; the same boxes in the handbook are `rgb(51,65,85)`. Lead confirmed from the screenshot: the calculator's helper text is barely visible.
- **Fix.** Lower the public base rules' specificity so component rules win: `.pub :where(p)`, `.pub :where(a)` (still beats the element rules in globals.css).
- **Verify.** `.pub-sample .box p` computed colour in dark mode = `#334155`.

### M1. No server-side access control for the product

- **Evidence.** The only things between a visitor and every chapter are `robots: { index: false }` (`app/(product)/layout.tsx:9`), a `robots.txt` disallow (`app/robots.ts:6`) and a dismissable `<dialog>` that writes `localStorage.handbookAccess` (`Gate.tsx:49`, comment at 9-11: "not a lock"). `lib/offer.ts:34-39` has `checkoutUrl: null`, so nothing is sold, and `docs/_archive/launch-handoff.md` launch blocker 1 states the gap plainly. The removed sign-up page had already described an entitlement model (Ch1–4 free, rest paid) the server could not enforce; `699d62a` stepped back from that.
- **Impact.** Not a vulnerability today. It becomes High the day `purchaseOpen()` is true or any "unlock" promise ships.
- **Fix.** Before selling: a signed, HttpOnly access cookie issued by the checkout webhook (or magic link), checked in `proxy.ts` (Next 16's name for middleware; see `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`) and re-checked in `handbook/[slug]/page.tsx`; keep `/preview` on an explicit allowlist. Until then keep the honest "purchase is not open" copy.
- **Verify.** `curl -sI https://<host>/handbook/ch13` → 302/401 without a valid cookie.

### M2. Quiz radios commit on the first key and drop focus

- **Evidence.** `KnowledgeCheck.tsx:42` and `QuestionItem.tsx:53-59` set `onChange={… commit}` and `disabled={done}` on every radio. Native radio groups select on arrow movement, so ArrowDown on the first option on `/handbook/ch1` observed: `checked: 1, disabled: all true, activeElement: BODY`, feedback "✗ Not quite". Space on `/preview` gave the same. `QuestionItem` is shared by chapter checks, `CoachCheck` and `/handbook/review`.
- **Impact.** Keyboard users cannot read the options before answering; the answer is irreversible; screen readers lose their place (2.1.1, 2.4.3, 3.2.2).
- **Fix.** Commit on an explicit "Check answer" action (the fill-in-blank path already does); after committing, use `aria-disabled` instead of `disabled` or move focus to the feedback element (`tabIndex={-1}` + `focus()`).
- **Verify.** Tab to a radio, ArrowDown twice: nothing commits; after committing, `document.activeElement !== body`.

### M3. Mobile table-of-contents menu is not inert-locked

- **Evidence.** At 360 px, Enter on `#menuToggle` sets `aria-expanded=true`, `scroll-locked`, backdrop `display:block`, but `#main-content.inert === false`. Continued Tab landed on `button.term "leading indicators"` in the chapter, visually under the opaque backdrop. `Gate.tsx:37-38` already shows the right pattern (`inert` on `.skip-link, #sidebar, #main-content`).
- **Fix.** When `open && phone`, set `inert` on `#main-content` and the skip link, remove on close; same for the search-results overlay.
- **Verify.** Tab through the open menu at 360 px; focus never leaves `#sidebar`.

### M4. Phones: controls land under the sticky search row

- **Evidence.** `app/globals.css:1057` makes `#sidebar` sticky and `:1061` gives only `h1, h2, h3, h4, [data-widget]` a `scroll-margin-top`; inputs, buttons and `.term` buttons get none and the phone scroll root has no `scroll-padding-top`. Observed Shift+Tab from "Next: 2. Finding Clients": `input "Appointments needed per closing" top=0 h=45 sidebarBottom=67` (fully hidden), `button.term "CRM"` fully hidden, textarea and "Check against the book" partly hidden. The public site is fine (`html:has(.pub) { scroll-padding-top: 84px }`, `site.css:286`).
- **Fix.** In the `(max-width: 900px)` block add `html { scroll-padding-top: 72px }` (or derive from `--header-h`) and collapse the per-element rule.

### M5. Dimmed nurture-timeline buttons

- **Evidence.** After choosing the "Calls" filter on `/handbook/ch5`, 8 of 13 `.touch-btn.dim` have `opacity: 0.35`, `disabled: false`; text `#0f172a` on white blends to ≈`#abaeb4` (≈2.3:1; dark ≈2.6:1). `NurtureTimeline.tsx:55` adds the class; `globals.css:886` sets the opacity.
- **Fix.** De-emphasise with border/background only (or `opacity: 0.7` ≈5:1), or make them genuinely disabled if that is the intent.

### M6. `/preview` heading hierarchy and section-heading styling (post-699d62a)

- **Evidence.** `Excerpt.tsx:47` demotes only the first bare `<h1>` to `<h2 class="pub-chapter-title">`; nested `<h2>`/`<h3>` are untouched, and `preview/page.tsx:41,46` add their own `<h2>Chapter 1</h2>` / `<h2>Chapter 7</h2>` wrappers. Observed outline: `h1 Read two chapters…` → `h2 Chapter 1` → `h2 1. Mindset…` → `h2 In this chapter…` → `h2 You own a business now` …, about 30 sibling h2s. Visually, because the sample is not inside `.chapter-section`, the global `h2` rule (`globals.css:356-362`, 2 rem, 2 px underline) applies instead of `.chapter-section h2` (`:383`, 1.35 rem, no border): `#you-own-a-business-now` is 32 px with an underline on `/preview` and 21.6 px without on `/handbook/ch1`. Paragraph, list and footnote styles differ the same way. Lead confirmed from the screenshot.
- **Impact.** Screen-reader heading navigation is flat; sighted readers cannot tell chapter title from section on the page meant to sell the product. Rated Medium rather than High because no level is skipped and the content remains readable.
- **Fix.** Demote the whole chapter one level when rendering a whole page (h1→h2, h2→h3, h3→h4) and drop or merge the "Chapter N" wrappers; move the content typography from `.chapter-section …` to a `.chapter-body` scope that both `ChapterView` and `Excerpt` emit (this is also the fix for L25). Keep `lib/outline.ts` ids so `/preview#…` anchors work.
- **Verify.** Outline on `/preview` reads h1 → h2 (chapter) → h3 (section) → h4 (box); computed size of a section heading matches the handbook.

### M7. Consent version check accepts prototype keys

- **Evidence.** `lib/leads/validate.ts:7` uses `refine(v => v in CONSENT_TEXTS)` on a plain object. Lead reproduced in Node: `'constructor' in {v1:'text'}` → `true`, lookup type `function`; `'__proto__'` → object; `'toString'` → function. `handler.ts:45` then stores `consentText: CONSENT_TEXTS[consentVersion]!`, which is not a string. The file store drops the field in JSON; the Neon store passes a function to the driver. `lib/leads/handler.test.ts:76` only tests `'v99'`.
- **Impact.** A crafted body `{"email":"a@b.co","consentVersion":"constructor"}` is accepted (200) and produces a consent record that cannot prove what was shown. Integrity, not exploitation.
- **Fix.** `z.enum([CONSENT_VERSION])` (or `Object.hasOwn`) and type `CONSENT_TEXTS` as `Record<typeof CONSENT_VERSION, string>`, which removes the `!`.
- **Verify.** Add the `'constructor'` case to `handler.test.ts` → `invalid_request`, no lead stored.

### M8. `AmountInput` keeps stale text after an external value change

- **Evidence.** `AmountInput.tsx:22,39`: `text` state, once set by typing, is always preferred over the `value` prop; nothing resets it. `StartSetup.tsx:138` presets call `setField('commission', 6500)`: the store updates and the preset shows pressed, but the input still displays what was typed. The authors worked around it with remount keys in `Scorecard.tsx:35,101` and `PipelineCalculator.tsx:23`. Code-path confirmed; not reproduced live.
- **Fix.** Track the last prop value in state and clear `text` when the parent changes it (the "derive state during render" pattern), then remove the remount keys.
- **Verify.** happy-dom test: type, re-render with a new `value`, assert the displayed string.

### M9. Public header menu stays open after a same-page hash link

- **Evidence.** `PublicHeader.tsx:12-14` has `/#how-it-works` and `/#included`; the only close paths are a `pathname` change (`:23`) and clicks outside `navRef` (`:32-34`). On `/`, tapping those links changes neither, so the absolute dropdown stays over the page after the scroll. `aria-current` compares `pathname === '/#…'`, which is never true.
- **Fix.** Close on any link activation inside the nav; compute `aria-current` from the path part. Verify with an e2e at 390 px.

### M10. Typecheck depends on generated route types

- **Evidence.** `tsconfig.json:30-34` includes `.next/types/**` and `.next/dev/types/**`, both gitignored; `typecheck` is bare `tsc --noEmit`. The route validator (`generateStaticParams`, `params: Promise<…>`) lives in those generated files, so on a clean clone it is skipped (Next docs recommend `next typegen && tsc --noEmit`, `node_modules/next/dist/docs/01-app/03-api-reference/06-cli/next.md:178-209`). During this review the opposite failure occurred: after the sign-up route was deleted with the dev server down, stale `.next/dev/types/validator.ts(262,39)` referenced the missing page and both `pnpm typecheck` and `next build` failed until the dev server regenerated it.
- **Fix.** `"typecheck": "next typegen && tsc --noEmit"`; consider removing `.next/dev/types/**` from `include` after checking the Next 16 docs (the line is generator-written and may be re-added); note the "restart `next dev` or `rm -rf .next/dev/types`" recovery in AGENTS.md.

### M11. Coach UI has no end-to-end coverage

- **Evidence.** Only `e2e/semantic-html.spec.ts:34-39` touches `/handbook/plan` (h1 only). The e2e server builds with `NEXT_PUBLIC_COACH_ENABLED=true`, so the pages are live but untested; the coach-off `notFound()` branch is tested nowhere. Reviewer 6 drove the happy path in a browser (start plan → session card → review deck empty state) with no console errors.
- **Fix.** `e2e/coach.spec.ts`: pinned-date plan creation, mark three steps, miss a ch4 question and see it in the review deck, `handbookCoach` export round-trip.

### M12. 404 page

- **Evidence.** `app/not-found.tsx` renders three bare elements under the root layout: no landmarks, header, skip link or footer; Tailwind preflight leaves the `h1` at 16 px / 400. Also reached by `/handbook/<bad-slug>` and the coach-off `notFound()`.
- **Fix.** Render inside the public chrome (`PublicHeader`/`PublicFooter`, `pub-h1`), and add `app/(product)/not-found.tsx` so product `notFound()` keeps the sidebar.

### Low findings, grouped

**Security hardening (L1–L5).** No security headers are configured (`next.config.ts` has no `headers()`; observed on the dev server). Add `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and `Content-Security-Policy: frame-ancestors 'none'`; a full CSP is a medium task because of the two static inline scripts in `app/layout.tsx:32,36` (hash them; they are constant strings). The rate limit trusts `x-forwarded-for` (`route.ts:19`), which Vercel overwrites but another host would not; add a global per-window send ceiling as a cost backstop. `storeFromEnv` (`store.ts:119-123`) checks `LEAD_STORE === 'file'` before `DATABASE_URL`, and `.env.example:17` ships that line uncommented; refuse the file store when `NODE_ENV === 'production'`, mirroring the `LEAD_IP_SALT` refusal at `route.ts:14`. `happy-dom` 21.0.3 carries GHSA-834v-8h66-3h79 (host code execution when parsing attacker-controlled markup); it is dev-only and parses only repo fixtures, so bump to ≥21.0.4 when convenient (lockfile change: ask first). Before lead capture goes live, add an `unsubscribed_at` column and a documented process, set a retention period, and resolve the four `Decision` placeholders on the privacy page plus `OWNER.supportEmail`. Existing protections worth keeping: same response for new/duplicate/bot leads, consent text stored server-side by version, salted IP hashes, no PII in logs, `Cache-Control: no-store` on the API, CAN-SPAM address required before sending, parameterised SQL throughout, JSON-LD `<` escaping, `dynamicParams = false` + `isPageId` so no URL reaches the file read.

**Types and validation (L6–L10).** `lib/state/index.ts:10` passes the handbook-state `migrate` to the settings store (and `transfer.ts:54` does the same on import), so settings are rewritten with `version: 1` and backed up on first load; omit it or give settings its own migration. `FileLeadStore.read` casts `JSON.parse` output (`store.ts:32`); guard that `leads` and `attempts` are arrays. `DeepLinks.tsx:37-44` and `SidebarSearch.tsx:85,137` cast content/index page ids to `PageId` without `isPageId`. `coach/schema.ts:65` uses a whole-object `.catch(undefined)` on `plan` where sibling schemas use per-field catches. `ProgressTransfer.tsx:30,44` voids an async handler with no `try`.

**Preview page follow-ups (L11–L15, post-699d62a).** `ErrorScoreCard.tsx:50` links to `/ch${chapter}` instead of `pageHref` (works via redirect, now also on the public page). `Excerpt.tsx:47` should match `<h1\b[^>]*>` and throw when a whole-page render finds no h1; the new e2e (`site.spec.ts:46-55`) should assert visibility, one `h1`, and no duplicate ids. `THEME_SCRIPT` adds `hide-quizzes` on every route and `globals.css:1124` hides `.box.quiz` everywhere, so a reader who switched quizzes off sees none on `/preview` (observed by toggling the class); scope the rule to `.shell-handbook`. `PREVIEW_WIDGETS` maps `knowledge-check` to `KnowledgeCheckEntry`, which would switch to `CoachCheck` if ch1/ch7 questions gained concept tags; register plain `KnowledgeCheck` for the sample. Copy: `refunds/page.tsx:21` ("a full section"), `page.tsx:362` ("a full sample lesson"), and the "exactly as they appear" claims on `preview/page.tsx:20` and `pricing/page.tsx:122` no longer match the sample (which omits glossary popovers, outline, read tracking and the next-chapter link); `docs/plans/free-sample-decision.md:27` still lists the Preface in the recommended set.

**Accessibility, lower impact (L16–L22).** `announce()` needs `#pageStatus`, which only the product layout renders; add the same region to `app/(public)/layout.tsx` (observed: "Copy script" on `/preview` updates nothing). `Settings.tsx:54-94` collapses on wheel-up even when a control inside is focused. `SidebarSearch.tsx:103-105` puts `aria-expanded`/`aria-controls` on a searchbox; drop them (the `role=status` result count already does the job). Box titles start with a literal "●" (28 h3s in content, 16 widget headings); move it to CSS `::before` or an `aria-hidden` span as `InteractiveHeader.tsx:7` does. Coach pages go h1 → h3. Seven data tables lack captions. The gate's email input never gets `aria-invalid`/`aria-describedby`, and Escape writes the permanent dismissal (source only; flag off locally).

**CSS, lower impact (L23–L25).** `.sidebar-header p` and `.settings-legal` use `white-space: nowrap` in a 320 px rail and overrun at "Large" text (observed). The shell breakpoints are `min-width: 901px` and `max-width: 900px` (a gap at fractional zoom widths) and nine distinct max-widths exist across the two stylesheets; move to range syntax and a few named breakpoints. The unscoped element rules in `globals.css:356-414,506-531` are the root cause of M6, of 8 px gaps between every menu item, and of eight undo rules in `site.css`; scoping them to a content wrapper fixes all three.

**Tests (L26–L27).** `lib/routes.ts:15` cites a spec that does not exist. `networkidle` and fixed waits proxy hydration in several specs; a `data-hydrated` signal would remove them and the H1 flake together.

## Optional improvements (not defects)

- Add `app/(product)/error.tsx` so a widget throw does not take the whole chapter to Next's default error screen.
- One shared `storage` listener per store instead of one per subscriber (`lib/state/store.ts:57-68`); debounce `update()` if textarea typing ever shows.
- Derive `WidgetName` from `WIDGET_NAMES as const` and type the registries with it; the three `as unknown as ComponentType` casts in `registry.tsx`/`Excerpt.tsx` may be removable under `@types/react` 19.3 (unverified).
- Export a `LeadBody`/`LeadError` union from `lib/leads/handler.ts` and import it in `Gate.tsx` instead of string comparisons.
- Build `THEME_SCRIPT` from `TEXT_SIZES` so the pre-paint script cannot drift from the schema.
- `role="list"` on the many `list-style: none` lists for Safari/VoiceOver; label `nav#sidebar` "Handbook" rather than "Table of contents"; `@media (forced-colors: active)` outline for `.nav-item:focus-visible`.
- `globals.css`: the `*` reset and body font stack duplicate preflight/tokens; wrap the dark token block in `@media screen` instead of re-listing 21 print tokens; `--color-focus-ring` tokens; pick one idiom for public-page spacing (utilities vs inline `style`).
- Rename or re-document the `parity/` specs: they transcribe expectations from `legacy/js`, they do not run the legacy site.
- Follow system dark-mode changes while `dark` is unset (`Settings.tsx:19`); fix the stale `pageIdFromPath` doc comment; remove the unused `useConceptStates` export.

## Remediation plan

**Immediate (before the next deploy of `/preview`)**
1. H1: fix the two calculator locators and the Ctrl+K hydration wait; get `pnpm e2e` green.
2. H2, H3: two token/specificity CSS fixes; re-check ch7 and `/preview` in dark mode.
3. M6 + L12 + L13 + L15: demote the whole chapter in `Excerpt`, scope `hide-quizzes` to the shell, tighten the preview e2e, correct the four copy lines.
4. M7: `z.enum` for consent versions plus the `'constructor'` test.

**Next development cycle**
5. M2, M3, M4, M5: quiz commit/focus, inert mobile menu, phone scroll padding, dim-button contrast.
6. M8, M9, M12, L16, L17, L18: `AmountInput` prop sync, header menu close, styled 404 with landmarks, public live region, Settings collapse guard, searchbox ARIA.
7. M10 + CI (from H1): `next typegen && tsc`, a workflow running typecheck/test/e2e (confirm with the owner).
8. L3, L6, L7, L8, L10, L11: small config/validation fixes in leads and state.

**Later / at launch**
9. M1: server-side access gate before `purchaseOpen()` can be true.
10. L1, L2, L5: security headers, rate-limit backstop, unsubscribe/retention/privacy decisions before `LEAD_CAPTURE_ENABLED=true` in production.
11. L25 + L24: scope content typography and consolidate breakpoints (medium refactor; unblocks removing the site.css undo rules).
12. M11, L19–L22, L4: coach e2e, bullet glyphs, coach heading levels, table captions, gate ARIA, `happy-dom` bump.

## Five highest-value next actions

1. Make `pnpm e2e` green (H1 locators + flake) and run it before every commit until CI exists. Everything else is verified through this suite.
2. Fix the two dark-mode contrast failures (H2, H3). Ten lines of CSS; both are on the sales sample.
3. Finish the `/preview` commit: whole-chapter heading demotion, hide-quizzes scoping, stronger e2e, copy alignment (M6, L12, L13, L15).
4. Fix quiz keyboard behaviour and the two mobile focus traps (M2, M3, M4); these are the WCAG failures with the widest reach.
5. Decide and build the access model before anything is sold (M1), and close the consent-version hole now (M7) so the lead table stays trustworthy.

## Open questions

- **Is `/handbook/*` meant to stay public until checkout exists, and will the free sample remain email-free?** `699d62a` and the decision doc say yes; the removed sign-up page said otherwise. This decides whether M1 is a launch blocker or a later item, and whether the Gate stays "not a lock".
- **Target host.** L2's severity depends on Vercel overwriting `x-forwarded-for`; if the app may be self-hosted, raise it to Medium and add a backstop now.
- **Is `legacy/` still needed?** No test references it at runtime; removing it would shrink the repo and let the `parity/` naming be cleaned up.
- **Should `.next/dev/types/**` stay in `tsconfig.json`?** It is generator-written; removing it needs a check against the Next 16 docs and a dev-server restart.
- **Is CI wanted in this repo?** It is the one process change that would have caught H1; it needs the owner's go-ahead because it adds a build tool.
- **Dark mode on the public site** follows the OS or the handbook setting with no toggle. The CSS reviewer read this as intentional (it renders well); confirm, since H3 and L13 both stem from handbook state reaching public pages.

## Environment notes

- The owner's dev server on port 3000 exited at about 15:01 during the review (cause not determined; none of the reviewers signalled it). The lead started a replacement `next dev -p 3000` with `NEXT_PUBLIC_COACH_ENABLED=true` for the browser-based reviewers; it was left running.
- Reviewer artifacts (scripts, screenshots, compiled CSS, test logs) are in the session scratchpad, not in the repository.
