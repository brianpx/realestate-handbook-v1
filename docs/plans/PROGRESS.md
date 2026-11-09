# Progress: MASTER-PROMPT.md

The running status record for `docs/plans/MASTER-PROMPT.md`. The prompt says what to do and in what order; this file says what has actually happened. Every session reads it first and writes to it last.

## Rules for this file

- **Append, never rewrite history.** The step log and the decision log are append-only. Correct a mistake with a new entry that says what was wrong.
- **The status tables are the exception.** Update the milestone table and the "Where things stand" paragraph in place so the top of the file is always current.
- **Evidence, not claims.** A step is `done` only with a commit hash and the verification commands that were run with their results. "Should work" is not a result. If verification was blocked, say which command, what it printed and what remains unverified.
- **Names and counts, never values.** No environment variable values, connection strings, tokens, row contents or addresses.
- **Keep both files in step.** When a step lands: tick it in `MASTER-PROMPT.md`, then add the entry here. When a decision is answered: fill the Answer column in `MASTER-PROMPT.md` section 4, then log it here.
- One entry per logical change. Several commits may share one entry if they land one step.

Status values: `not started`, `in progress`, `blocked` (name the blocker), `done`.

## Where things stand

*Updated 8 November 2026, late.* M1 is done and on `origin/main` (`1ab140b`, CI green). M2 (sample and preview fixes) is merged to `main` and pushed (`1ce9f95`, CI run 42549247814 green), six code commits (`0268308` to `16ce981`) plus the docs commit: typecheck, 369 unit tests and the full e2e suite (234, including eight new `/preview` and sales-page tests) pass, and a fresh reviewer's one confirmed regression was fixed before the final run, and dark-mode contrast on `/handbook/ch7` and `/preview` was measured at 10:1 or better. Another session still has content-review Phase 2 work uncommitted in the main checkout (see M4 and the collision note); until it is committed, no other lane touches `content/`, `lib/sources.ts`, `lib/glossary.ts`, `lib/state/index.ts`, `components/widgets/LeadSources.tsx` or `e2e/parity/practice.spec.ts`. Next: M3 (needs the owner checklist at the top of M3) or, in the gaps, M6 items that do not touch the content session's files. The "Answer first" decisions in `MASTER-PROMPT.md` section 4 are unanswered apart from OD-24 (yes) and OD-26 (keep); M2 proceeded on the OD-01 and OD-28 defaults as the prompt allows.

## Milestone status

