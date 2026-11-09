# Master prompt: realestate-handbook-v1

Written 8 November 2026 from five planning documents (now in `docs/_archive/`; this file and its progress record `PROGRESS.md` are the only files kept under `docs/plans/`), from `AGENTS.md`, and from the repository at commit `6652f83` plus three kinds of uncommitted work: the staged move of older docs into `docs/_archive/`, the project-instructions half of `AGENTS.md` (only the managed Next.js block is committed), and content edits in progress by another session that already execute part of the content review (listed under M4, "Status at 8 November"). Revised the same day after an external critique; section 12 lists what changed and what was declined. This file replaced `master-plan.md`, the first version, now archived at `docs/_archive/master-plan.md`. Nothing in this document changes what the source plans decided. It decides **order, ownership, dependencies, and which overlapping steps are done once**, and it carries every step from the source plans so a session can work from this file alone and open a source plan only for verbatim detail (SQL column lists, command transcripts, finding evidence).

Source plans, all under `docs/_archive/`, and the tags used to cite them:

| Tag | Document | What it is |
|---|---|---|
| **CR** | `2026-11-08-code-review.md` | Six-reviewer code review at `699d62a`: 3 High, 12 Medium, 27 Low findings, optional improvements, remediation order, open questions |
| **CC** | `2026-11-08-course-content-review.md` | Content review of preface, Chapters 1 to 13 and Appendices A to F: Decisions A to H, Phases 0 to 4, findings §1 to §7, verification list |
| **FS** | `free-sample-decision.md` | What is free (Chapter 1 and Chapter 7 in full on `/preview`), no time limit, no email to read; three open owner decisions |
| **UD** | `user-database-plan.md` | Users, magic-link sign-in, grants, entitlement, enforcement, billing mirror, admin, privacy, Phases 0 to 7, D1 to D16 |
| **VM** | `vercel-pro-migration-meded.md` | Agent prompt to move the Vercel project from `brianpxs-projects` (Hobby) to team `meded` (Pro) with a new Neon resource, steps 0 to 7 |

Citations look like `[CR-H1]` (finding), `[CC-§2]` (section), `[CC-A]` (decision), `[FS-D3]` (decision), `[UD-§9]`, `[UD-P2]` (phase), `[UD-D9]` (decision), `[VM-4.5]` (step and sub-step).

## How to use this document

- Work top to bottom through **section 6 (milestones)**. Each milestone lists preconditions, steps with source tags and files, verification, and exit criteria.
- **Section 4 (decision register)** is the only list of owner decisions. When the owner answers, record the answer there with the date, then tick the steps it unblocks.
- **Section 7 (file collision map)** says which files more than one workstream edits. Partition agents by it so no two agents touch the same file (AGENTS.md, Parallelism).
- **Progress lives in `docs/plans/PROGRESS.md`.** Read it before starting (its "Where things stand" paragraph, milestone table, active collisions and open blockers are the current state). When a step lands, tick it here, then append a step-log entry there with the commit hash and the verification commands and results. When a decision is answered, fill the Answer column in section 4, then append to the decision log there. End every session with a hand-off note there.
- This file does not replace the Vercel migration prompt. For that work, hand `docs/_archive/vercel-pro-migration-meded.md` to the session verbatim; section 6, milestone M3 says when and what must be true first.

## Session briefing (read before anything else)

Do not paste this whole file into one agent context. Slice it by milestone. For milestone Mx a session reads, in this order:

0. `docs/plans/PROGRESS.md`: where things stand, the milestone table, active collisions, open blockers, and the last hand-off note.
1. Section 3 (working rules) in full.
2. Section 4: the "Answer first" paragraph and the rows whose Blocks column names Mx.
3. Section 7: the "Active collisions" callout and the rows that name Mx.
4. The Mx section itself, including preconditions and exit criteria.
5. Section 9 (stop rules and rollback).

Open a source plan in `docs/_archive/` only for the tagged items the Mx steps cite (`[CR-H1]` is the H1 entry in the code review, `[UD-§9]` is section 9 of the user-database plan), never the whole document. M3 is the exception: hand that session `docs/_archive/vercel-pro-migration-meded.md` verbatim as well.

Briefing template:

> You are working milestone Mx of `docs/plans/MASTER-PROMPT.md` on branch `<name>`. First read `docs/plans/PROGRESS.md` in full. Then read sections 3, 4 (the Answer-first paragraph and the Mx rows), 7 (the callout and the Mx rows), the Mx section, and section 9 of the prompt. Work only the steps listed for Mx. Open `docs/_archive/<plan>.md` only for the tagged items those steps cite. Before editing, run `git status` and confirm none of your files appear in the active-collision list in `PROGRESS.md` or are modified by another session. Stop at every point section 3.4 names. Report per section 3.3. When a step lands, tick it in this file and append the step-log entry to `PROGRESS.md` (commit hash, verification commands and results, anything unverified). Before you stop, update the milestone table and "Where things stand" in `PROGRESS.md` and append a hand-off note.

## 1. The five plans in one sentence each

1. **CR**: the code is sound (no `any`, no vulnerabilities, validation at every boundary) but the e2e suite has been red since `581fff3`, two dark-mode contrast failures sit on the sales sample, the product has no access control, and quiz and mobile-menu keyboard behaviour fails WCAG.
2. **CC**: the chapters mostly landed the October review, but shared rules (consent, speed-to-lead, post-close timing, scorecard thresholds, reading order) are stated several ways, assessments contradict text in six places, and coach coverage spans four of thirteen chapters.
3. **FS**: Chapter 1 and Chapter 7 are the free sample, in full, with every tool working, unlimited, and with no email required; the "first four chapters for an email" page was removed; the post-sample email offer and the first-visit form are open.
4. **UD**: one `users` table, passwordless magic link on the existing lead-pipeline stack, grants-derived membership, read-time entitlement, `proxy.ts` plus a data-access layer as the gate, a billing mirror for a one-time purchase, an audited admin surface, and seven implementation phases.
5. **VM**: transfer the Vercel project to the Pro team `meded` with zero downtime, provision a new Neon resource there with per-environment branches, scope and mark every environment variable, release local then preview then production, set a $10 alert and $20 limit, retire the old resource, write a result file.

## 2. Duplicated or conflicting effort, and the single resolution

