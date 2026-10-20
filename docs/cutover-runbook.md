# Cutover runbook: static handbook to the Next.js site

Status: **drafted, not rehearsed.** Nothing here has been run against Vercel, DNS or GitHub Pages. The Vercel commands come from the Vercel CLI guidance available in this project (`vercel promote`, `vercel rollback`) and should be checked against the current docs before use. Companion to the "Cutover gates" in `nextjs-migration-plan.md`.

## Before cutover (each is a gate)

| Gate | How to check | State when this was written |
| --- | --- | --- |
| All tools ported with parity tests | `pnpm test` and `pnpm e2e` pass | Done (see the plan's progress log) |
| Search, glossary, tool index | same suites | Done |
| Book JSON-LD | `e2e/jsonld.spec.ts` | Done |
| Print styles | `e2e/print.spec.ts` (print emulation and a PDF), then print two chapters to paper or PDF and read them | Automated part done; **human read not done** |
| Phone comparison | Screenshots at iPhone 13 size looked equivalent for the title page, menu, search results and chapter top. **Not a real iPhone**: scroll lock, the opaque dropdown backdrop and search results position need a real-device pass | Emulated only |
| Lighthouse and axe on every route | Needs `@axe-core/playwright` and a Lighthouse run | **Not done** (new dependency or tool: needs your go-ahead) |
| Progress moves | Static site's "Download my progress" (`docs/cutover-static-site-export.patch`, for `main`) and the Pages stub (`docs/cutover/pages-stub-index.html`), both round-tripped into Settings > Restore from a file | Built and tested here; **not yet on `main`** |
| Lead capture works for real | A production store and SendGrid with an authenticated sending domain | Database done and tested; **SendGrid key, sending domain and postal address still missing** |
| Content answers reviewed | Checkpoint key points marked as drafted in `content/data/checkpoints.ts`, the gate's "How your email is used" text, and the welcome email | **Author review pending** |

## Order of work

1. Merge the static-site export patch into `main` and let it sit for a while (the soak is the readers' chance to download progress). Apply with `git apply docs/cutover-static-site-export.patch` in a checkout of `main`.
2. Create the Vercel project from the `next` branch. Set `NEXT_PUBLIC_SITE_URL` to the final address **at build time**. Set `LEAD_CAPTURE_ENABLED=true` (build time) only once the store and email are in place; leave it off for the first launch if they are not.
3. Open a preview of `next`, run the e2e suite against it, and test the real deployment on a phone.
4. Point the domain at production. Record the previous production deployment so it can be restored.
5. On `main`, replace the root `index.html` with `docs/cutover/pages-stub-index.html` after replacing `__NEW_ORIGIN__`. Keep `chapters/`, `css/`, `js/`, `images/` and `downloads/` where they are for the soak period so old asset links still resolve. Update `sitemap.xml` and `robots.txt` to point at the new address, and re-submit the sitemap.
6. Watch for errors (`vercel logs <deployment> --level error`) and for submissions to the lead store for the first days.

## Rollback

Source recovery (`git checkout main`, or the `static-v1` tag) does **not** change what the domain serves.

- **Restore the previous production deployment:** `vercel rollback` (previous) or `vercel rollback <deployment-url-or-id>`; `vercel promote <deployment>` re-points production without a rebuild. Rehearse on a preview first.
- **Restore the old address:** put the original `index.html` back on `main`'s Pages branch (the stub is a one-file change, so reverting that commit does it). Pages cannot send 301s, so the stub redirects with a script and a meta refresh.
- **What a rollback does not undo:**
  - Leads written after cutover stay in the store. Export them before any rollback, because Formspree stops receiving submissions as soon as the form posts to `/api/lead`.
  - Progress restored on the new origin stays on that origin; readers who rolled back to the old address have their old progress there.
  - Database changes: write migrations so the previous deployment still works (add, never rename or drop in the same release). Do not restore a database snapshot as a code rollback, because it discards new leads.

## Checks after cutover

- `/#ch5` style links on the old address reach `/ch5` on the new one (`e2e/cutover-stub.spec.ts` covers all 21).
- A reader with saved progress is offered the file before being redirected.
- The sitemap and canonical tags show the new address; `curl -I` on a chapter returns 200.
- Submit the gate form once with your own address; confirm the row exists and the email arrives with the postal address.
