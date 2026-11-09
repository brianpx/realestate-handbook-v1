# Prompt: move `realestate-handbook` to the Vercel Pro team `meded`

Drafted 8 November 2026, revised the same day against the current Vercel docs, then tightened after review (Git access as a hard pre-condition, a stop rule if the alias drops after transfer, explicit Neon branching fallback, and sequencing with the user-database plan). This is a prompt to hand to an agent session (or to follow by hand). Companion to `../_archive/vercel-preview-plan.md` (what was true on 20 October) and `../_archive/cutover-runbook.md`.

Facts below were read from the repo on 8 November 2026 or from Vercel's documentation the same day. Anything the agent cannot confirm live must be marked **unchecked**, not assumed. Items tagged **(docs)** come from Vercel's documentation and should be re-read against the live dialog or `--help` output before acting.

---

You are helping move the Vercel project for this repository from the personal Hobby scope `brianpxs-projects` (account `brian-pitts`) to the paid Pro team **`meded`**, with zero downtime for the public alias.

## Decisions already made (do not re-ask these)

1. **Database: Path A.** Provision a **new** Neon resource on `meded` through its existing Marketplace Neon integration. The old personal-scope resource is retired at the end. If `leads` or `lead_attempts` turn out to have rows, copy them (step 4) — still Path A.
2. **Release order: local → preview → production.** After env vars are in place: run the app locally against the new Neon *development* branch first, then create a **preview deployment** with `vercel` and test it, then promote with `vercel --prod` from this checkout. No pushes to `main` for this migration.
3. **Environment variables: best practice, your call.** Scope every variable to only the environments that need it; mark secrets (`SENDGRID_API_KEY`, `LEAD_IP_SALT`, `VERCEL_AUTOMATION_BYPASS_SECRET`, all Neon credentials) as **Sensitive**; Preview and Development must never hold Production database credentials; recreate only variables that existed before or that `.env.example` marks as required. Still **ask me for any value you do not have** — never invent one.
4. **CLI: upgrade if needed.** Run `vercel upgrade` (or `pnpm add -g vercel@latest` if that command is missing on 62.2.0) without asking if any sub-command below is missing or misbehaves. Report the before/after version.
5. **Spend Management on `meded`: budget alert at $10, hard spend limit $20.** Set the notification threshold at $10 and the spend amount at $20. **Before enabling "pause production deployments when the limit is reached", tell me plainly that this means the live site goes down at $20 of usage and wait for my yes.** Without that option the limit only notifies.

## What this project is

- **Repo:** `brianpx/realestate-handbook-v1`, production branch `main`. Package name `realestate-handbook`. Next.js App Router, `pnpm` (use `/opt/homebrew/bin/pnpm`; the `~/.grok/bin` shim is broken), TypeScript, Tailwind. Vercel builds on Node 24.
- **Vercel project today:** `realestate-handbook` in scope `brianpxs-projects`, Git-linked to the repo above. Public alias `https://realestate-handbook.vercel.app` (protection `all_except_custom_domains`). **No custom domain yet**; the domain cutover is a separate, later step in `../_archive/cutover-runbook.md`. The local `.vercel/` folder is currently **absent**, so the checkout is not linked.
- **No `vercel.json` and no `vercel.ts`.** No crons, rewrites, or `env` / `build.env` entries to migrate. (The `lead_attempts` cleanup in `db/migrations/001_leads.sql` runs on the request path, not as a cron.)
- **Database: Neon, not Supabase.** The only database use is the lead-capture store (`lib/leads/neon-store.ts`; tables `leads` and `lead_attempts` in `db/migrations/001_leads.sql`). It was provisioned through the **Vercel Marketplace Neon integration** on the personal scope and backs Neon project `morning-credit-15469990` ("realestate-handbook"). That integration put 18 variables on the project (`DATABASE_URL`, `POSTGRES_*`, `PG*`, `NEON_*`, `VITE_NEON_AUTH_URL`), all set for Production, Preview and Development alike. The code reads only `DATABASE_URL`. Lead capture is **off** in production (`LEAD_CAPTURE_ENABLED` unset), so the tables are probably empty; confirm with row counts.
- **The `meded` team already has the Neon integration installed.** The new resource goes there.
- **App environment variables that matter** (see `.env.example` for meaning and which are build-time): `NEXT_PUBLIC_SITE_URL`, `SITE_INDEXABLE`, `LEAD_CAPTURE_ENABLED`, `LEAD_IP_SALT`, `LEAD_ALLOWED_ORIGINS`, `NEXT_PUBLIC_COACH_ENABLED`, SendGrid (`SENDGRID_API_KEY`, `LEAD_FROM_EMAIL`, `LEAD_MAILING_ADDRESS`, `LEAD_FROM_NAME`, `LEAD_REPLY_TO`), `MAILPIT_URL` (dev only), `VERCEL_AUTOMATION_BYPASS_SECRET` (Playwright against protected previews). On 20 October none were set on Vercel; re-check.
- **Tooling on this machine:** Vercel CLI 62.2.0 at `/opt/homebrew/bin/vercel`. `neon` CLI at `/opt/homebrew/bin/neon`. Neon MCP tools for read-only inspection (`list_projects`, `describe_project`, `get_connection_string`, `run_sql`); never call a destructive Neon tool without asking. `pg_dump` / `psql` availability is **unchecked**.
- **Verification already exists:** `pnpm typecheck`, `pnpm test` (vitest), `pnpm e2e` (Playwright; set `PLAYWRIGHT_BASE_URL`, plus `VERCEL_AUTOMATION_BYPASS_SECRET` if the URL is behind Vercel login). `lib/leads/neon-store.integration.test.ts` runs against a real Neon database when `TEST_DATABASE_URL` is set; point it at a branch, never production.

