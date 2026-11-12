# Mobile responsiveness and UX audit

**Assessment: strong default-width responsiveness, but mobile readiness is only partially established.** No default-text document overflow was detected in 1,104 Chromium/WebKit observations across 46 routes and all 12 requested widths. Accessibility stress checks exposed text-enlargement overflow and a reproducible drill focus defect. Recovery flows have additional source-confirmed friction and probable input-loss risks. No P0 defect was established; untested flows cannot be certified usable.

Audit date: 2026-11-10. Read-only application snapshot: `feat/owner-postal`, commit `2e02de7` plus pre-existing working-tree edits. Source hashes are retained in [snapshot evidence](artifacts/source-snapshot.json). Other sessions' edits and worktrees were preserved. Only this documentation directory was added to the source repository; no production code, configuration, dependencies, commits or deployments were changed. An isolated temporary copy used port 3199 and its own authentication fixtures and build output.

## Reports and evidence

- [Detailed findings](RESPONSIVE_ISSUES.md): 18 prioritized issues, hypotheses and recommendations with source references, reproduction, evidence, correction, risk and complexity.
- [Mobile UX review](MOBILE_UX_REVIEW.md): navigation, authentication, onboarding, reading, practice and account journeys.
- [Accessibility report](ACCESSIBILITY_REPORT.md): criteria, tested evidence and manual coverage gaps.
- [Device and route matrix](DEVICE_TEST_MATRIX.md): each route, environments, exact commands and results.
- [Remediation sequence](REMEDIATION_PLAN.md): work packages for a separately approved implementation pass.
- [Artifacts](artifacts/) and [screenshots](screenshots/): raw observations, test results, source hashes and reproducible tooling snapshots. Captures are not approved visual-regression baselines.

## Ten most consequential findings

| Priority | ID | Finding and evidence status |
|---|---|---|
| P1 | MA-01 | 200% root-font simulation at 320px creates document overflow on home, preview, chapter 1 and account; confirmed browser observation |
| P1 | MA-02 | Fair Housing Next phrase moves keyboard focus to BODY; confirmed on Chromium |
| P1 | MA-03 | Profile response can overwrite edits typed while save is pending; probable source-based race, database-backed runtime not exercised |
| P2 | MA-04 | Mobile menu extends below a 768×320 viewport; confirmed geometry, full reachability impact requires further QA |
| P2 | MA-05 | Send again resets to a blank email form; confirmed source behavior |
| P2 | MA-06 | Search failure says Try again without an actionable retry; typing remains blocked from refetching; confirmed source behavior |
| P2 | MA-07 | Ordinary chapter lists, including ordered lists, have no markers; confirmed computed CSS, screen-reader impact unverified |
| P2 | MA-08 | Response timer verdict has no live status announcement mechanism; confirmed source omission |
| P2 | MA-09 | Progress import saves a backup but exposes no recovery control; confirmed product limitation |
| P2 | MA-10 | Pathname scroll reset may defeat browser Back reading-position restoration; probable, runtime unverified |

Highest-value corrective actions: fix intrinsic-width reflow causes; preserve profile edits and provide backup recovery; repair drill focus and status/list semantics; constrain mobile navigation to available height; make resend/search recovery actionable. These are targeted corrections, not a redesign.

## Repository and component inventory

Installed versions: Next.js **16.4.2**, React **19.3.1**, TypeScript **5.9.3**, Tailwind **4.3.3**, Playwright **1.64.1**, Vitest **5.0.5**, happy-dom **21.0.4**. App Router only; public, product and admin route-group layouts plus root layout and standalone coming-soon. Next.js production guidance in the installed package was read before temporary tooling/build work. No Pages Router was found.

| Area | Main components | Primary responsibilities |
|---|---|---|
| Public | PublicChrome/Header/Footer, SignupForm, LeadForm, HeroPlan, PricingTable, ToolIndex, Excerpt | Marketing, sample lessons, pricing, email access and subscription |
| Product shell | Sidebar, SidebarSearch, Settings, ChapterOutline, Breadcrumbs, ChapterEnd, TermPopover, ProgressTransfer | Reader navigation, search, theme/text settings, glossary, progress backup |
| Reader dashboard/account | HomePanels, AccountPanels, StartSetup, ProfileForm, UpsellCard | Entitlements, onboarding, profile and local progress |
| Coach | PlanApp, PlanSetup, TodayCard, ReviewDeck | Reading plan and spaced review, controlled by coach flag and Pro access |
| Practice/tools | Goal/Pipeline calculators, AmountInput, TimeBlockPlanner, Checklists, Scorecard, KnowledgeCheck, ChoiceDrill, ScriptBox/Practice, ResponseTimer, ConsultationLab, NurtureTimeline, PostCloseScheduler | Stateful exercises and work planning; complete widget mapping in components/widgets/registry.tsx |
| Data/admin | DataTable/PageDataTable, AdminShell/Nav, Users/Leads/Audit tables, UserActions, StatCards | Sort/filter, role/access management, operational visibility |
| Shared primitives | Base UI/shadcn button, input, textarea, checkbox, radio, select, sheet, tooltip, table, tabs and sidebar | Shared controls; legacy CSS remains alongside newer primitives |

