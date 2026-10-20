# Vercel preview plan

Drafted 20 October 2026. Companion to `nextjs-migration-plan.md` (phase 6) and `cutover-runbook.md`.

Everything under "What is true today" was read with `vercel env ls`, `vercel ls`, `vercel inspect`, GET calls to the Vercel API, and `curl` against the public alias. Nothing was deployed, no variable was changed, nothing was pushed. Anything not checked is marked **unchecked**.

## What is true today

| Fact | Evidence |
| --- | --- |
| Vercel project `realestate-handbook` exists in scope `brianpxs-projects`, linked to this checkout (`.vercel/project.json`) and to GitHub `brianpx/realestate-handbook-v1`. | `.vercel/`, project API |
| The project's **production branch is `main`**. | project API, `link.productionBranch` |
| Exactly one deployment exists: target **Production**, source git, branch **`next`**, commit 60e37fd (the latest pushed commit at the time), state Ready, built in 46 s. | `vercel api /v6/deployments` |
| The production alias `https://realestate-handbook.vercel.app` is **public** (HTTP 200, no login). The per-deployment URL is behind Vercel login (302). Protection is `all_except_custom_domains`. | `curl`, project API |
| That live site has `NEXT_PUBLIC_SITE_URL` unset, so its **canonical tags, `sitemap.xml`, `robots.txt` Sitemap line and (by the same constant) JSON-LD all point at `http://localhost:3000`**. `robots.txt` says `Allow: /`. | `curl` of `/robots.txt`, `/sitemap.xml`, `/ch1` |
| `/plan` returns 404 and `/api/lead` answers GET with 405, so the coach pages and gate are off, as intended. | `curl` |
| Environment variables on the project: only the 18 database variables (`DATABASE_URL`, `POSTGRES_*`, `PG*`, `NEON_*`, `VITE_NEON_AUTH_URL`), each set for **Production, Preview and Development alike**. Not set: `NEXT_PUBLIC_SITE_URL`, `LEAD_IP_SALT`, `LEAD_CAPTURE_ENABLED`, `LEAD_ALLOWED_ORIGINS`, SendGrid variables. | `vercel env ls` |
| Vercel runs Node 24.x; this machine runs Node 22.23.3. | project inspect, `node -v` |
| `playwright.config.ts` only runs against a local build on port 3187 and has no way to point at a deployed URL. | file |
| Other sessions are committing and pushing to `next` while this is written (`origin/next` moved several times in an hour). Each push to a connected branch triggers a Vercel build. | `git log`, `git ls-remote` |

## Problems to fix before anyone treats the preview as a test

1. **The new site is publicly live and indexable under a production alias with broken canonicals.** Search engines that crawl `realestate-handbook.vercel.app` would see a duplicate of the handbook whose canonical points at localhost. Decide whether that alias should be public at all before cutover.
2. **A `next` commit was deployed as Production although the production branch is `main`.** I did not find out how (a `vercel --prod` from this checkout is the likely cause; unchecked). It matters because "production" is supposed to be the cutover moment. Check `vercel inspect` on that deployment and the project's Git settings, then decide whether to leave it.
3. **Previews would write to the production database.** The Neon variables are shared by all three environments, and the lead store and its rate-limit table live in that one database. Lead capture is off, so nothing writes today, but turning it on for a preview would put test addresses in the real `leads` table.
4. **Site URL is baked in at build time and is wrong for every non-local build.** `lib/site.ts` reads `NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'`. A preview needs its own origin; production needs the final domain.
5. **Preview URLs sit behind Vercel login**, which blocks the Playwright suite and a phone test unless a bypass is arranged.
6. **Node version mismatch** (24 on Vercel, 22 here) is untested. A build that passes locally could differ.

## Proposed changes (none made yet)

