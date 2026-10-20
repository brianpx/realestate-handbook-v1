# Migration plan: static handbook to Next.js, TypeScript, Vercel, Neon

Drafted 19 October 2026 against the working tree at `main` (0fa621c plus uncommitted edits). Nothing here has been built or run. Line counts and file names come from reading the repo.

## What exists today

| Piece | Where | Size | Migration consequence |
| --- | --- | --- | --- |
| Shell, sidebar, gate, footer template | `index.html` | 11 KB | Becomes `app/layout.tsx` plus a sidebar component |
| Chapter fragments (13 chapters, preface, cover, 6 appendices) | `chapters/*.html` | 2.7–12.8 KB each | Become HTML pages in `content/pages/`, one route each (see the progress log) |
| Router, continuous scroll, scroll anchoring, menu, gate | `js/app-with-cover.js` | 488 lines | Mostly replaced by the Next.js router; gate and scroll behavior need decisions |
| Progress, settings, checklists, scorecard, script and objection trainers, chapter end | `js/interactive.js` | 715 lines | Becomes a state layer plus components |
| Calculators, speed-to-lead, response timer, nurture timeline | `js/widgets.js` | 646 lines | Components |
| Quizzes, drills, lead sources, pipeline calculator | `js/widgets-practice.js` | 1,221 lines | Components, the largest port |
| Roadmap, time-block planner, post-close scheduler, glossary popovers | `js/widgets-plan.js` | 463 lines | Components |
| Sidebar search | `js/search.js` | 169 lines | Build-time index |
| Styles | `css/styles.css` | 50 KB | Port as-is first (global CSS), refactor later |
| State | `localStorage` keys `handbookState`, `handbookSettings` | n/a | Schema design input |
| Email capture | Formspree POST, `js/app-with-cover.js` line 317 | n/a | Route handler plus Neon table |
| Assets | `images/` (7 files), `downloads/` (promo mp4 and vtt) | n/a | `public/` (video later to Vercel Blob) |

Deleted or stale in the working tree: `js/app.js` (deleted, unstaged), `downloads/AD_12-18_LegalChange_Draft5.pdf` (deleted, unstaged; the review flags it as a copyrighted 2018 form), and two logo files. Commit or discard those before branching so the migration diff stays clean.

## The central risk: widgets find their mount points by text

Only `app-e.html` has `data-widget` attributes (20 of them). In the other chapters the setup functions locate chapter HTML by matching visible text, for example:

- `js/widgets-plan.js:25` finds the `.diagram-box` whose title starts with "Figure 7".
- `js/widgets-plan.js:124` finds the `<p>` that starts with "Table 8.1.".
- `search.js` and the scroll anchor code match headings by text plus occurrence count.

So the HTML is the widget API, and editing a caption silently breaks a tool. With explicit `<!--widget:name-->` markers in the page HTML, every widget becomes a component mounted where it belongs, and the text-matching goes away. That is the main quality win. It is also why each widget port needs a manual comparison against the current page. Static tables the widgets replace (for example Figure 5, which `setupNurtureTimeline` swaps out) become the no-JS fallback inside the component.

## Target architecture

```
app/
  layout.tsx                  shell, fonts, theme script, sidebar, providers
  page.tsx                    cover
  [slug]/page.tsx             pref, ch1..ch13, app-a..app-f (generateStaticParams)
  api/lead/route.ts           email capture (zod-validated)
  api/progress/route.ts       sync endpoint (phase 5)
  sitemap.ts, robots.ts, not-found.tsx
content/pages/*.html          the 21 pages; widgets mount at <!--widget:name--> markers
lib/content.ts                splits page HTML into html and widget segments
components/widgets/registry.tsx  widget name to component map
content/data/*.ts             quiz items, touch schedules, lead sources, glossary
components/widgets/*.tsx      one per setup* function
components/shell/*.tsx        Sidebar, Search, SettingsDialog, ChapterNav, Gate
lib/state/*.ts                store, storage adapter, zod schema
lib/db/*.ts                   Neon client, queries
```

Defaults per your global rules: App Router, Server Components for chapters, `"use client"` only on widgets and interactive shell pieces, zod at every route handler, strict TypeScript, pnpm.

## Decisions to make before phase 1

1. **Continuous scroll or one chapter per page.** Today the next chapter is appended as the reader nears the end, with scroll anchoring, `IntersectionObserver`-style nav sync, and hash routing. One route per chapter is simpler, gives real URLs for SEO and sharing, and removes about 200 lines of scroll code. It changes the reading feel. Recommendation: per-chapter routes with prefetch on the "Next" link, and drop continuous scroll.
2. **Static export or server rendering.** Chapters are static either way. Choose server rendering only if you want auth and API routes on Vercel, which phases 4 and 5 need. Skip `output: 'export'`.
3. **Does reading stay anonymous?** The gate says "not a key to the book," and `chapters/*.html` are public. Recommendation: keep reading anonymous, and make accounts optional, for syncing progress. Gating content is a business decision, not a migration step.
4. **Content format.** Decided in phase 1: plain HTML fragments with widget comment markers, not MDX. No extra dependency. Converting to MDX later stays possible.
5. **Auth choice (phase 5).** Neon Auth (managed Better Auth) keeps the user table in the same database. Clerk via the Vercel Marketplace is the alternative. Decide only when phase 5 starts.

## Phases

Each phase ends with something previewable. Only the phases listed under "Cutover gates" are suitable to replace the public site; a widget-free phase 1 is a preview, not feature parity. Rollback before cutover is "keep serving the old site"; after cutover see "Production rollback" below.

### Phase 0: Prepare (about half a day)