## What Vercel's docs say moves and does not move **(docs — confirm against the live dialog)**

Moves with a project transfer: deployments, the `*.vercel.app` alias (project name reused by default, so the alias should survive if the name is unchanged), project settings, and environment variables — **apparently including the Neon integration's 18 variables as plain copies**; whether they arrive as plain values or are dropped is **unchecked** and is the first thing to inspect after the transfer.

Does **not** move: integrations (the Neon connection must be re-established on `meded`) and `vercel.json` `env`/`build.env` entries (none here). Usage history and log drains are expected to stay behind.

Consequences for ordering:

- If the 18 Neon variables **are** copied as plain values, the transferred project keeps working against the **old** database until we change it. Good for zero downtime, but Production `DATABASE_URL` then points at a resource we intend to retire — step 4 swaps it before step 7 removes anything.
- Connecting the new Neon resource will try to create the same variable names. Delete the copied plain values (a Production env change — **ask first**) immediately before connecting the new resource, in the same sitting.
- Unverified: whether a project still connected to a Marketplace resource can be transferred at all, or whether the dialog demands disconnecting first (the *integration* transfer flow has that rule; the *project* transfer docs do not say). If the dialog blocks, stop and show me.

## Ground rules

- Prefer the CLI; use the dashboard where there is no reliable CLI equivalent (project transfer, plan confirmation, Spend Management).
- **Pause and ask before** anything billing-related beyond Decision 5, before the project transfer, before deleting, disconnecting or re-creating anything, before changing any environment variable in Production, before enabling deployment-pausing on the spend limit, and before any write to a Neon database.
- Show the output of each major command. Report what actually printed; mark anything you could not check as **unchecked**.
- Do not commit or push. Deploy only at the points in step 6.
- Never print environment variable values. Names and environments only.
- Run `<command> --help` before any sub-command you have not confirmed exists (`vercel integration …`, `vercel integration resource …` / `vercel ir …`, `vercel upgrade`, `vercel rollback`, `vercel env add` flags). Paste the exact `--help` output of any command you were unsure about into the result file (step 7). There is **no** CLI command to buy or change a team plan.

## 0. Rollback plan (read first; invoke if step 3 or 6 goes wrong)

- The transfer is reversible via the same Settings → General → Transfer Project flow back to the personal account **(docs)**.
- Until step 7 the old Neon resource still exists, so a database rollback is "point `DATABASE_URL` back at it". Nothing is destroyed before step 7.
- Deployment rollback: `vercel rollback <previous-deployment-url-or-id>` under whichever scope owns the project at that moment. Record the pre-transfer production deployment id in step 1.
- If the alias ever stops returning 200, stop everything and report before touching anything else.

## 1. Pre-flight and inspection (read only)

