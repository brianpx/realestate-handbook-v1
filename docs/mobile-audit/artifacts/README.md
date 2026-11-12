# Reproducing this audit

Use an isolated copy or worktree of the source snapshot, never an active session’s build directory. The original run copied app, components, content, lib, hooks, public, media, db and e2e plus package/lock/config files, without `.env*`, `.git`, generated output or live data. Preserve the existing pnpm lockfile and pinned dependencies. Source hashes are in source-snapshot.json; a different snapshot may produce different results.

1. Copy the six `*.txt` tooling snapshots here into the isolated project root, removing only the final `.txt` extension. They are text artifacts to avoid repository test discovery.
2. Replace hard-coded `/Users/mmbp/Projects/code/realestate-handbook-v1/docs/mobile-audit` output paths in the copied scripts/configs with your dedicated evidence directory. Create `artifacts/` and `screenshots/` there. Configs and scripts import the project’s installed Playwright and existing `e2e/auth.ts` fixtures.
3. Ensure `DATABASE_URL`, `E2E_DATABASE_URL`, `PLAYWRIGHT_BASE_URL`, hosted deployment flags and actual mail credentials are unset in this isolated environment. Do not copy production environment files. Install only the lockfile’s pinned dependencies if needed.
4. Start the isolated development server with the following environment and command:

```sh
AUTH_STORE=file AUTH_STORE_PATH=.data/e2e-auth.json LEAD_STORE=file LEAD_STORE_PATH=.data/audit-leads.json NEXT_PUBLIC_COACH_ENABLED=true NEXT_PUBLIC_SITE_URL=http://localhost:3199 node node_modules/next/dist/bin/next dev -p 3199
```

5. Run `node node_modules/@playwright/test/cli.js test -c audit.config.ts`. Its global setup seeds the existing test reader, preview reader and admin in the isolated `.data/e2e-auth.json`; this setup replaces that file, so do not point it at shared state. The collector records 46 routes across 12 widths in Chromium/WebKit and attempts Firefox. Missing engines are recorded, not passed. Review statuses and dimensions separately; collector completion alone is not acceptance.
6. Run `node node_modules/@playwright/test/cli.js test -c interaction.config.ts` for the existing a11y/CSS/semantic subset and two targeted tests. Change its report path to preserve development versus production runs. `node diagnose.cjs` collects detailed overflow/focus/list evidence.
7. Stop only your isolated development server. Build with `env -u DATABASE_URL -u E2E_DATABASE_URL NEXT_PUBLIC_COACH_ENABLED=true pnpm build`. Start `next start -p 3199` with the same file-store environment from step 4, replacing `dev` with `start`. Run the interaction subset again and `node performance.cjs`. Keep seeded file data available; no authentication controls are disabled.
8. Stop only the audit server you started. Do not stop other sessions, clean their worktrees or overwrite their reports.

The production interaction script rewrites targeted.json and the text-enlargement/landscape/dark screenshots; the 30 route-sweep screenshots remain development captures. No screenshot is an approved baseline. Performance is one navigation per route, not Lighthouse or field monitoring. The CLS-labelled raw field in performance.json is a raw shift sum excluding recent input, not the session-window CLS metric; the reports deliberately use “observed layout-shift sum.”

Matrix acceptance checks used: exactly 1,104 records; widths equal 320/360/375/390/402/430/480/768/820/1024/1280/1440; expected 404 only for /missing-audit-route and 200 otherwise; scrollWidth ≤ innerWidth + 1 on every default-text row. Their result is saved in matrix-assertions.json. Known text-resize/focus failures are observations in targeted.json, not passing accessibility assertions.