- Commit or discard the current working-tree changes. Tag the static site (`static-v1`) so it stays recoverable.
- Create the Next.js app in a new branch `next`, in a subfolder or fresh repo. Leaving GitHub Pages live during the migration costs nothing.
- Write a script that dumps every chapter's rendered text and the list of `data-widget` / text anchors, to diff against later.
- Add Playwright with one smoke test per chapter (loads, has an h2, no console errors). This is the regression net for everything after.
- Resolve the content errors in `docs/handbook-webpage-review.md` that touch data you are about to move (8x8 definition, 8–12 versus 13 touches, scoreboards). Moving contradictory data into typed files makes the contradictions permanent.

### Phase 1: Shell and content (1–2 days) — implemented; verification pending

- Scaffold `layout.tsx` from `index.html`: skip link, `role=status` announcer (`#pageStatus`), sidebar, `chapterFoot` template as a footer component.
- Port `css/styles.css` unchanged into `app/globals.css`. Keep class names so chapter markup works as-is.
- Move the pre-paint theme script (`index.html`, reads `handbookSettings`) into a `<script>` in `layout.tsx` with `suppressHydrationWarning` on `<html>`. This prevents the dark-mode flash.
- Move each `chapters/*.html` fragment into `content/pages/` unchanged (they are plain HTML, so no text is altered), rendered on the server with widget markers.
- Generate the sidebar from one `content/nav.ts` (part labels and titles currently hand-written in `index.html`).
- Replace the hand-kept `sitemap.xml` and `robots.txt` with `sitemap.ts` / `robots.ts`. Per-route `generateMetadata` carries the OG, Twitter and canonical tags and the `Book` JSON-LD. Move `404.html` into `not-found.tsx`.
- Done when: all 21 pages render with no widgets, and the Playwright smoke tests pass.
- Still to verify before cutover: Book JSON-LD, print styles, and a phone comparison against the static site. Treat these as cutover requirements.

### Phase 2: Client state layer (1 day)

This must precede the widgets because all of them call `loadState` / `saveState` / `widgetState`.

- Replace the `memoryState` singleton in `js/interactive.js` with a typed store (zustand or `useSyncExternalStore`). Zod schema for `{ read, checks, scorecard, scripts, objections, calc, widgets }` plus the separate settings object (`dark`, `fullWidth`, `essentialOnly`, `hideQuizzes`, `trackProgress`).
- Keep the same `localStorage` keys and shape, so existing readers on the old site lose nothing when you cut over on the same origin. If the domain changes, `localStorage` does not carry over. Say so in the release note, or offer export and import.
- Keep the try/catch fallback to in-memory when storage is blocked. The current code does this deliberately.
- Persist behind an adapter interface (`localStorageAdapter` now, `apiAdapter` in phase 5).
- Done when: settings toggles, dark mode and progress work, and a Vitest suite covers load, corrupt JSON and blocked storage.

### Phase 3: Widgets (6–10 days, the bulk of the work)

Port in order of dependency and risk. For each, move the data to `content/data/`, build the component, add its marker to the page HTML and the registry, keep the static table as fallback, then compare to the old page side by side.

| Order | Widget (source function) | Notes |
| --- | --- | --- |
| 1 | Settings dialog, progress UI, chapter end (`setupSettingsUi`, `setupProgressUi`, `setupChapterEnd`) | Needed for everything else to be toggleable |
| 2 | Checklists, scorecard (`setupChecklists`, `setupScorecard`) | Simple state, good first test of the store |
| 3 | Goal calculator, speed-to-lead, response timer (`widgets.js`) | `amountInput` becomes a shared component; `downloadIcs` becomes a util with a test |
| 4 | Nurture timeline (`NURTURE_TOUCHES`) | Fix the 13-versus-8–12 conflict first |
| 5 | Script practice, objection trainer | Data-heavy |
| 6 | `choiceDrill` and the five drills built on it (qualifying, consultation lab, fair housing, pitfall cycle, error self-score) | One generic component, five data files |
| 7 | Checkpoints, knowledge check (the quiz added in 0fa621c) | Cross-chapter rollup, `hideQuizzes` setting |
| 8 | Lead sources, pipeline calculator (`widgets-practice.js`, the 1,221-line file) | Charts: SVG in React, no chart library unless you ask for one |
| 9 | Roadmap, time-block planner, post-close scheduler (`widgets-plan.js`) | Date math (`firstWorkingDay`, `addMonths`); put under unit tests, as time zone and month-end bugs live here |
| 10 | Glossary popovers (`loadGlossary`, `openTermPop`) | Build-time glossary from `app-d`, wrap terms in a build-time transform of the page HTML instead of runtime text matching |
| 11 | Appendix E tool index | Becomes a typed list that links to widget anchors |

Mobile scroll locking and the "freeze the page behind dropdowns" fixes (recent `fix(mobile)` commits) were written for the vanilla DOM. Re-test them on a real phone after the shell and again after search, since both rely on the opaque backdrop and `scroll-locked` class.

### Phase 4: Search and lead capture (2–3 days)

- **Search:** at build time, parse the page HTML and emit a JSON index of headings, terms, paragraphs and list items (the same `SEARCH_SELECTOR` set), with page id and heading occurrence. Load it lazily on first focus. This removes the runtime fetch-and-parse of every chapter. Keep the 12-result cap and the `/` shortcut.
- **Lead capture:** `POST /api/lead`, zod-validated email, honeypot field (`_gotcha`, already in the form), per-IP rate limit. Replaces the client-side attempt throttle in `setupGate`, which only a determined user could bypass anyway. Store in a Neon `leads` table (`id`, `email` unique, `created_at`, `source`, `consent_text`). Rewrite the gate copy so it says why the address is asked, which the review also flagged. Remove the Formspree endpoint from client code.
- **Email provider: SendGrid** (decided; shared with the reading-coach plan). Formspree sent the follow-up email for you, so the SendGrid client is a new dependency to confirm before installing. Authenticate the sending domain (SPF, DKIM, DMARC) before cutover, since approval lead time will gate the first real send.
- **Dev email: Mailpit** for now. Run it as a local SMTP catcher (a standalone binary or container, not a project dependency) and keep the sender behind one small interface: SMTP to Mailpit in development, SendGrid when `SENDGRID_API_KEY` is set. Mailpit is installed locally (`/opt/homebrew/bin/mailpit`). Not yet checked: current SendGrid API requirements.