| # | Change | Why | Needs your go-ahead? |
| --- | --- | --- | --- |
| 1 | `lib/site.ts`: resolve the origin as `NEXT_PUBLIC_SITE_URL`, else `https://${VERCEL_BRANCH_URL}` on Vercel previews, else localhost. Set `NEXT_PUBLIC_SITE_URL` explicitly for Production only. | Canonicals, sitemap, JSON-LD and the lead form's same-origin check are right on every preview without per-deploy edits. | Code change in this repo |
| 2 | `app/robots.ts`: return `Disallow: /` unless a `SITE_INDEXABLE=true` variable is set (Production only, at cutover). Vercel already adds `X-Robots-Tag: noindex` to preview deployments; this covers the production alias before cutover. | Stops the duplicate-content problem in point 1 above. | Code change |
| 3 | Add `PLAYWRIGHT_BASE_URL` (and an optional `x-vercel-protection-bypass` header from `VERCEL_AUTOMATION_BYPASS_SECRET`) to `playwright.config.ts`; skip the local `webServer` when it is set. | Runs the same 150+ tests against the real deployment. | Code change; creating the bypass secret is a project setting change |
| 4 | Give Preview its own database branch. The Neon integration may offer a branch per preview; **unchecked**. Otherwise create a `preview` branch in Neon and set `DATABASE_URL` for the Preview environment only. | Isolates test leads from real ones. | Yes: creates a Neon branch and changes Vercel env |
| 5 | Preview environment variables: `LEAD_IP_SALT` (random, Preview-specific), `LEAD_CAPTURE_ENABLED=true` only when testing the gate, no SendGrid key (use no email, or a test sender). | Gate can be exercised without emailing anyone. | Yes: env changes, one secret to generate |
| 6 | Set the project's Node version to 22.x, or install Node 24 locally and rerun the suites. | Removes the mismatch. | Settings change or local tooling |
| 7 | Production variables, at cutover only: `NEXT_PUBLIC_SITE_URL` (final domain), `SITE_INDEXABLE=true`, `LEAD_*`, SendGrid (blocked on the author, see the runbook). | Matches the runbook gates. | Yes |

## Stages

1. **Local dev (done).** `pnpm typecheck`, `pnpm test`, `pnpm e2e` pass per the progress log. Re-run them on the commit that will be previewed.
2. **Preview, automatic.** Pushing `next` builds a preview (and, until problem 2 is explained, possibly a production deployment). Pull requests give a stable per-branch URL. Check each build log for warnings, and compare the build's route list with `pnpm build` locally.
3. **Preview, tested.** Run the Playwright suite against the preview URL (change 3). Then by hand on that URL:
   - Real iPhone: menu open and close, page pinned behind the menu, search results position, tool inputs, scroll lock.
   - Desktop: print two chapters to PDF and read them; dark mode; full width.
   - `curl -I` any chapter: 200; view source: canonical and JSON-LD show the preview origin (after change 1).
   - Settings > Download my progress, then Restore from a file, on the preview origin.
   - If lead capture is on for the preview: submit once with your own address; confirm the row lands in the preview branch only.
   - Lighthouse and axe on all 21 routes (needs `@axe-core/playwright` or a Lighthouse CLI: new tooling, ask first).
4. **Production, at cutover.** Follow `cutover-runbook.md` steps 1 to 6. Before pointing the domain, set the production variables (change 7), record the current production deployment id for rollback, and rehearse `vercel rollback` on a preview first (the runbook says the commands are unverified).

## Decision log needed from you

1. Should `realestate-handbook.vercel.app` stay public before cutover? Recommended: no. Add change 2, or enable protection for production until the domain exists.
2. Was the current Production deployment from `next` intentional? If not, which command created it?
3. Previews and the database: Neon branch per preview (recommended), or lead capture simply stays off in previews?
4. Which Node version should be the standard, 22 or 24?
5. Approve changes 1 to 3 (code) so I can make them on `next`.

## What this plan does not cover

- The final domain, DNS, and the GitHub Pages stub (runbook steps 4 and 5).
- SendGrid setup: the author's key, sending domain and postal address are still outstanding.
- Vercel Analytics, Speed Insights (a Speed Insights id already exists on the project, with no data) and logging.
- Any rehearsal of rollback. None has been run.