- Confirm the working directory is the repo root (`package.json` name `realestate-handbook`, `db/migrations/001_leads.sql` present).
- Confirm no `vercel.json` / `vercel.ts` and that `.vercel/` is absent. Confirm `.env.local`, if present, is git-ignored and list its variable names.
- Tooling: `vercel --version`, `which pg_dump psql neon`. Upgrade the CLI now if `vercel integration --help` or `vercel integration resource --help` is missing (Decision 4).
- Run and show:
```sh
  vercel whoami
  vercel teams ls
  vercel project ls --scope brianpxs-projects
  vercel project ls --scope meded
```
Note whether `realestate-handbook` already exists under `meded` (a clash would force a rename, which changes the alias — we do not want that).
- Link without changing anything:
```sh
  vercel link --scope brianpxs-projects --project realestate-handbook --yes
  cat .vercel/project.json
  vercel env ls
  vercel domains ls
  vercel integration list
  vercel ls --prod
```
Record to a scratch file (names only): `orgId`, `projectId`, the current production deployment id and URL, the env var list per environment, and the Neon resource name as Vercel shows it.
- Dashboard, `brianpxs-projects` → `realestate-handbook` → Settings → Git: note the repo and which GitHub installation authorises it. Then `meded` → Settings → Git: does the team's GitHub installation have access to `brianpx/realestate-handbook-v1`? **The docs do not say what happens to the Git link if not. This is a hard pre-condition, not an unchecked item to carry forward: do not open the transfer dialog in step 3 until the `meded` team's GitHub app can see the repository.** If it cannot, stop and tell me — I will authorise the GitHub app, then you re-check and show me the result.
- Neon side (read only): `neon projects list` or MCP `list_projects`; confirm `morning-credit-15469990` and its owning org. Run `select count(*) from leads;` and `select count(*) from lead_attempts;` on its default branch and show the counts.

## 2. Confirm `meded` is on Pro and set Spend Management

- `vercel switch meded`.
- Dashboard `meded` → Settings → Billing: tell me the plan shown. If it is still Hobby, stop — I will upgrade it myself.
- Confirm a payment method is on file (a Marketplace resource may prompt for one in step 4).
- Spend Management: set the spend amount to **$20** and a notification at **$10** (Decision 5). Show me the screen before saving. Leave "pause deployments" **off** unless I say yes after your warning.

## 3. Transfer the project to `meded` (zero downtime)

- **Blocking pre-condition:** the `meded` GitHub installation must already have access to `brianpx/realestate-handbook-v1` (step 1). Do not open the transfer dialog until that is confirmed and shown to me.
- Dashboard: `brianpxs-projects` → `realestate-handbook` → Settings → General → **Transfer Project** → target `meded`. Keep the name unchanged. Before confirming, paste the dialog's list of what moves and does not move back to me verbatim and call out any difference from the docs section above.
- If the dialog refuses because of the connected Neon resource, stop and show me.
- Wait for my explicit yes, then transfer.
- After the transfer:
```sh
  rm -rf .vercel
  vercel link --scope meded --project realestate-handbook --yes
  cat .vercel/project.json
  vercel ls --prod
  vercel env ls
  vercel integration list
  curl -sI https://realestate-handbook.vercel.app | head -5
```
The alias must still return 200 from the **same** deployment id as step 1. Do not redeploy yet.
- **Stop rule.** If the alias does not return 200 from the same deployment id, or if `vercel env ls` shows the Neon variables missing, **stop**. Do not delete anything, do not provision a new resource, do not redeploy. Report the state exactly as printed and be prepared to reverse the transfer (step 0).
- Why the window is safe: lead capture is off in production (`LEAD_CAPTURE_ENABLED` unset), so a brief period in which Production still points at the old `DATABASE_URL`, or has none, loses no data. If step 1 shows lead capture is actually **on**, say so before transferring; the window is then not free and I need to decide.
- Report which of the 18 Neon variables arrived as plain values, per environment, and whether any Neon resource shows as connected (expected: none).
- Dashboard `meded` → project → Settings → Git (link survived and authorised) and → Deployment Protection (`all_except_custom_domains` survived).
- Protection Bypass for Automation: check whether the secret survived the transfer. Either way, before step 6b it must exist on the `meded` project and the value must be available to Playwright locally. If it is gone, ask, then re-create it (a new value; update wherever the old one was stored). Record survived / re-created in the result file.