### Phase 5: Accounts and synced progress (5–8 days, optional)

Only start when phase 3 is stable.

Neon schema sketch:

```sql
users            -- owned by the auth provider (Neon Auth keeps this in the database)
progress (
  user_id      uuid references users,
  key          text,           -- e.g. 'read', 'widgets.roadmap'
  value        jsonb not null,
  updated_at   timestamptz not null default now(),
  primary key (user_id, key)
)
leads ( id, email unique, created_at, source, consent_text )
```

- Store progress as JSON documents keyed by the same top-level keys the client uses. This avoids modeling 20 widgets relationally and lets widget shapes evolve.
- Merge rule on sign-in: per-key, newest `updated_at` wins, and never silently overwrite local data. Show "Keep this device's progress or the account's?" when both are non-empty.
- Every route handler re-checks the session server-side, validates the body with zod, and takes the user id from the session, never from the request.
- Use the Neon serverless driver with the pooled connection string, and a Neon branch per Vercel preview deployment.
- Privacy: the quiz and scorecard answers are personal data. Add a delete-my-data action and a sentence in the footer. Check any compliance obligations around training content and tracking before launch.

### Phase 6: Cutover (3–4½ days of work, plus a soak period)

- Vercel project from the `next` branch, preview per PR, production on the domain. The current canonical URL is `brianpx.github.io/realestate-handbook-v1/`. If the URL changes, update canonical, OG, JSON-LD and `sitemap`, and keep GitHub Pages serving a notice or redirect (a static `index.html` with `<meta refresh>` and canonical, since Pages cannot send 301s).
- Move `downloads/*.mp4` to Vercel Blob (or keep in `public/` if under limits) and keep the `.vtt` caption track next to it. The video poster and `preload="none"` behavior in `chapters/pref.html` stay.
- Lighthouse and axe on every route, then the full manual check on iPhone Safari (scroll lock, dropdown backdrop, search results positioning).

#### Cutover gates

Do not point the public domain or redirect Pages until every gate below passes.

**1. Scope: what may replace the public site**

| Stage | Status |
| --- | --- |
| Phases 0–1 (shell, content, no widgets) | Preview only. Not feature parity. |
| Phases 2–3 (state, all widgets ported, parity checks passing) | Required for cutover. |
| Phase 4 (search, lead capture, SendGrid sending) | Required for cutover. The public site has search and the email gate today. |
| Phase 5 (accounts, sync) | Optional. Cut over without it and add it later. |

**2. Verification carried over from phase 1**

- Book JSON-LD present and valid on the cover and chapter routes.
- Print styles checked (`@media print`, `.print-page-break`, essential-only) on at least one chapter per part and the appendices.
- Phone comparison against the static site (scroll lock, dropdown backdrop, search results position) on a real iPhone, after the shell and again after search.
- Lighthouse and axe on every route.

**3. Legacy URL and asset checks**

Test against the real deployed old URL, not just `/#ch5`. The old site is served from the repo path `https://brianpx.github.io/realestate-handbook-v1/`, and the `/#ch5` redirect in `app/layout.tsx` only fires when `location.pathname === '/'`, so it will not run under that path.

- Hashes: the static site only ever wrote page-id hashes (`#cover`, `#pref`, `#ch1`–`#ch13`, `#app-a`–`#app-f`). Test all 21 against the new origin, through the Pages stub described below, with the hash carried across.
- The Pages stub (`index.html` left on `main`/Pages) must forward by script as well as by `<meta refresh>`: `<meta refresh>` drops the hash, so a small script maps `#ch5` to `<new-origin>/ch5`. Keep the canonical link and a visible notice.
- Assets and files someone may have linked or bookmarked: the video and caption under `downloads/`, images, `sitemap.xml`, `robots.txt`, `404.html`. Decide per URL: redirect, keep on Pages, or accept the break, and record it.
- Re-submit the sitemap and update canonical, OG and JSON-LD if the origin changes.

**4. Reader progress continuity**

`localStorage` does not cross origins. If the new domain differs from `brianpx.github.io`, which is the likely case, existing readers lose progress and settings unless we act.

- Before cutover, ship a progress export on the static site (a button that downloads the `handbookState` and `handbookSettings` JSON) while Pages is still live, and keep it on the stub.
- On the new site, add an import that runs the payload through `migrate` and the zod schemas, backs up the current local state first, and reports what it kept and dropped.
- A release note alone is not enough. Test the round trip with a realistic exported payload from the live static site (this also replaces the hand-written fixture in `lib/state/fixtures/`).

**5. Production rollback**

`git checkout main` or `static-v1` recovers source only. It does not change what the domain serves.

- Keep GitHub Pages live and unchanged through a soak period after cutover, so the old site stays reachable.
- Document the exact steps to restore the previous production deployment on Vercel (promote the prior deployment) and to repoint the domain or DNS. Rehearse them on a preview before cutover. Not yet verified against current Vercel behavior; check the docs when writing the runbook.
- Writes after cutover do not roll back with the code: new `leads` rows (SendGrid sends, consent text) and, once phase 5 ships, `progress` rows. Rollback therefore needs a plan for exporting leads first. Formspree submissions stop arriving as soon as the form posts to `/api/lead`.
- Keep database migrations backward compatible (add columns and tables, do not drop or rename in the same release), so the previous deployment still works against the current schema. Do not use a database restore as the rollback for code, since it also discards new leads.

**6. Sign-off**

All of: gates 1–4 pass, rollback has been rehearsed, SendGrid domain authentication is complete, and the Pages stub and progress export are live.

## Contracts added before phase 3

