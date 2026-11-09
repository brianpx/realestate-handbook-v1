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

*Updated 8 November 2026.* The planning phase is complete and merged to `main` (`6d63992`): the five source plans live in `docs/_archive/`, `AGENTS.md` carries the project instructions, and `MASTER-PROMPT.md` is the live plan. No engineering milestone has started. Another session has content-review Phase 2 work uncommitted in the tree (see M4 and the collision note below); until it is committed, no other lane touches `content/`, `lib/sources.ts`, `lib/glossary.ts`, `lib/state/index.ts` or `components/widgets/LeadSources.tsx`. The next unblocked work is M1 (green e2e baseline), which needs no owner decision. The "Answer first" decisions in `MASTER-PROMPT.md` section 4 are all unanswered.

## Milestone status

| Milestone | Status | Branch | Started | Finished | Notes |
|---|---|---|---|---|---|
| M0 Housekeeping | in progress | `docs/plans-master` (merged, deleted) | 2026-11-08 | | Steps 1 to 3 done; step 4 waits on the content session's commit; step 5 waits on OD-17 |
| M1 Green baseline | not started | `fix/e2e-green` | | | No decision needed. OD-24 only affects step 4 (CI) |
| M2 Sample and preview fixes | not started | `fix/preview-sample` | | | Needs M1 green to verify |
| M3 Vercel Pro migration | not started | none (no commits; result file after) | | | Owner checklist at the top of M3 must be complete first |
| M4 Content revision | in progress | content session's branch (Phase 2); Phase 1 not started | 2026-11-08 | | Phase 2 landing before Phase 1; Phase 0 decisions OD-03 to OD-09 unanswered |
| M5 Accounts, sign-in, gate | not started | `feat/auth-core`, `feat/access-gate`, `feat/signup-home` | | | Blocked on M3 for any hosted migration and on the sender (OD-23) for any real send |
| M6 Hardening and a11y | not started | several, see M6 | | | `lib/state/index.ts` and chapter HTML wait for the content commit |
| M7 Admin, billing, copy, profile | not started | `feat/admin`, `feat/billing`, `docs(site)/policies-copy`, `feat/profile` | | | Blocked on M5 and the billing provider choice |
| M8 Launch readiness | not started | | | | Blocked on M5 and M7 |

## Active collisions and in-flight work

| Files | Who has them | Since | Blocks | Clears when |
|---|---|---|---|---|
| `content/pages/{ch1,ch2,ch3,ch5,ch6,ch8,ch9,ch10,ch11,ch12,ch13,app-d,app-e}.html`, `content/data/{checkpoints,qualify}.ts`, `components/widgets/LeadSources.tsx`, `lib/{sources,glossary}.ts`, `lib/state/index.ts`, `lib/{checkpoints,sources-pipeline}.test.ts`, `e2e/parity/{checkpoints,practice}.spec.ts` | content session, uncommitted (M4 Phase 2 items 9c, 9d, 9e) | 2026-11-08 | M4 Phase 1, M6 steps 10 and 11 | the content branch is committed and merged; then run M4 step 1b |
| root `downloads/` (untracked) | nobody | 2026-11-08 | M0 step 5 | OD-17 is answered |

## Open blockers

| Blocker | Blocks | Owner action |
|---|---|---|
| OD-01, OD-03 to OD-09, OD-10, OD-11, OD-17, OD-23 (from-address and postal address), OD-24 unanswered | M2 step 3 copy (default assumed), M4 Phase 0, M5, M1 step 4 | Answer in `MASTER-PROMPT.md` section 4; log below |
| `meded` GitHub app access and Pro plan unconfirmed | M3 | Owner checklist at the top of M3 |
| Content Phase 2 branch uncommitted | M4 Phase 1, M6 steps 10 and 11 | Content session commits on its branch after typecheck, test and e2e |

## Decision log (append-only)

| Date | Decision | Answer | Logged by |
|---|---|---|---|
| | | | |

## Step log (append-only)

| Date | Step | Branch | Commit(s) | Verification run and result | Notes, assumptions, unverified |
|---|---|---|---|---|---|
| 2026-11-08 | M0.1 docs reorganisation committed | `docs/plans-master` | `4450278` | n/a (docs only) | Twelve docs into `docs/_archive/`, plans gathered, master plan added |
| 2026-11-08 | M0.2 Preface line in free-sample decision | `docs/plans-master` | `4450278` | n/a | Preface belongs to the signed-in free set, not `/preview` |
| 2026-11-08 | M0.3 AGENTS.md project instructions committed | `docs/plans-master` | `7a650a1` | n/a | Managed Next.js block unchanged |
| 2026-11-08 | Plans moved to `docs/_archive/`; master plan the only file under `docs/plans/` | `docs/plans-master` | `d751dce`, `d706a3b` | n/a | Cross-references repointed; fast-forwarded into `main` and pushed |
| 2026-11-08 | `MASTER-PROMPT.md` written from an external critique; `master-plan.md` archived; this file created | `docs/master-prompt` | `6d63992` | n/a (docs only) | Revision log in `MASTER-PROMPT.md` section 12; fast-forwarded into `main` |

## Session hand-off notes (append-only)

One short paragraph per session: what it did, what it left unverified, what the next session should start with.

- **2026-11-08, planning session.** Wrote the master plan from the five source plans, revised it into `MASTER-PROMPT.md` after a critique, archived the originals, created this file. All of it is committed and merged to `main` (`6d63992`), not yet pushed. Nothing engineering-side was run. Next session: push `main` if the owner wants, then start M1 on `fix/e2e-green`.