| # | The same work appears in | Conflict or duplication | Resolution in this plan |
|---|---|---|---|
| 1 | FS-D1, UD-D1, CC-A, CC-B, CR-L15 | Which pages are free. FS table includes the Preface; FS status and `/preview` carry only Chapters 1 and 7; UD sets `FREE_PAGE_IDS = cover, pref, ch1, ch7`; CC requires the free set to be self-contained and to carry the "before your first outreach" safeguards | Two distinct surfaces with one decision (OD-01): the anonymous `/preview` sample is Chapter 1 and Chapter 7 plus the two teasers; the signed-in free set inside `/handbook` is `cover, pref, ch1, ch7` (the preface carries the reading plan and legend a reader needs to navigate). CC's self-containment and safeguards check runs once in M4 against both surfaces. `FREE_PAGE_IDS` is a code constant, so a later change is one line |
| 2 | CR-M1, UD-§3, UD-§9, launch-handoff blocker 1 | The access gate. CR sketches a signed access cookie read in `proxy.ts`; UD rejects a signed-claims cookie (stale revocation, second crypto scheme) in favour of a random session id, hash in a `sessions` table, cookie-shape check in proxy and the real check in a data-access layer | **UD's design wins.** CR-M1 is closed by UD Phases 1 and 2 and is not a separate task. CR's one addition that UD lacks, "keep `/preview` on an explicit allowlist", is already satisfied because the proxy matcher never includes `/preview` |
| 3 | FS-D3, UD-§3.3, UD-P0, UD-P6, VM-5, CR-L5 | The transactional sender. FS needs a from-address and postal address for the post-sample offer; UD makes SPF and DKIM verification a Phase 0 launch blocker; VM recreates the SendGrid variables; CR-L5 wants the privacy placeholders, unsubscribe recording and retention set before any send | One task, **"Email sender ready"** (M5 step 1), owned by the accounts workstream, executed after VM so the variables land on the `meded` project only. No real send of any kind (welcome, sign-in link, ready email) before it passes |
| 4 | FS-D3, UD-P6, CR-L5 | Rewrite the welcome email ("The book stays free to read" is no longer true) | Done once in M5 step 1, with the sender work, not in Phase 6 |
| 5 | FS-D3, UD-§2, UD-D14 | The post-sample optional email form; confirmed opt-in; a new `source` value on the lead handler | One form, built in UD Phase 3 as the marketing opt-in with `source` values, using confirmed opt-in. FS's two candidate offers become one owner choice (OD-02) that only changes copy |
| 6 | FS open decision 3, UD-D10, CR-L22 | The first-visit `Gate.tsx` dialog: what it is for once the handbook is paid; its ARIA gaps | Retire the dialog for signed-in readers in UD Phase 2 (UD-D10). Fix CR-L22 only if the dialog survives for anonymous visitors to free pages; otherwise L22 closes with the retirement |
| 7 | UD-§1, UD-P3, UD-D15, FS status, CR baseline | UD says the `/signup` page and `SignupForm.tsx` are preserved uncommitted work to edit; `699d62a` deleted them | UD Phase 3 **recreates** `/signup` and `SignupForm.tsx` rather than editing them. UD-D15 (hold the sitemap entry) applies at that point. Status 8 November: no uncommitted copy of either file exists in the tree (`GET /signup` returned 404 in CR's verification). If one appears from another session later, preserve or rebase it; never discard it |
| 8 | VM-4, VM-5, VM-7 note, UD-§12.5, UD-P0, UD-P5, CR-L3 | Environment variables and the database. UD's new variables (`AUTH_IP_SALT`, `ADMIN_BOOTSTRAP_EMAILS`, `BILLING_*`, `CRON_SECRET`) and migrations `002+` must go only on the new `meded` Neon resource; UD notes previews share production today; CR-L3 says `LEAD_STORE=file` beats `DATABASE_URL` in production | **VM runs before any UD migration touches a hosted database.** UD Phase 1 code is developed against the Memory and File stores and a Neon branch of the new resource; nothing is applied to a production branch until VM's done-when list is met. CR-L3 is fixed in M6 so the production store selection cannot silently pick the file store. Status 8 November: VM has not run; previews still share the production `DATABASE_URL`, so no UD migration may be applied anywhere yet |
| 9 | UD-§10.5, VM facts | UD says "Vercel Hobby allows daily cron only" and adds `vercel.json` crons; VM notes no `vercel.json` or `vercel.ts` exists today | After VM the team is on Pro, so the daily-only constraint is gone (daily is still enough). The cron file is introduced in UD Phase 5 only, as the one deployment-config change that phase is allowed (AGENTS.md Boundaries). Use whichever of `vercel.json` or `vercel.ts` the current Vercel docs recommend at that time |
| 10 | CR-L15, FS status, CC-C, UD-P5, UD-P6 | Public copy on `/pricing`, `/refunds`, `/about`, `/`, `/preview`, FAQ, footer, Terms: stale sample description (CR), Keller Williams Command positioning (CC-C), "no accounts" sentences and billing copy (UD) | Three copy passes at three different times, each with one owner and no concurrent editor of those files: M2 (CR-L15 four lines), M4 (CC-C once OD-05 is answered), M7 (UD Phases 5 and 6). Section 7 lists the files |
| 11 | CR-L14, CC-Phase 4 | If Chapter 1 or 7 questions gain concept tags, `/preview` would switch to `CoachCheck` and write coach attempts for anonymous visitors | Fix CR-L14 (register plain `KnowledgeCheck` for the sample) in M2, **before** CC Phase 4 authors questions for Chapters 1 and 7 |
| 12 | CR-H1, UD-P1..P7 ("each phase ends with e2e green"), VM-6b | Every later plan assumes `pnpm e2e` is a usable signal; it exits 1 on every run today | M1 makes e2e green first. Nothing in M2 onward is "done" against a red suite |
| 13 | CR-M10, AGENTS.md Commands | `pnpm typecheck` depends on generated `.next/types`; AGENTS.md tells every session to run it | Change the script to `next typegen && tsc --noEmit` in M1 and record the recovery (`rm -rf .next/dev/types` or restart `next dev`) in AGENTS.md. Status 8 November: the script is still bare `tsc --noEmit` |
| 14 | CR-L5, UD-§12.3, UD-P6 | The privacy page: four `Decision` placeholders and no contact (CR); cookie disclosure and an accounts section (UD) | One edit in M7 (UD Phase 6) that does both; `POLICY_STATUS.privacy` stays `draft` until the owner approves so the draft-label e2e keeps passing |
| 15 | CR-M2, CC-§5, UD-P2 | `QuestionItem` is shared by chapter checks, `CoachCheck` and `/handbook/review`; CR changes its commit behaviour; CC adds questions; UD gates the pages | Fix CR-M2 in M6 before CC Phase 4 adds content that depends on the quiz UI, and before UD Phase 2 e2e tests seed sessions to reach those pages |
| 16 | CR open question 2, VM | CR-L2's severity depends on Vercel overwriting `x-forwarded-for` | Resolved: the host is Vercel (VM). L2 stays Low; the global send ceiling is added in M8 before lead capture goes live |
| 17 | CR open question 5, AGENTS.md Boundaries | CI would have caught H1, but adding it is a new build tool and a CI config change | One owner decision (OD-24). If yes, it is its own task in M1 with its own branch. Status 8 November: no `.github/` directory exists |
| 18 | CC cross-plan notes, UD-§13 | Both say "do not start coach Phase 4 until both plans' content rules are stable" | Encoded as a hard precondition on M4 step 9 |

## 3. Working rules for every milestone (AGENTS.md applied)

These rules come from `AGENTS.md`, the user-level `CLAUDE.md`, and the ground rules inside VM. They apply to every step below. A session that cannot follow one of them stops and says which. As of 8 November the "Project instructions" section of `AGENTS.md` exists only in the working tree; M0 step 3 commits it so every later session and subagent sees the same rules.

### 3.1 Before writing code

- Read the matching guide under `node_modules/next/dist/docs/` **before** writing any Next.js code; this Next.js has breaking changes against training data. Guides this plan's work needs, by workstream:
  - Gate and sessions: `01-app/03-api-reference/03-file-conventions/proxy.md`, `01-app/01-getting-started/16-proxy.md`, `01-app/02-guides/authentication.md`, `01-app/03-api-reference/04-functions/cookies.md`, `headers.md`, `redirect.md`, `generate-static-params.md`, `01-app/03-api-reference/03-file-conventions/02-route-segment-config/`.
  - Route handlers (auth, account, admin, billing webhook, cron, gated media): `01-app/03-api-reference/03-file-conventions/route.md`, `public-folder.md`.
  - Typecheck script: `01-app/03-api-reference/06-cli/next.md` (the `next typegen` section).
  - Security headers and CSP: `01-app/03-api-reference/05-config/01-next-config-js/headers.md`, `01-app/02-guides/content-security-policy.md`.
  - 404 and error pages: `01-app/03-api-reference/03-file-conventions/not-found.md`, `error.md`.
  - Robots and sitemap changes: `01-app/03-api-reference/03-file-conventions/01-metadata/robots.md`, `sitemap.md`.
  - Testing and CI: `01-app/02-guides/testing/`, `01-app/02-guides/ci-build-caching.md`, `01-app/02-guides/environment-variables.md`, `01-app/02-guides/production-checklist.md`.
- Re-read the relevant guide at the start of each session and whenever the `next` version in `package.json` has changed since it was last read. The guides ship with the installed version and move with it.
- Heed deprecation notices. `middleware.ts` is deprecated in favour of `proxy.ts`. `forbidden()` and `unauthorized()` need an experimental flag and are not used (UD-§9).
- Never introduce Pages Router patterns. Server Components by default; `"use client"` only for interactivity, browser APIs or local state, pushed to the leaf.
- Keep the managed Next.js block at the top of `AGENTS.md` exactly as written and commit it with the work.
- Package manager is `pnpm` at `/opt/homebrew/bin/pnpm` (the `pnpm` first on PATH is a broken shim). Never create a second lockfile. Ask before adding a dependency or changing the lockfile (the `happy-dom` bump, OD-27, is such a change).

### 3.2 Branching and commits

- Check `git status` and the branch before editing. Preserve uncommitted work; never discard it to resolve a conflict.
- Never work on `main`. One branch per milestone step or per lane: `docs/<slug>`, `fix/<slug>`, `feat/<slug>`, `chore/<slug>`. Suggested names are given in section 6.
- Small atomic commits; the tree builds and tests pass at each. Conventional Commits, imperative subject of at most 72 characters, body says why, scoped prefix as the repo uses (`fix(e2e): …`, `feat(auth): …`, `docs(plans): …`).
- Stage explicitly. Never `git add -A` or `git add .`.
- Never force-push, rewrite shared history, amend pushed commits, or run `reset --hard`, `clean -fd` or `checkout -- .` without explicit authorization.
- Commit, push or open a PR only when asked or already authorized for that scope. PR body: what, why, how verified, what is unverified.

### 3.3 Verification and the definition of done

- Use the repo's scripts and pinned versions: `pnpm typecheck`, `pnpm test` (single file: `pnpm test <path>`), `pnpm e2e` (`PLAYWRIGHT_BASE_URL` and `VERCEL_AUTOMATION_BYPASS_SECRET` for a deployment). There is no lint or format script. Never substitute global tools.
- After any code change run typecheck plus the tests for what was touched; before declaring a milestone step done run the full three. Fix failures caused by the change before reporting.
- Bug fixes get a focused regression test when practical (CR names the test for most findings). Never weaken an assertion, skip a test, or run `--update-snapshots` or any `--fix` to get green.
- `lib/leads/neon-store.integration.test.ts` and the UD integration tests run only with `TEST_DATABASE_URL` set to a **Neon branch**, never production.
- If `pnpm typecheck` or `next build` fails on a stale `.next/dev/types` validator that references a deleted route, restart `next dev` or remove `.next/dev/types`, re-run, and say so in the report. M1 step 3 removes the root cause.
- Review the final diff for accidental edits, secrets, debug output and unrelated formatting. No placeholders, `TODO` in place of code, dead code or commented-out blocks. Strict typing: no `any`, no unchecked casts, no `@ts-ignore` or `eslint-disable` without a one-line justification beside it.
- **Done means:** implemented; typecheck, tests and e2e pass or the exact failure is reported; the diff is clean; the final report lists files changed, verification commands with results, assumptions, and blockers, with completed work separated from anything unverified.

### 3.4 Autonomy and stop points

- Carry a step through implementation, verification and a final report. Don't stop at a plan or ask whether to continue. Look in the repo, docs and tools before asking. Authorization given once continues for that scope.
- **Never infer authorization** for destructive actions, publishing, sending messages or spending money. That covers, concretely: the Vercel project transfer, any Production environment variable change, deleting or disconnecting a Neon resource, any write to a hosted database (including applying a migration), enabling deployment-pausing on the spend limit, buying or changing a plan, any real email send, flipping `purchaseOpen()` to true, pushing to `main`, and adding CI. Finish all useful preparation, then ask one concise question, and keep working on independent parts while waiting.
- Do not modify CI, deployment or infrastructure config unless that is the task (M3 and the cron file in M7 are such tasks). Do not touch `.vscode/`, `.idea/` or shell config.
- Never print environment variable values, connection strings, tokens or row contents. Names, environments and counts only.
- Stay inside the ask. Mention an adjacent problem in one line; don't fix it unbidden. Note refactor opportunities in the report.

### 3.5 Parallel work and subagents

- Before large work, split into independent units that share no files or state and spawn them in one batch. Section 6 marks the lanes that may run concurrently; section 7 is the file collision map they must respect.
- Use read-only explore agents for codebase sweeps; return conclusions, not file dumps.
- Every subagent gets a self-contained brief: goal, files and docs to read, what is already ruled out, exact output expected.
- Editing subagents use worktree isolation. Partition so no two agents edit the same file.
- Treat subagent output as a claim to verify. The final review of a milestone is done by a fresh agent that did not write the code.
- Don't spawn an agent for a handful of tool calls or a lookup whose target is known.

### 3.6 Communication and the progress record

- Progress updates brief and non-blocking. Final report: what changed, how verified (commands and results), assumptions, blockers. Separate completed from unverified. Record material assumptions in the report and, if they are decisions, in section 4.
- `docs/plans/PROGRESS.md` is the durable version of that report. A session is not finished until it has: appended a step-log entry for each step it landed (hash, commands, results, unverified items); updated the milestone table row and the "Where things stand" paragraph; updated the active-collisions and open-blockers tables if they changed; appended a hand-off note saying what the next session should start with. Its rules (append-only logs, evidence not claims, names not values) are at the top of that file.

## 4. Decision register (owner)

One list. Recommended defaults come from the source plans. "Blocks" names the first milestone step that cannot finish without the answer. Record answers in the Answer column with the date.

**Answer first.** M1, M2 (on the OD-01 and OD-28 defaults) and M3 need no decision and start now. Everything after them is gated by a small set, so answer these before anything else: OD-01 (free set), OD-03 to OD-09 (content Phase 0; OD-09, the canonical phrasing, is the blocking one), OD-10 and OD-11 (auth approach and the gate), OD-17 (member media and the root `downloads/` folder), the from-address and postal address inside OD-23, and OD-24 (CI, so M1 can add it in the same pass). The remaining rows carry defaults the work proceeds on and are confirmed later; a late answer there changes copy or a constant, not architecture.

| ID | Decision | Source | Recommended default | Blocks | Answer |
|---|---|---|---|---|---|
| OD-01 | The free set. Confirm `/preview` = Chapter 1 and Chapter 7 in full plus the two teasers, and the signed-in free set `FREE_PAGE_IDS = cover, pref, ch1, ch7` | FS-D1, FS open 1, UD-D1, CR-L15 | Yes to both as stated | M2 step 3 (copy), M5 UD-P2 | Yes to both (owner, 8 Nov 2026, M5 session) |
| OD-02 | Post-sample email offer wording: "Tell me when purchase opens" or "Email me my daily number and the Chapter 1 card" | FS-D3, FS open 2 | Purchase notice while `purchaseOpen()` is false; switch copy when it opens | M5 UD-P3 | Purchase notice ("Tell me when purchase opens") while `purchaseOpen()` is false; the copy switches to the daily-number offer when it opens (owner, 9 Nov 2026, M5 Phase 3 brief). Both texts live in `OPT_IN_OFFER`, `lib/leads/config.ts`; the email that would carry the number is not built |
| OD-03 | Reading plan order vs. book order; add a quick start | CC-A | Plan follows book order; `content/data/plan.ts` updated; short self-contained quick start | M4 Phase 0 | |
| OD-04 | Early safeguards: minimum "before your first outreach" checklist in the quick start | CC-B | Yes; Chapter 11 stays the full treatment | M4 Phase 0 | |
| OD-05 | CRM positioning: vendor-neutral with labelled optional Keller Williams Command examples, or an explicitly Command-oriented edition | CC-C | Vendor-neutral with labelled examples | M4 Phase 1 copy pass | |
| OD-06 | Jurisdiction: California-first or national; label Appendix F accordingly | CC-D | Owner's call; label either way | M4 Phase 1 | |
| OD-07 | Post-close plan timing: when the template is created, personalised, activated | CC-E | State the three moments once in Chapter 4 and apply everywhere | M4 Phase 1 | |
| OD-08 | Table 5.1's four undetailed plans: drop or give each a sequence in Appendix B | CC-F | Give Monthly Neighborhood Nurture and the two Long-Term Nurtures a short sequence; point Home Anniversary at Table 10.1 | M4 Phase 2 | |
| OD-09 | Canonical phrasing sign-off for the consent rule, speed-to-lead and the 9 p.m. test, and the post-close milestone; name one canonical-phrasing owner | CC-G, CC-H, CC Phase 0 | Owner signs the exact sentences once; they go into `content/data/rules.ts` | M4 Phase 0 (blocking) | |
| OD-10 | Build the magic link here or adopt Neon Auth | UD-D2 | Build here | M5 UD-P1 | Build here (owner, 8 Nov 2026, M5 session) |
| OD-11 | Gate all of `/handbook` behind sign-in; `/preview` stays anonymous | UD-D3, CR open 1 | Yes | M5 UD-P2 | Yes (owner, 8 Nov 2026, M5 session) |
| OD-12 | Session length and cap | UD-D4 | 90 days sliding, one-year cap | M5 UD-P1 | |
| OD-13 | Admin role never grants content; bootstrap inserts an owner grant | UD-D5 | Yes | M5 UD-P2 | Default applied, M5 Phase 2 (9 Nov 2026): role ignored by `entitlement()`; bootstrap inserts a complimentary Pro grant. Owner may overrule |
| OD-14 | One-time edition-scoped purchase first | UD-D6 | Yes | M7 UD-P5 | |
| OD-15 | Grace after failed payment (subscriptions only) | UD-D7 | 7 days | M7 UD-P5 (only if recurring) | |
| OD-16 | Refund window | UD-D8 | 14 days, no usage condition | M7 UD-P5 copy | |
| OD-17 | Are `public/downloads` and `public/audio` member-only? Also: what is the untracked root `downloads/` folder (a PDF, `audio/`, `downloads/`, `images/`) for, and should it be committed, ignored or moved | UD-D9 (Phase 0 **launch blocker**), repo state | If member-only, a viewer-checked `app/api/media/[...path]/route.ts` in UD-P2. Root `downloads/` should not stay untracked | M5 UD-P2; M0 step 4 | Member-only: both move behind the viewer-checked media route in UD-P2 (owner, 8 Nov 2026, M5 session). Fate of the root `downloads/` folder still to decide |
| OD-18 | Retire the first-visit `Gate.tsx` dialog for signed-in readers | UD-D10, FS open 3 | Yes | M5 UD-P2 | Yes (owner, 8 Nov 2026, M5 session) |
| OD-19 | Billing record retention after account deletion | UD-D11 | 7 years, anonymised; confirm with an accountant | M7 UD-P5 | |
| OD-20 | What "updates" covers; is a future edition sold separately | UD-D12 | Corrections included; one `product_key` for edition 1.0 | M7 UD-P5 copy | |
| OD-21 | Delete-account confirmation | UD-D13 | Typed email, no re-authentication in v1 | M5 UD-P2 | Default applied, M5 Phase 2 (9 Nov 2026): typed email on `/account`, no re-authentication. Owner may overrule |
| OD-22 | Marketing opt-in on the sign-in form | UD-D14 | Separate optional checkbox through `/api/lead`, confirmed opt-in | M5 UD-P3 | Yes: a separate optional checkbox, unchecked by default, posting through `/api/lead` with its own `source`, confirmed opt-in (owner, 9 Nov 2026, M5 Phase 3 brief) |
| OD-23 | Owner inputs: transactional from-address on a domain the owner controls (SPF and DKIM verified), postal address, support email, price, checkout URL, access and update terms, approval of privacy, terms, refunds and updates policies, billing provider | UD-D16, UD-§3.3, FS-D3, launch-handoff blockers 2 to 5 | From-address and postal address first (they block M5); the rest before M7 | M5 step 1; M7; M8 | Sender domain not set up as of 9 Nov 2026; Phase 3 keeps the existing transport (`deliver()`, Mailpit locally) with no sender config change (owner, M5 Phase 3 brief). From-address, postal address and the rest still owed |
| OD-24 | Add CI (a workflow running typecheck, test, e2e on Node 22 with `playwright install --with-deps chromium`) | CR-H1, CR open 5 | Yes | M1 step 4 | Yes (owner, 8 Nov 2026). `.github/workflows/ci.yml` on `chore/ci`, `a3fdf42` |
| OD-25 | Remove `legacy/` and rename the `parity/` specs | CR open 3 | Remove `legacy/` once no spec references it; rename later | M6 (optional) | |
| OD-26 | Keep `.next/dev/types/**` in `tsconfig.json` include | CR open 4, CR-M10 | Check the Next 16 docs; the line is generator-written and may be re-added | M1 step 2 | Keep (8 Nov 2026). `next dev` re-adds both globs through `writeConfigurationDefaults` (`lib/typescript/type-paths.js`), so removing it only churns `tsconfig.json`; `next typegen` writes `.next/types` only, so the stale `.next/dev/types` recovery note in `AGENTS.md` stays |
| OD-27 | Bump `happy-dom` to ≥ 21.0.4 (lockfile change) | CR-L4 | Yes, when convenient | M6 | |
| OD-28 | Public site dark mode follows the OS or the handbook setting with no toggle: intentional? | CR open 6 | Keep, but stop handbook-only state (`hide-quizzes`) reaching public pages (CR-L13) | M2 step 3 | |
| OD-29 | Spend Management on `meded`: enable "pause production deployments when the limit is reached" (the live site goes down at $20 of usage) | VM Decision 5 | Leave off (notify only) unless the owner says yes after the warning | M3 step 2 | |
| OD-30 | Reviewer for coach questions: someone who has worked as an agent, to clear `draft` on new items | CC-§5, CC Phase 4 | Owner names the reviewer | M4 step 9 | |
| OD-31 | Tiers: the free set, Basic and Pro, each paid tier a one-time purchase; Phase 2's access_grants gains a tier and entitlement() becomes tier-aware (Basic: chapters, appendices, essential tools, search; Pro: every tool, the coach, the PDF) | FS, UD-§7 | Three tiers as stated | M7 (pricing now, entitlement in M5 Phase 2, billing in M7 Phase 5) | Yes (owner, 8 Nov 2026) |

VM Decisions 1 to 4 (Path A new Neon resource, local then preview then production, best-practice env scoping, CLI upgrade) are already made and are not re-asked.

## 5. Workstreams and dependencies

| Lane | Workstream | Source | Depends on |
|---|---|---|---|
| A | Green baseline: e2e fixes, typecheck script, CI | CR-H1, CR-M10, CR-L26, CR-L27 | nothing |
| B | Sample and preview fixes | CR-H2, H3, M6, M7, L11 to L16 | A (to verify) |
| C | Content revision Phases 0 to 3 and shared rules module | CC | OD-03 to OD-09; A (to verify) |
| D | Vercel Pro migration | VM | GitHub app access for `meded`; `meded` on Pro |
| E | Accounts, sign-in, gate, home page forms | UD-P0 to P3, FS-D3 | A; D (before any hosted migration); OD-01, OD-10 to OD-13, OD-17, OD-18, OD-21, OD-22, OD-23 (sender) |
| F | Hardening and accessibility backlog | CR-M2 to M5, M8, M9, M11, M12, L1 to L10, L17 to L25 | A; partition against B and E by file |
| G | Admin, billing, copy and policies, profile | UD-P4 to P7, CC-C copy, CR-L5 | E; OD-14 to OD-16, OD-19, OD-20, OD-23 |
| H | Coach coverage | CC Phase 4 | C frozen; B (CR-L14); F (CR-M2); OD-30 |
| I | Launch readiness | CR "Later / at launch", UD acceptance, launch-handoff | everything above |

Concurrency that is safe: A, C Phase 0 decisions and D can start the same day. B starts once A has a green suite to verify against (same day). E's Phase 1 code can be written against the Memory and File stores while D is in progress, but no hosted migration is applied until D is done. F runs between the others, partitioned by section 7; "in the gaps" is bounded by that map, because `app/globals.css`, `app/(public)/site.css`, `components/shell/Sidebar.tsx`, `lib/state/index.ts` and the chapter HTML each have a named predecessor that lands first. H waits for C, B and F. G waits for E.

## 6. Milestones

### M0. Housekeeping (today)

Goal: the docs and rules committed on their own branch, the in-flight content work preserved and committed by the session doing it, and the owner decisions in one place.

State of the tree on 8 November (from `git status` and `git diff --stat`, 35 files, +382/-205):

- Staged: the renames of twelve older docs into `docs/_archive/` and `docs/free-sample-decision.md` into `docs/plans/`; several archived files also carry small path updates after the move.
- Unstaged: the 79-line "Project instructions" section of `AGENTS.md`.
- Unstaged, **another session's work in progress**: `content/pages/{ch1,ch2,ch3,ch5,ch6,ch8,ch9,ch10,ch11,ch12,ch13,app-d,app-e}.html`, `content/data/{checkpoints,qualify}.ts`, `components/widgets/LeadSources.tsx`, `lib/{sources,glossary}.ts`, `lib/state/index.ts`, `lib/{checkpoints,sources-pipeline}.test.ts`, `e2e/parity/{checkpoints,practice}.spec.ts`. These implement content-review Phase 2 items (see M4 status). Do not edit, stage or revert any of them from another session.
- Untracked: the three new plan files, this file, and the root `downloads/` folder.

Branch: `docs/plans-master` for steps 1 to 3; the content session uses its own branch (suggested `feat(content)/practice-gaps`).

Status: steps 1 to 3 landed on 8 November (`4450278`, `7a650a1`), the five source plans were then moved to `docs/_archive/` (`d751dce`, `d706a3b`), and `main` was fast-forwarded and pushed. Steps 4 and 5 remain open.

Steps:

- [x] 1. Stage by path and commit the docs reorganisation (the archive renames, `free-sample-decision.md`, the three new plans, this file): `docs(plans): archive superseded docs and add the master plan`. Nothing under `content/`, `components/`, `lib/` or `e2e/` goes into this commit.
- [x] 2. Fix the stale line in `free-sample-decision.md:30` (now `docs/_archive/free-sample-decision.md`) (the recommended set lists the Preface; resolution #1): the Preface belongs to the signed-in free set, not to `/preview` [CR-L15]. Include in the same commit.
- [x] 3. Commit `AGENTS.md` on its own: `docs(agents): add project instructions`. Keep the managed Next.js block byte for byte.
- [ ] 4. The content session finishes its Phase 2 work, runs `pnpm typecheck`, `pnpm test` and `pnpm e2e` (its own spec changes expect 16 scripts and 9 objections), and commits on its branch with Conventional Commits, one commit per logical change where practical. Tick the matching M4 steps here with the hashes.
- [ ] 5. Decide the untracked root `downloads/` folder (OD-17). Until answered it stays untracked, so every session keeps seeing `?? downloads/` in `git status`; that is expected. Do not add it to `.gitignore` and do not commit it until the decision is recorded in section 4.

Exit: `git status` clean apart from `downloads/`; `main` untouched until the owner asks to merge.

### M1. Green baseline (lane A)

Goal: `pnpm e2e` exits 0 three runs in a row; `pnpm typecheck` works on a clean clone.

Branch: `fix/e2e-green`; CI on its own branch `chore/ci` if OD-24 is yes.

Steps:

- [x] 1. **Calculator locators** [CR-H1]. In `e2e/parity/calculators.spec.ts` change the `outputCell` helper at line 11 from `.locator('td').nth(2)` to `.nth(1)`, and line 98 from `.nth(1)` to `.nth(0)`; or use `getByRole('row', { name: /Closings needed/ }).getByRole('cell').nth(1)`. Cause: since `581fff3`, `GoalCalculator.tsx:73` renders the label as `<th scope="row">` with two `<td>`. Verify: `pnpm exec playwright test e2e/parity/calculators.spec.ts` gives 14 passed.
- [x] 2. **Ctrl+K flake** [CR-H1, CR-L27]. `e2e/parity/search.spec.ts:70-72` presses the shortcut before hydration. Add a hydration signal (a `data-hydrated` attribute the shell sets after mount) and wait for it, then replace the `networkidle` waits in `e2e/parity/{search,glossary-tools,practice}.spec.ts`, the fixed wait in `cutover-stub.spec.ts:43` and `parity/settings.spec.ts:69-76` with the same signal. Verify: `search.spec.ts --repeat-each 10` green. Landed 8 November except two waits: `practice.spec.ts` is in the content session's uncommitted set (M0 step 4), and `cutover-stub.spec.ts:43` asserts that the static stub page does not redirect, which is a negative wait on a non-React page, not a hydration proxy, so it stays.
- [x] 3. **Typecheck script** [CR-M10]. `package.json`: `"typecheck": "next typegen && tsc --noEmit"`. Decide OD-26 on `.next/dev/types/**` after reading the `next typegen` docs. Add the recovery note ("if `tsc` fails on a stale `.next/dev/types`, restart `next dev` or remove that folder") to `AGENTS.md` under Commands. Verify on a clean checkout (`git stash -u` is not allowed; use a fresh clone or worktree): `pnpm typecheck` passes.
- [x] 4. **CI** (only if OD-24 is yes) [CR-H1]. `.github/workflows/ci.yml` running `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test`, `pnpm exec playwright install --with-deps chromium`, `pnpm e2e` on Node 22. Read `01-app/02-guides/ci-build-caching.md` first. Until CI exists, run `pnpm e2e` before every commit.
- [x] 5. **Doc comment** [CR-L26]. `lib/routes.ts:15` cites `e2e/routes.spec.ts`, which does not exist; point it at `e2e/site.spec.ts:112-121`.

Verification: `pnpm typecheck`, `pnpm test` (369 passed, 4 skipped expected), `pnpm e2e` 0 failed in three consecutive runs. The three runs happen after step 3 has landed, on a tree with none of your own uncommitted changes (another session's files excepted), so the result reflects the committed state.

Exit: all three green; CI decision recorded.

### M2. Sample and preview fixes (lane B)

Goal: `/preview` is correct in both themes, structurally sound, and its copy matches what it shows. These are CR's "Immediate (before the next deploy of `/preview`)" items plus the FS items that need no email.

Branch: `fix/preview-sample`.

Steps:

- [x] 1. **Pitfall-cycle dark mode** [CR-H2]. `app/globals.css:959` `.cycle-node.is-broken`: use theme tokens (`background: var(--color-brand-tint); border-color: var(--color-brand-soft)`, the pair `.setup-source.on` uses) and `.cycle-badge { color: var(--color-success) }`. Verify on `/handbook/ch7` and `/preview` in dark mode after clicking "CRM": node title and body at least 4.5:1.
- [x] 2. **Callout text on `/preview` dark mode** [CR-H3]. `app/(public)/site.css:53`: lower the public base rules' specificity to `.pub :where(p)`, `.pub :where(a)` so `.box p` from `globals.css:1214` wins. Verify: `.pub-sample .box p` computed colour in dark mode is `#334155`.
- [x] 3. **Finish the `/preview` commit** [CR-M6, L12, L13, L14, L15, OD-28]:
  - `components/site/Excerpt.tsx:47`: when rendering a whole page, demote every heading one level (h1 to h2, h2 to h3, h3 to h4), match `<h1\b[^>]*>` not only a bare `<h1>`, and throw when a whole-page render finds no h1. Drop or merge the `<h2>Chapter N</h2>` wrappers in `app/(public)/preview/page.tsx:41-50`. Keep `lib/outline.ts` ids so `/preview#…` anchors work.
  - Move content typography from `.chapter-section …` (`globals.css:356-362,383-396`) to a `.chapter-body` scope that both `ChapterView` and `Excerpt` emit. This is also the start of CR-L25; finish L25 in M6.
  - Scope the `hide-quizzes` rule at `globals.css:1124` to `.shell-handbook` so a reader who hid quizzes still sees them on `/preview`.
  - `PREVIEW_WIDGETS` in `Excerpt.tsx:24`: register plain `KnowledgeCheck`, not `KnowledgeCheckEntry`, so the sample never switches to `CoachCheck` when Chapter 1 or 7 questions gain concept tags (precondition for M4 step 9).
  - Copy: `app/(public)/refunds/page.tsx:21` ("a full section"), `app/(public)/page.tsx:362` ("a full sample lesson"), the "exactly as they appear" claims on `preview/page.tsx:20` and `pricing/page.tsx:122`. Say what the sample omits (glossary popovers, outline, read tracking, next-chapter link).
  - `e2e/site.spec.ts:46-55`: assert visibility, exactly one `h1`, no duplicate ids, and the outline h1 to h2 (chapter) to h3 (section) to h4 (box).
- [x] 4. **Consent-version check** [CR-M7]. `lib/leads/validate.ts:7`: `z.enum([CONSENT_VERSION])` or `Object.hasOwn`; type `CONSENT_TEXTS` as `Record<typeof CONSENT_VERSION, string>` and remove the `!` in `handler.ts:45`. Add the `'constructor'` case to `lib/leads/handler.test.ts` expecting `invalid_request` and no stored lead.
- [x] 5. **Legacy link** [CR-L11]. `components/widgets/ErrorScoreCard.tsx:50` links `/chN`; use `pageHref`.
- [x] 6. **Public live region** [CR-L16]. Add the `#pageStatus` region to `app/(public)/layout.tsx` so `announce()` works and "Copy script" on `/preview` is announced.
- [x] 7. **Appendix E tool table on the sales page** [FS-D1, "not done yet"]. Render the tool list as "what is inside" on `/pricing` or `/`. It is a feature list, not teaching.
- [x] 8. **FS status check** [FS]. Confirm `e2e/site.spec.ts` still checks both chapters, both checkpoint boxes, both quizzes and the two Chapter 7 tools after step 3.

Verification: dark-mode screenshots of ch7 and `/preview`; the heading outline; `pnpm typecheck`, `pnpm test`, `pnpm e2e` green.

Exit: CR items H2, H3, M6, M7, L11, L12, L13, L14, L15, L16 closed; FS Appendix E item done.

### M3. Vercel Pro migration (lane D)

Goal: the project lives under `meded` with a new Neon resource, per-environment branches, scoped and Sensitive variables, and the public alias never stopped returning 200. **Hand `docs/_archive/vercel-pro-migration-meded.md` to the session verbatim**; this section is the checklist and the stop points.

Branch: none for code (VM says no commits or pushes). The result file is committed afterwards on `docs/vercel-migration-result`.

**What the owner does before a session starts M3** (each saves a round-trip):

- [ ] Authorise the `meded` team's GitHub installation on `brianpx/realestate-handbook-v1`. The session will not open the transfer dialog until it can show this.
- [ ] Put `meded` on Pro with a payment method on file (VM step 2). If the dashboard says Hobby the session stops.
- [ ] Answer OD-29 (deployment pausing at the $20 limit), or expect the question.
- [ ] Have the values for every environment variable that must exist (VM step 5 and `.env.example`) ready to hand over on request; the session never invents one.
- [ ] Confirm lead capture is off in production (`LEAD_CAPTURE_ENABLED` unset). That is what makes the `DATABASE_URL` window safe; if it is on, the owner decides before the transfer.

Hard preconditions the session verifies (VM step 1): GitHub access shown, Pro shown, lead capture state read from `vercel env ls`.

Steps (the full detail, including every command, is in VM):

- [ ] 0. **Rollback plan read** [VM-0]: transfer is reversible via Settings, General, Transfer Project; the old Neon resource exists until step 7; `vercel rollback <id>` under whichever scope owns the project; if the alias stops returning 200, stop everything.
- [ ] 1. **Pre-flight, read only** [VM-1]: repo root check; no `vercel.json` or `vercel.ts`; `.vercel/` absent; `.env.local` git-ignored, names only; `vercel --version`, `which pg_dump psql neon`; upgrade the CLI from 62.2.0 if `vercel integration --help` or `vercel integration resource --help` is missing (VM Decision 4, report before and after); `vercel whoami`, `vercel teams ls`, `vercel project ls --scope brianpxs-projects`, `vercel project ls --scope meded` (a `realestate-handbook` already under `meded` would force a rename and change the alias: stop); `vercel link --scope brianpxs-projects --project realestate-handbook --yes`, `cat .vercel/project.json`, `vercel env ls`, `vercel domains ls`, `vercel integration list`, `vercel ls --prod`; record `orgId`, `projectId`, the production deployment id and URL, the env var list per environment, the Neon resource name to a scratch file (names only); dashboard Git settings on both scopes; Neon read-only: confirm project `morning-credit-15469990`, `select count(*) from leads;` and `select count(*) from lead_attempts;`.
- [ ] 2. **Pro and Spend Management** [VM-2]: `vercel switch meded`; Billing shows Pro; payment method on file; spend amount $20, notification $10; show the screen before saving; "pause deployments" stays off unless OD-29 is a yes after the plain warning.
- [ ] 3. **Transfer** [VM-3]: dashboard Transfer Project to `meded`, name unchanged; paste the dialog's moves and does-not-move list verbatim and call out differences from the docs; if the dialog refuses because of the connected Neon resource, stop; wait for the explicit yes; then `rm -rf .vercel`, `vercel link --scope meded --project realestate-handbook --yes`, `cat .vercel/project.json`, `vercel ls --prod`, `vercel env ls`, `vercel integration list`, `curl -sI https://realestate-handbook.vercel.app | head -5`. **Stop rule:** if the alias is not 200 from the same deployment id as step 1, or the Neon variables are missing, stop, delete nothing, provision nothing, redeploy nothing, report, and be ready to reverse. Report which of the 18 Neon variables arrived as plain values per environment; confirm Git link and `all_except_custom_domains` protection survived; check whether the Protection Bypass for Automation secret survived (re-create it, with permission, before 6b if not).
- [ ] 4. **New Neon resource, Path A** [VM-4]: if counts were non-zero, `pg_dump --data-only -t leads -t lead_attempts` to `/tmp/leads.sql` (never echo the URL); confirm provisioning is possible (`vercel integration add --help`, `vercel integration list` under `meded`, payment method, offered plans) before removing anything; **one ask** covers deleting the 18 copied variables and running `vercel integration add neon --name realestate-handbook` immediately after, in the same sitting; choose the lowest Neon plan with branching (stop and report the price if only paid plans are offered); confirm the resource is connected for Production, Preview and Development; then make sure Preview and Development never hold the production `DATABASE_URL` (per-preview branching if offered, otherwise `preview` and `development` branches created with permission and `DATABASE_URL` re-scoped per environment); `vercel env ls` must show `DATABASE_URL` scoped separately for all three and the session states which branch each points at (names only); apply `db/migrations/001_leads.sql` to main (ask first) and to the other branches if they pre-date it; restore the dump if any and show before and after counts and `min/max(created_at)` only; do not remove the old resource yet.
- [ ] 5. **Environment variables** [VM-5, VM Decision 3]: diff `vercel env ls` against step 1; recreate only variables that existed or that `.env.example` marks required; ask for every value not in hand; mark `SENDGRID_API_KEY`, `LEAD_IP_SALT`, `VERCEL_AUTOMATION_BYPASS_SECRET` and all Neon credentials Sensitive; Preview gets `SITE_INDEXABLE` unset and `NEXT_PUBLIC_SITE_URL` unset or the preview pattern; Preview never gets production SendGrid credentials unless told; note build-time variables (`NEXT_PUBLIC_SITE_URL`, `LEAD_CAPTURE_ENABLED`, `NEXT_PUBLIC_COACH_ENABLED`) need a redeploy; `vercel env pull .env.local --environment development` after confirming `.env.local` is ignored; never pull Production locally unless a check requires it, and delete the file after.
- [ ] 6. **Release** [VM-6, VM Decision 2]: **6a local**: `pnpm install`, `pnpm typecheck`, `pnpm test`, `TEST_DATABASE_URL=<development branch> pnpm vitest run lib/leads/neon-store.integration.test.ts`, `pnpm dev`, `curl -sI http://localhost:3000/api/lead` gives 405. **6b preview**: `vercel` (no `--prod`); record URL and id; 200 (or 401 then bypass header); `/api/lead` 405 on GET; preview `DATABASE_URL` is a non-production branch; `PLAYWRIGHT_BASE_URL=<preview> pnpm e2e` with the bypass secret; `vercel logs <preview> --level error`; **stop and wait for the yes**. **6c production**: `vercel --prod`; record the id; 200 on the alias; `/robots.txt` and `/sitemap.xml` unchanged (indexing off unless `SITE_INDEXABLE=true`); `/api/lead` 405; if lead capture is on, one test lead with the owner's address lands in the new database and the old count is unchanged; `PLAYWRIGHT_BASE_URL=https://realestate-handbook.vercel.app pnpm e2e`; `vercel logs --level error` for the first minutes; Usage shows the project under Pro.
- [ ] 7. **Cleanup and record** [VM-7]: only after 6c is green, ask, then remove the old Neon resource from `brianpxs-projects`; delete scratch files and `/tmp/leads.sql`; write `docs/_archive/vercel-pro-migration-meded-result.md` (beside the prompt) with everything VM lists (ids before and after, branch per environment, bypass secret fate, CLI versions, `--help` transcripts, spend settings, env list with Sensitive flags, the dialog text, row counts, what was verified, every **unchecked** item), ending with the sequencing note that UD's variables and migrations `002+` apply only to the new `meded` resource; add a dated note to `docs/_archive/vercel-preview-plan.md`. **Old-resource check, done without printing a value:** for Development and Preview, `vercel env pull <tmpfile> --environment <env>` then `grep -c morning-credit-15469990 <tmpfile>`; report the count (must be 0) and delete the file. For Production ask first, do the same, delete the file. Also confirm `vercel integration list` under `meded` shows only the new resource.

Exit (VM "Done when"): alias 200 from a `meded` build; no variable points at `morning-credit-15469990`; Preview and Development on non-production branches with `DATABASE_URL` scoped three ways; Git link authorised; bypass secret exists and Playwright used it; $10 alert and $20 limit; nothing left in the personal scope except what the owner kept; result file lists every unchecked item.

### M4. Content revision (lane C), then coach coverage (lane H)

Goal: one authoritative source for every shared rule, no learner-facing contradiction, the reading plan consistent, and tests that fail on drift. CC Phases 0 to 3, then Phase 4 when its preconditions hold.

Branches: `docs/content-decisions` (Phase 0 record), `fix(content)/rules-module`, `fix(content)/contradictions`, `feat(content)/core-plans`, `chore(content)/trim`, `feat(coach)/coverage-chN` (one per chapter in Phase 4).

**Status at 8 November.** Another session has Phase 2 work in the tree, uncommitted (M0 step 4). From the diff: five new Chapter 6 scripts with practice mode (referral partner introduction, one-week call, 30-day review request, home anniversary card, quarterly call) and the matching Chapter 6 checkpoint lines (step 9c); the buyer-agreement objection as a ninth objection-trainer row (step 9c); the seller column in Table 5.2 and the qualifying drill pointing at it (step 9c); cost per appointment in Chapter 2, Chapter 12, Appendix D, the glossary, `lib/sources.ts`, the lead-sources widget and its state field (step 9d); review profiles in Chapter 3 (step 9e); Table 1.2 runway and commission worksheet in Chapter 1 (step 9e); checkpoint answers for Chapter 1's "three things", Chapter 8's slow week, Chapter 11's seven documentation items and a new Chapter 13 checkpoint (step 9e); Chapter 10's Try It now says "rewrite" the Chapter 6 scripts; Chapter 13 points at the Chapter 6 introduction script. **Not in the diff:** the Phase 1 Critical contradiction fixes (the Chapter 2 checkpoint still says "five to ten times"; the Chapter 10 quiz item and the Chapter 5 stem are in files that have not changed), the rules module, and the Phase 0 decisions. Phase 2 landing before Phase 1 is acceptable because the two touch different sentences, but Phase 1 remains the higher priority and starts as soon as the Phase 2 branch is committed, so the chapter files are not edited by two sessions at once.

**Phase 0 (blocking, short)** [CC Phase 0]:

- [ ] 1. Resolve OD-03 to OD-06 and sign off the exact canonical phrasing (OD-09) for the consent rule, the speed-to-lead standard and 9 p.m. test, and the post-close milestone. Record the sentences in section 4 and in the Phase 0 doc.

**Hand-off check between the content session and Phase 1:**

- [ ] 1b. When the Phase 2 branch is committed, every active session runs `git status` and confirms no `content/pages/*.html`, `content/data/*.ts`, `lib/sources.ts`, `lib/glossary.ts` or `lib/state/index.ts` file is modified in more than one place. Only then does Phase 1 start, and then on one branch with one editor per chapter file.

**Phase 1 (high-priority consistency)** [CC Phase 1, CC-§1, CC-§2, CC-H]:

- [ ] 2. **Shared rules module** [CC-H]. Create `content/data/rules.ts` with the canonical phrasing and values (consent rule, speed-to-lead standard, 9 p.m. test, post-close milestone, scorecard thresholds as Table 8.2 states them). Point `lib/nurture-consistency.test.ts`, `lib/scorecard-consistency.test.ts` and `lib/coach/anchors.test.ts` at it. Chapter text, widgets and the coach reference it.
- [ ] 3. **Text versus assessment** [CC-§2]:
  - Critical: Chapter 2 checkpoint answer 1 in `content/data/checkpoints.ts` ("five to ten times") to match "often converts far better"; retire the matching `knowledge-checks.ts` item so it cannot resurface.
  - Critical: Chapter 10 quiz MCQ 1 ("seven to ten years") to match "a decade or two" (this item is live because Chapter 10 has no tagged questions).
  - Critical: Chapter 5 quiz stem "industry follow-up data says" to "many agents and industry trainers report", also in `questions.ts` (`ch5.multi-touch.fifth-to-twelfth`, non-draft, live).
  - Critical: Chapter 4 blank asserting conversion is highest under five minutes: reword to test the standard (automated reply in a minute, call in minutes), not the illustrative Figure 4.
  - Medium: Chapter 6 explains ("gets no reply" vs "rarely"; "thank them and move on" vs "keep in touch").
- [ ] 4. **Text versus widget** [CC-§2]: scorecard (`content/data/scorecard.ts`) scoring zero open houses red in any week vs Table 8.2's first-30-days allowance (change the row mode or the table wording); Appendix C's 8 p.m. test to 9 p.m.; qualifying drill scenario 4 sending a seller to a plan with no sequence (resolves with OD-08).
- [ ] 5. **Text versus text** [CC-§2, CC-§6]: the consent rule's four phrasings across Chapters 2, 4 (twice), 5, 6, 11, Appendix B.1 and C become the one canonical sentence from `rules.ts`; keep brief reminders beside B.1 and the Chapter 5 Try It.
- [ ] 6. **Sequencing** [CC-§1, OD-03, OD-04, OD-07]: implement the reading-plan decision in `content/data/plan.ts` and the preface; add the quick start with the "before your first outreach" checklist (consent before automated texts, describe property not people, agency disclosure at first substantive contact, do-not-call); fix forward references (Chapter 4's Try It importing the Chapter 2 sphere list; Chapter 12's "you have now met every part"); state the three post-close moments once and apply to Chapter 4 step 3, Chapter 5, Chapter 12, the preface and Appendix C.
- [ ] 7. **Free-set validation** [CC cross-plan, UD-§13, OD-01]: once OD-01 and OD-03/04 are answered, confirm the pages in `FREE_PAGE_IDS` and on `/preview` are self-contained and that the safeguards appear in the free material or a quick start a free reader can reach.
- [ ] 8. **CRM positioning copy pass** [CC-C, OD-05]: FAQ (`content/site/faq.ts`), footer, About and Terms claim examples "use Keller Williams Command screens and terms, and each is labeled"; make site copy and the handbook vocabulary (Marketing Profile, Client App, Agent Site, "productivity coach" in Chapters 3 and 4, Appendix C, glossary) agree with the decision. Single owner for these files during this pass (section 7). Label Appendix F per OD-06.

Definition of done for Phase 1 [CC]: all non-draft questions and checkpoints match chapter text; scorecard and Appendix C match their source tables; reading plan and forward references consistent; `rules.ts` exists and is referenced by text, widgets and tests; existing tests pass and the new assertions below are in place.

**Phase 2 (core plans and practice)** [CC Phase 2, CC-§3, CC-§4]:

- [ ] 9a. Define or drop the four undetailed plans (OD-08); give Appendix B.4 a table or point at Table 10.1 and drop the "four plans" claim; remove "your CRM's library already contains plans for most of these" if OD-05 is vendor-neutral.
- [ ] 9b. Add the under-contract communication checklist (weekly update even when nothing changed; touch list and script).
- [ ] 9c. Fill the highest-value script gaps: the buyer-agreement objection ("Why do I have to sign before you show me homes?") in Table 9.2 and the objection trainer; the quarterly call; the lender or attorney introduction; seller-variant qualifying questions (makes the drill's seller scenario coherent); Chapter 10's one-week call, 30-day review request and anniversary card models.
- [ ] 9d. Teach cost per appointment alongside cost per closed deal in Chapters 2 and 12; let the lead-sources widget show both.
- [ ] 9e. Lower priority, same phase if time allows: review profiles in Chapter 3's home-base section; a compact runway and commission set-aside worksheet (must not delay the contradiction fixes); exercises or checkpoints for the unassessed objectives (Chapter 8 slow week, Chapter 11 seven documentation items, Chapter 13 objectives).

**Phase 3 (polish)** [CC Phase 3, CC-§6, CC-§7]:

- [ ] 10. Trim repetition once the rules are standard: speed-to-lead explained in Chapters 2, 3, 4, 5, 7, 12, 13 (define in Chapter 4; one-line pointers elsewhere; Chapter 2's forward reference to Chapter 3 corrected); daily rhythm (keep Table 4.1 and the weekly grid; cut Chapter 8's prose); the 13 scorecard rows (Chapter 12's four bullets become one sentence pointing at Appendix A); combine the two Friday habits into one definition ("one thing" vs "one number"; Chapter 13's "fix one thing a month"); verbatim repeats inside Chapters 1 and 5; duplicates across chapters ("I'm just looking" in Chapter 6 and Table 9.2; the static roadmap SVG before the interactive roadmap; Chapter 13's "Do these this week"; Chapter 10's timeline and flywheel both enumerating six steps).
- [ ] 11. Legend, figures, credits: add the legal box, key takeaways and learning objectives to the preface legend; number the figures (there is no Figure 1; about twenty newer diagrams are unnumbered); fix the Appendix D colophon ("Figures 1 to 5", "Figures 6 and 7", "typical industry ranges" vs Figure 2's "illustrative").

**Verification to add** [CC Verification], extending the existing consistency tests:

- Reading plan: `plan.ts` units match the preface list; every chapter's forward references point only to earlier units.
- Consent and speed-to-lead: one canonical phrasing, asserted in every page that restates it.
- Post-close timing: one milestone, asserted in Chapter 4, Chapter 5, Chapter 12, the preface and Appendix C.
- Assessment: every non-draft question's `explain` and answer text is found in its chapter's HTML; every checkpoint answer's numeric claims appear in the chapter.
- Widgets: scorecard thresholds match Table 8.2 wording; Appendix C's test time matches Chapter 4.
- Forward-reference integrity after OD-03.
- Optional: a content lint that greps `content/pages/` for retired phrasings and fails on a hit; widget snapshots for scorecard, lead-sources and roadmap if e2e supports them.

**Phase 4 (coach coverage, lane H)** [CC Phase 4, CC-§5]:

Preconditions, all required: Phases 1 to 3 landed and the rules frozen; CR-L14 fixed (M2 step 3); CR-M2 fixed (M6 step 1); OD-30 names the reviewer.

- [ ] 12. Author concepts (`content/data/concepts.ts`) and questions (`content/data/questions.ts`) for Chapters 1, 3, 6, 7, 8, 9, 10, 11 and 13; rough size 8 chapters × 4 to 6 concepts × 2 to 3 questions, about 80 to 140 items, each needing agent review and sign-off (clearing `draft`) and validation against the chapter text. One branch per chapter so agents never share a file. Keep the Chapter 2, 4, 5 and 12 question reviews in `docs/_archive/` as the pattern.

Exit: CC Phase 1 definition of done met; Phases 2 and 3 items ticked; coach bank covers all 13 chapters with no draft items left unreviewed.

### M5. Accounts, sign-in and the gate (lane E): UD Phases 0 to 3

Goal: readers sign in with a magic link, the handbook is gated, free pages open to signed-in readers, the home page captures email, and nothing is sold yet. Closes launch-handoff blocker 1 and CR-M1.

Preconditions: M1 green; M3 done (hosted migrations go only to the new `meded` resource and to a branch first); OD-01, OD-10 to OD-13, OD-17, OD-18, OD-21, OD-22 answered; the sender in step 1 verified before any real send.

Branches: `feat/auth-core` (P1), `feat/access-gate` (P2), `feat/signup-home` (P3). P1 and P2 share `lib/leads/validate.ts` only through the shared email schema; land P1 before P2 starts. P3 touches public files no other lane may edit meanwhile.

**Phase 0: decisions and launch blockers** [UD-P0]:

- [ ] 1. **Email sender ready** (resolution #3): a transactional from-address on a domain the owner controls, SPF and DKIM verified at SendGrid, a test sign-in link landing in the inbox (not spam) of at least one Gmail and one Outlook account; postal address supplied for the marketing footer; `SENDGRID_API_KEY`, `LEAD_FROM_EMAIL`, `LEAD_MAILING_ADDRESS`, `LEAD_FROM_NAME`, `LEAD_REPLY_TO` set on the `meded` project per VM scoping (Production only unless told). Rewrite the welcome text in `lib/leads/mail.ts` ("The book stays free to read") [FS-D3, UD-§3.3, UD-P6]. Before lead capture goes live, also add the `unsubscribed_at` column and documented process, set a retention period, and resolve `OWNER.supportEmail` [CR-L5] (the privacy page text itself is M7).
- [x] 2. Record OD-17 (media) because a yes adds the gated media route to Phase 2. Decide the fate of the root `downloads/` folder at the same time.
- [x] 3. Update `.env.example` with `AUTH_IP_SALT` (or reuse `LEAD_IP_SALT`), `ADMIN_BOOTSTRAP_EMAILS`, and placeholders for the later `BILLING_PROVIDER`, `BILLING_WEBHOOK_SECRET`, `BILLING_API_KEY`, `CRON_SECRET` [UD-§12.5]. Fill `lib/offer.ts` values the owner has supplied.

**Phase 1: users and auth core** [UD-P1, UD-§3, UD-§6.1 to §6.4, UD-§12.1, UD-§12.2]:

- [x] 4. Migration `db/migrations/002_users_auth.sql`: `users`, `auth_tokens`, `sessions`, `auth_attempts` exactly as UD-§6 specifies (uuid keys, `timestamptz`, `text` with `check (... in (...))`, lower-cased unique email with `check (email = lower(btrim(email)))`, commented `-- down` block, 001-style header). If OD-10 chose Neon Auth, 002 omits `auth_tokens` and `sessions` and says so.
- [x] 5. Shared email schema `lib/validate/email.ts` (trim, lower-case, max 254, no dot or plus rewriting); `lib/leads/validate.ts` imports it.
- [x] 6. Stores and helpers: `lib/users/{types,validate,store,neon-store,memory-store}.ts`; `lib/auth/{config,token,session,cookie,handler,validate,store,neon-store,memory-store,mail,dal}.ts`. `config.ts` holds `TERMS_VERSION` and the exact sentence shown under the sign-in button, as `CONSENT_TEXTS` does. Token: 32 random bytes, base64url in the link, SHA-256 hex stored, 15-minute expiry, `next_path` validated (starts with `/`, not `//`, no scheme), `source` in the allowed set. Session cookie `__Host-hb_session` in production (`hb_session` over plain http), `HttpOnly; Secure; SameSite=Lax; Path=/`, Max-Age 90 days; hash stored; sliding renewal by the single conditional statement in UD-§3.2 at most once per 24 hours; one-year absolute cap. The auth mailer relaxes the postal-address check for the transactional sign-in message only.
- [x] 7. Handlers and routes: `app/api/auth/request-link/route.ts` (Origin required and allow-listed; 5 per IP per 10 minutes, 3 per email hash per hour; `200 {ok:true}` and identical email whether or not the address is known; **no user row at request time**); `app/auth/verify/page.tsx` (GET does a read-only lookup and renders "expired or already used" with a resend form, or a one-button "Sign me in" form that JavaScript submits, so scanners consume nothing); `app/api/auth/verify/route.ts` (one atomic `update … where token_hash = $1 and consumed_at is null and expires_at > now() returning …`; rate-limited 10 per IP per 10 minutes; upserts the user with `email_verified_at` and `accepted_terms_version`; writes the session; sets the cookie; updates `last_sign_in_at`; redirects to `next` or `/handbook`; bootstrap admin from `ADMIN_BOOTSTRAP_EMAILS` only while zero admins exist, audited `actor_kind = 'system'`, `action = 'bootstrap_admin'`, inserting the owner grant once Phase 2's tables exist); `app/api/auth/sign-out/route.ts`.
- [x] 8. `proxy.ts` at the repo root (read `proxy.md` first): matcher `['/handbook/:path*', '/account/:path*', '/admin/:path*', '/search-index.json']`; missing or malformed cookie (not 43 base64url characters) redirects to `/signup?next=<path>`; otherwise re-emit the cookie with a fresh Max-Age and continue; no database access; never decides preview versus member.
- [x] 9. Data-access layer `lib/auth/dal.ts`: `getViewer()` in React `cache()` reads the cookie, hashes it, loads session and user, runs `entitlement()`, returns `{ user, role, entitlement }` or null; `requireViewer()` redirects to `/signup`; `requireAdmin()` redirects to `/handbook`. Revocation takes effect at the next DAL call, which is acceptable because proxy never serves content.
- [x] 10. Tests from UD-§15 for request-link, verify, session, Neon stores with the fake `Sql`, and `proxy.ts` with `next/experimental/testing/server`. Apply 002 to a Neon branch of the new resource, run the integration tests with `TEST_DATABASE_URL`, then (ask first) apply to the default branch.

**Phase 2: access and gate** [UD-P2, UD-§4, §5, §6.5, §6.6, §6.12, §7, §8, §9]:

- [x] 11. Migration `db/migrations/003_access_billing.sql`: `access_grants`, `memberships`, `billing_customers`, `billing_records`, `billing_events`, `audit_log` per UD-§6.5 to §6.9 and §6.12 (the billing tables ship now so the schema is complete; billing code waits for M7). Apply to a branch first, as in step 10.
- [x] 12. `lib/access/{entitlement,grants,membership,validate}.ts` and `lib/audit.ts`. `entitlement()` is the pure function in UD-§8: status not active gives none; `memberships.suspended_at` set gives none for paid content; role ignored; any non-revoked in-window grant gives member; the billing safety net in rule 5; otherwise preview. `recomputeMembership()` per UD-§7.2, run after every grant or suspension change and lazily when a gate read finds `ends_at` past. `audit_log` is append-only; mutations and their audit row run in one fixed `transaction([...])` batch and skip the row when before equals after.
- [x] 13. `FREE_PAGE_IDS` in `lib/pages.ts` per OD-01. `app/(product)/handbook/[slug]/page.tsx` keeps `generateStaticParams` and `dynamicParams = false`, calls `requireViewer()`, and renders the **designed upsell card** (chapter title, one line on what it teaches, the price or "not yet on sale" state from `purchaseOpen()`, one primary action, links to the free chapters and `/pricing`) when the slug is not free and the viewer is not a member. It must never read as a broken page.
- [x] 14. Leaks: `app/search-index.json/route.ts` becomes dynamic, requires a viewer, filters to free pages for preview users. If OD-17 is yes, `app/api/media/[...path]/route.ts` checks the viewer and the files move out of `public/`.
- [x] 15. `app/(product)/layout.tsx`: retire `Gate` for signed-in readers (OD-18); `components/shell/Sidebar.tsx` shows locked markers; `app/(product)/account/page.tsx` and `components/handbook/AccountPanels.tsx` show identity, last sign-in, sessions, "sign out everywhere" (`app/api/account/sign-out-all/route.ts`) and delete (`app/api/account/delete/route.ts`, typed-email confirmation, the one fixed anonymisation batch in UD-§12.4); `app/robots.ts` disallows `/admin`, `/auth` and `/api`.
- [x] 16. Tests: table-driven `entitlement()` and `recomputeMembership()` cases from UD-§15; integration tests for unique constraints, atomic consume under concurrency, single renewal under concurrency, one admin from two bootstrap addresses, cascades, anonymisation keeping billing rows. Add one revocation case the source plan implies but does not name: a grant is revoked (admin action or SQL on the test branch) while the member's session is live, and the member's very next request renders the upsell card, with no sign-out and no cookie expiry in between. Revocation is enforced at the data-access layer, not the proxy (UD-§3.2 point 5), and this test proves it.

**Phase 3: home page and forms** [UD-P3, UD-§2, FS-D3, OD-02, OD-22]:

- [x] 17. Recreate `components/site/SignupForm.tsx` (honeypot, validation, inbox-check state) with `variant` (`hero`, `card`, `inline`) and `source` props, and `app/(public)/signup/page.tsx` with copy per OD-01 (resolution #7). Hold the sitemap entry until the form sends (UD-D15).
- [x] 18. `app/(public)/page.tsx`: the form in the hero as the primary action ("No password, no card. The link we email also signs you in next time."), "Try the sample lesson without an email" and "Pricing and availability" as text links, the form repeated after the calculator win in `components/site/HeroPlan.tsx` (`source: 'calculator'`) and at the end (`source: 'final'`); returning readers with a cookie see "Welcome back. Open the handbook"; `components/site/PublicHeader.tsx` shows "Open the handbook" instead of "Sign in" (also close the menu on same-page hash links and fix `aria-current`, CR-M9, since this file is open). When `purchaseOpen()` is true the buy button returns as primary and the form moves to the side column. No invented proof.
- [x] 19. `app/(public)/signin/page.tsx` (same form, `source: 'signin'`); verify page states; success state inline with "Send again" after 30 seconds and "Use a different email".
- [x] 20. Marketing opt-in: a separate optional checkbox posting through `/api/lead` with a new `source` value, confirmed opt-in (send a confirmation link; store as subscribed only when clicked). This is the FS post-sample form; its copy follows OD-02. Place it after the sample on `/preview` too. Signing in never implies marketing consent.
- [x] 21. Placement measurement without a tracker: store `source` on every link request and count requests against completed sign-ins in the database.
- [x] 22. E2E: `e2e/auth.spec.ts`, `e2e/auth.ts` (session seeding helper), updates to `e2e/site.spec.ts`, `e2e/gate.spec.ts`, `playwright.config.ts`, `e2e/global-setup.ts`; Mailpit locally. The scenarios in UD-§15 (request on `/signup`, read the link from Mailpit, GET leaves the token unconsumed, click lands on `next`; preview reader sees the upsell on `/handbook/ch2` and content on `/handbook/ch1`; signed out `/handbook/ch1` redirects, `/preview` loads, `/search-index.json` is not public; sign-out and sign-out-everywhere; no admin access for a preview reader). The product-page loops seed a session or they fail on the redirect.

Verification: `pnpm typecheck`, `pnpm test`, integration tests against a branch, `pnpm e2e`; UD acceptance criteria for the gate: no route under `/handbook`, `/account`, `/admin` or `/search-index.json` returns member content without a database-backed session and a member entitlement; raw tokens and session ids never appear anywhere but the one email link and the cookie; identical responses for known and unknown emails.

Exit: launch-handoff blocker 1 closed; CR-M1 closed; the owner can grant complimentary access by hand once M7's admin UI exists, or by SQL on a branch until then.

### M6. Hardening and accessibility backlog (lane F)

Goal: CR's "Next development cycle" and the remaining Low items that do not depend on launch. Partition by file against M2, M4 and M5 (section 7); run these in the gaps.

Branches: `fix(a11y)/quiz-and-focus`, `fix(ui)/inputs-menus-404`, `fix(leads)/config-validation`, `fix(css)/scope-and-breakpoints`, `test/coach-e2e`.

Steps:

- [x] 1. **Quiz keyboard** [CR-M2]. `components/widgets/KnowledgeCheck.tsx:42`, `QuestionItem.tsx:53-59`: commit on an explicit "Check answer" action (as fill-in-blank does); after committing use `aria-disabled` or move focus to the feedback (`tabIndex={-1}` plus `focus()`). Verify: ArrowDown twice commits nothing; `document.activeElement !== body` after commit. Precondition for M4 step 12.
- [x] 2. **Mobile menu inert** [CR-M3]. `components/shell/Sidebar.tsx:60-83,203-207`: when open on a phone set `inert` on `#main-content` and the skip link (the `Gate.tsx:37-38` pattern); same for the search-results overlay.
- [x] 3. **Phone scroll padding** [CR-M4]. In the `(max-width: 900px)` block of `app/globals.css` add `html { scroll-padding-top: 72px }` (or derive from `--header-h`) and collapse the per-element rule at `:1061`.
- [x] 4. **Dimmed timeline buttons** [CR-M5]. `globals.css:886`, `NurtureTimeline.tsx:55`: de-emphasise with border or background only (or opacity 0.7), or make them genuinely disabled.
- [x] 5. **`AmountInput` prop sync** [CR-M8]. Track the last prop value and clear `text` when the parent changes it; remove the remount keys in `Scorecard.tsx:35,101` and `PipelineCalculator.tsx:23`. happy-dom test: type, re-render with a new value, assert the string.
- [ ] 6. **Public header menu** [CR-M9] if not already done in M5 step 18.
- [x] 7. **404 pages** [CR-M12]. `app/not-found.tsx` inside the public chrome with `pub-h1`; add `app/(product)/not-found.tsx` so product `notFound()` keeps the sidebar. Read `not-found.md` first.
- [x] 8. **Coach e2e** [CR-M11]. `e2e/coach.spec.ts`: pinned-date plan creation, mark three steps, miss a ch4 question and see it in the review deck, `handbookCoach` export round-trip, plus the coach-off `notFound()` branch.
- [x] 9. **Leads config and validation** [CR-L3, L7]. `lib/leads/store.ts:119-123`: refuse the file store when `NODE_ENV === 'production'` (mirror the `LEAD_IP_SALT` refusal at `route.ts:14`); guard that parsed `leads` and `attempts` are arrays. Fix `.env.example:17` so `LEAD_STORE=file` is commented or clearly dev-only.
- [ ] 10. **State and narrowing** [CR-L6, L8, L9, L10]. *L8, L9 and L10 landed 8 November (`fix/m6`); L6 waits for the content commit (`lib/state/index.ts`).* `lib/state/index.ts:10` and `transfer.ts:54`: stop running the handbook-state migration on the settings store (or give settings its own); `DeepLinks.tsx:37-44` and `SidebarSearch.tsx:85,137`: `isPageId` before casting; `coach/schema.ts:65`: per-field catches instead of a whole-object `.catch(undefined)`; `ProgressTransfer.tsx:30,44`: handle `file.text()` rejection with a message.
- [ ] 11. **Lower-impact a11y** [CR-L17 to L22]. *L17, L18 and L20 landed 8 November (`fix/m6`); L19 and L21 wait for M4 Phase 3, L22 for OD-18.* `Settings.tsx:54-94` collapse guard while a control inside is focused; drop `aria-expanded`/`aria-controls` from the searchbox in `SidebarSearch.tsx:103-105`; move the literal "●" out of 28 content h3s and 16 widget headings into CSS `::before` or an `aria-hidden` span (the `InteractiveHeader.tsx:7` pattern; coordinate with M4 so no two agents edit the same `content/pages/*.html`); coach pages h1 to h2 instead of h1 to h3 (`PlanSetup.tsx:47`, `TodayCard.tsx:31,89`, `ReviewDeck.tsx:98,144`); `<caption>` on the seven data tables (`app-b.html:7,30,48`, `app-e.html:6`, `app-f.html`, `ch2.html:79`, `ch9.html:61`); `Gate.tsx` `aria-invalid`/`aria-describedby` and Escape behaviour only if the dialog survives OD-18.
- [x] 12. **CSS** [CR-L23, L24, L25]. `.sidebar-header p` and `.settings-legal` lose `white-space: nowrap`; move the shell breakpoints to range syntax with a few named breakpoints (the 900 to 901 px gap, nine distinct max-widths); finish scoping the unscoped `h2/h3/p/li/table` rules (`globals.css:356-414,506-531`) to the `.chapter-body` wrapper begun in M2, then delete the eight undo rules in `site.css`.
- [ ] 13. **Dependency** [CR-L4, OD-27]. Bump `happy-dom` to ≥ 21.0.4 with the owner's yes (lockfile change).
- [ ] 14. **Optional improvements** [CR]: `app/(product)/error.tsx`; one shared `storage` listener per store; derive `WidgetName` from `WIDGET_NAMES as const` and check whether the three `as unknown as ComponentType` casts can go under `@types/react` 19.3; export `LeadBody`/`LeadError` from the handler for `Gate.tsx`; build `THEME_SCRIPT` from `TEXT_SIZES`; `role="list"` on `list-style: none` lists, label `nav#sidebar` "Handbook", forced-colours outline; the `globals.css` reset and print-token tidy; `parity/` rename and `legacy/` removal (OD-25); follow system dark-mode changes while `dark` is unset; fix the `pageIdFromPath` doc comment; remove the unused `useConceptStates` export.

Exit: CR Medium items all closed; every Low item either closed or named here as deferred. The deferred set is exactly L1, L2 and L5, which M8 steps 1 to 3 own.

### M7. Admin, billing, copy and policies, profile (lane G): UD Phases 4 to 7

Goal: the owner can manage users and grants, a purchase produces access, the public copy and policies describe the real product, and the profile hook exists.

Preconditions: M5 complete; OD-14 to OD-16, OD-19, OD-20 answered; the billing provider chosen and its test mode available (OD-23).

Branches: `feat/admin`, `feat/billing`, `docs(site)/policies-copy`, `feat/profile`.

**Phase 4: admin** [UD-P4, UD-§9]:

- [ ] 1. `app/(admin)/admin/**` pages and `app/api/admin/**` handlers, each starting with `requireAdmin()` and the Origin check. User list with status, role, membership and billing; audit list. Idempotent state-setters `setRole`, `createGrant`, `revokeGrant`, `suspend`, `unsuspend`, `setStatus`, `linkBillingToUser`, `resyncBilling`, `resendReadyEmail`, each writing its audit row in the same fixed batch and skipping it when nothing changed; an admin can never change their own role or status. Tests per UD-§15 (non-admin 403; self-change refused; repeated action writes no second audit row).

**Phase 5: billing** [UD-P5, UD-§10, UD-§6.7 to §6.9]:

- [ ] 2. Adapter interface (`verify`, `parse`, `fetch`, `checkoutParams`) in `lib/billing/{types,store,neon-store,memory-store,process-event,adapters/<provider>}.ts`. `lib/offer.ts` gains `checkoutUrlFor({ userId, email })`; the buy button sends a signed-out visitor through sign-in first so the user id travels in metadata. Nothing is merged automatically; `linkBillingToUser` is the audited exception path.
- [ ] 3. `app/api/billing/webhook/route.ts` (`dynamic = 'force-dynamic'`, `maxDuration = 60`, raw body, constant-time signature check with a five-minute window before any database call; 400 on bad signature, 500 on processing failure so the provider retries). Processing per UD-§10.3 and the recovery table in §10.4: claim the event row (`on conflict … do update … where status = 'failed'`), fetch the object by id, `ignored_stale` if older than `last_event_at`, resolve the user (metadata id, else normalised email, else create), one fixed batch for record upsert, grant upsert or revoke, `recomputeMembership` and audit, then the ready email with `ready_email_sent_at` written after, then `processed`.
- [ ] 4. `app/api/cron/billing-reconcile/route.ts` (GET, `CRON_SECRET`), scheduled daily in the cron config file (resolution #9; the one deployment-config change in this phase): mirror every non-terminal record, re-queue `received` rows older than ten minutes as `failed`, send the ready email for paid rows with `ready_email_sent_at` null, null `billing_events.payload` older than 90 days, delete expired tokens and sessions past retention. The same function backs the admin "Resync" button.
- [ ] 5. Account billing panel on `app/(product)/account/page.tsx` (provider status, dates, manage link, or "no purchase" plus pricing). Environment: `BILLING_PROVIDER`, `BILLING_WEBHOOK_SECRET`, `BILLING_API_KEY`, `CRON_SECRET` on `meded` only, Sensitive, Production and Preview scoped as VM prescribes, provider test mode on Preview.
- [ ] 6. Tests per UD-§15 billing list, including the store fake that throws after each step in turn and converges after one retry or one reconcile pass; a payload containing `role: 'admin'` changes nothing.

**Phase 6: copy and policies** [UD-P6, UD-§12.3, CR-L5, CC-C follow-through] (one owner, one branch, no concurrent editor of these files):

- [ ] 7. `app/(public)/privacy/page.tsx`: replace "It sets no cookies of its own" with the strictly necessary session cookie disclosure (name, 90 days, why no banner); add "Accounts and sign-in" (email, transactional emails, session records, retention, how to delete); hosting names Vercel, Neon and SendGrid; resolve the four `Decision` placeholders and add the contact; the payment `Decision` stays until the provider is chosen; `POLICY_STATUS.privacy` stays `draft` until approved. The "draft for owner review" notice therefore stays visible to readers until the owner approves; do not hide, soften or restyle it to make the page look finished.
- [ ] 8. Remove "no accounts" sentences from pricing, support, account and FAQ; pricing, refunds (OD-16), updates (OD-20) and FAQ copy for the purchase; `lib/leads/config.ts` consent text review; update `docs/_archive/launch-handoff.md` blockers and `docs/_archive/cutover-runbook.md`.

**Phase 7: profile and survey hooks** [UD-P7, UD-§6.10, §6.11, §11] (any time after Phase 2):

- [ ] 9. `db/migrations/004_profiles_surveys.sql` (`realtor_profiles`, all optional; `survey_responses` only if the owner wants unmapped answers); `lib/users/profile.ts`; `app/api/account/profile/route.ts`; the account page profile form sets `profile_source = 'user'`. No survey UI. Sign-up, preview, checkout, webhook and `entitlement()` never read the profile.

Exit: a signed webhook fixture posted to the local build makes `/account` show the purchase; a grant made in the admin UI opens `/handbook/ch2` in the member's context and appears in the audit list; policies ready for the owner's approval.

### M8. Launch readiness (lane I)

Goal: `purchaseOpen()` can be flipped to true honestly. Nothing here is started before M5 and M7 are complete.

- [ ] 1. **Security headers** [CR-L1]. `next.config.ts` `headers()`: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `Content-Security-Policy: frame-ancestors 'none'`; hash the two constant inline scripts in `app/layout.tsx:32,36` for a full CSP (medium task; read `content-security-policy.md`). Verify with `curl -sI` against the production alias, not the dev server.
- [ ] 2. **Rate-limit backstop** [CR-L2]. A global per-window send ceiling on `/api/lead` and the auth request-link route as a cost backstop.
- [ ] 3. **Lead capture live** [CR-L5, FS-D3]: only after M5 step 1 (sender), the unsubscribe column and process, retention, and the privacy page (M7 step 7) are done, set `LEAD_CAPTURE_ENABLED=true` for Production on `meded` and redeploy (build-time variable).
- [ ] 4. **Owner inputs** (OD-23): price, checkout URL, access and update terms in `lib/offer.ts`; `POLICY_STATUS` for terms, refunds, updates (and privacy) to `approved` once the owner approves; `purchaseOpen()` then returns true by its own rule. Flipping it is a publishing action: ask.
- [ ] 5. **Pre-launch verification**: full `pnpm e2e` against a preview with the bypass secret, then against production; `curl -sI https://<host>/handbook/ch13` gives a redirect without a valid cookie [CR-M1 verify]; `/search-index.json` not public; a test purchase in provider test mode end to end; `vercel logs --level error`; Spend Management unchanged.
- [ ] 6. **Custom domain cutover**: out of this plan's scope; follow `docs/_archive/cutover-runbook.md` when the owner is ready.

Exit: launch-handoff blockers 1 to 5 closed; CR "Later / at launch" items closed; UD acceptance criteria all green.

## 7. File collision map

**Active collisions on 8 November.** The current list is maintained in `docs/plans/PROGRESS.md` ("Active collisions and in-flight work"); this callout is the snapshot at writing. The content session's uncommitted files (listed in M0) include `lib/state/index.ts`, which M6 step 10 (CR-L6) also edits, and the chapter HTML, which M4 Phase 1 and M6 step 11 also edit. No other lane touches those files until the content branch is committed and merged (M4 step 1b). Re-check this callout whenever a new session starts, and update it when the collision clears.

Files that more than one milestone or lane edits. Before spawning parallel agents, assign each file to exactly one of them for that round. Where two milestones are sequential (M2 then M6) the later one rebases on the earlier.

| File | Touched by | Rule |
|---|---|---|
| `app/globals.css` | M2 (H2, M6 scope start), M6 (M3, M4, M5, L13, L23, L24, L25) | One CSS agent at a time |
| `app/(public)/site.css` | M2 (H3), M5-P3, M6 (L25 undo rules) | Same |
| `components/site/Excerpt.tsx` | M2 (M6, L12, L14) | M2 only |
| `app/(public)/preview/page.tsx` | M2 (M6, L15, Appendix E), M5-P3 (opt-in form) | M2 lands first |
| `app/(public)/page.tsx` | M2 (L15), M5-P3 (hero rework) | M2 lands first |
| `app/(public)/pricing/page.tsx`, `refunds/page.tsx` | M2 (L15), M7-P5/P6 | Three separate passes; never concurrent |
| `content/site/faq.ts`, footer, About, Terms | M4 step 8 (CC-C), M7-P6 | Never concurrent |
| `app/(public)/privacy/page.tsx` | M7-P6 only (CR-L5 and UD-§12.3 together) | One edit |
| `lib/leads/mail.ts` | M5 step 1 (welcome rewrite), M5-P1 (auth mailer reuses) | Same lane |
| `lib/leads/validate.ts` | M2 (M7), M5-P1 (shared schema) | M2 lands first |
| `lib/leads/config.ts` | M2 (M7), M5 step 1 and M7-P6 (L5 review) | Sequential |
| `lib/leads/store.ts` | M6 (L3, L7) | M6 only |
| `components/shell/Gate.tsx` | M5-P2 (retire), M6 (L22 only if it survives) | Decide OD-18 first |
| `app/(product)/layout.tsx` | M5-P2, M7-P4 (admin layout) | Sequential |
| `app/(product)/handbook/[slug]/page.tsx` | M5-P2 | One lane |
| `components/shell/Sidebar.tsx` | M6 (M3 inert), M5-P2 (locked markers) | Partition by hunk is not allowed; sequence them |
| `components/shell/SidebarSearch.tsx` | M6 (L8, L18) | M6 only |
| `components/widgets/QuestionItem.tsx`, `KnowledgeCheck.tsx` | M6 (M2); M4 Phase 4 depends on the result | M6 before M4 step 12 |
| `components/site/PublicHeader.tsx` | M5-P3 (header state) and CR-M9 | Do M9 inside M5-P3 |
| `content/pages/*.html` | M4 (text), M6 (L19 bullets, L21 captions) | Assign chapters, not hunks; L19 and L21 after M4 Phase 3. **In flight, uncommitted, by the content session on 8 November**: no other lane touches them until M0 step 4 is done |
| `content/data/*.ts`, `lib/sources.ts`, `lib/glossary.ts`, `components/widgets/LeadSources.tsx`, `e2e/parity/{checkpoints,practice}.spec.ts` | M4 only | Lane C; in flight on 8 November (M0 step 4) |
| `lib/state/index.ts` | M4 (in flight: the `appointments` field), M6 (CR-L6 settings migration) | M6 step 10 waits for the content commit |
| `app/layout.tsx` | M2 (L13 via CSS, not the script), M8 (CSP hashes), M6 optional (`THEME_SCRIPT` from `TEXT_SIZES`) | Sequential |
| `next.config.ts` | M8 (L1) | M8 only |
| `app/robots.ts`, `app/sitemap.ts` | M5-P2, M5-P3 | Lane E |
| `e2e/site.spec.ts` | M2 (L12), M5-P3 (session seeding) | M2 lands first |
| `playwright.config.ts`, `e2e/global-setup.ts` | M1 (hydration signal), M5-P3 | Sequential |
| `package.json`, `tsconfig.json` | M1 (M10), M6 (`happy-dom`) | Ask before lockfile changes |
| `.env.example` | M3 (none, read only), M5 step 3, M6 (L3 comment) | Lane E owns it; M6 edits one line after |
| `AGENTS.md` | M1 step 3 (recovery note) | Keep the managed block verbatim |
| `lib/offer.ts` | M5 step 3, M7-P5 (`checkoutUrlFor`), M8 (values) | Sequential |

## 8. Verification matrix

| Milestone | Commands | Also |
|---|---|---|
| M1 | `pnpm typecheck`; `pnpm test`; `pnpm e2e` three times; `pnpm exec playwright test e2e/parity/search.spec.ts --repeat-each 10` | clean-clone typecheck |
| M2 | the three; `pnpm exec playwright test e2e/site.spec.ts` | dark-mode screenshots of `/handbook/ch7` and `/preview`; heading outline |
| M3 | VM 6a, 6b, 6c command lists; `pnpm e2e` against preview and production | result file; every **unchecked** item listed |
| M4 | the three; the extended consistency tests; optional content lint | Phase 1 definition of done |
| M5 | the three; `TEST_DATABASE_URL=<branch> pnpm vitest run <integration files>`; `pnpm e2e` with Mailpit | UD acceptance criteria for the gate |
| M6 | the three; the new happy-dom and e2e tests named per finding | screenshots at 360 and 320 px for the a11y items |
| M7 | the three; integration tests; a signed webhook fixture against the local build | admin flows in e2e |
| M8 | `pnpm e2e` against preview with the bypass secret, then production; `curl -sI` header and redirect checks on the alias | provider test-mode purchase |

Everything is run with `/opt/homebrew/bin/pnpm` or `PATH=/opt/homebrew/bin:$PATH`.

## 9. Risks and stop rules

- **Red suite as cover.** Until M1 lands, a passing build means nothing about regressions. Do not merge anything else first.
- **Alias drop during M3.** If `https://realestate-handbook.vercel.app` ever stops returning 200, stop and report before touching anything (VM-0, VM-3).
- **Production database window in M3.** Safe only because lead capture is off. If step 1 shows it on, the owner decides before the transfer.
- **Migrations on the wrong resource.** No `002+` migration is applied to any hosted database before M3's done-when list is met, and then only to a branch of the `meded` resource first, with permission.
- **Sender not verified.** No real email (welcome, sign-in link, ready email, confirmation) is sent before M5 step 1 passes. Links in spam make the whole sign-in flow fail silently.
- **Media leak.** An unanswered OD-17 at launch is an open leak; the static layer cannot be gated by proxy.
- **Coach coverage too early.** Authoring questions before the rules are frozen (M4 Phases 1 to 3), before CR-L14 and before CR-M2 produces rework and anonymous coach writes on `/preview`.
- **Two agents, one file.** Section 7 is binding. A conflict is resolved by sequencing, never by discarding uncommitted work.
- **Spend limit pause.** Enabling deployment-pausing takes the site down at $20 of usage. Only on an explicit yes (OD-29).
- **`purchaseOpen()`.** Flipping it is publishing. It happens once, at M8, on the owner's word, with the gate, policies and sender verified.

**When a stop rule fires.** Stop the action in progress. Run nothing that changes state. Leave the working tree and any staged changes exactly as they are. Write down the command, its output and the state observed (names and counts, never values). Report and wait. In M3, additionally do not redeploy and be ready to reverse the transfer per VM step 0. Resume only on an explicit instruction that names the step to resume from.

**Rollback outside M3.** VM carries its own rollback plan; the other milestones use these:

- Code: `git revert <hash>` of the offending commit (never `reset`), then the three verification commands. Small atomic commits (section 3.2) are what make this cheap.
- Content: the same, per chapter commit. `content/data/rules.ts` and the consistency tests must agree with the reverted text, so a revert that leaves them inconsistent fails the suite and says where.
- Migrations 002 to 004: applied to a Neon branch first, drop-only `-- down` blocks because they only add tables; for a later `alter table`, Neon point-in-time restore on the branch rather than a hand-written down script (UD-§14).
- The gate: reverting `proxy.ts` and the dynamic chapter page restores the open handbook; nothing else in M5 changes public behaviour (UD-§14).
- Build-time flags (`LEAD_CAPTURE_ENABLED`, `NEXT_PUBLIC_*`): a change in either direction takes effect only on the next deployment, so a rollback of one of these is a redeploy.
- Deployments: `vercel rollback <previous-deployment-id>` under the `meded` scope, with permission.

## 10. Document status and maintenance

- `docs/plans/MASTER-PROMPT.md` (this file): the sequencing authority. Ticks and decision answers are kept here.
- `docs/plans/PROGRESS.md`: the progress record. Milestone status, active collisions, open blockers, the append-only decision and step logs with commit hashes and verification results, and a hand-off note per session. These two are the only files under `docs/plans/`.
- `docs/_archive/master-plan.md`: the first version of this file, before the critique in section 12. Archived so only one plan is live; do not update it.
- The five source plans were moved to `docs/_archive/` on 8 November so that this file is the single live plan. They remain the authority for their own detail and are cited by tag throughout:
  - `docs/_archive/2026-11-08-code-review.md`: finding evidence and verification steps.
  - `docs/_archive/2026-11-08-course-content-review.md`: content detail; Phase 4 is tracked here.
  - `docs/_archive/free-sample-decision.md`: decided; its open items are OD-01, OD-02 and OD-18.
  - `docs/_archive/user-database-plan.md`: schema, flows and tests, through M7.
  - `docs/_archive/vercel-pro-migration-meded.md`: the executable prompt for M3; its result file goes beside it.
- Also in `docs/_archive/`: the older superseded documents; `launch-handoff.md` and `cutover-runbook.md` are still updated in M7 step 8 and consulted in M8 step 6.
- `docs/chapter-reviews/`: the October chapter review, mostly landed per CC; reference only.

## 11. Out of scope

Named so the gaps are explicit rather than silent. None of the five source plans sets criteria for these, and this document does not invent any:

- Performance budgets, Core Web Vitals or bundle-size targets. The site is static apart from the API routes; revisit when the gate makes chapter pages dynamic (M5) if page timings regress.
- Observability beyond `vercel logs --level error` and the Neon dashboard. No error tracker or metrics are planned.
- Accessibility beyond the code review's listed findings: no screen-reader pass, no axe-core, no forced-colours audit was run (CR coverage table). A fresh audit after M6 would be the time to add them.
- The custom domain cutover (`docs/_archive/cutover-runbook.md`) and the realtor survey UI (UD-§11).

## 12. Revision log

**8 November 2026, after an external critique of the first version (now `docs/_archive/master-plan.md`).** Each point and what was done with it:

| Critique point | Taken | Where |
|---|---|---|
| Too long to paste whole; add a session-briefing template and slice by milestone | Yes | "Session briefing" before section 1 |
| Resolution #7: say that uncommitted `/signup` copies must be preserved, not discarded | Yes, with the fact that none exist today | Section 2 #7 |
| Add "status at 8 November" to resolutions that depend on tree state | Yes, for #7, #8, #13, #17 | Section 2 |
| Repeat the typecheck recovery note under verification | Yes | Section 3.3 |
| Re-read the Next.js guide when the version changes | Yes | Section 3.1 |
| Mark a must-answer-first subset of decisions | Yes | Section 4, "Answer first" |
| Cross-reference section 7 from the lane description | Yes | Section 5 |
| M0: say the untracked `downloads/` folder will keep showing in `git status` | Yes; M0 steps 1 to 3 also ticked with hashes | M0 |
| M1: the three green e2e runs come after the typecheck change, on a clean tree | Yes | M1 verification |
| M3: an owner checklist at the top | Yes | M3 |
| M3: verify no env var points at the old Neon resource | Already in the exit criteria; added the how without printing values | M3 step 7 |
| M4: enforce the Phase 2 to Phase 1 hand-off strictly; re-verify no two sessions edit the same chapter files | Yes | M4 step 1b |
| M5: test that a revoked grant is enforced on the next request | Yes | M5 step 16 |
| M6: make the deferrals explicit in the exit criteria | Yes | M6 exit |
| M7: the privacy draft label stays visible until approval | Yes | M7 step 7 |
| Section 7: highlight today's `lib/state/index.ts` collision | Yes | Section 7 callout |
| Section 9: what to do when a stop rule fires | Yes | Section 9 |
| Rollback for non-Vercel milestones | Yes | Section 9 |
| Performance, observability and broader a11y criteria are missing | Recorded as out of scope rather than invented; the source plans set none | Section 11 |
| Dependence on the source plans being present | Not a change: they are committed under `docs/_archive/` and cited by tag | |
| Heavy dependence on timely owner decisions | Mitigated by the Answer-first subset; the dependence itself is real and is left visible | Section 4 |