- **Widget markers** (`lib/widget-markers.ts`): `<!--widget:name-->` with a lowercase-kebab name. `splitSegments` throws on an unknown name (not in `WIDGET_NAMES`), a duplicate name on one page, or a malformed marker, so `next build` fails. The instance id is `page:name` (`widgetInstanceId`) and is passed to the widget as its persistence key and anchor. Adding a widget means adding its name to `WIDGET_NAMES`, its component to the registry, and the marker to the page. The static table stays in the page HTML as the no-JS fallback; the component must replace it in place, not render a second copy. Resolved in item 2: the marker replaces the static block in the page HTML, and the widget component is server-rendered, so its first HTML is the no-JavaScript version (unchecked boxes, an empty table). There is no second copy to hide.
- **Stored-state versioning** (`lib/state/schema.ts`): `version` field on both `handbookState` and `handbookSettings`; the static site's payload is version 0 and migrates to 1 unchanged. Changing a stored shape means appending a step to `MIGRATIONS`. Before a migration or a failed parse, the original text is copied once to `<key>.backup` and never overwritten. Known gap: a single bad field dropped by its per-field `.catch` is not backed up.
- **Wrapping markers** (added in item 5): `<!--widget:name#slug-->…page HTML…<!--/widget:name#slug-->` hands the enclosed HTML to the component, for tools that enhance content that must stay in the page (script boxes, the objection table). `#slug` separates several uses of one widget on a page; ids are `page:name#slug`. The validator rejects a close with no open and a marker nested inside a wrapper. A wrapper whose close is forgotten is read as a stand-alone marker, so wrapping components throw at build time when they receive no HTML.
- **Widget parity checks** (convention for phase 3): before replacing a widget, capture its old behavior from `legacy/` as input/output pairs in `e2e/parity/<widget>.spec.ts` (calculations, persisted state after reload, downloads), and test keyboard operation. The smoke test alone is not enough to ship a widget.

## Behavior to preserve (tested explicitly)

- Skip link, `aria-live` page announcements, focus moved to the chapter heading on navigation.
- Print styles (`@media print`, `.print-page-break`) and the essential-only mode.
- Everything works without storage, and the static tables still read correctly without JavaScript. The current site shows only a `<noscript>` chapter list, so server-rendered HTML is already an improvement.
- Dark mode without flash, and `theme-color` metas for both schemes.
- Hash links to headings (`#ch5` style) from shared links. Add redirects from `/#ch5` to `/ch5` with a small client script in the layout, since hashes never reach the server.

## Effort and order

Re-estimated 19 October 2026 after adding the marker contract, state versioning and cutover gates. These are my estimates from reading the code and plan, not measurements. Phases 0–2 are implemented, so the remaining work is:

| Item | Days | What changed from the first estimate |
| --- | --- | --- |
| Phase 1 verification (JSON-LD, print, phone comparison) | ½–1 | New: was marked done, now a cutover requirement |
| Phase 3 widgets | 6–10 | Was 4–7. Adds old-behavior capture, parity tests and keyboard checks per widget, roughly 30–50% on top of the port |
| Phase 4 search and lead capture | 2–3 | Was 1. Adds duplicate handling, durable rate limiting, the Mailpit/SendGrid sender interface, and Neon setup |
| Phase 6 cutover | 3–4½ | Was ½. Pages stub with hash forwarding (¼), progress export on the static site (½), import with tests (½–1), legacy URL checks (½), Lighthouse and axe fixes (½–1), runbook and rollback rehearsal (½), final iPhone pass (¼) |
| **Remaining, phases 1 verification through 6** | **12–18½** | |
| Phase 5 accounts and sync (optional) | 5–8 | Was 3–5. The sync policy (revisions, stale writes, per-type merge) is still undesigned, so this is the least certain figure |

Phases 0–2 took the equivalent of roughly 2½–4 days at the original estimates, so the whole project is about 14½–22 days without phase 5. The first version of this section said 11–18 days, but its own phase figures summed to only 8–12, so the earlier total was not consistent either.

Calendar time is longer than work time. Two waits are outside the work estimate: SendGrid sending-domain authentication (start it during phase 4) and a soak period with Pages left live after cutover (length not decided).

The widest range is still phase 3, so port two widgets with parity checks, time them, and re-estimate before committing to the rest.

## Open questions for you

1. Per-chapter routes (recommended) or keep continuous scroll?
2. Should reading stay fully anonymous, with accounts only for syncing?
3. Same repo or a new repo? Settled in practice: the work lives on branch `next` in this repo, with the static site in `legacy/` and tagged `static-v1`. Splitting later needs a concrete ownership or deployment reason.
4. Which email sender replaces Formspree? Decided: SendGrid in production (matching the reading-coach plan), Mailpit in development.
5. Do the content fixes in `docs/handbook-webpage-review.md` land before the move, or after?

## Progress log

### 19 October 2026: phases 0 and 1 implemented on branch `next`; verification pending

- Static site snapshotted on `main` (commit 7dde930) and tagged `static-v1`. Recover the source with `git checkout main` or `git checkout static-v1`. That does not restore a live deployment; see Cutover gates, "Production rollback".
- Static files moved to `legacy/` on `next` as a porting reference (delete at cutover). Images and downloads are in `public/`.
- **Deviation from the plan: chapters are not MDX.** The 21 fragments are plain, regular HTML (tables, divs, a few inline styles), so converting them risked altering text. They live in `content/pages/*.html`, are rendered on the server, and widgets mount at explicit `<!--widget:name-->` comment markers (`lib/content.ts`, `components/widgets/registry.tsx`). This removes the text-matching problem the same way MDX would, with no extra dependency. Converting to MDX later stays possible.
- Done: layout and metadata (OG, Twitter, theme-color), sidebar with the menu, header-collapse and phone scroll-lock behavior ported, one route per page (`app/[slug]`), `/#ch5` to `/ch5` redirect, `sitemap.ts`, `robots.ts`, `not-found.tsx`, Playwright smoke tests (23 passing).
- Not done yet: settings dialog and progress bar (phase 2), all widgets (phase 3), search and lead capture (phase 4). The email gate is intentionally absent until phase 4.
- Not yet checked (cutover requirements): pixel comparison against the static site on a phone, Book JSON-LD, print styles.

