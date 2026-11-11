# Vercel Pro migration result: `realestate-handbook` on `meded`

Written 10 November 2026, about 09:15 UTC, by a read-only walk of M3 (COMPLETION-PLAN wave 3 item 5). Nothing was deployed, transferred, deleted, or changed on Vercel or Neon. No environment value, connection string, or bypass secret is in this file.

The walk followed `docs/_archive/vercel-pro-migration-meded.md` against the project as it already is. The owner decided on 9 November to keep Neon project `morning-credit-15469990` instead of Path A (a new resource). That decision supersedes the prompt's "no variable points at `morning-credit-15469990`" exit line and the instruction to remove the old resource.

## The three checks this walk was asked to confirm

### GitHub installation on `meded`: confirmed

The `meded` project is building from `brianpx/realestate-handbook-v1` through Git, so the team's GitHub connection can see that repository.

- `vercel` Git namespaces (`provider=github`) returned one namespace: slug `brianpx`, installation id `72846851`, owner type user, access not restricted, viewer role admin.
- GitHub's own installation API was not readable with this token (`GET /user/installations` 403; `GET /repos/brianpx/realestate-handbook-v1/installation` 401). The installation id above is Vercel's, not a GitHub response.
- The proof that this installation is the one `meded` uses is the production deployment below: source `git`, from that repo, on the `meded` project.

### Spend Management: pausing is off; the $10 notification is not what is saved

OD-29 (9 November) is: pausing off, notify only, notification at $10. A later decision-log row says the owner read the screen that day as notify at $10, limit $20, production pausing off.

`vercel budgets inspect --json --scope brian-pitts` on 10 November printed:

| Field | Value |
| --- | --- |
| Team | `meded` (`brian-pitts`, `team_1ZCqbOdEpNIvzb8gzxEVH7m7`) |
| Budget id | `budget_01kr6np52ze07vq7hacmrg0g5w` |
| Amount | $100 |
| Status | active |
| Pause | false |
| Webhook | absent |
| Current on-demand spend | $0.00 (0%) |
| Thresholds | 50%, 75%, and 100%, each with notifications on and pause off |

Pausing matches OD-29. The first notification is 50% of $100, which is $50, not $10. The $20 limit from the 9 November screen note is not the saved amount. This walk did not change the budget. On this CLI, `vercel budgets set --amount 20 --no-pause --scope brian-pitts` is the command that would make the 50% notification $10 and leave pausing off. It was not run.

### Git link: confirmed

Project API `link` on `realestate-handbook`:

| Field | Value |
| --- | --- |
| type | github |
| org | `brianpx` |
| repo | `realestate-handbook-v1` |
| repo id | `1422952073` (same id `gh api repos/brianpx/realestate-handbook-v1` returned; default branch `main`; public) |
| production branch | `main` |
| git credential | set (id not copied here) |
| link created | 2026-10-20T01:37:54Z |

Newest production deployment at the time of the walk: `dpl_7qKVu6bqdfn8iS8eqfrYPSWCb3Tx`, URL `realestate-handbook-huogh5obd-brian-pitts.vercel.app`, Ready, target production, source `git`, ref `main`, sha `2e02de74e268fceb2ce67d8792ab33a2ba82be72` ("Merge pull request #50 from brianpx/feat/coach-port-and-postclose"). Creator username `brian-pitts`.

## Identity

| Item | Value |
| --- | --- |
| CLI | Vercel CLI 62.2.0 at `/opt/homebrew/bin/vercel`. `vercel integration list` and `vercel budgets` both exist, so Decision 4's upgrade was not required. Before and after are the same version. |
| `vercel whoami` | `brian-pitts` |
| Team | `meded`, slug `brian-pitts`, id `team_1ZCqbOdEpNIvzb8gzxEVH7m7`, plan **pro** (`billing.plan` `pro`, `planIteration` `plus`, `status` active, `platform` stripe). No card last-four was printed. |
| Other scope | `brianpxs-projects` is Hobby. `vercel project ls --scope brianpxs-projects` lists `whale-tracker-v2`, `whale-tracker`, and `vc-clone`. `realestate-handbook` is not among them. |
| Project | `realestate-handbook`, id `prj_RtoVEbnWQiUEpZQgK9V01FDaNLbU`, owner `meded`, created 19 October 2026, Node 24.x, framework Next.js, root directory `.` |
| Org and project id before the transfer | Not recorded by the session that transferred it. The project id is the same one earlier notes attributed to the personal scope. **Unchecked:** who transferred it, and the dialog's moves / does-not-move list. |

## Commands that were read because they were unfamiliar

`vercel billing` is not a command on 62.2.0. Spend Management is `vercel budgets` (beta). The option text that matters:

