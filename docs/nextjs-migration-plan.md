# Migration plan: static handbook to Next.js, TypeScript, Vercel, Neon

Drafted 19 October 2026 against the working tree at `main` (0fa621c plus uncommitted edits). Nothing here has been built or run. Line counts and file names come from reading the repo.

## What exists today

| Piece | Where | Size | Migration consequence |
| --- | --- | --- | --- |
| Shell, sidebar, gate, footer template | `index.html` | 11 KB | Becomes `app/layout.tsx` plus a sidebar component |
| Chapter fragments (13 chapters, preface, cover, 6 appendices) | `chapters/*.html` | 2.7–12.8 KB each | Become MDX, one route each |
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

So the HTML is the widget API, and editing a caption silently breaks a tool. In MDX, every widget becomes an explicit component placed where it belongs, and the text-matching goes away. That is the main quality win. It is also why each widget port needs a manual comparison against the current page. Static tables the widgets replace (for example Figure 5, which `setupNurtureTimeline` swaps out) become the no-JS fallback inside the component.

## Target architecture

```
app/
  layout.tsx                  shell, fonts, theme script, sidebar, providers
  page.tsx                    cover
  [slug]/page.tsx             pref, ch1..ch13, app-a..app-f (generateStaticParams)
  api/lead/route.ts           email capture (zod-validated)
  api/progress/route.ts       sync endpoint (phase 5)
  sitemap.ts, robots.ts, not-found.tsx
content/chapters/*.mdx        the 21 pages
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
4. **MDX tooling.** `@next/mdx` with a components map is enough. Adding it is a new dependency, so confirm before installing.
5. **Auth choice (phase 5).** Neon Auth (managed Better Auth) keeps the user table in the same database. Clerk via the Vercel Marketplace is the alternative. Decide only when phase 5 starts.

## Phases

Each phase ends with something shippable and a rollback of "keep serving the old site."

### Phase 0: Prepare (about half a day)

- Commit or discard the current working-tree changes. Tag the static site (`static-v1`) so it stays recoverable.
- Create the Next.js app in a new branch `next`, in a subfolder or fresh repo. Leaving GitHub Pages live during the migration costs nothing.
- Write a script that dumps every chapter's rendered text and the list of `data-widget` / text anchors, to diff against later.
- Add Playwright with one smoke test per chapter (loads, has an h2, no console errors). This is the regression net for everything after.
- Resolve the content errors in `docs/handbook-webpage-review.md` that touch data you are about to move (8x8 definition, 8–12 versus 13 touches, scoreboards). Moving contradictory data into typed files makes the contradictions permanent.

### Phase 1: Shell and content (1–2 days)

- Scaffold `layout.tsx` from `index.html`: skip link, `role=status` announcer (`#pageStatus`), sidebar, `chapterFoot` template as a footer component.
- Port `css/styles.css` unchanged into `app/globals.css`. Keep class names so chapter markup works as-is.
- Move the pre-paint theme script (`index.html`, reads `handbookSettings`) into a `<script>` in `layout.tsx` with `suppressHydrationWarning` on `<html>`. This prevents the dark-mode flash.
- Convert each `chapters/*.html` to MDX mechanically (the fragments are plain HTML, so most of the content survives). Do this with a script and review diffs, not by hand.
- Generate the sidebar from one `content/nav.ts` (part labels and titles currently hand-written in `index.html`).
- Replace the hand-kept `sitemap.xml` and `robots.txt` with `sitemap.ts` / `robots.ts`. Per-route `generateMetadata` carries the OG, Twitter and canonical tags and the `Book` JSON-LD. Move `404.html` into `not-found.tsx`.
- Done when: all 21 pages render with no widgets, and the Playwright smoke tests pass.

### Phase 2: Client state layer (1 day)

This must precede the widgets because all of them call `loadState` / `saveState` / `widgetState`.

- Replace the `memoryState` singleton in `js/interactive.js` with a typed store (zustand or `useSyncExternalStore`). Zod schema for `{ read, checks, scorecard, scripts, objections, calc, widgets }` plus the separate settings object (`dark`, `fullWidth`, `essentialOnly`, `hideQuizzes`, `trackProgress`).
- Keep the same `localStorage` keys and shape, so existing readers on the old site lose nothing when you cut over on the same origin. If the domain changes, `localStorage` does not carry over. Say so in the release note, or offer export and import.
- Keep the try/catch fallback to in-memory when storage is blocked. The current code does this deliberately.
- Persist behind an adapter interface (`localStorageAdapter` now, `apiAdapter` in phase 5).
- Done when: settings toggles, dark mode and progress work, and a Vitest suite covers load, corrupt JSON and blocked storage.

### Phase 3: Widgets (4–7 days, the bulk of the work)