### 19 October 2026: phase 2 done (state layer, settings, progress)

- `lib/state/`: zod schemas matching the static site's `handbookState` and `handbookSettings` (same keys, loose objects so unknown keys survive, per-field `.catch` so one bad field does not wipe the rest), a `createStore` for `useSyncExternalStore` with in-memory fallback when storage is blocked and cross-tab `storage` sync, and typed helpers (`markRead`, `resetProgress`, `writeSettings`).
- Sidebar now has the progress bar, read ticks, and the Settings panel (dark mode, full width with scroll-anchor preservation, quizzes, essential tools, tracking, reset). The scroll-up-collapses-Settings behavior is ported.
- `ReadTracker` marks a chapter read when its end scrolls into view. Settings `essentialOnly` is stored but only takes effect once widgets exist (phase 3).
- The adapter interface for the phase 5 server sync is not extracted yet: `createStore` talks to `localStorage` directly. Do that when phase 5 starts.
- Tests: 7 Vitest (store) and 27 Playwright (21 page smoke, redirect, 404, 4 settings/progress). All pass. Not yet checked visually against the static site on a phone.

### 19 October 2026: phase 3 started, item 1 (settings, progress UI, chapter end)

- Item 1 was already ported in phase 2 (`Settings.tsx`, `ProgressItem.tsx`, `ReadTracker.tsx`, `ChapterEnd.tsx`). This pass compared it against `legacy/js/interactive.js` and added `e2e/parity/settings.spec.ts` (7 tests: essential-only and quiz persistence, blocked storage, reset note and group visibility, keyboard operation, scroll-up fold, chapter end link and footer). The assertions come from reading the legacy code; running the spec against the static site was tried and does not work (see the spec header).
- Parity gap found and fixed: with storage blocked, the static site reverted a settings checkbox, while the new `writeSettings` kept the unsaved choice in memory. It now drops the choice (`lib/state/index.ts`, with a unit test).
- Still not covered for item 1: the "Essential tools only" and quiz toggles have no visible effect yet because no widget or quiz markup exists in `content/pages/`. Their stored values are tested, their page effects are not. Dark mode follows the system setting until the reader chooses; the static site read the `dark` class set by its pre-paint script, which is equivalent but not compared side by side.
- Tests: 25 Vitest and 34 Playwright pass.

### 19 October 2026: phase 3 item 2 (checklists and scorecard)

- Markers and data: `crm-checklists` (ch12, app-c), `scorecard` and `scorecard-change` (app-a), registered in `WIDGET_NAMES` and `components/widgets/registry.tsx`. The checklist items and scorecard rows moved verbatim from the page HTML into `content/data/checklists.ts` and `scorecard.ts`; check and score keys are unchanged (`ch12-d1:0`, `calls:0`), so saved ticks carry over. The `data-widget` keys `crm-checklists` and `scorecard` match the static site for Appendix E links.
- New shared pieces: `AmountInput` and `lib/amount.ts` (text entry that accepts `$1,500`, with unit tests), `InteractiveHeader`, and state helpers `setCheck`, `setScore`, `setScoreChange`, `clearScorecard`.
- Behavior kept: per-list meters and an overall total, status colouring (`min` rows hit/close/miss, `growing` rows against the previous week), the targets-hit totals and SVG chart, debounced screen-reader summary, inline Clear confirmation with Escape and focus return, the "one change" note stored with the numbers, and plain unsaved checkboxes when Essential tools only is on.
- **Deviation: Print.** The static site's Print button loaded every chapter so the whole book printed. With one route per chapter it now prints the current page only. Decide whether whole-book printing is wanted before cutover.
- Tests: `e2e/parity/checklists-scorecard.spec.ts` (14 tests, including a no-JavaScript render and static-site saved ticks), plus 41 Vitest and 47 Playwright passing in total. As with settings, assertions come from reading the legacy code; they were not run against the static site.
- Not done: no side-by-side visual comparison with the static site, and no real-phone check of the new widgets.

### 19 October 2026: phase 3 item 3 (goal calculator, speed-to-lead, response timer)

- Markers `goal-calculator` (ch1, replaces Table 1.1 and its caption), `speed-to-lead` (ch4 Figure 4) and `response-timer` (ch4, after the Field Note). Table rows moved verbatim to `content/data/goal.ts`; the Figure 4 band list lives in a `<noscript>` and the server HTML.
- Pure logic is in `lib/goal.ts` and `lib/speed.ts` with unit tests (worked example 13 closings / 780 conversations / about 16 a week / 3 to 4 a day; band edges; stopwatch format and verdict lines). `AmountInput` gained `format` and `placeholder`. `downloadIcs` is not needed yet; it comes with the roadmap and scheduler (items 9).
- Small deviation: the static site wrote the default ratios (3, 20, 48) into saved state on first load. The new calculator shows the defaults without saving them, so stored `calc` only holds numbers the reader typed. A cleared field stays empty for the visit and returns to its default on reload, as before.
- Essential tools only: the timer is hidden, the explorer and calculator stay, as before.
- Tests: `e2e/parity/calculators.spec.ts` (14 tests). Totals: 65 Vitest, 61 Playwright. Assertions come from reading the legacy code, not from running it.

### 19 October 2026: phase 3 item 4 (nurture timeline)

- Marker `nurture-timeline` (ch5 Figure 5). The 13 touches are copied unchanged from `legacy/js/widgets.js` into `content/data/nurture.ts`; the filter, zone and note logic is in `lib/nurture.ts` with unit tests (13 touches, seven in the first 14 days, value on 3/6/9/12, calls 5, texts 4, emails 5). The 13-versus-8-12 conflict the plan flagged is already resolved in the page text, which says 13 throughout.
- The old static list is kept as `<noscript>` content (`StaticFallback`, shared with speed-to-lead) so it shows only without JavaScript.
- `vitest.config.ts` gained an `@` alias matching `tsconfig.json`.
- Tests: `e2e/parity/nurture.spec.ts` (7). Totals: 98 Vitest, 68 Playwright.