`vercel budgets` subcommands: `inspect` (default; this cycle's on-demand spend), `list`, `set`, `remove`.

`vercel budgets set`: `--amount <DOLLARS>` (whole dollars, minimum 1; creates with 50/75/100% alerts and notifications on; updates keep pause and webhook unless those flags are passed), `--pause`, `--no-pause` ("Do not pause all projects or their production deployments when the budget is reached"), `--webhook <URL>`, `--no-webhook`.

## What was checked, by step

### 0. Rollback plan

Read. Transfer back is Settings, General, Transfer Project. `vercel rollback <id>` runs under whichever scope owns the project. The kept Neon resource is still the one connected, so there is no second resource to point `DATABASE_URL` back at. The public host that must keep returning 200 is `https://www.findnurturekeep.com`, not the removed `vercel.app` alias (below).

### 1. Pre-flight

Repo root, package name `realestate-handbook`, `db/migrations/001_leads.sql` present. No `vercel.json`, no `vercel.ts`, no `.vercel/` in the root checkout (`.vercel` is gitignored). `.env.local` is gitignored (`.gitignore` `.env*`); the only name in it is `SHADCNUIKIT_API_KEY`.

`which`: `pg_dump` not found, `psql` not found, `neon` at `/opt/homebrew/bin/neon`. `which pnpm` resolved to `~/.grok/bin/pnpm`; it was not run.

`vercel link` was not run. The project is already on `meded`, and the root checkout had unrelated uncommitted work.

`vercel project inspect realestate-handbook --scope brian-pitts` matches the identity table. `vercel ls realestate-handbook --scope brian-pitts --prod` shows recent production builds under `brian-pitts/realestate-handbook`, the newest Ready about two hours before the walk (the deployment in the Git-link section). Several older rows in that list are Canceled; the newest Ready row is a git build, so those cancels were not treated as a GitHub-auth failure.

Neon MCP `describe_project` and `list_branches` for `morning-credit-15469990` returned 404 from this connection. Row counts were not re-run. The 9 November pre-flight remains the last reading of that project id, its branches, and the zero row counts.

### 2. Pro and Spend Management

Pro: confirmed, above. Spend Management: see the three checks. Left unchanged.

### 3. Transfer

Already done before this walk. The project name is still `realestate-handbook` and the account id is the `meded` team. This walk did not open the transfer dialog, so the dialog text is **unchecked**.

- `curl -sI https://www.findnurturekeep.com` returned `HTTP/2 200` with the site CSP (`script-src 'self' 'unsafe-inline'` and the rest of the M8 policy).
- `curl -sI https://realestate-handbook.vercel.app` returned `HTTP/2 404` and `x-vercel-error: DEPLOYMENT_NOT_FOUND`. The owner decided on 10 November to remove that alias because it served an old deployment. Project domains now are `findnurturekeep.com` (verified, redirects to `www.findnurturekeep.com`) and `www.findnurturekeep.com` (verified, no redirect).
- Neon variable names are present (step 5). They are type Secret, not plain values.
- Git link: confirmed, above.
- Deployment protection: `ssoProtection.deploymentType` is `all_except_custom_domains`.
- Protection Bypass for Automation: one secret is present on the project. The value was not recorded. Rotation stays skipped until remote e2e (decision log, 9 November).

### 4. Database, under the keep decision

Path A (provision a new Neon resource and retire the old one) was not done. The owner kept the existing resource.

`vercel integration list realestate-handbook --scope brian-pitts` printed one resource: name `realestate-handbook-db`, status available, product Neon, id `store_pPuSqinKAVS2Sqoa`, installation `icfg_ZahY8BXfyvanszzwRA1WyjRQ`, project `realestate-handbook`.

`DATABASE_URL` is a Secret on Preview and Production. Development has no environment variables, which is the 9 November decision (local work uses a gitignored file; Vercel Development stays empty). The integration does not offer per-environment branch mapping (decision log, 9 November). `db/migrate.ts` `refusalReason` skips migrations when `VERCEL_ENV` is not production and the database host is `PRODUCTION_DB_HOST`. That variable is set on Preview and Production.

**Unchecked today:** which Neon branch Preview's `DATABASE_URL` points at, and that the stored id is still `morning-credit-15469990`. Both were read on 9 November. This walk did not pull any environment value.

### 5. Environment variables

`vercel env ls --project realestate-handbook --scope brian-pitts`. Every row was type Secret. Names and environments only:

| Name | Environments |
| --- | --- |
| `COMING_SOON` | Production |
| `LEAD_FROM_EMAIL` | Production |
| `SENDGRID_API_KEY` | Production |
| `PRODUCTION_DB_HOST` | Preview; Production |
| `AUTH_IP_SALT` | Preview; Production |
| `ADMIN_BOOTSTRAP_EMAILS` | Production |
| `VITE_NEON_AUTH_URL`, `POSTGRES_URL_NO_SSL`, `POSTGRES_USER`, `POSTGRES_DATABASE`, `NEON_PROJECT_ID`, `PGHOST`, `POSTGRES_URL`, `POSTGRES_PASSWORD`, `PGHOST_UNPOOLED`, `PGDATABASE`, `PGPASSWORD`, `POSTGRES_HOST`, `NEON_AUTH_BASE_URL`, `PGUSER`, `POSTGRES_URL_NON_POOLING`, `POSTGRES_PRISMA_URL`, `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | Preview, Production |

Development: none. `LEAD_CAPTURE_ENABLED` is absent, so lead capture is off. `SENDGRID_API_KEY` is not on Preview.

Absent relative to `.env.example` and the prompt's app list: `NEXT_PUBLIC_SITE_URL`, `SITE_INDEXABLE`, `LEAD_IP_SALT`, `LEAD_ALLOWED_ORIGINS`, `LEAD_MAILING_ADDRESS`, `LEAD_FROM_NAME`, `LEAD_REPLY_TO`, `NEXT_PUBLIC_COACH_ENABLED`. Those belong to later milestones (sender, launch), not to a value invented here. No Production or Development pull was made.

### 6. Release

Not run as the prompt's local, then preview, then `vercel --prod` ceremony. Production is already served by meded git builds. `www.findnurturekeep.com` returned 200 from the deployment above. `/api/lead`, `/robots.txt`, and `/sitemap.xml` were not requested in this walk. Playwright was not run against a preview or production URL. The bypass secret has not been rotated, by the owner's 9 November choice, and remote e2e waits on that.

### 7. Cleanup and record

The Neon resource stays. It is the kept database, and it is already attached to `meded`, not left behind on `brianpxs-projects`. The prompt's check that no pulled value contains `morning-credit-15469990` (count must be 0) contradicts the keep decision and was not run. Scratch env files and `/tmp/leads.sql` were not created. This file is the result file. A dated pointer was added to `vercel-preview-plan.md`; the 20 October table there was left as the snapshot it is.

## Done-when, against the prompt and against the keep decision

| Prompt line | This walk |
| --- | --- |
| Alias 200 from a `meded` build | `www.findnurturekeep.com` returned 200 from `dpl_7qKVu6bqdfn8iS8eqfrYPSWCb3Tx`, a `meded` git build. `realestate-handbook.vercel.app` returns 404 `DEPLOYMENT_NOT_FOUND` because the owner removed it. |
| No variable points at `morning-credit-15469990` | Superseded. The keep decision is that this project is the database. Not re-tested by pulling values today. |
| Preview and Development on non-production branches, `DATABASE_URL` scoped three ways | Not met as written. Development has no `DATABASE_URL` on purpose. Preview and Production both have the integration's `DATABASE_URL`. Per-environment branch mapping is not available; the runner guard is the control. |
| Git link points at `brianpx/realestate-handbook-v1` and is authorised | Met. See above. |
| Bypass secret exists and Playwright used it | The secret exists. Playwright has not used it. Rotation still pending. |
| $10 alert and $20 limit | Not met. Amount $100, first notification at $50, pause off. |
| Nothing for this project left in the personal scope except what the owner kept | Met for the project: `realestate-handbook` is not in `brianpxs-projects`. The database was kept, and it lives on the `meded` integration. |
| Result file lists every unchecked item | This file. |

## Unchecked

- Who transferred the project, and the transfer dialog's list of what moves.
- Who ran migrations 002 and 003 on the production branch (owner not sure; recorded 10 November).
- Neon project id, branch names, and row counts, today (Neon MCP 404; last reading 9 November).
- Which branch Preview `DATABASE_URL` points at, today (would require reading a secret).
- `pg_dump` and `psql` are not on this machine.
- The prompt's pull-and-grep for `morning-credit-15469990` (superseded, and it would write secret files).
- Remote Playwright (6b and 6c), `/api/lead` on the live host, and a card last-four.
- GitHub's installation API. The working git deployment is the evidence used instead.

## Sequencing note

The migration prompt says to end with: the user-database plan's variables and migrations `002+` apply only to a new Neon resource under `meded`, and nothing new goes on `morning-credit-15469990`.

That sentence is superseded by the keep decision of 9 November. `morning-credit-15469990` is the `meded` database. Migrations `002+` apply to it, on a non-production branch first, which is the rule already in use. Do not provision a second Neon resource to satisfy the old sentence.