Public routes cover home, preview, pricing, signup/signin/verification, subscription confirmation, informational/legal/support pages and coming-soon. Product routes cover handbook dashboard/start/plan/review, 21 page IDs (cover, pref, ch1–ch13, app-a–f), and account. Admin routes include dashboard, users/detail, leads and audit. See the matrix for every tested URL.

Free authenticated content is cover/pref/ch1/ch7; Basic grants all chapters/essential tools, Pro adds all tools/coach. Administrator role alone does not grant paid content. Existing member/admin file fixtures were used through normal authentication checks; security was not bypassed. Preview/suspended-role variants and admin user detail were inventoried but not runtime tested.

Design conventions: system fonts, light/dark semantic tokens, Base UI and shadcn base-nova, Lucide icons, Tailwind and legacy CSS. Product thresholds are 420/600/700/900/1000/1100px, admin hook 768px, outline container queries 1160/1628px. Multiple breakpoints alone are not defects. Existing review history in docs/plans/PROGRESS.md and existing a11y/CSS/semantic test files informed this audit; no independent visual design specification was supplied.

## Verification and performance

Production build passed, including TypeScript, with database migration explicitly skipped because DATABASE_URL was unset. The production accessibility/CSS/semantic/targeted subset passed **19/19**. The targeted observation collector records known defects and is not an accessibility acceptance test; the separate touch-navigation test contains assertions. Independent matrix assertions verified counts, expected statuses and absence of default-text document overflow. Development initially showed one focus-test failure caused by the Next.js development toolbar; production passed unchanged.

Production localhost diagnostics used a fresh Chromium Pixel 7 browser context per route, 4× CPU slowdown, 150ms network latency, 200,000 bytes/s download and 93,750 bytes/s upload. Each route was sampled once; navigation waited for network idle plus 1.5 seconds. LCP is the last observed candidate at capture. Layout shifts below are the raw sum excluding recent input, not the session-window CLS algorithm. Request/JS totals include resources observed during capture, potentially including prefetch; they are not build chunk attribution.

| Route | LCP candidate | Observed layout-shift sum | Encoded JS | Decoded JS | Resource requests |
|---|---:|---:|---:|---:|---:|
| `/` | 0.820s | 0 | 290,121 B | 1,016,527 B | 22 |
| `/preview` | 0.804s | 0 | 277,882 B | 982,599 B | 17 |
| `/handbook/ch11` | 0.872s | 0 | 408,266 B | 1,384,364 B | 31 |

These numbers do **not** establish real-user performance or a Core Web Vitals pass. INP was not measured. Lighthouse was unavailable and was not installed. No field/RUM data, repeated-run variance or actual cellular hardware trace was collected. See [raw diagnostics](artifacts/performance.json).

System fonts avoid external font fetches; visible brand images have width/height attributes; audio uses user activation and preload=none. Server-rendered content and client widgets are separated. Chapter 11 transferred more JS than the public routes in this sample; inspect route chunks, shared widget imports and hydration in a production trace before deciding to lazy-load or split widgets. Do not infer that every registry import ships to every route. Full responsive-image sizes/priority and asynchronous waterfall tracing remain unverified. Highest-value performance follow-up is repeatable production profiling and field measurement before speculative optimization.

Current official references: [Next.js production checklist](https://nextjs.org/docs/app/guides/production-checklist), [Core Web Vitals](https://web.dev/articles/vitals), [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [Apple accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), [Android accessibility](https://developer.android.com/guide/topics/ui/accessibility/apps). Field goals are p75 LCP≤2.5s, INP≤200ms, CLS≤0.1. WCAG target-size minimum is 24 CSS px with exceptions; 44–48 CSS px is a preferred mobile design target, not the AA rule or a direct equivalence to native pt/dp units.

## Acceptance assessment and limitations

- Initial reading/navigation is usable in the tested contexts; public touch navigation, quiz keyboard behavior, menu/search inertness and heading focus passed selected tests. Complete business workflows are not certified.
- Default-text horizontal overflow: none detected across the executed matrix. Text-enlargement stress: confirmed issues on four routes.
- Safe areas, native virtual keyboards, browser bottom bars, physical rotation, iPad split-screen and real Safari: **not verified**. Absence of viewport-fit or env(safe-area-inset-*) is not itself a defect.
- Accessibility: focus and marker defects observed; status/state omissions found statically. No axe scan or screen-reader audit occurred; no full WCAG claim.
- Authentication: missing-token recovery and authenticated rendering tested. Actual email delivery, mobile mail handoff, resend, profile database saving and entitlement edge states remain unverified.
- Firefox executable missing. Browser zoom and OS text settings were not tested; root-font scaling is explicitly a simulation. Full dark-mode contrast, long-data admin tables, all loading/error states and every interactive widget remain coverage gaps.

Material assumptions: use the current working-tree snapshot, file fixtures and coach-enabled mode to expose the product; treat this as an audit deliverable, not remediation authorization; preserve source and active sessions. A separate approved remediation pass should use the ordered work packages and rerun affected checks against the then-current source.
