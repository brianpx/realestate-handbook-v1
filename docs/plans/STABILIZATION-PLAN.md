# Stabilization plan

Audit date: 2026-11-11. Planning only. This file is untracked. It does not tick boxes in `docs/plans/MASTER-PROMPT.md`, `docs/plans/COMPLETION-PLAN.md`, or `docs/plans/PROGRESS.md`.

No commit, merge, rebase, push, pull request, deploy, hosted-config change, or database migration was made. Owner work in the primary checkout and in the pre-existing worktrees was left in place.

## 1. Executive assessment

The product on committed `HEAD` is a working local app. A clean detached checkout of `2e02de74e268fceb2ce67d8792ab33a2ba82be72` passed `pnpm typecheck`, `pnpm test` (835 passed, 20 skipped), `pnpm build`, and `pnpm e2e` (298 passed, 2 skipped). That result is committed `HEAD` only. It does not cover the dirty primary tree, pull request #53, or `origin/main`.

`origin/main` is `a2fe58f4082d1dfa9b2d9c1eab499408b48dacc3` (merge of pull request #51, billing). The primary checkout is 12 commits behind that tip. GitHub Actions run [42957530376](https://github.com/brianpx/realestate-handbook-v1/actions/runs/42957530376) on `a2fe58f` concluded success, including the single `check` job that runs typecheck, unit tests, and Playwright. This audit did not re-read that job's e2e log.

The shortest path to a reviewable local app is the primary checkout as it sits, with the file stores and Mailpit already configured. That tree is the mobile, sign-in, and postal-address work, and it does not contain the billing code from pull request #51. The shortest path to a stable integrated main is a new local integration branch that starts at `a2fe58f`, takes pull request #52, then takes pull request #53, and is re-checked with the Lane 6 command sequence. Updating `origin/main` is a later, separate authorization, because a push to `main` deploys production.

Local review of this checkout can start before that integration branch exists. Calling the local candidate stable waits until that branch is green, includes the Wave 2 sign-in fixes, and has been reviewed. Wave 3 (suspension and account delete) is required before a database-backed deploy. Nothing in this plan authorizes a push.

## 2. Source and integration inventory

| Source | Identity | Freshness | Role |
| --- | --- | --- | --- |
| Primary checkout | `feat/owner-postal` at `2e02de74`, tracking `origin/main`, 0 ahead / 12 behind | Dirty: 37 modified files (+644/−200) and untracked tests, `docs/mobile-audit/`, `Claude outputs/` | Owner work. Preserve. Do not copy its files onto a billing tree. |
| Live `origin/main` | `a2fe58f` "Merge pull request #51 from brianpx/feat/billing" (2026-11-10 20:10 −0800) | `git ls-remote` matched the cached `origin/main` SHA. Comparison is current. | Integration base. |
| Local `main` | `69813b19` (pull request #12) | 0 ahead / 151 behind live `origin/main` | Stale ref. Do not branch or diff against it. |
| Remote `next` | `1287616a` | Ancestor of `a2fe58f` | Old content commit. "Dev" means local `next dev`. |
| Pull request #53 | `feat/mobile-and-auth-polish` at `c41cb8d`, descendant of `a2fe58f` | Open. Vercel preview success. CI run [43056110990](https://github.com/brianpx/realestate-handbook-v1/actions/runs/43056110990): `pnpm typecheck` and `pnpm test` succeeded; `playwright install --with-deps chromium` failed on Ubuntu DNS (`Temporary failure resolving`); e2e was skipped. `mergeable: MERGEABLE`, `mergeStateStatus: UNSTABLE`. | The committed form of the primary dirty product diff, already stacked on billing. |
| Pull request #52 | `fix/billing-fraudulent` at `3dbddfe` | Open. CI success, Vercel preview success. Descendant of `a2fe58f`. Clean worktree `/private/tmp/reh-billing`. | Unmerged fraud handling. |
| Pull request #28 | `fix/signin-verify-copy` at `6eaeea5` | Open. CI success on 2026-11-10. Not contained in `a2fe58f`. | Stalled auto-submit and a separate verify rate-limit key. Conflicts with #53. |
| Pull request #27 | `docs/coming-soon-commands` at `6354b65` | Open. CI success. Docs only. | Defer. |

`git merge-tree --write-tree` against `a2fe58f` is clean for #53, #52, #28, #27, and `feat/handbook-mockup-style` (`c71bda7`). #53 against #52 is clean. #53 against #28 conflicts in `app/(public)/auth/verify/page.tsx`, `app/(public)/subscribe/confirm/page.tsx`, and `lib/auth/handler.ts`. #53 against the mockup branch conflicts in `app/globals.css`.

Every other remote head checked, including `origin/feat/access-gate` (`8aa3cdac`), `origin/feat/owner-inputs`, and `origin/feat/handbook-content-pass`, is already contained in `a2fe58f`.

### Dirty primary tree versus pull request #53

The tracked hunks are the same change set as `a2fe58f..c41cb8d`, applied onto `2e02de74` instead of onto billing. Byte comparison with `c41cb8d` matches the product files and the untracked tests (`e2e/signin.spec.ts`, `e2e/mobile-layout.spec.ts`, `e2e/mobile-recovery.spec.ts`, `lib/auth/config.test.ts`, header and signup tests) and the seven `docs/mobile-audit/*.md` reports. Six blobs differ because this tree lacks billing that #53 already contains: `.env.example`, `app/(product)/account/page.tsx`, `lib/auth/mail.ts`, `lib/auth/mail.test.ts`, `lib/offer.ts`, `lib/offer.test.ts`. Copying those six working-tree files onto `a2fe58f` drops the purchase panel, the ready email, and the signed-in checkout helper. A 3-way merge with base `2e02de74` does not: `git merge-file` of each of the six was clean, and the results still contain `loadPurchases`, `PurchasePanel`, `sendReadyLink`, and `checkoutUrlFor`, plus the postal stand-in. Pull request #53 is that merge already committed. The tip commit `c41cb8d` is the audit-doc commit; the code commits under it are `2f6dd24`, `131fd3d`, and `3ecd5a3`.

Untracked and not in #53: `Claude outputs/*.html`, and the screenshot and artifact trees under `docs/mobile-audit/`. Keep them local.

### Worktrees with uncommitted work (preserve)

These are owner work. This audit did not modify them.

| Path | Branch / commit | What it is |
| --- | --- | --- |
| Primary checkout | `feat/owner-postal` @ `2e02de74` | The #53 patch on the pre-billing tree, plus local-only artifacts. |
| `/private/tmp/reh-mobile-accessibility`, `reh-mobile-layout`, `reh-mobile-recovery`, `reh-mobile-remediation` | `2e02de74` | Slices of #53. Remediation also sets a preview `distDir`. Do not integrate. |
| `/private/tmp/reh-security-resilience-20261110` | `2e02de74` | Widest uncommitted security and recovery patch, including a draft `007` migration. |
| `/private/tmp/reh-closeout-browser-c`, `reh-closeout-confirmation-a`, `reh-closeout-consistency` | `2e02de74` | Subsets of the security tree, not byte-identical. |
| `/private/tmp/reh-audit-data`, `reh-audit-runtime`, `reh-audit-independent-before` | `2e02de74` | Access-store and runtime slices. The suspension fix lives in the data tree. |
| `/private/tmp/reh-coach-review` | `2e02de74` | Uncommitted question rewrites. Not an approval. |
| `/private/tmp/reh-q1109-0857-*` | `ae1708d` | Ancient. Not an integration source. |
| `/private/tmp/reh-billing` | `3dbddfe` | Clean copy of #52. |
| `.claude/worktrees/integrate` | `c41cb8d` | Clean copy of #53. |
| `.claude/worktrees/mockup-style` | `c71bda7` | Local-only shell restyle. |
| `.claude/worktrees/fix-e2e-green` | `a2eebed` (ancestor of main) | Small dirty `.env.example` and `PROGRESS.md`. A nested `.env.dev-branch.local` has a hosted database host. Do not use that file. |
| Many other worktrees | exact `2e02de74` or old docs commits | Labels or docs. Not extra product commits. |

### Scripts and deploy triggers

`package.json` scripts, confirmed: `dev`, `build` (`pnpm db:migrate && next build`), `db:migrate`, `start`, `typecheck` (`next typegen && tsc --noEmit`), `test` (`vitest run`), `e2e` (`playwright test`). There is no lint or format script.

No `vercel.json` and no `.vercel/` in the primary checkout. `origin/main` has `vercel.json` with one schedule: `GET /api/cron/billing-reconcile` at 08:00 UTC.

`.github/workflows/ci.yml` runs on push to `main` and on pull requests: install, typecheck, test, Playwright with Mailpit. `.github/workflows/neon-preview-cleanup.yml` deletes Neon branch `preview/<head>` in project `morning-credit-15469990` when a same-repo pull request closes.

Observed, not declared in a repo file: opening or updating a pull request creates a Vercel preview on project `realestate-handbook` (scope `brian-pitts`). A push to `main` runs GitHub Actions and has produced a Vercel production deployment (the `a2fe58f` commit status completed a deployment). The same push also runs the external GitHub Pages workflow `pages-build-deployment` (source `main` at `/`). Pushing the current branch with no pull request does not run `ci.yml`. A Vercel preview is still likely.

### This audit's worktrees (owner may remove)

- Execution worktree, clean detached `HEAD`, checks ran here: `/tmp/reh-lane6-clean-2e02de7`
- First Lane 6 attempt. It copied the dirty tree, ran no checks, and is not registered in `git worktree list`: `/Users/mmbp/.grok/worktrees/code-realestate-handbook-v1/subagent-01a1cb74-dd1a-7570-8064-6c20e317c17d`

## 3. Reconciled backlog

Historical plans stay as they are. Link them. Status below is from the code and the git history on 2026-11-11, not from checkbox counts in `PROGRESS.md`.

Already satisfied or superseded, so they are not open work:

- Completion-plan wave 1 pull requests #17 through #22 are in `origin/main`. The "stacked and unmerged" note at the top of `docs/plans/PROGRESS.md` is stale.
- Wave 2 content and accessibility pull requests through #47, and the coach-port merge #50, are in `HEAD`. Billing pull request #51 is in `origin/main` only.
- `lib/pages.ts:53` free set is `cover`, `pref`, `ch1`, `ch7`, with no expiry. `purchaseOpen()` is false (`lib/offer.test.ts`). Draft coach questions are stored and filtered out of the reader-facing check (`lib/coach/check.ts:16`).
- The memory note that 8x8 means eight days is superseded. `content/pages/ch5.html` Table 5.1 and `content/pages/app-d.html` define 8x8 as eight touches over eight weeks. This audit did not re-audit the whole book.
- The mobile worktrees and the primary dirty tree are not a second feature beside #53.

### Stable integrated main

These items belong on the integration branch before anyone treats main as the combined product. They do not all block the owner from opening the current checkout locally.

| ID | Class | Evidence | Impact | Confidence | Correction | Acceptance | Dependencies and files | Effort |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S-01 | integration gap | Primary `HEAD` `2e02de74` is 12 behind `a2fe58f`. Local `main` is `69813b19`. Lane 1. | A branch cut from local `main` misses billing. The dirty tree's own commit does not contain billing until it is merged with base `2e02de74`. | confirmed | Start the integration branch at `a2fe58f`. | The branch contains `loadPurchases` on the account page and `lib/billing/**`. | `origin/main` | small |
| S-02 | integration gap | Byte diff of the dirty tree against `c41cb8d`. A 3-way `git merge-file` from base `2e02de74` onto `a2fe58f` was clean for the six billing-adjacent files and kept `loadPurchases`, `PurchasePanel`, `sendReadyLink`, and `checkoutUrlFor`. | Copying the six working-tree files onto `a2fe58f` drops billing. Merging them, or merging #53, keeps it. | confirmed | Land #53, which is the merge already made. Leave the primary dirty tree uncommitted so the owner's copy stays put. Do not `checkout` those six paths onto a billing tree. | The candidate contains `c41cb8d` and still has the billing account panel. | #53 files listed in section 5 | small |
| S-03 | defect | `a2fe58f:lib/billing/adapters/lemonsqueezy.ts` leaves `fraudulent` unmatched. `3dbddfe` maps it to `chargeback_lost` and revokes. Lanes 1, 4, 5. | A preview that holds billing keys can keep access after a fraudulent order. Production billing env is unset, so production does not process orders today. | confirmed | Take #52 onto the integration branch before any push. | A fraudulent order fixture revokes the live grant and does not grant again on replay. A partial refund that is not fraudulent still grants. | `lib/billing/adapters/lemonsqueezy.ts`, `process-event.ts`, `reconcile.ts`, tests. Clean versus #53. | small |
| S-04 | verification gap | CI run 43056110990: typecheck and unit test succeeded; Playwright's apt step failed on DNS; e2e did not run. | #53's new sign-in and mobile specs are unproven in CI. | confirmed | Re-run the workflow, or run `pnpm e2e` on the integration branch locally, before any merge talk. | E2e exit 0 on the combined tree, including `e2e/signin.spec.ts` and the two mobile specs. | CI, Playwright | small |
| S-05 | defect | `lib/access/membership.ts:40-44` read-modify-writes the row. `lib/access/neon-store.ts:132-141` writes `suspended_at` from that snapshot. Entitlement reads `suspendedAt` (`lib/access/entitlement.ts:40`). The comment that enforcement ignores `status` does not cover `suspendedAt`. Fix is uncommitted in `/private/tmp/reh-audit-data`. Lane 4. | A grant refresh can clear or restore a suspension. | confirmed | Land the upsert that does not write the suspension columns, with the suspension-race test. | A suspend that commits after the grant read stays suspended. | `lib/access/membership.ts`, `lib/access/neon-store.ts`, `lib/access/store.ts`, `lib/access/suspension-race.test.ts` | small |
| S-06 | defect | `lib/account/handler.ts:66-81`: anonymise commits, then profile and lead deletes are separate and errors are swallowed. Lane 4. | A deleted account can keep a license number, phone, or marketing address. | confirmed | Delete those rows in the same statement as anonymise. | One failure leaves the account active. Success removes the profile and the lead. Grants and billing rows remain. | `lib/access/neon-store.ts`, `lib/account/handler.ts`. Needs migration `006` present. | small |

### Local review

| ID | Class | Evidence | Impact | Confidence | Correction | Acceptance | Dependencies and files | Effort |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L-01 | defect | `components/site/SignupForm.tsx:165-174` posts a form body. `lib/auth/handler.ts:66-69` accepts only JSON with `termsVersion` and `source`. Lane 2, confirmed. | Enter before hydration, or no JavaScript, shows a JSON 400. The hydrated path sends the link. | confirmed | Disable submit until `data-ready`, or accept the form body with the hidden fields. | Pre-hydration Enter stays on the page. A hydrated valid address reaches the sent state. | `components/site/SignupForm.tsx`, possibly `lib/auth/handler.ts` | small |
| L-02 | defect | `handleVerify` returns JSON on 503 and 429 (`lib/auth/handler.ts:104-105`, `:130-131`) while `AutoSubmit` is a native form POST. Sign-out-everywhere and delete do the same on 403/503. Lane 2. | A mail or database failure shows raw JSON. | confirmed | Redirect those failures back to the page with an `error` query the page already renders. | A form navigation never renders JSON. | `lib/auth/handler.ts`, `lib/account/handler.ts`, verify and account pages. Shares `handler.ts` with L-04. | small |
| L-03 | defect | `components/shell/Sidebar.tsx:255-258`: while results are open the button is named "Close search results" but `aria-expanded` follows `menuOpen` and `aria-controls` stays `navList`. Lane 3, confirmed. | A phone user hears the contents as collapsed while results are open. | confirmed | Point expanded and controls at the result list while `searching` is true. | With a query and the menu closed, the button exposes the result list. | `components/shell/Sidebar.tsx` | small |
| L-04 | defect | Pull request #28. Clean versus `a2fe58f`. Conflicts with #53 on the verify page, the confirm page, and `lib/auth/handler.ts`. Lane 1. | A stalled magic link can leave a disabled button. Verify attempts still share the request-link budget. #53 does not add the retry or the `verify:` key. | confirmed | Rework #28 onto the integration branch after #53 and after L-02. | The button re-enables after a stall. Verify uses its own key. #53's limit injection remains. | `components/auth/AutoSubmit.tsx`, verify page, confirm page, `lib/auth/handler.ts` | small |
| L-05 | defect | `app/(product)/handbook/page.tsx:57-62` always sets `data-widget`. `components/shell/DeepLinks.tsx:19-25` announces a missing tool. An upsell page has no widget (`app/(product)/handbook/[slug]/page.tsx:34`). Lane 3, confirmed. | The paid wall is announced as a broken tool. | confirmed | Omit `data-widget` unless the page is open, or skip the announcement when the upsell is present. | A preview reader activating a paid tool hears the upsell title. | `app/(product)/handbook/page.tsx`, `DeepLinks.tsx` | small |
| L-06 | incomplete feature | `lib/leads/handler.ts:74-76` resends only when `emailStatus === 'failed'`. A null status never retries. The lease and `007_confirmation_delivery.sql` are uncommitted in the security worktree. Lane 4. | A crashed confirmation cannot be repaired by submitting again. | strongly supported | Land one lease with the code that reads it. | Two concurrent submits send one email. A confirmed address is never emailed again. | `lib/leads/handler.ts`, `lib/leads/neon-store.ts`, migration `007` | medium |
| L-07 | verification gap | Lane 6 on `2e02de74`: profile e2e expects "Profile editing needs the account database" because `AUTH_STORE=file`. Neon profile tests skipped. | Saving a profile is proven by unit tests, not by the e2e server. | confirmed | Keep the file-store message for local review. Add a round-trip only when a localhost database exists. | The file-store account page shows that sentence. A database round-trip is a separate check. | `e2e/access.spec.ts`, `components/account/ProfileForm.test.tsx` | small to accept; medium to extend |
| L-08 | verification gap | `~/.grok/bin/pnpm` is `exec corepack pnpm` and exits 127 (`corepack: not found`). `/opt/homebrew/bin/pnpm` 12.9.1 ran the suite. Lane 6. | Local commands fail if that shim is first on `PATH`. | confirmed | Use Homebrew pnpm for the runbook. Do not change the repo to paper over the shim. | `pnpm -v` prints 12.x. | Owner shell. No repo file. | small |

### Vercel preview

Do not push until the owner authorizes a preview. These are the reasons a push is not a neutral act.

| ID | Class | Evidence | Impact | Confidence | Correction | Acceptance | Dependencies and files | Effort |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P-01 | integration gap | Lane 5: one `DATABASE_URL` is targeted at Preview and Production. `db/migrate.ts` refuses a non-production migrate when the host equals `PRODUCTION_DB_HOST`. Runtime auth, lead, and billing stores have no such check. Preview has `SENDGRID_API_KEY` and the four billing secrets. The host string was not read. | A preview whose runtime URL is the production host reads and writes production rows and can send real sign-in mail. | strongly supported for the missing guard; needs verification for the live host | Before any preview exercise, confirm the preview database host is a Neon branch. Refuse startup when a non-production `VERCEL_ENV` host equals `PRODUCTION_DB_HOST`. | A preview pointed at the production host serves 503 for lead, auth, and billing writes and does not call SendGrid. | `lib/auth/store.ts`, `lib/leads/store.ts`, `lib/billing/env.ts`, `db/migrate.ts`. Owner confirms the host. | medium |
| P-02 | integration gap | `LEAD_IP_SALT` is absent from the Vercel name list for Production and Preview. `lib/leads/env.ts` returns 503 in production without it. `AUTH_IP_SALT` is set and is not a fallback. Lane 5. | Hosted `POST /api/lead` answers 503. Local file-store review does not need the salt. | confirmed for the name list | Set the salt on Preview and Production only when the owner wants hosted notes. Distinct from the database credential. | A hosted lead post from the site origin returns 200, and a missing salt still returns 503. | `lib/leads/env.ts`, Vercel env. Owner creates the salt. | small |
| P-03 | owner dependency | Preview has `BILLING_PROVIDER`, `BILLING_WEBHOOK_SECRET`, `BILLING_API_KEY`, and `CRON_SECRET`. Production does not. `purchaseOpen()` is false. Lane 5. | A signed webhook to a preview of main can grant access. The public buy button stays off. | confirmed | Keep production billing unset. Confirm the preview keys are test mode without printing them. Land S-03 first. | Production webhook stays 503. A test-mode preview grants only on a non-production database. | `lib/billing/**`, `app/api/billing/webhook/route.ts`, `vercel.json` on main | medium |

### Production

| ID | Class | Evidence | Impact | Confidence | Correction | Acceptance | Dependencies and files | Effort |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R-01 | owner dependency | `docs/operations/hosting.md` records the 2026-11-08 move to meded (CLI scope `brian-pitts`, project `prj_RtoVEbnWQiUEpZQgK9V01FDaNLbU`) and the kept Neon project `morning-credit-15469990`. The cleanup workflow uses that id. The audit brief says a fresh Neon database. Local env files in the primary checkout do not set `DATABASE_URL`. | Hosted data is still the transferred database. A fresh database is not started. | confirmed as a doc-versus-brief conflict | The owner chooses keep or fresh before any migration or env edit. | The chosen project id is the one in the cleanup workflow and hosting doc. The other database is untouched. | `docs/operations/hosting.md`, `.github/workflows/neon-preview-cleanup.yml` | decision, or large if a new database is required |
| R-02 | incomplete feature | SendGrid key and `LEAD_FROM_EMAIL` are set on Production and Preview. `LEAD_MAILING_ADDRESS` is not. `lib/leads/mail.ts` then selects provider `none`. Sign-in mail does not require the postal line. Dirty `lib/offer.ts` uses the stand-in postal string, and policies stay `draft`. Lane 5 and Lane 2. | Notes confirmation is skipped on the host. Sign-in mail can already leave Production and every preview. The stand-in address is on the draft terms page. | confirmed | Leave notes mail dark until the owner supplies the postal address and `LEAD_MAILING_ADDRESS`. | With the key set and the mailing address unset, notes status stays skipped. | `lib/leads/mail.ts`, `lib/offer.ts`. Owner owns the address. | small |
| R-03 | defect | `lib/auth/handler.ts:118-123` counts admins, then `setRole`, then grants, as separate statements. Lane 4. | Two bootstrap addresses can both become admin, or the first admin can lack a content grant. | strongly supported | One conditional update that sets admin only while none exists, and inserts the grant in that statement. | Concurrent first sign-ins produce one admin and one owner grant. | `lib/auth/handler.ts`, `lib/users/neon-store.ts`, `lib/access/grants.ts` | medium |
| R-04 | verification gap | `NEXT_PUBLIC_SITE_URL` is unset on Vercel. `lib/site.ts` falls through to `VERCEL_PROJECT_PRODUCTION_URL` at build time. `COMING_SOON` is Production-only. Lane 5. | If the public origin is not that host, sign-in links and lead posts miss. Previews show the full site. | needs verification | Set `NEXT_PUBLIC_SITE_URL` when the canonical domain is chosen. | A sign-in link and a lead post from the public origin succeed. Another origin is 403. | `lib/site.ts`, `proxy.ts` | small |
| R-05 | optional enhancement | GitHub Pages workflow `pages-build-deployment` is not a file in this repo. The `a2fe58f` push created a Pages deployment. The repository is public. Lane 5. | Every main update also publishes `https://brianpx.github.io/realestate-handbook-v1/`. | confirmed | Disable GitHub Pages if Vercel is the only host. | A main push no longer starts that workflow. | GitHub Pages settings | small |
| R-06 | verification gap | Default e2e sets `NEXT_PUBLIC_COACH_ENABLED=true`. `e2e/coach-off.spec.ts` skipped (2). The flag is build-time and defaults off (`lib/coach/enabled.ts`). Lane 6. | The 404 behavior of plan and review was not executed. | confirmed | Run the second build on port 3206 when the owner wants the pre-cutover check. | Both coach-off tests pass, and the coach-on suite is unchanged. | `e2e/coach-off.spec.ts` | small |

### Later

| ID | Class | Evidence | Impact | Confidence | Correction | Acceptance | Dependencies and files | Effort |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D-01 | owner dependency | Audit brief: Chapters 1 and 7, no email gate, no expiry. Recorded OD-01 and OD-11 in `docs/plans/PROGRESS.md` and `docs/plans/MASTER-PROMPT.md`. Code: `/preview` is anonymous and includes Chapter 1, Chapter 7, a preface excerpt, one Chapter 6 script, and the Chapter 8 planner (`app/(public)/preview/page.tsx:46-79`). `/handbook` requires a session (`proxy.ts:23`, `:46-50`). Signed-in readers without a grant get `cover`, `pref`, `ch1`, `ch7`. | Changing the code to the one-sentence brief would remove recorded sample excerpts and would open handbook chapters that OD-11 closes. `/preview` already supports a local look at Chapters 1 and 7 with no email and no expiry. | confirmed | Leave the code until the owner restates OD-01 and OD-11. | One written decision, then copy, `FREE_PAGE_IDS`, the preview excerpts, and `e2e/site.spec.ts` match it. | `app/(public)/preview/page.tsx`, `lib/pages.ts`, `proxy.ts` | none until the decision |
| D-02 | incomplete feature | `content/data/questions.ts` draft flags. `/private/tmp/reh-coach-review` clears `draft` under an "awaiting accuracy review" comment. Lane 3. | Drafts are not shown. Merging that worktree would show them. | confirmed | Keep the filter. Treat the worktree as a review draft. | The owner accepts the question diff, and `e2e/coach.spec.ts` passes. | `content/data/questions.ts` | medium |
| D-03 | optional enhancement | `feat/handbook-mockup-style` `c71bda7`, local only. Conflicts with #53 in `app/globals.css`. Lane 1. | Shell visuals only. | confirmed | Defer until #53 is on the integration branch. | Shell specs pass and #53 touch-target rules remain. | `app/globals.css`, `Sidebar.tsx`, `HomePanels.tsx` | medium |
| D-04 | optional enhancement | q1109 worktrees at `ae1708d`. `a5c-amount-boundaries` has an untracked script only. Lane 1. | Possible amount and ICS gaps were not proven against current files. | needs verification | Do not merge those trees. Re-test `lib/amount.ts` and `lib/ics.ts` on `a2fe58f` if the owner wants that pass. | A focused test on the current files. | `lib/amount.ts`, `lib/ics.ts` | medium |
| D-05 | optional enhancement | Pull request #27. `docs/vercel-migration-result` conflicts in `PROGRESS.md`. Lane 1. | Docs only. | confirmed | Defer. Do not auto-merge old progress notes. | `PROGRESS.md` on main stays the append-only record. | `docs/plans/` | small |
| D-06 | optional enhancement | No `app/(admin)/error.tsx`. Product routes have `app/(product)/error.tsx`. Lane 3. | A thrown admin query replaces the shell with the framework error. | confirmed | Add an admin error boundary when admin is next touched. | A failed list still shows the admin nav and a retry control. | `app/(admin)/error.tsx` | small |
| D-07 | optional enhancement | `networkidle` at `e2e/access.spec.ts:177` and `e2e/parity/practice.spec.ts:115` and `:151`. This run was green. Lane 6. | A chatty connection can time out those tests. | strongly supported | Replace those waits when those specs are next edited. | Those tests pass with no `networkidle`. | those two specs | small |
| D-08 | incomplete feature | Dev auth ceiling is keyed on `NODE_ENV !== 'production'` (`lib/auth/config.ts:34-43`). Production numbers stay when `NODE_ENV` is `production`. Mail uses SendGrid whenever the key is set. Lane 4. | `next dev` aimed at SendGrid and a hosted database can send far past the production ceiling. The configured local env does not do that. | confirmed | Keep the high ceiling for Mailpit and the file store. Do not point `next dev` at SendGrid. | Any process with `SENDGRID_API_KEY` set keeps the production limits. | `lib/auth/config.ts`, `lib/auth/env.ts` | small |

`lib/auth/config.ts:48` still sets `SIGN_IN_PATH` to `/signup`. `/signin` and `/signup` both render `SignupForm` (`app/(public)/signin/page.tsx`, `app/(public)/signup/page.tsx`). The gate and the header reach the same form. That is not a separate defect.

## 4. Execution waves

Future editing agents each get a new worktree. Do not edit the primary checkout. Do not reset, stash, or clean any existing worktree. Shared files, migrations, and the integration branch are serial. A fresh reviewer reads the combined diff before it is treated as the main candidate. No wave pushes.

### Wave 0 — preserve

Outcome: the primary dirty tree and every pre-existing worktree stay byte-for-byte.

Acceptance: `git status --porcelain` on the primary checkout still lists the same owner paths, plus this untracked plan.

Agent: coordinator. No file ownership except this plan.

### Wave 1 — integration branch

Outcome: a local branch `feat/stabilize-main` whose tree is `a2fe58f` plus #52 plus #53.

Prerequisites: Wave 0. Network may stay unused if the commits are already local (`a2fe58f`, `3dbddfe`, `c41cb8d` are).

Steps, serial, in a new worktree created with `git worktree add` at `a2fe58f` (detached or a new branch). Do not check out `feat/owner-postal`.

1. Merge `3dbddfe` (pull request #52). Expected clean.
2. Merge `c41cb8d` (pull request #53). Expected clean.
3. Safety gate, then the serial commands. Use the `env -u` prefixes from section 6 on `pnpm test`, `pnpm build`, and `pnpm e2e`. A bare `pnpm build` is not safe: `package.json` runs `db/migrate.ts` first, and `refusalReason` returns null when `VERCEL_ENV` is unset, so a `DATABASE_URL` already in the shell is migrated. `lib/auth/mail.ts` uses SendGrid whenever `SENDGRID_API_KEY` is set, including when `MAILPIT_URL` is also set. Unset both names for the command even though the primary env files do not set them.
4. Fresh reviewer on the combined diff versus `a2fe58f`. The reviewer did not author the merges.

Owned files: the #52 and #53 file lists. Collision surface with later waves: `lib/auth/handler.ts`, `lib/auth/mail.ts`, `lib/offer.ts`, `app/(product)/account/page.tsx`, `components/site/SignupForm.tsx`, `app/globals.css`, `components/shell/Sidebar.tsx`.

Checks: the four scripts above. E2e must include the three specs that exist only on #53.

Integration position: this branch is the only candidate for a later main update. The primary checkout stays the owner's working copy.

### Wave 2 — journey fixes, two lanes

Prerequisites: Wave 1 green.

Lane A, one worktree from the integration branch. Owns `components/shell/Sidebar.tsx`, `components/shell/DeepLinks.tsx`, `app/(product)/handbook/page.tsx`. Does L-03 and L-05. Check: `pnpm test` for the touched tests, plus `pnpm e2e e2e/parity/search.spec.ts e2e/a11y.spec.ts` when port 3187 is free.

Lane B runs in parallel with Lane A. They share no files. Owns `components/site/SignupForm.tsx`, `components/auth/AutoSubmit.tsx`, `components/auth/AutoSubmit.test.tsx` (this file exists on #28 and not on #53), `lib/auth/handler.ts`, `lib/auth/handler.test.ts`, `lib/account/handler.ts`, `app/(public)/auth/verify/page.tsx`, `app/(public)/subscribe/confirm/page.tsx`. Does L-01, L-02, and the #28 rework (L-04) in that order, because all three meet in `lib/auth/handler.ts`. Take #28's retry and `verify:` key. Keep #53's limit injection. `handler.test.ts` merges clean; `AutoSubmit.test.tsx` must be brought across or the new retry has no test. Check: `pnpm typecheck`, `pnpm test`, `pnpm e2e e2e/auth.spec.ts e2e/signin.spec.ts`, with the section 6 `env -u` prefixes.

A third agent integrates A and B onto the Wave 1 branch and re-runs the full serial suite.

### Wave 3 — data integrity

Prerequisites: Wave 2 integrated, because account deletion and the lead handler sit next to Wave 2's account and auth files.

One worktree from the Wave 2 tip. Port specific hunks. Do not copy whole files out of `/private/tmp/reh-security-resilience-20261110` or `/private/tmp/reh-audit-data`. Those trees are `2e02de74` plus dirty edits. Their `lib/offer.ts` has the pre-billing `checkoutUrlFor`. Their `lib/account/handler.ts` still swallows the profile and lead deletes (the atomic deletes are in that tree's `lib/access/neon-store.ts`). Copying either file would drop billing and would replace Wave 2's error redirects.

Take the suspension upsert and `suspension-race.test.ts` from the audit-data tree into `lib/access/neon-store.ts` and `lib/access/membership.ts`. Take the anonymise SQL from the security tree's neon store into the current `lib/access/neon-store.ts`. In `lib/account/handler.ts`, change only the delete path so a failed profile or lead delete rolls back with the account, and keep Wave 2's 403/503 redirects. Take the confirmation lease the same way, into `lib/leads/handler.ts` and `lib/leads/neon-store.ts`, without reverting #53's postal mail. Do not copy the Next.js pin, the lockfile, or a `distDir` change. Add migration `007` only in the same change as the code that reads it, and only after `006`.

Owns: `lib/access/**`, the delete path inside `lib/account/handler.ts` (Wave 2 owns the rest of that file and lands first), `lib/leads/handler.ts`, `lib/leads/neon-store.ts`, `db/migrate.ts` only if the preview guard must change, `db/migrations/007_confirmation_delivery.sql`.

Does S-05, S-06, and L-06. Check: `pnpm typecheck`, `pnpm test`. Neon integration tests stay skipped unless `TEST_DATABASE_URL` is a localhost URL. Do not point them at a hosted host.

### Wave 4 — review gate

A fresh reviewer, not an author of Waves 1–3, reads the diff from `a2fe58f` to the integration tip. Then the owner runs section 6 against that worktree. Findings from the reviewer are fixed before any request to push.

### Explicitly not in these waves

D-01 through D-05, the mockup, the coach-question rewrite, GitHub Pages, and a fresh Neon project. R-03 (bootstrap race) waits until an auth-store change is already in progress, or until the owner schedules it. It is not required for the first local pass.

## 5. Integration and main strategy

Preserve the primary checkout. Its dirty files are the owner's copy of work that already exists as pull request #53 on top of billing. The integration branch is built in a new worktree from `a2fe58f`, by merging #52 and then #53. Do not copy the six billing-adjacent working-tree files onto that branch. A 3-way merge from base `2e02de74` would also keep billing; #53 is that result already committed, so use the commits.

Order:

1. `a2fe58f` (billing, already on `origin/main`).
2. #52 fraud revocation. No overlap with #53.
3. #53 mobile, one sign-in form, postal stand-in, account recovery copy. Carries billing forward.
4. #28 reworked onto that result (Wave 2 Lane B).
5. Suspension, anonymise, and the confirmation lease (Wave 3), taken from the security and audit worktrees as a new commit series, not as a merge of those dirty trees.
6. Mockup and coach questions only after the owner asks, each on its own branch.

Collision handling: if a merge is not clean, stop and keep both sides. Do not use a strategy that drops either billing or the #53 behavior. `app/globals.css` is the known mockup collision and stays out of Waves 1–3. `lib/auth/handler.ts` is the known #28 collision and is owned by Wave 2 Lane B alone.

Review gates: Wave 1 reviewer, Wave 4 reviewer. Checks after combining: `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm e2e`, serial, under the section 6 safety gate. A red check stops the branch. Owner changes in other worktrees are not discarded to make the check pass.

`origin/main` changes only at section 7 gate 5, and only by a normal merge of the integration branch. Gate 3 pushes a feature branch for a preview and does not update `main`. This plan does not perform either push. Local `main` is not updated by this plan either. A push of `main` also starts GitHub Pages and a Vercel production deployment.

## 6. Local owner-review runbook

Two trees. Pick one and say which.

**A. Primary checkout, today.** `feat/owner-postal` with the dirty mobile and sign-in work. Billing from pull request #51 is absent. Good for layout, the sample, sign-in copy, and account recovery copy.

**B. Wave 1 worktree, after it exists.** `a2fe58f` plus #52 plus #53. This is the tree that matches what a later main would be, before Waves 2 and 3.

### Safe configuration

Primary env files, names only, confirmed without printing values:

- `.env.development.local` (gitignored) sets `AUTH_STORE`, `LEAD_STORE`, and `MAILPIT_URL`. It does not set `DATABASE_URL`.
- `.env.local` (gitignored) does not set `DATABASE_URL`, `SENDGRID_API_KEY`, or `MAILPIT_URL`.
- `.env.example` documents `MAILPIT_URL=http://localhost:8025` and leaves `DATABASE_URL` commented out.

Do not pass `--env-file` at `.claude/worktrees/fix-e2e-green/.env.dev-branch.local`. That file's database host is hosted.

Keep these unset unless the host is `localhost` or `127.0.0.1`: `DATABASE_URL`, `TEST_DATABASE_URL`, `E2E_DATABASE_URL`, `PLAYWRIGHT_BASE_URL`, `SENDGRID_API_KEY`, `VERCEL_AUTOMATION_BYPASS_SECRET`.

`pnpm build` runs `db/migrate.ts`. With no `DATABASE_URL` the migrator prints that it has nothing to do. That is the safe local path. A hosted URL is not a local-review configuration.

Mailpit is already listening on `127.0.0.1:8025` (HTTP API). The app posts to `{MAILPIT_URL}/api/v1/send`. It does not use SMTP. If `SENDGRID_API_KEY` is set, SendGrid wins and Mailpit is not used.

`PATH`: put `/opt/homebrew/bin` first so `pnpm` is 12.x. `~/.grok/bin/pnpm` exits 127 on this machine.

`COMING_SOON` is unset locally, so the public site is visible. Production sets `COMING_SOON`. While that is true, a visitor with no session sees `/coming-soon` instead of `/preview`.

### Dev-mode review

`pnpm dev` is the Next.js dev server, default port 3000. It serves the working tree, hot-reloads, and uses the development auth ceiling in `lib/auth/config.ts`. It does not run the production build, the migrator, or Playwright.

```sh
export PATH="/opt/homebrew/bin:$PATH"
cd /Users/mmbp/Projects/code/realestate-handbook-v1
env -u DATABASE_URL -u SENDGRID_API_KEY -u E2E_DATABASE_URL -u PLAYWRIGHT_BASE_URL \
  pnpm dev
```

Open `http://localhost:3000`. Mailpit UI: `http://localhost:8025`.

### Production-build verification

This is what CI runs. Playwright builds, then `pnpm start -p 3187`, with file stores and Mailpit. Port 3187 must be free. This is slower and does not follow unsaved editor buffers unless they are saved in the tree Playwright builds.

```sh
export PATH="/opt/homebrew/bin:$PATH"
env -u DATABASE_URL -u TEST_DATABASE_URL -u E2E_DATABASE_URL \
  -u SENDGRID_API_KEY -u PLAYWRIGHT_BASE_URL \
  -u VERCEL_AUTOMATION_BYPASS_SECRET \
  pnpm typecheck && pnpm test && pnpm build
# port 3187 free, Mailpit on localhost:8025, then:
env -u DATABASE_URL -u TEST_DATABASE_URL -u E2E_DATABASE_URL \
  -u SENDGRID_API_KEY -u PLAYWRIGHT_BASE_URL \
  -u VERCEL_AUTOMATION_BYPASS_SECRET -u COACH_OFF_BASE_URL \
  pnpm e2e
```

On the primary checkout this verifies saved dirty files plus `HEAD`. It does not verify `origin/main`. On the Wave 1 worktree it verifies the combined branch. Lane 6 already ran this sequence on clean `2e02de74` only.

### Personas

Fixtures, not real inboxes (`e2e/auth.ts`):

- `reader@e2e.test` — shared Pro member, the default storage state.
- `preview@e2e.test` — signed in, no grant, free set only.
- `admin@e2e.test` — admin role, no grant. The role does not open chapters.
- Lead specs use `@example.com`. Auth specs use `@example.test`.

For a manual dev pass, use an address you can read in Mailpit. The file store creates the user on the first successful link.

### Critical-journey checklist

1. `/` loads, and the sample link goes to `/preview`.
2. `/preview` shows Chapter 1 and Chapter 7 in full, with the optional notes form after the sample. No email is required to read it.
3. `/handbook/ch2` with no cookie redirects to `/signup`. Chapters 1 and 7 inside `/handbook` still require the emailed link. Cover and the overview are part of the signed-in free set.
4. Request a link at `/signup` or `/signin`. Open it from Mailpit. The link works once. A second use shows the failure card.
5. `/account` shows the free-set plan. With the file store, profile editing says it needs the account database. Sessions and the typed delete form are on the page.
6. Handbook search, as the preview reader, does not return a paid chapter. A paid chapter shows the upsell, not the chapter body.
7. With `NEXT_PUBLIC_COACH_ENABLED` unset, plan and review are off. E2e turns the flag on at build time. Draft questions do not appear in a chapter check.
8. `/admin` as `reader@e2e.test` redirects. As `admin@e2e.test` it opens. Resync and resend stay unavailable until billing config exists.
9. `/pricing` has no live checkout button while `purchaseOpen()` is false.
10. A notes opt-in sends a confirmation via Mailpit. Confirming once subscribes. This is the lead list, not the sample gate.

## 7. Approval and release gates

1. **Local review of the current checkout (tree A).** Allowed now. Section 6. It does not wait on Waves 2 or 3. The owner says whether the checklist behaves on this tree. D-01 stays a recorded decision, not a code change.
2. **Implementation and local integration.** Waves 1–3, in other worktrees. No remote action. Stop on a red check. Wave 1 commands use the section 6 `env -u` prefixes.
3. **Local review of the integration branch (tree B).** After Wave 1 the owner can review billing plus #53. Sign-off of the sign-in and mobile journeys waits until Wave 2 is in that branch (L-01, L-02, L-04). Wave 3 is required before a database-backed deploy. It is not required to start either local review.
4. **Authorization to push for a Vercel preview.** Explicit, after gate 3's tree B review. This push does not update `main`. Pushing a branch or opening a pull request creates a Vercel preview. Preview currently shares the production database entry and holds SendGrid and billing secrets (P-01, P-02, P-03). Do not push until the preview database host is confirmed to be a non-production branch, or the runtime guard in P-01 is in the branch. Prefer a pull request so `ci.yml` runs. Re-run #53's failed Playwright install rather than treating that DNS failure as a product failure. S-03 and Wave 2 are in the pushed commit. Wave 3 is in it as well, unless the owner has a dated deferral that still includes S-03.
5. **Preview validation.** On the preview URL, after the database-host check: sample page, sign-in against Mailpit or a mailbox the owner chooses, paid chapter upsell, pricing with purchase closed, and a test-mode webhook only if the owner asks and the database is not production. `COMING_SOON` is not set on Preview, so the preview is the full site.
6. **Production approval.** The only gate that updates `main`. Separate from gate 4. A merge or push to `main` runs CI, GitHub Pages, the billing reconcile schedule, and a Vercel production deployment. `pnpm build` on Vercel runs migrations against that environment's `DATABASE_URL`. Production has `COMING_SOON` and no billing secrets, so the public site stays on the coming-soon page and the webhook stays closed. R-01 (which database) and Wave 3 are answered before that deploy. R-02 (postal address and notes mail) stays dark until the owner sets `LEAD_MAILING_ADDRESS`.

Historical sentences in `COMPLETION-PLAN.md` that say to merge or redeploy are context. They are not authorization for gates 4 or 6.

## 8. Decisions, assumptions, and unresolved evidence

- **Sample shape.** The code follows OD-01 and OD-11. The one-sentence brief in this audit is not implemented, and this plan does not implement it. `/preview` is the no-email, no-expiry look at Chapters 1 and 7, plus the recorded excerpts.
- **Database.** Hosting doc and the cleanup workflow describe the kept Neon project. The brief's fresh database is an open owner decision (R-01). Local review does not need either hosted database.
- **Dev means `next dev`.** The remote branch `next` is an ancestor of main.
- **`PROGRESS.md` "Where things stand" is stale** relative to pull requests #48 through #53. This plan does not rewrite it.
- **Lane 2's note that `c41cb8d` is docs-only is rejected.** That commit is the doc commit on top of three code commits. The coordinator compared blobs.
- **The dev rate ceiling (D-08) is intentional** for `next dev` on one shared IP. It is not a local-review blocker while SendGrid is unset.
- **Profile editing on the file store (L-07)** is the designed local message. It is not a broken page.
- **Suspension race (S-05)** is real for the Neon store. The local file store does not take that path. It is required before a database-backed deploy, and it is in Wave 3, not in the way of opening `/preview`.
- **Independent review, same day.** A fresh reviewer confirmed five defects in an earlier draft of this file. They are corrected here: tree A review is not waiting on Waves 2 and 3; copying the six dirty files onto billing is distinguished from a 3-way merge, which keeps billing; only section 7 gate 6 updates `main`; Wave 1's build and e2e unset `DATABASE_URL` and `SENDGRID_API_KEY`; Wave 3 ports hunks and does not copy the pre-billing `lib/offer.ts` or `lib/account/handler.ts`. The reviewer did not re-confirm the Lane 6 counts, the GitHub Actions conclusions, or the live Vercel env names.
- **Unresolved:** the actual hostname behind the shared Preview and Production `DATABASE_URL` (value not read). Whether `VERCEL_PROJECT_PRODUCTION_URL` matches the intended public origin. Whether q1109's amount and ICS hunks are still absent from current `lib/amount.ts` and `lib/ics.ts`. The line-by-line behavior of the security worktree beyond the three items in Wave 3. Neon integration tests (20 skipped). Pull request #53 e2e, which CI did not reach.

## 9. Definition of done

**Stable integrated main**, as a local candidate, not as a push:

- The integration branch contains `a2fe58f`, the #52 fraud mapping, the #53 tree (including the billing account panel), and Wave 2 (the sign-in fallback, the form-error redirects, and the #28 retry and `verify:` key).
- `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm e2e` exit 0 on that branch under the section 6 `env -u` safety gate, including the sign-in and mobile specs.
- A reviewer who did not author the merges has read the diff against `a2fe58f`.
- Wave 3's suspension and delete behavior is in the branch before a database-backed deploy. A dated deferral can leave it out of the first preview. A deferral does not apply to S-03.
- The primary checkout's uncommitted files are still present and uncommitted.
- No push, deploy, or migration has been run. Updating `origin/main` is gate 6 in section 7, not this definition.

**Local review readiness:**

- Tree A meets this bar without Waves 2 or 3 and without a push. Section 6's commands start it. The checklist has been walked in the browser, at a desktop width and at a phone width for the header, the sign-in form, and the handbook menu.
- Tree B meets this bar after Wave 1 for a billing-aware pass, and after Wave 2 before the sign-in journey is called signed off.
- The owner can tell tree A from tree B.
- Mail goes to Mailpit, and no command in the session had a hosted `DATABASE_URL` or `SENDGRID_API_KEY`.
- Known gaps are the ones in this plan (purchase closed, profile needs a database, coach flag, #53 e2e until Wave 1, CI DNS on the current #53 run, Wave 3 until a database deploy), not an unstated failure.

A running dev server by itself does not meet either definition.
