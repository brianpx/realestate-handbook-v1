# Public site and product split: handoff

Written 21 October 2026. Covers the sales site, the `/handbook` move, the guided setup and the account page.

## What changed

- **Two layouts, one app.** `app/(public)` is the marketing site (header, footer, `site.css`, all rules scoped under `.pub`). `app/(product)` is the handbook shell (sidebar, search, settings). Both sit under one root layout, so navigation between them stays client-side.
- **Route map.** Every old chapter address redirects permanently (308) to `/handbook/<same slug>`: `/ch1`..`/ch13`, `/pref`, `/app-a`..`/app-f`, `/plan`, `/review`. Heading anchors survive (`/ch2#track-every-source`). Old `/#ch5` hash links are redirected on the client to `/handbook/ch5`. The old title page is now `/handbook/cover`. The map lives in `lib/routes.ts` and `next.config.ts`; `e2e/site.spec.ts` walks all of it.
- **Progress is untouched.** Storage keys (`handbookState`, `handbookSettings`) and page ids did not change; `e2e/site.spec.ts` seeds old-format state and checks it shows on the new routes.
- **New pages.** `/` sales page, `/preview` (real Chapter 1 section + live calculator, a Chapter 6 script, the Chapter 8 planner, no sign-up), `/about`, `/support`, `/pricing`, `/privacy`, `/terms`, `/refunds`, `/updates`, `/handbook` (orientation, continue panel, tool shortcuts, chapter list), `/handbook/start` (six-step guided setup), `/account`.
- **Guided setup** stores values where the chapter tools already do (`calc.*`, `widgets.timeblock`) plus a small `widgets.startSetup` slice (step, two sources, split, finished date). Logic and tests: `lib/setup.ts`, `lib/setup.test.ts`. Print and text download are built in; calendar export is the Chapter 8 planner's.
- **Sitemap** lists public pages only (policy pages join it once their status is `approved`). `robots.ts` disallows `/handbook`, `/account`, `/api/` once indexing is on, and the product layout is `noindex`.
- Small changes to existing code: `AmountInput` takes an `id`; `readTimeblockCfg` moved to `lib/plan.ts`; `summarizeState` extracted in `lib/state/transfer.ts`; chapter-end and coach links use `/handbook/...`; the cutover stub (`docs/cutover/pages-stub-index.html`) now targets `/handbook/<id>`.

## Launch blockers (owner or infrastructure)

1. **There is no paid access.** The repo has no authentication, purchase records or server-side entitlement. `/handbook/*` is publicly readable and so is every chapter's HTML. Hiding links is not protection. Before selling, the handbook routes need a real gate (for example a signed access cookie checked in `proxy.ts` or a session library, issued after a hosted-checkout webhook). Nothing in the UI claims accounts or purchases exist.
2. **No checkout.** The site contains no payment code. `lib/offer.ts` takes a hosted-checkout URL; until price, checkout, access term, update term and approved terms/refund/updates policies are all set, every purchase button degrades to "See pricing and availability".
3. **The handbook is currently advertised as free.** The welcome email says "The book stays free to read", `docs/handbook-webpage-review.md` records the public promise as free, and the live GitHub Pages copy is free. Charging for it, or for part of it, is a decision to make and announce.
4. **Pricing is not decided.** No price exists in the repo, and none was invented.
5. **Policies are drafts.** `POLICY_STATUS` in `lib/offer.ts` is `draft` for privacy, terms, refunds and updates. Drafts show a notice and are `noindex`. Decisions are marked "Decision needed" on each page. Privacy was written from actual data handling (local storage only, optional email form to Neon + SendGrid, salted IP hash for rate limiting, no analytics). It needs your review and probably a professional's. Also confirm the lead-attempts cleanup from `db/migrations/001_leads.sql` is actually scheduled, since the privacy text says the hash is kept briefly.

## Owner inputs needed (all in `lib/offer.ts`)

- `OWNER.author` (name, bio, confirmed background lines). Until set, `/about` and the sales page say nothing about the author instead of inventing it.
- `OWNER.supportEmail`, `OWNER.businessName`, `OWNER.postalAddress`.
- `OFFER.priceDisplay`, `OFFER.checkoutUrl`, `OFFER.accessTerm`, `OFFER.updatesTerm`.
- Genuine reviews or sources, if any. None are shown.
- `SITE_INDEXABLE=true` and `NEXT_PUBLIC_SITE_URL` at cutover, as before (see `docs/cutover-runbook.md`, which still needs a pass for the new sales home page).

## Verified

- `pnpm typecheck` clean; `pnpm test` 354 passed; `pnpm e2e` 216 tests against a production build (see the summary for the final run).
- Desktop and 390px screenshots of the sales page, preview, handbook home and setup were reviewed by eye. **Not done:** a real phone, an axe/Lighthouse run (needs a new dependency), dark mode on the public pages beyond the inversion the handbook already uses, and a screen-reader pass.
- Sales claims were checked against the code: counts (13 chapters, 6 appendices, 20 Appendix E entries, 26 script boxes, 3+1 questions per chapter), tools, calendar export, backup/restore. The reading-plan coach pages (`/handbook/plan`, `/handbook/review`) are flagged off by default and are not mentioned in sales copy.

## Not done on purpose

No payments, emails, deployments or commits. Existing uncommitted work on `settings`/`textSize` was left as it was and is still uncommitted alongside this change.