| Milestone | Status | Branch | Started | Finished | Notes |
|---|---|---|---|---|---|
| M0 Housekeeping | in progress | `docs/plans-master` (merged, deleted) | 2026-11-08 | | Steps 1 to 3 done; step 4 waits on the content session's commit; step 5 waits on OD-17 |
| M1 Green baseline | done | `fix/e2e-green`, `chore/ci` (both merged; `main` at `0ec1372`) | 2026-11-08 | 2026-11-08 | Steps 1 to 5 done; CI green on run 42546261513. Only `practice.spec.ts` (content session's file) still has `networkidle` waits and the stock import |
| M2 Sample and preview fixes | done | `fix/preview-sample` (merged, `main` at `1ce9f95`) | 2026-11-08 | 2026-11-08 | Steps 1 to 8 done; CR H2, H3, M6, M7, L11 to L16 closed; L25 started (`.chapter-body` scope) and finishes in M6 |
| M3 Vercel Pro migration | not started | none (no commits; result file after) | | | Owner checklist at the top of M3 must be complete first |
| M4 Content revision | in progress | content session's branch (Phase 2); Phase 1 not started | 2026-11-08 | | Phase 2 landing before Phase 1; Phase 0 decisions OD-03 to OD-09 unanswered |
| M5 Accounts, sign-in, gate | not started | `feat/auth-core`, `feat/access-gate`, `feat/signup-home` | | | Blocked on M3 for any hosted migration and on the sender (OD-23) for any real send |
| M6 Hardening and a11y | not started | several, see M6 | | | `lib/state/index.ts` and chapter HTML wait for the content commit |
| M7 Admin, billing, copy, profile | not started | `feat/admin`, `feat/billing`, `docs(site)/policies-copy`, `feat/profile` | | | Blocked on M5 and the billing provider choice |
| M8 Launch readiness | not started | | | | Blocked on M5 and M7 |

## Active collisions and in-flight work

| Files | Who has them | Since | Blocks | Clears when |
|---|---|---|---|---|
| `content/pages/{ch1,ch2,ch3,ch5,ch6,ch8,ch9,ch10,ch11,ch12,ch13,app-d,app-e}.html`, `content/data/{checkpoints,qualify}.ts`, `components/widgets/LeadSources.tsx`, `lib/{sources,glossary}.ts`, `lib/state/index.ts`, `lib/{checkpoints,sources-pipeline}.test.ts`, `e2e/parity/{checkpoints,practice}.spec.ts` | content session, uncommitted (M4 Phase 2 items 9c, 9d, 9e) | 2026-11-08 | M4 Phase 1, M6 steps 10 and 11, the `practice.spec.ts` follow-up (switch its import to `../fixtures` and drop its two `networkidle` waits) | the content branch is committed and merged; then run M4 step 1b |
| root `downloads/` (untracked) | nobody | 2026-11-08 | M0 step 5 | OD-17 is answered |

## Open blockers

| Blocker | Blocks | Owner action |
|---|---|---|
| OD-01, OD-03 to OD-09, OD-10, OD-11, OD-17, OD-23 (from-address and postal address) unanswered | M2 step 3 copy (default assumed), M4 Phase 0, M5 | Answer in `MASTER-PROMPT.md` section 4; log below |
| `meded` GitHub app access and Pro plan unconfirmed | M3 | Owner checklist at the top of M3 |
| Content Phase 2 branch uncommitted | M4 Phase 1, M6 steps 10 and 11 | Content session commits on its branch after typecheck, test and e2e |

## Decision log (append-only)

| Date | Decision | Answer | Logged by |
|---|---|---|---|
| 2026-11-08 | OD-26 keep `.next/dev/types/**` in `tsconfig.json` include | Keep. `next dev` re-adds both type globs (`node_modules/next/dist/lib/typescript/type-paths.js`, `writeConfigurationDefaults.js`), so removing the line only churns the file; `next typegen` writes `.next/types` only, so the stale `.next/dev/types` recovery note stays. Decided by the M1 session from the installed Next.js source, as M1 step 3 instructs; the owner may overrule | M1 session |
| 2026-11-08 | OD-24 add CI | Yes, said by the owner in the M1 session ("merge fix/e2e-green into main, push, and add CI") | M1 session |

## Step log (append-only)

| Date | Step | Branch | Commit(s) | Verification run and result | Notes, assumptions, unverified |
|---|---|---|---|---|---|
| 2026-11-08 | M0.1 docs reorganisation committed | `docs/plans-master` | `4450278` | n/a (docs only) | Twelve docs into `docs/_archive/`, plans gathered, master plan added |
| 2026-11-08 | M0.2 Preface line in free-sample decision | `docs/plans-master` | `4450278` | n/a | Preface belongs to the signed-in free set, not `/preview` |
| 2026-11-08 | M0.3 AGENTS.md project instructions committed | `docs/plans-master` | `7a650a1` | n/a | Managed Next.js block unchanged |
| 2026-11-08 | Plans moved to `docs/_archive/`; master plan the only file under `docs/plans/` | `docs/plans-master` | `d751dce`, `d706a3b` | n/a | Cross-references repointed; fast-forwarded into `main` and pushed |
| 2026-11-08 | `MASTER-PROMPT.md` written from an external critique; `master-plan.md` archived; this file created | `docs/master-prompt` | `6d63992` | n/a (docs only) | Revision log in `MASTER-PROMPT.md` section 12; fast-forwarded into `main` |
| 2026-11-08 | M1.1 calculator locators (CR-H1) | `fix/e2e-green` | `e5fb824` | `pnpm exec playwright test e2e/parity/calculators.spec.ts`: 14 passed | Worked in git worktree `.claude/worktrees/fix-e2e-green`, branched from `main` at `cc6b822`, so the content session's tree was untouched |
| 2026-11-08 | M1.2 hydration mark replaces networkidle (CR-H1, CR-L27) | `fix/e2e-green` | `1bc6acf` | `search.spec.ts --repeat-each 10`: 110 passed; `glossary-tools.spec.ts` and `settings.spec.ts`: 19 passed | New `components/shell/HydrationMark.tsx` (sets `<html data-hydrated="true">` after mount, rendered last in the product layout) and `e2e/hydration.ts` (`waitForHydration`). Not changed: `practice.spec.ts` (in the content session's uncommitted set) and `cutover-stub.spec.ts:43` (a negative wait on the static stub page, not a hydration proxy) |
| 2026-11-08 | M1.3 typecheck runs `next typegen` first (CR-M10); OD-26 decided | `fix/e2e-green` | `6f91612` | `pnpm typecheck` in the worktree, and in a clean `git archive` export after a fresh `pnpm install --frozen-lockfile`: both pass | `AGENTS.md` Commands carries the stale-dev-types recovery note; the managed Next.js block is untouched |
| 2026-11-08 | M1.5 routes doc comment (CR-L26) | `fix/e2e-green` | `23a9410` | n/a (comment only) | |
| 2026-11-08 | M1 verification at `23a9410` | `fix/e2e-green` | | `pnpm test`: 369 passed, 4 skipped; `pnpm e2e` three consecutive runs: 229 passed each, 0 failed | Run with `/opt/homebrew/bin` first on PATH because the Playwright webServer command calls `pnpm` and the first `pnpm` on PATH is the broken shim. Step 4 (CI) not started: OD-24 unanswered. Branch not merged or pushed |
| 2026-11-08 | M1 merged: `fix/e2e-green` fast-forwarded into `main` and pushed | `main` | `fd923c9` | n/a (fast-forward of verified commits) | Done with `git fetch . fix/e2e-green:main` because the main checkout was on another session's branch |
| 2026-11-08 | M1.4 CI workflow (CR-H1, OD-24) | `chore/ci` | `a3fdf42` | YAML parses (ruby `YAML.load_file`); `playwright test --list --reporter=line,html` accepted. Not yet run on GitHub: push rejected, token lacks `workflow` scope | `.github/workflows/ci.yml`: push to `main` and pull requests; Node 22, pnpm 12, `--frozen-lockfile`, typecheck, test, Chromium install, e2e; `.next/cache` cached; HTML report uploaded on failure. Local `main` is at `a3fdf42`, one ahead of origin |
| 2026-11-08 | CI pushed; first run red | `main` | `c6cfbdd` pushed after the owner added the `workflow` scope | Run 42545635454: typecheck and `pnpm test` passed; `pnpm e2e` 3 failed, 226 passed (`glossary-tools.spec.ts:50` popover measured before it rendered; `glossary-tools.spec.ts:114` data-goto click ran before hydration, so the link did a full reload and nothing was announced; `planning.spec.ts:40` date fill ran before hydration, so the controlled input reset) | All three are the CR-L27 race on a slower runner |
| 2026-11-08 | M1.2 follow-up: shared page fixture waits for hydration after every handbook `goto` | `chore/ci` | `0ec1372` | Local: `pnpm typecheck` pass; `pnpm e2e` 229 passed (one earlier local run caught the JavaScript-off case, fixed before commit). CI run 42546261513: 369 unit tests passed, 4 skipped; 229 e2e passed | `e2e/fixtures.ts` re-exports `@playwright/test` with a `page` fixture whose `goto` waits for the mark on `/handbook` paths when JavaScript is on; 22 specs import it; `practice.spec.ts` excluded (content session's file) |
| 2026-11-08 | M1 merged and green in CI | `main` | `0ec1372` on `origin/main` | CI run 42546261513 green | M1 exit criteria met |
| 2026-11-08 | M2.4 consent version is an enum (CR-M7) | `fix/preview-sample` | `0268308` | `pnpm test lib/leads`: 32 passed, 4 skipped (new `constructor` case) | `CONSENT_TEXTS` typed `Record<typeof CONSENT_VERSION, string>`; `!` removed in `handler.ts` |
| 2026-11-08 | M2.6 public live region (CR-L16) | `fix/preview-sample` | `d429eba` | covered by the `/preview` e2e (`#pageStatus` exists on public pages) | |
| 2026-11-08 | M2.1, 2.2, 2.3, 2.5 sample outline, typography scope, dark-mode tokens, copy (CR-H2, H3, M6, L11 to L15, OD-28 default) | `fix/preview-sample` | `034610f`, `d904584` | `e2e/site.spec.ts`: 29 passed, including the new outline test (rendered headings h1 → h2 → h3 → h4, no skips, no duplicate ids, section heading 21.6px) and the dark-mode token test; measured contrast with a Playwright script: ch7 interrupted node text 14.25:1, badge 10.62:1; `/preview` node 10.04:1, callout `.box.try-it p` 9.83:1 (`rgb(51,65,85)` on `rgb(236,253,245)`) | Excerpt demotes headings one level (regex, attributes kept) and throws without an h1; `BoxTitle` (new) lets six tool boxes follow the demotion through a React context; `.chapter-body` carries chapter typography and `.chapter-demoted` shifts it; `.chapter-section` stays on the article for `lib/scroll-anchor.ts` and the semantic-html spec. A slice with no heading of its own (the planner teaser) is not demoted so its box stays an h3 under the page h2. Not changed: the calculator footnote dialog's hidden h3 → h5 (pre-existing, both surfaces; the outline test counts rendered headings only) |
| 2026-11-08 | M2.7 Appendix E tool index on `/` and `/pricing` (FS) | `fix/preview-sample` | `3ab8dc8` | `e2e/site.spec.ts`: both pages open the details and list the Objection trainer; 20 rows | `components/site/ToolIndex.tsx` reads Table E.1 with the existing `pageTableRows`, so the sales pages cannot drift from Appendix E |
| 2026-11-08 | M2.8 FS status check | `fix/preview-sample` | n/a | `site.spec.ts` still asserts both chapters (as h2), both checkpoint boxes, both quizzes, the pitfall cycle and the self-score | |
| 2026-11-08 | M2 verification at `d904584` | `fix/preview-sample` | | `pnpm typecheck` pass; `pnpm test` 369 passed, 4 skipped; `pnpm e2e` 233 passed (full run at `3ab8dc8`; `site.spec.ts` re-run at `d904584`) | A fresh reviewer agent read the diff; its findings and the fixes are the next entry |
| 2026-11-08 | M2 review fixes | `fix/preview-sample` | `16ce981` | `pnpm typecheck` pass; `pnpm e2e` 234 passed (full run at `16ce981`, with the new paragraph-rule regression test on `/handbook/ch1` and `/preview`) | Reviewer found, Confirmed: `p, .chapter-body p` (0,1,1) beat every single-class paragraph rule in the handbook (`.calc-note`, `.part-intro`, `.footnote`, …); fixed by restoring the bare `p` rule and excluding chapter text from the public rule with `.pub :where(p:not(.chapter-body *))`. Plausible, fixed: tool-index phone CSS hid the header row with `display: none` and `tr { display: grid }` dropped table roles; the header is now clipped and the markup carries explicit table roles. Plausible, fixed: demotion now keys on an h1 or h2 in the slice, not an h3. Declined: `.pub-sample > :first-child` was already inert before M2 (segments are `display: contents` wrappers), so no change |
| 2026-11-08 | M2 merged: `fix/preview-sample` fast-forwarded into `main` and pushed | `main` | `1ce9f95` | CI run 42549247814 green (typecheck, unit tests, 234 e2e) | |

## Session hand-off notes (append-only)

One short paragraph per session: what it did, what it left unverified, what the next session should start with.

- **2026-11-08, planning session.** Wrote the master plan from the five source plans, revised it into `MASTER-PROMPT.md` after a critique, archived the originals, created this file. All of it is committed and merged to `main` (`6d63992`), not yet pushed. Nothing engineering-side was run. Next session: push `main` if the owner wants, then start M1 on `fix/e2e-green`.
- **2026-11-08, M1 session.** Landed M1 steps 1, 2, 3 and 5 on `fix/e2e-green` in a git worktree (`.claude/worktrees/fix-e2e-green`): four code commits plus this docs commit. Typecheck, unit tests and three full e2e runs are green (step log). Not done: step 4 (CI) pending OD-24; two `networkidle` waits in `practice.spec.ts` left until the content session commits; `cutover-stub.spec.ts:43` kept on purpose. The branch is not merged into `main` or pushed; the owner decides. Next session: merge `fix/e2e-green` if approved, then start M2 on `fix/preview-sample` from the merged `main`, verifying against the now-green suite.
- **2026-11-08, M1 session, continued.** Owner approved merge, push and CI. `fix/e2e-green` is merged to `main` and pushed (`fd923c9`). CI workflow committed on `chore/ci` (`a3fdf42`) and fast-forwarded into local `main`; the push failed on the token's missing `workflow` scope. Next: owner runs `gh auth refresh -h github.com -s workflow`; then push `main`, watch the first run with `gh run watch`, and log its result here. After that, M2 on `fix/preview-sample`.
- **2026-11-08, M1 session, close.** M1 is done: `main` is at `0ec1372` on origin with CI green. Lessons for later lanes: every spec should import `test` and `expect` from `e2e/fixtures.ts`, not `@playwright/test`, so `page.goto` on a handbook page waits for hydration; public pages have no mark, so a public-page spec that needs React must assert on something rendered client-side first. Next session: M2 on `fix/preview-sample` from `main`; and once the content session commits, switch `practice.spec.ts` to the fixture.
- **2026-11-08, M2 session.** M2 landed on `fix/preview-sample` (worktree `.claude/worktrees/fix-e2e-green`), unmerged: the sample has one heading outline and the handbook's typography, dark mode is legible, the consent check is an enum, the public layout has a live region, and the Appendix E tool index is on the sales pages. Verified by typecheck, unit tests, the full e2e suite and measured contrast. Not done here: the calculator footnote dialog's h3 → h5 skip (pre-existing, outside M2; a candidate for M6 step 11); the four tool boxes not in the sample (`PostCloseCard`, `ResponseTimer`, `QualifyCard`, `FairHousingDrill`) still render a plain h3, which is correct in the handbook and only matters if they ever join the sample. Merged and pushed the same evening with CI green. Next session: M3 when the owner checklist is complete, or M6 items that avoid the content session's files.