Port in order of dependency and risk. For each, move the data to `content/data/`, build the component, place it in MDX, keep the static table as fallback, then compare to the old page side by side.

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
| 10 | Glossary popovers (`loadGlossary`, `openTermPop`) | Build-time glossary from `app-d`, wrap terms with a remark plugin instead of runtime text matching |
| 11 | Appendix E tool index | Becomes a typed list that links to widget anchors |

Mobile scroll locking and the "freeze the page behind dropdowns" fixes (recent `fix(mobile)` commits) were written for the vanilla DOM. Re-test them on a real phone after the shell and again after search, since both rely on the opaque backdrop and `scroll-locked` class.

### Phase 4: Search and lead capture (1 day)

- **Search:** at build time, walk the MDX AST and emit a JSON index of headings, terms, paragraphs and list items (the same `SEARCH_SELECTOR` set), with page id and heading occurrence. Load it lazily on first focus. This removes the runtime fetch-and-parse of every chapter. Keep the 12-result cap and the `/` shortcut.
- **Lead capture:** `POST /api/lead`, zod-validated email, honeypot field (`_gotcha`, already in the form), per-IP rate limit. Replaces the client-side attempt throttle in `setupGate`, which only a determined user could bypass anyway. Store in a Neon `leads` table (`id`, `email` unique, `created_at`, `source`, `consent_text`). Rewrite the gate copy so it says why the address is asked, which the review also flagged. Remove the Formspree endpoint from client code.
- Decide where the follow-up email is sent from before cutover. Formspree did that for you, so a replacement (Resend or similar) is a new dependency to confirm.

### Phase 5: Accounts and synced progress (3–5 days, optional)

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

### Phase 6: Cutover (half a day)

- Vercel project from the `next` branch, preview per PR, production on the domain. The current canonical URL is `brianpx.github.io/realestate-handbook-v1/`. If the URL changes, update canonical, OG, JSON-LD and `sitemap`, and keep GitHub Pages serving a notice or redirect (a static `index.html` with `<meta refresh>` and canonical, since Pages cannot send 301s).
- Move `downloads/*.mp4` to Vercel Blob (or keep in `public/` if under limits) and keep the `.vtt` caption track next to it. The video poster and `preload="none"` behavior in `chapters/pref.html` stay.
- Lighthouse and axe on every route, then the full manual check on iPhone Safari (scroll lock, dropdown backdrop, search results positioning).

## Behavior to preserve (tested explicitly)

- Skip link, `aria-live` page announcements, focus moved to the chapter heading on navigation.
- Print styles (`@media print`, `.print-page-break`) and the essential-only mode.
- Everything works without storage, and the static tables still read correctly without JavaScript. The current site shows only a `<noscript>` chapter list, so server-rendered MDX is already an improvement.
- Dark mode without flash, and `theme-color` metas for both schemes.
- Hash links to headings (`#ch5` style) from shared links. Add redirects from `/#ch5` to `/ch5` with a small client script in the layout, since hashes never reach the server.

## Effort and order

Roughly 11–18 working days for phases 0–4 and 6, plus 3–5 for phase 5. The wide range is almost all in phase 3, so port two widgets, time them, and re-estimate before committing to the rest.

## Open questions for you

1. Per-chapter routes (recommended) or keep continuous scroll?
2. Should reading stay fully anonymous, with accounts only for syncing?
3. Same repo (replacing the static files) or a new repo? A new one is safer, and keeps GitHub Pages live until cutover.
4. Which email sender replaces Formspree?
5. Do the content fixes in `docs/handbook-webpage-review.md` land before the move, or after?

## Progress log

### 19 October 2026: phases 0 and 1 done on branch `next`

- Static site snapshotted on `main` (commit 7dde930) and tagged `static-v1`. Roll back with `git checkout main` or `git checkout static-v1`.
- Static files moved to `legacy/` on `next` as a porting reference (delete at cutover). Images and downloads are in `public/`.
- **Deviation from the plan: chapters are not MDX.** The 21 fragments are plain, regular HTML (tables, divs, a few inline styles), so converting them risked altering text. They live in `content/pages/*.html`, are rendered on the server, and widgets mount at explicit `<!--widget:name-->` comment markers (`lib/content.ts`, `components/widgets/registry.tsx`). This removes the text-matching problem the same way MDX would, with no extra dependency. Converting to MDX later stays possible.
- Done: layout and metadata (OG, Twitter, theme-color), sidebar with the menu, header-collapse and phone scroll-lock behavior ported, one route per page (`app/[slug]`), `/#ch5` to `/ch5` redirect, `sitemap.ts`, `robots.ts`, `not-found.tsx`, Playwright smoke tests (23 passing).
- Not done yet: settings dialog and progress bar (phase 2), all widgets (phase 3), search and lead capture (phase 4). The email gate is intentionally absent until phase 4.
- Not yet checked: pixel comparison against the static site on a phone, Book JSON-LD, print styles.