### 19 October 2026: phase 3 item 5 (script practice, objection trainer)

- 14 script boxes (11 in ch6, one each in ch9, ch11 and the preface) are wrapped with `script-practice#slug` markers; the ch9 Table 9.2 wrapper carries `objection-trainer`. Page text is unchanged apart from the markers (the outer `<div class="box script">` is now drawn by `ScriptBox`).
- Saved practice text still keys on the box title and mastered objections on the objection text, so both carry over from the static site. `lib/html-text.ts` (with tests) reads titles and table rows; `lib/announce.ts` is the page status helper.
- Deviation: the static site picked the first objection at random while building the page. The card renders the first row on the server, then picks at random once saved progress is readable, preferring objections not yet mastered.
- Search: because widget data now lives outside the page HTML in some places (checklists, scorecard rows, goal ladder, nurture touches), phase 4's index must read `content/data/*` as well as the pages, or those texts drop out of search. Script boxes and the objection table stay in the page HTML.
- Tests: `e2e/parity/practice.spec.ts` (12), marker and text unit tests. Totals: 115 Vitest, 79 Playwright, stable over three runs.

### 19 October 2026: phase 3 item 6 (drills)

- Markers `qualifying-drill` (ch5), `pitfall-cycle` and `error-self-score` (ch7), `consultation-lab` (ch9), `fair-housing-drill` (ch11). Scenario and item data are copied unchanged from `legacy/js/widgets-practice.js` into `content/data/`.
- Correction to this plan: only the consultation lab and the Fair Housing drill use `choiceDrill`. The qualifying drill, pitfall cycle and self-score are separate tools, so there are two `ChoiceDrill` users rather than five.
- The qualifying drill and the self-score read their source tables (Table 5.2, the Chapter 7 errors table) from the page HTML on the server (`lib/page-html.ts`), so the wording has one copy. The Figure 6 text stays as `<noscript>` content.
- Grading, ranking, cycle and allocation logic is in `lib/drills.ts` with unit tests. Saved slices keep the legacy names (`widgets.qualify`, `selfscore`, `consultMisstep`, `fairHousing` with `best`).
- Tests: `e2e/parity/drills.spec.ts` (10). Totals: 125 Vitest, 89 Playwright.

### 19 October 2026: phase 3 item 7 (checkpoints, knowledge check) and a gate for Essential tools only

- Markers: `checkpoints` wraps the Checkpoint box in chapters 1-12 (the questions stay in the page HTML), `knowledge-check` follows the key takeaways in chapters 1-13. Key points and quiz data are copied from `legacy/js/widgets-practice.js` into `content/data/checkpoints.ts` and `knowledge-checks.ts`. The sidebar progress item now carries the roll-up (`N of 38 checkpoint questions confident`).
- **Content found out of step with the answer key.** The page edits made since the static site shipped changed eight Checkpoint boxes. Chapter 4 gained a first question and Chapter 5 a second, so the static site's answers no longer lined up (the static site silently skipped enhancing a box whose counts differed; this build now fails instead). I drafted key points for the new or changed questions (ch3 q3, ch4 q1, ch5 q2, ch6 q1, ch7 q2, ch11 q2) from the chapter text and marked them in the data file. **The author should review those wordings.** Total questions are 38, not 36.
- Saved answers are keyed by question number, so adding a question in front moves them. The 0-to-1 migration now shifts saved `ch4:n` (all) and `ch5:n` (n >= 1) up by one, with a unit test. This is the "versioned question IDs" problem the review raised: any future question insertion needs the same treatment until keys are stable IDs.
- `ToolGate` applies Essential tools only to every tool except the five the static site keeps; tools that replaced page content show it again (nurture list, Figure 6 text, the Checkpoint box). `e2e/parity/essential.spec.ts` covers it. I had missed this for items 4 and 6 and fixed it here.
- CSS: added `.script-actions[hidden]`. The static site's rating buttons carried `hidden` but the flex rule overrode it, so they showed before a question was checked. They now stay hidden until the key points are opened or a rating exists, which is what its code intended.
- Tests: `e2e/parity/checkpoints.spec.ts` (11), `essential.spec.ts` (3). Totals: 131 Vitest, 103 Playwright, stable over three runs.

### 19 October 2026: phase 3 item 8 (lead sources, pipeline calculator), and a repo change mid-session

- Markers `lead-sources` (ch2, after the Figure 2 caption) and `pipeline-calculator` (ch12). Range data is copied unchanged into `content/data/lead-sources.ts`; cost and pipeline logic is in `lib/sources.ts` and `lib/pipeline.ts` with unit tests. Saved shapes match the static site (`widgets.sourceCost` with `rate` and `rows`, `widgets.pipeline.rows`). A new contact counts as an active opportunity until its type is changed, as before.
- **Process note.** Midway through this item the work-in-progress was stashed (`stash@{0}`, "pre-merge wip"), `origin/next` was merged and a content commit landed, leaving the working tree without the widget code. I restored it with `git stash apply` (the stash entry is still there; drop it, do not pop it) and resolved the one conflict, in `app-a.html`: the commit changed the appointment targets in the scorecard table that this migration had moved into `content/data/scorecard.ts`, so the new wording (1 to 2 appointments set, 1+ held) was carried into that file. **Any later edit to a table that has become widget data must be made in the data file, not the page.** That applies to the scorecard rows, goal ladder, checklists, nurture touches and lead-source ranges.
- Tests: `e2e/parity/sources-pipeline.spec.ts` (8). Totals: 163 Vitest, 111 Playwright.

### 19 October 2026: phase 3 item 9 (roadmap, time-block planner, post-close scheduler)