## 4. Database: new Neon resource on `meded` (Path A)

1. If step 1 counts were non-zero: `pg_dump --data-only -t leads -t lead_attempts "$OLD_URL" > /tmp/leads.sql` (get `$OLD_URL` via `vercel env pull` to a temp file or MCP `get_connection_string`; never echo it). Show row counts and dump size.
2. **Confirm the new resource can be provisioned before removing anything.** Run `vercel integration add --help` and `vercel integration list` under `meded`; confirm the Neon integration is installed on the team, that a payment method is on file (step 2), and which Neon plans the flow offers. Paste the `--help` output into the result file. Do not run the add command yet.
3. **Ask once for both actions** — deleting the copied variables *and* running the provisioning command in sub-step 4 — then delete the copied plain Neon variables from the `meded` project (all 18, all environments) and go straight to the next sub-step in the same sitting. From this moment until the new production deployment in 6c, the live site has no `DATABASE_URL`; that is acceptable only because lead capture is off (see the step 3 note).
4. **Immediately** provision, with the checkout linked to `meded`: `vercel integration add neon --name realestate-handbook` (it auto-provisions **and connects to the linked project**, so it is a Production env change, covered by the yes from sub-step 3). Choose the lowest Neon plan that offers branching; if the only option is paid, stop and tell me the price. Confirm the resource is connected for Production, Preview and Development.
5. **Preview and Development must never hold a Production `DATABASE_URL`.** The exact option that exists today is **unchecked** until you see it in the resource settings or `--help`:
   - If the resource settings offer per-preview-deployment branching, enable it, then confirm what Development received — if Development still shows the production branch, create a `development` branch and re-scope `DATABASE_URL` for Development to it.
   - Otherwise create `preview` and `development` branches (`neon branches create` or MCP `create_branch`; ask first) and re-scope `DATABASE_URL` for Preview and Development to each branch's connection string.
   - Fallback either way: Development always gets its own branch, so local `pnpm dev` and the integration test never touch production data. Before leaving this step, `vercel env ls` must show `DATABASE_URL` scoped separately for Production, Preview and Development, and you must state which Neon branch each one points at (names only).
6. Apply `db/migrations/001_leads.sql` to the main branch (ask first; it is a write), then to the preview/development branches if they were created before the migration ran. If there was a dump, `psql "$NEW_URL" < /tmp/leads.sql`, then re-run the row counts on the new database and show them beside the step 1 counts. Also run `select count(*), min(created_at), max(created_at) from leads;` on old and new and report counts and timestamps only — never connection strings or row contents.
7. Do not remove or disconnect the old personal-scope resource until step 7.

## 5. Environment variables (best practice — Decision 3)

- `vercel env ls` under `meded`; diff against the step 1 list and report missing/extra per environment.
- For each app variable: recreate it only if it existed before or `.env.example` marks it required. Ask me for values you do not have. Add with `vercel env add <NAME> <environment>` one at a time (check whether 62.2.0 supports a `--sensitive` flag; otherwise mark Sensitive in the dashboard). Preview gets `SITE_INDEXABLE` unset and `NEXT_PUBLIC_SITE_URL` pointing at the preview URL pattern or left unset per `.env.example` guidance; never give Preview production SendGrid credentials unless I say so.
- Mind build-time variables (`NEXT_PUBLIC_SITE_URL`, `LEAD_CAPTURE_ENABLED`, `NEXT_PUBLIC_COACH_ENABLED`): they need a redeploy to take effect, which step 6 provides.
- `vercel env pull .env.local --environment development` for local dev (confirm `.env.local` is git-ignored first). Do not pull Production values locally unless a check requires it, and delete the file afterwards if you do.
- Protection Bypass for Automation: confirm the step 3 check is resolved (secret survived or was re-created) and that `VERCEL_AUTOMATION_BYPASS_SECRET` is available to Playwright before 6b.

## 6. Release: local → preview → production (Decision 2)

**6a. Local.** With `.env.local` pulled from Development: `pnpm install`, `pnpm typecheck`, `pnpm test`, then `TEST_DATABASE_URL=<development branch URL> pnpm vitest run lib/leads/neon-store.integration.test.ts`, then `pnpm dev` and `curl -sI http://localhost:3000/api/lead` → 405. Report results. Stop if anything fails.

