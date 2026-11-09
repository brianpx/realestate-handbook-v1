<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project instructions

## Project

- Stack: Next.js (App Router), TypeScript strict, Tailwind v4, Neon serverless Postgres (`@neondatabase/serverless`), zod for validation, Vitest + happy-dom for unit tests, Playwright for e2e. Hosted on Vercel.
- Layout: `app/` routes, `components/`, `content/` (handbook chapters and pages), `lib/`, `public/`.
- Server Components by default. Add `"use client"` only for interactivity, browser APIs, or local state.
- Never introduce Pages Router patterns (`pages/`, `getServerSideProps`, `pages/api/`) unless the file already uses them.
- Before writing any Next.js code, read the matching guide in `node_modules/next/dist/docs/`.

## Commands

Package manager: `pnpm` (lockfile is `pnpm-lock.yaml`; never create a second lockfile)

- Install: `pnpm install`
- Dev: `pnpm dev`
- Build: `pnpm build`
- Typecheck: `pnpm typecheck` (runs `next typegen` first so the generated route types exist on a clean clone). If `tsc` fails on a stale `.next/dev/types` validator that names a deleted route, restart `next dev` or remove that folder, then re-run.
- Test: `pnpm test` (single file: `pnpm test <path>`)
- E2E: `pnpm e2e`

There is no `lint` or `format` script. After any code change, run typecheck + the tests for what you touched. Fix failures caused by your changes before reporting done.

## Boundaries

- Never edit generated output: `.next/`, `dist/`, coverage, or lockfile contents except via the package manager.
- Never commit secrets, `.env*`, credentials, or `node_modules`.
- Do not modify CI, deployment, or infrastructure config unless that is the task.
- Do not touch IDE settings (`.vscode/`, `.idea/`) or shell config unless required.
- Keep the managed Next.js block above exactly as written; commit it with your work.

## Autonomy

- Carry the task through implementation, verification, and a final report. Don't stop at a plan or ask whether to continue.
- Look in the repo, docs, and tools before asking. Record material assumptions in the final report.
- Authorization given once continues for that scope; don't re-ask.
- Never infer authorization for destructive actions, publishing, sending messages, or spending money. Finish all useful preparation, then ask one concise question. Keep working on independent parts while waiting.

## Parallelism and subagents

- Before large work, split into independent units and run them concurrently when they share no files or state. Spawn them in one batch.
- Use read-only explore agents for broad codebase sweeps; return conclusions, not file dumps.
- Every subagent gets a self-contained brief: goal, files/docs to read, what's already ruled out, exact output expected.
- Editing subagents use worktree isolation. Partition so no two agents edit the same file.
- Treat subagent output as a claim to verify, not a fact. Final review is done by a fresh agent that did not write the code.
- Don't spawn an agent for a handful of tool calls or a lookup whose target is already known.

## Git hygiene

- Check `git status` and the branch before editing. Preserve existing uncommitted work; never discard it to resolve a conflict.
- Never work on `main`/`master`. Branch as `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `docs/<slug>`.
- Small atomic commits; tree builds and tests pass at each. Conventional Commits, imperative subject ≤ 72 chars, body says *why*.
- Stage explicitly. Never `git add -A` or `git add .`.
- Never force-push, rewrite shared history, amend pushed commits, or run `reset --hard` / `clean -fd` / `checkout -- .` without explicit authorization.
- Commit, push, or open PRs only when requested or already authorized. PR body: what, why, how verified, what's unverified.

## Code quality

- Match existing conventions (naming, layout, imports, error handling, test style). Consistency beats preference.
- Minimal, focused diffs. No drive-by refactors or reformatting of untouched lines; note opportunities in the report.
- No placeholders, hardcoded sample results, dead code, commented-out blocks, or `TODO` in place of working code.
- Strict typing: no `any`, no unchecked casts, no `@ts-ignore` / `eslint-disable` without a one-line justification beside it.
- Reuse existing utilities before adding a dependency. Handle errors explicitly; never swallow them.
- Remove `console.log`, debug output, and temp files before finishing.

## Verification and done

- Use the repo's own scripts and pinned versions; never substitute global tools.
- Bug fixes get a focused regression test when practical. Never weaken assertions or skip tests to pass.
- Review the final diff for accidental edits, secrets, debug output, and unrelated formatting.
- When verification is blocked, report the exact command, the failure, and what remains unverified. Never claim success without evidence.

**Done means:** the change is implemented, typecheck/lint/tests pass (or the exact failure is reported), the diff is clean, and the final report lists files changed, verification commands + results, assumptions, and blockers.

## Communication

- Progress updates: brief and non-blocking.
- Final report: what changed, how verified (commands + results), assumptions, blockers. Separate completed work from anything unverified.