- Markers `timeblock-planner` (ch8, after Table 8.1) and `postclose-scheduler` (ch10, after Table 10.1). The roadmap is part of the `crm-checklists` widget on ch12, because it decorates those same lists: Checklists now draws the Day 1 picker, status and calendar export above the lists, and a dated summary beside each phase title.
- Date and calendar logic is split out and unit-tested: `lib/dates.ts` (month clamping, first working day, next Monday, daylight-saving-safe day counts), `lib/ics.ts` (escaping, floating times, all-day, recurrence) and `lib/plan.ts` (roadmap status and events, planner blocks and verdict, post-close schedule). The post-close scheduler reads its touch wording from Table 10.1 on the server and fails the build if a row it uses is renamed.
- **Deviations.** (1) `.ics` lines longer than 75 bytes are now folded as RFC 5545 requires; the static site wrote them unfolded. (2) "Start the week of" defaults to the next Monday after mount rather than at render, so the prerendered page is the same for everyone. (3) Phase and status wording uses the browser's locale for dates, as before.
- Tests: `e2e/parity/planning.spec.ts` (11, with today pinned to 20 Nov 2026 and the downloaded calendar files read back), plus 50 new unit tests across dates, ics and plan. Totals: 213 Vitest, 122 Playwright, stable over three runs. One earlier objection-trainer test was racy against the post-hydration random pick and now waits for the page to settle.

### 19 October 2026: phase 3 items 10 and 11 (glossary, tool index): phase 3 widgets complete

- **Glossary.** `lib/glossary.ts` wraps the first use of each of the 19 terms per page at build time, using a small tag-aware scanner (no HTML parser dependency) and the same skip rules as the static site (headings, links, buttons, form fields, tool markup, `.box-title`, `.diagram-title`, the glossary and scorecard). Definitions are read from Appendix D and carried on the button (`data-definition`). One `TermPopover` in the layout handles click, hover (hover-capable devices only, with the 250 ms grace), Escape, outside click, scroll and resize, positioning inside the viewport and the spoken definition. Unlike the static site, terms that first appear inside a widget's own text no longer consume the page's one use; the scan covers page HTML only.
- **Tool index.** `DeepLinks` moves `a[data-goto]` links within the app and lands on the `data-widget` target with focus, or announces why it could not (naming Essential tools only when that is the cause). With that setting on it hides the Appendix E rows for tools that are not built. A test visits all 20 linked tools and checks each target exists.
- Tests: `e2e/parity/glossary-tools.spec.ts` (13), `lib/glossary.test.ts` (9). Totals: 229 Vitest, 134 Playwright, stable on two runs.
- **Phase 3 status.** All eleven items are ported: 13 distinct tools plus checkpoints, quiz, glossary and the tool index, each with parity tests written from the legacy code. Still not done for phase 3: a side-by-side visual comparison with the static site and a real-phone check. The scripts from the static site were read, not run, so every parity assertion rests on my reading of that code.

### 19 October 2026: phase 4, search

- **Index.** `lib/search-index.ts` builds the index from the page HTML at build time with a small tag-aware scanner (same selection rules as the static site: headings, glossary terms, figure titles, paragraphs and list items; footer, next-link and plain fallbacks excluded). `app/search-index.json/route.ts` serves it statically, and the sidebar fetches it the first time the box is focused. A Playwright test (`e2e/parity/search-index.spec.ts`) checks the scanner against the browser's own HTML parser on all 21 pages, 540 entries, and they match exactly.
- **What the pages no longer hold.** Static text that now lives in widget data would have dropped out of search, so the index adds the Table 1.1 caption and the checklist titles (app-c, ch12). Other moved data (checklist items, scorecard rows, goal ladder) was never searchable on the static site because it sat in table cells and labels.
- **Deviation.** A line break now counts as a space when indexing, so "Open House<br>Online Leads" is findable as two words; the static site glued them. The shortcut is Ctrl/Cmd+K, not `/` as this plan said earlier.
- **UI.** `SidebarSearch` ports the box, results (cap 12, headings first), keyboard use (arrows, Escape, Ctrl/Cmd+K), the "Loading…" and "could not load" states, and the phone behavior where the menu button sits beside the box and turns into a cross that closes the results (with the page pinned behind them). Jumping to a result finds the nth block with that text on the page and highlights it, as before.
- Moved the menu button from the sidebar header into the search box container so the existing phone CSS applies, as on the static site.
- Tests: `e2e/parity/search.spec.ts` (10), `lib/search-index.test.ts` (12). Totals: 241 Vitest, 146 Playwright, stable over three runs.

### 19 October 2026: phase 4, lead capture (built and tested against a file store and Mailpit; database not yet)