**6b. Preview.** `vercel` (no `--prod`) from this checkout. Record the preview URL and deployment id. Verify:
- `curl -sI <preview-url>` → 200 (or 401 if protected; then use the bypass header) and `/api/lead` → 405 on GET.
- The preview's `DATABASE_URL` is a non-production branch (check `vercel env ls` scoping and the Neon branch list; do not print the value).
- `PLAYWRIGHT_BASE_URL=<preview-url> pnpm e2e` with the bypass secret. Report pass/fail counts.
- `vercel logs <preview-deployment> --level error`.
  Stop and show me the results. **Wait for my yes before 6c.**

**6c. Production.** Note the timing first: Production env changes take effect only on the next deployment, so the deployment that has been serving the alias since step 1 is still running against the **old** database (or against no `DATABASE_URL` once step 4 removed the copied values) until this promotion completes. The window is small and safe because lead capture is off. Then `vercel --prod`. Record the new deployment id. Verify:
- `curl -sI https://realestate-handbook.vercel.app` → 200; `/robots.txt` and `/sitemap.xml` behave as before (indexing off unless `SITE_INDEXABLE=true`).
- `/api/lead` → 405 on GET. If `LEAD_CAPTURE_ENABLED` is on, submit **one** test lead with my address and confirm the row appears in the **new** database and the **old** database's count is unchanged — this proves Production left the old resource.
- `PLAYWRIGHT_BASE_URL=https://realestate-handbook.vercel.app pnpm e2e`.
- `vercel logs <deployment> --level error` for the first minutes.
- `meded` → Usage shows the project under Pro limits.

## 7. Cleanup and record

- Only after 6c is green: ask me, then remove the old Neon resource from `brianpxs-projects` (`vercel integration resource remove <name>` / `vercel ir rm <name>` under that scope, or the dashboard). Ask before deleting anything else. Nothing for this project should remain in the personal scope except what I choose to keep.
- Delete scratch files holding pulled env values and `/tmp/leads.sql`.
- Write `docs/plans/vercel-pro-migration-meded-result.md` with: new team, `orgId`/`projectId` before and after, production deployment id before and after, preview deployment id used for testing, new Neon project id and branch names, which branch each environment's `DATABASE_URL` points at, whether the Protection Bypass secret survived or was re-created, CLI version before and after, the `--help` output of any command you were unsure about, Spend Management settings as saved, the final env var list per environment (names only, with Sensitive flags), what the transfer dialog actually listed, the before/after row counts and timestamps if data was copied, what was verified, and everything left **unchecked**.
- End the result file with this sequencing note for later sessions: *"The user-database plan (`docs/plans/user-database-plan.md`) — its Phase 0/5 environment variables (`AUTH_IP_SALT`, `BILLING_*`, `CRON_SECRET`, etc.) and migrations `002+` — applies only to the new Neon resource under `meded`, following the same environment-scoping rules as this migration. Nothing new goes on Neon project `morning-credit-15469990`."*
- Update the "What is true today" table in `../_archive/vercel-preview-plan.md` with a dated note that the project now lives under `meded`.

## Done when

- `https://realestate-handbook.vercel.app` returns 200 from a deployment built under `meded`.
- No variable on the `meded` project points at Neon project `morning-credit-15469990`.
- Preview and Development deployments use non-production Neon branches, and `vercel env ls` shows `DATABASE_URL` scoped separately for all three environments.
- The Git link on the `meded` project points at `brianpx/realestate-handbook-v1` and is authorised.
- A Protection Bypass for Automation secret exists on the `meded` project and Playwright used it in 6b.
- Spend Management on `meded` shows a $10 alert and $20 limit.
- Nothing for this project remains in `brianpxs-projects` except what I chose to keep.
- The result file exists and lists every **unchecked** item.

## Relationship to the other plans

- This migration moves only the existing `leads` / `lead_attempts` tables. The users/auth/billing schema in `docs/plans/user-database-plan.md` (migrations `002+`) does not exist yet and is **not** part of this work. Once this migration is complete, that plan's environment variables and migrations target the new `meded` Neon resource only.
- The content-revision, free-sample and quick-start plans are unaffected by where the project is hosted.

Proceed step by step and stop for confirmation at every point marked above.