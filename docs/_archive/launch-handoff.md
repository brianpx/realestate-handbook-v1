# Public site and product split: handoff

Written 21 October 2026. Covers the sales site, the `/handbook` move, the guided setup and the account page.

## What changed

- **Two layouts, one app.** `../../app/(public)` is the marketing site (header, footer, `site.css`, all rules scoped under `.pub`). `app/(product)` is the handbook shell (sidebar, search, settings). Both sit under one root layout, so navigation between them stays client-side.
- **Route map.** Every old chapter address redirects permanently (308) to `/handbook/<same slug>`: `/ch1`..`/ch13`, `/pref`, `/app-a`..`/app-f`, `/plan`, `/review`. Heading anchors survive (`/ch2#track-every-source`). Old `/#ch5` hash links are redirected on the client to `/handbook/ch5`. The old title page is now `/handbook/cover`. The map lives in `../../lib/routes.ts` and `next.config.ts`; `e2e/site.spec.ts` walks all of it.
- **Progress is untouched.** Storage keys (`handbookState`, `handbookSettings`) and page ids did not change; `../../e2e/site.spec.ts` seeds old-format state and checks it shows on the new routes.
- **New pages.** `/` sales page, `/preview` (Chapters 1 and 7 in full with their tools, a Chapter 6 script, the Chapter 8 planner, no sign-up; see `../plans/free-sample-decision.md`), `/about`, `/support`, `/pricing`, `/privacy`, `/terms`, `/refunds`, `/updates`, `/handbook` (orientation, continue panel, tool shortcuts, chapter list), `/handbook/start` (six-step guided setup), `/account`.
- **Guided setup** stores values where the chapter tools already do (`calc.*`, `widgets.timeblock`) plus a small `widgets.startSetup` slice (step, two sources, split, finished date). Logic and tests: `../../lib/setup.ts`, `lib/setup.test.ts`. Print and text download are built in; calendar export is the Chapter 8 planner's.
- **Sitemap** lists public pages only (policy pages join it once their status is `approved`). `robots.ts` disallows `/handbook`, `/account`, `/api/` once indexing is on, and the product layout is `noindex`.
- Small changes to existing code: `AmountInput` takes an `id`; `readTimeblockCfg` moved to `../../lib/plan.ts`; `summarizeState` extracted in `lib/state/transfer.ts`; chapter-end and coach links use `/handbook/...`; the cutover stub (`docs/cutover/pages-stub-index.html`) now targets `/handbook/<id>`.

## Launch blockers (owner or infrastructure)

1. **The gate exists; a purchase cannot yet open it.** Superseded 9 November 2026 (M5 of `../plans/MASTER-PROMPT.md`): magic-link sign-in, a session cookie checked in `proxy.ts` and a grant-based entitlement check now gate `/handbook/*` and the search index. Until the billing webhook (M7 Phase 5) exists, grants will be created by hand in the admin (M7 step 1, not built yet; today only the bootstrap grant for the first administrator exists).
2. **No checkout.** The site contains no payment code. Each paid tier in `../../lib/tiers.ts` takes a hosted-checkout URL; until price, checkout, access term, update term and approved terms/refund/updates policies are all set, every purchase button degrades to "See pricing and availability".
3. **The handbook is currently advertised as free.** `handbook-webpage-review.md` records the public promise as free, and the live GitHub Pages copy is free. (The welcome email that said "The book stays free to read" is gone: the notes list now sends only a confirmation link, `../../lib/leads/mail.ts`.) Charging for it, or for part of it, is a decision to make and announce.
4. **Pricing is decided, not entered.** Basic $79 and Pro $149, one-time (OD-23, 9 November 2026); neither is in `../../lib/tiers.ts` yet, and no copy invents one.
5. **Policies are drafts.** `POLICY_STATUS` in `../../lib/offer.ts` is `draft` for privacy, terms, refunds and updates. Drafts show a notice and are `noindex`. Decisions are marked "Decision needed" on each page. Privacy was written from actual data handling (local storage, the two sign-in cookies, account and session records, the confirmed notes list on Neon + SendGrid, salted IP hashes for rate limiting, no analytics). It needs your review and probably a professional's. The lead-attempts cleanup from `db/migrations/001_leads.sql` runs on the request path (`../../lib/leads/neon-store.ts`), so the "kept for a day" wording holds.

## Owner inputs needed (all in `../../lib/offer.ts`)

- `OWNER.author` (name, bio, confirmed background lines). Until set, `/about` and the sales page say nothing about the author instead of inventing it.
- `OWNER.supportEmail`, `OWNER.businessName`, `OWNER.postalAddress`.
- `OFFER.accessTerm`, `OFFER.updatesTerm`; `priceDisplay` and `checkoutUrl` per paid tier in `../../lib/tiers.ts`.
- Genuine reviews or sources, if any. None are shown.
- `SITE_INDEXABLE=true` and `NEXT_PUBLIC_SITE_URL` at cutover, as before (see `cutover-runbook.md`, which still needs a pass for the new sales home page).

## Verified

- `pnpm typecheck` clean; `pnpm test` 354 passed; `pnpm e2e` 216 tests against a production build (see the summary for the final run).
- Desktop and 390px screenshots of the sales page, preview, handbook home and setup were reviewed by eye. **Not done:** a real phone, an axe/Lighthouse run (needs a new dependency), dark mode on the public pages beyond the inversion the handbook already uses, and a screen-reader pass.
- Sales claims were checked against the code: counts (13 chapters, 6 appendices, 20 Appendix E entries, 26 script boxes, 3+1 questions per chapter), tools, calendar export, backup/restore. The reading-plan coach pages (`/handbook/plan`, `/handbook/review`) are flagged off by default and are not mentioned in sales copy.

## Not done on purpose

No payments, emails, deployments or commits. Existing uncommitted work on `settings`/`textSize` was left as it was and is still uncommitted alongside this change.