- **What exists.** `POST /api/lead` (`app/api/lead/route.ts`, logic in `lib/leads/`): zod-validated body (`email`, `consentVersion`, hidden `_gotcha`), same-origin check, 2 KB body cap, per-address rate limit (5 attempts in 10 minutes, counting failures; 429 with `Retry-After`), then store and email. The email gate (`components/shell/Gate.tsx`) is ported from the static site with the Formspree call replaced; it is shown only when the build has `LEAD_CAPTURE_ENABLED=true`, so it stays off until you turn it on.
- **Acceptance criteria this plan asked for.** *Duplicate submissions:* one row per address (case-insensitive), the follow-up email goes out once, and a repeat or a bot gets the same `{ ok: true }` as a new sign-up so the form cannot reveal who is on the list. *Success and failure:* the reader sees the same three outcomes as before (done, "please enter a valid email address", "something went wrong, try again or continue without email") plus a rate-limit message; a failed email never loses the lead, it is stored with `email_status = failed`, and the route fails closed with 503 when no store is configured or `LEAD_IP_SALT` is missing in production. *Consent:* the server stores the consent text for the version the browser names, not text the browser sends. *Privacy:* only a salted hash of the visitor's address is kept; logs never contain the email.
- **Email.** SendGrid and Mailpit are both called over HTTPS (`fetch`), so no client library was added. SendGrid sends only if the API key, `LEAD_FROM_EMAIL` and `LEAD_MAILING_ADDRESS` are all set (a commercial email needs a postal address). Mailpit is used when `MAILPIT_URL` is set. Checked by hand: a sign-up through a running server reached a local Mailpit with the right sender, subject and body, and the lead was recorded as sent. Not checked: SendGrid itself (no key), its current API requirements, or domain authentication.
- **Gate copy changed.** "How your email is used" now says the address is stored by the author and sent through SendGrid instead of Formspree. The welcome email text is also new. **The author should read both, and supply the postal address.**
- **What is blocked on you.** The production store. `db/migrations/001_leads.sql` defines `leads` and `lead_attempts`, but nothing is applied and the Neon-backed `LeadStore` is not written, because that needs a decision and an action from you: add a database driver dependency (`@neondatabase/serverless` is the usual choice) and create or pick a Neon project. Until then production has no store and the route answers 503, which is why the gate is off by default. The durable, cross-instance rate limit is the same table (`lead_attempts`), so it arrives with the store.
- **Test setup.** Playwright now builds with lead capture on and a throwaway file store, and every test starts as a reader who dismissed the gate (`storageState`); `e2e/gate.spec.ts` (11) clears that. Totals: 266 Vitest, 157 Playwright, stable over four runs after fixing three tests that clicked before the page had hydrated.

### 19 October 2026: phase 6 preparation (nothing deployed)

- **JSON-LD** added: the cover declares the `Book` (same facts as the static site), each chapter a `Chapter` pointing back to it (`lib/jsonld.ts`, `e2e/jsonld.spec.ts`).
- **Print** checked with print emulation (sidebar, menu button, gate and scorecard tools hidden; dark mode prints dark-on-white; a multi-page PDF is produced) in `e2e/print.spec.ts`. A human print-out has not been read.
- **Phone comparison**: screenshots at an iPhone 13 viewport in Chromium (title page, chapter top, open menu, search results) look equivalent between the static site and this one. The static site screenshots were mid-scroll, so the comparison is of layout, not of identical scroll positions. This is not a real iPhone.
- **Progress export and restore**: Settings has "Download my progress" and "Restore from a file" (`ProgressTransfer`, `lib/state/transfer.ts`). Restore validates and migrates the file, shows what it holds, asks before replacing, and keeps the previous values as `<key>.pre-import`. The static site gets the same download button via `docs/cutover-static-site-export.patch` (for `main`; applied to a scratch copy only). Round trip checked: a patched static site wrote a file that the new site restored, including the Chapter 4 checkpoint shift.
- **Pages stub** (`docs/cutover/pages-stub-index.html`) maps `#chN` hashes to `/chN`, redirects readers with no saved progress at once, and offers a reader with progress a download button first, because the stub is the last page on the old address that can read their storage. `e2e/cutover-stub.spec.ts` covers all 21 hashes, unknown hashes, the progress path and no-JavaScript.
- **Runbook**: `docs/cutover-runbook.md` (gates with their real state, order of work, rollback with what it does not undo). Not rehearsed.
- **Shared build folder.** Other processes were running `next start` on ports 3470 to 3473 from this same checkout while I worked, and one rebuilt `.next` under my manual run once. The Playwright suite builds there too, so parallel runs can collide.
- Tests: 321 Vitest, plus Playwright (see the last line below).

### 19 October 2026: Neon set up

- **Driver.** Added `@neondatabase/serverless` 1.2.0 (changes `package.json` and `pnpm-lock.yaml`).
- **Why not the Neon API.** The Neon organizations on this account are managed by Vercel, and creating a project through the Neon API is refused there ("organization is managed by Vercel"). The database was provisioned through the Vercel Marketplace instead.
- **What was created (all new, nothing existing touched).** A Vercel project `realestate-handbook` (scope `brianpxs-projects`, linked to this checkout as `.vercel/`, and connected to the GitHub repo `brianpx/realestate-handbook-v1`, so pushes there will now produce Vercel preview deployments); a Neon database `realestate-handbook-db` from `vercel integration add neon`, project id `morning-credit-15469990` (AWS us-east-1, Postgres 17), with `DATABASE_URL`, `DATABASE_URL_UNPOOLED` and the usual `POSTGRES_*`/`PG*` variables on the Vercel project and in `.env.local` (git-ignored; it also added `NEON_AUTH_BASE_URL`, which nothing uses yet). A Neon branch `store-test` was created for a test and not used in the end; it can be deleted.
- **Schema.** `db/migrations/001_leads.sql` applied to the default branch (the database was empty): `leads` (one row per lower-case address, consent text and version, email status) and `lead_attempts` (salted address hash and time).
- **Store.** `lib/leads/neon-store.ts` implements the same `LeadStore` the route already used, so rate limiting is now shared across server instances. `storeFromEnv` picks it when `DATABASE_URL` is set. Checked: 5 unit tests with a fake query function (values are bound, not spliced), 4 integration tests against the real database (`lib/leads/neon-store.integration.test.ts`, which runs only with `TEST_DATABASE_URL` and cleans up after itself), and a real `next start` with the database: a first and a repeat submission gave one lower-cased row, a bad address was refused, three attempts were counted, then the test rows were removed.
- **Still to do before the gate can go live.** Set these on the Vercel project for Production (and Preview as wanted): `LEAD_IP_SALT` (long random string), `LEAD_CAPTURE_ENABLED=true` (build time), `NEXT_PUBLIC_SITE_URL`, and for email `SENDGRID_API_KEY`, `LEAD_FROM_EMAIL`, `LEAD_MAILING_ADDRESS`. Preview deployments currently share the one database; give previews their own Neon branch before using lead capture there.
- Totals: 338 Vitest (the 4 integration tests skip without `TEST_DATABASE_URL`).

