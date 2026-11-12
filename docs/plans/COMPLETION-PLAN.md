# Completion plan: the remaining 38 steps of `MASTER-PROMPT.md`, in waves of parallel lanes

*Written 10 November 2026 by the progress session, on the owner's request. This file orders the open work of `MASTER-PROMPT.md` section 6; it adds no steps and changes no decision. Progress is still recorded in `PROGRESS.md`. Rules from `MASTER-PROMPT.md` section 3 (branching, fresh review before every PR, merges gated on the run's conclusion, the collision map) apply to every lane below.*

## How the waves relate

| Wave | What | Who | Starts when | Runs alongside |
|---|---|---|---|---|
| 1 | Merge the six reviewed PRs | coordinator, on the owner's word | now | wave 3 |
| 2 | Content and a11y backlog: M6 step 11, M4 steps 6 to 8, 10 to 12 | 3 lanes plus 9 coach lanes, then 1 short lane | wave 1 has landed | waves 3 and 4 |
| 3 | Owner inputs: sender, billing account, address, approvals, small calls, the M3 record | owner, with the coordinator for the Vercel and M3 parts | now | everything |
| 4 | Billing: M7 steps 2 to 6 | 1 lane plus reviewer | the Lemon Squeezy account and its test mode exist | wave 2 |
| 5 | Launch readiness: M8 steps 3 to 5 | coordinator, with the owner for the flip | waves 2, 3 and 4 are done | nothing (sequential) |

The serial bottleneck is the merge: every lane branches from `main`, lands one PR at a time with `main` merged in first and the run's conclusion checked. Lanes inside a wave run at once because they share no files; the file partition for each is written out below and is the brief's hard boundary.

## Wave 1: land what is built (coordinator)

Order, each merge gated on `gh run view <id> --json conclusion` equal to `success`, with `main` merged into the branch first where GitHub asks:

1. #17 `fix/m6-l6` (closes M6 step 10)
2. #18 `docs/faq-accounts` (closes M7 step 8)
3. #19 `fix/content-rules-module` (M4 step 2)
4. #21 `fix/content-contradictions`, retargeted to `main` after #19 lands (M4 steps 3 to 5)
5. #20 `feat/profile` (M7 step 9)
6. #22 `feat/admin-users` (M7 step 1; its diff shrinks to the admin work once #20 is in)

After the last merge: `main`'s own run green, a smoke check of the production alias (`/privacy`, `/account` signed out, `/admin` redirect), the worktrees removed, the record in `PROGRESS.md`. Migration 006 then runs on production at the next deploy because `pnpm build` runs the migrator; that is the designed path and needs no separate step.

## Wave 2: the content and a11y backlog

### 2a. Three lanes at once, partitioned by file

Every lane: its own worktree from `origin/main`, Conventional Commits, `pnpm typecheck` and `pnpm test` before reporting, `pnpm e2e e2e/parity/ e2e/semantic-html.spec.ts e2e/a11y.spec.ts` when port 3187 is free, a fresh reviewer, then its PR. No lane edits `docs/plans/*.md`.

| Lane | Steps | Owns (writes) | Reads only |
|---|---|---|---|
| **Captions and a11y** | M6 step 11 except the marker move: `<caption>` on the ten data tables (`app-b.html` B.1, B.2, B.3, B.5, B.6, B.7; `app-e.html`; `app-f.html`; `ch2.html` Table 2.x; `ch9.html` Table 9.2); `Settings.tsx` collapse guard while a control inside has focus; drop `aria-expanded`/`aria-controls` from the searchbox in `SidebarSearch.tsx`; coach pages h1 to h2 (`PlanSetup.tsx`, `TodayCard.tsx`, `ReviewDeck.tsx`) | `content/pages/{app-b,app-e,app-f,ch2,ch9}.html`, `components/shell/Settings.tsx`, `components/shell/SidebarSearch.tsx`, `components/coach/{PlanSetup,TodayCard,ReviewDeck}.tsx`, `e2e/a11y.spec.ts`, `e2e/semantic-html.spec.ts` | everything else |
| **Sequencing and copy** | M4 step 6 (reading plan in `plan.ts` and the preface; the quick start with the "before your first outreach" checklist; forward references in ch4's Try It and ch12's "every part"; the three post-close moments stated once and applied to ch4 step 3, ch5, ch12, the preface, Appendix C); step 7 (free-set validation against `FREE_PAGE_IDS` and `/preview`); step 8 (CRM copy pass per OD-05 in the FAQ, footer, About, Terms, ch3, ch4, Appendix C, the glossary; Appendix F label per OD-06) | `content/pages/{pref,ch4,ch5,ch12,app-c,app-f}.html`, `content/data/{plan,checklists}.ts`, `content/site/faq.ts`, `app/(public)/{about,terms}/page.tsx`, `components/site/PublicFooter.tsx`, `lib/glossary.ts`, `lib/plan.ts`, `lib/plan.test.ts`, `lib/nurture-consistency.test.ts`, `e2e/parity/planning.spec.ts` | `content/data/rules.ts`, `lib/pages.ts` (`FREE_PAGE_IDS`), `app/(public)/preview/**` |
| **Trim, legend and figures** | M4 step 10 (speed-to-lead defined once in ch4, one-line pointers in ch2, ch3, ch5, ch7, ch12, ch13; ch2's forward reference corrected; the duplicated plan tables and consent paragraphs trimmed to pointers); step 11 (legal box, key takeaways and learning objectives in the preface legend; figure numbering across the chapters; the Appendix credits) | `content/pages/{ch1,ch3,ch6,ch7,ch8,ch10,ch11,ch13,app-a,app-d}.html`, the figure captions in every chapter it numbers (it is the only lane editing `<figure>`/`<figcaption>` elements), `lib/outline.test.ts`, `lib/search-index.test.ts` | `content/data/rules.ts` |

Collision rule for 2a: `ch4`, `ch5`, `ch12` and `app-c` belong to the sequencing lane; `ch2` and `ch9` to the captions lane; the trim lane touches `ch2` only for figure captions and only after the captions lane's PR has merged (it rebases). The preface belongs to the sequencing lane; the trim lane's legend edits go into the same file, so the trim lane does step 11's preface part after the sequencing PR merges, as its last commit. If that ordering costs more than a day, split step 11's preface part into its own follow-up PR instead.

### 2b. The marker move (M6 step 11, CR-L19), one short lane after 2a

Moves the literal "●" out of 28 content h3s and 16 widget headings into CSS `::before` or an `aria-hidden` span (the `InteractiveHeader.tsx` pattern). It touches most chapter files at once, so it runs alone, after the three 2a PRs have merged, from a fresh `main`. Owns every `content/pages/*.html` h3 that carries the marker, `components/widgets/InteractiveHeader.tsx`, the chapter styles in `app/globals.css`, and the marker assertions in `lib/widget-markers.test.ts` and `e2e/parity/*.spec.ts`. The widget-marker set per page must be unchanged before and after (the rules lane's reviewer script in `PROGRESS.md` is the model).

### 2c. Coach coverage (M4 step 12), nine lanes at once

One lane per untagged chapter: 1, 3, 6, 7, 8, 9, 10, 11 and 13 (only ch2, ch4, ch5 and ch12 carry concepts today), each authoring 4 to 6 concepts and 2 to 3 questions per concept, draft-flagged where the plan's shape tests require, anchored to a heading id in its chapter. Shared files: `content/data/concepts.ts` and `content/data/questions.ts`. Partition: each lane appends one clearly delimited block per file (`// ch<N>` to `// end ch<N>`) at the end of the array and edits nothing outside it; the coordinator merges the nine PRs in chapter order, resolving the trailing-comma conflicts only. Gates: `lib/coach/item-bank.test.ts`, `lib/coach/anchors.test.ts`, `lib/coach/check.test.ts` (both banks identical where it requires), `pnpm e2e e2e/coach.spec.ts`. A tenth, fresh reviewer reads all nine before the first merge, for duplicated concepts across chapters and for answers that the chapter text contradicts (the `rules.ts` sentences are the reference). 2c can start together with 2a: it touches no chapter HTML.

Wave 2 exit: M4 and M6 fully ticked; `main` green; the e2e suite green on CI after each merge.

## Wave 3: owner inputs (owner, with the coordinator)

In the order they unblock the most. Items 1 and 2 are the whole calendar.

1. **Sender** (M5 step 1): SendGrid domain authentication for `findnurturekeep.com` (the CNAME records at the registrar), a DMARC record, and the mailboxes or forwarding for `hello@`, `support@`, `brian@`. Then the coordinator sets `LEAD_FROM_EMAIL`, `LEAD_FROM_NAME` and `SENDGRID_API_KEY` (from the vault item) on Vercel Production and Preview as Sensitive, redeploys, and sends one test sign-in link to a Gmail and one other inbox; the step closes when both land outside spam. Unblocks M8 step 3.
2. **Billing account**: the Lemon Squeezy store with test mode on, the two products at the signed prices (Basic $79, Pro $129) and the $50 Pro upgrade for Basic owners, their checkout URLs (the upgrade's goes in `BILLING_CHECKOUT_URL_UPGRADE` and its variant id in `BILLING_VARIANT_UPGRADE`), the webhook signing secret and an API key in the vault. Unblocks wave 4 and M8 step 4's price fields.
3. **Legal and policies**: postal address and legal name (CAN-SPAM footer, the terms page, `LEAD_MAILING_ADDRESS`); one read each of `/privacy`, `/refunds`, `/updates` to approve them (they stay marked draft until then); the priority-support decision for Pro (default today: no).
4. **Small calls**: the Table 8.2 route (keep the tightened wording, or relax the widget); the root `downloads/` PDF (delete, per OD-17); the "Playwright e2e" bypass secret rotated before any remote e2e; who ran migrations 002 and 003 on production.
5. **The M3 record**: a 30-minute walk of M3's owner checklist and steps 0 to 7 with the coordinator, read-only, ticking each box that the keep decision already satisfies and recording the two or three that still need an action (the GitHub installation on the `meded` team, Spend Management's current setting, the Git link). This turns M3 from "mostly done outside the record" into done.

## Wave 4: billing (one lane plus a reviewer)

Starts when wave 3 item 2 exists. One worktree from `main`, PR against `main`, no content files. Owns `lib/billing/**`, `lib/offer.ts` (`checkoutUrlFor`), `app/api/billing/webhook/route.ts`, `app/api/cron/billing-reconcile/route.ts`, `vercel.ts` or `vercel.json` (the one deployment-config change, for the cron), `app/(product)/account/page.tsx` (the billing panel only), the `resync-billing` and `resend-ready-email` stubs in `lib/admin/handler.ts`, `lib/auth/mail.ts` (the ready email), and the Vercel variables `BILLING_PROVIDER`, `BILLING_WEBHOOK_SECRET`, `BILLING_API_KEY`, `CRON_SECRET` (Sensitive; Preview gets the test-mode values). Steps 2 to 6 of M7 as four commits (adapter and stores; webhook with the claim-and-recover path of UD §10.3 and §10.4; reconcile cron and the admin resync; account panel) plus the UD §15 tests, including the store fake that throws after each step in turn. Exit: a signed webhook fixture posted to the local build makes `/account` show the purchase; a test purchase in provider test mode on a preview deployment produces a grant, an audit row and the ready email in Mailpit or the test inbox.

## Wave 5: launch readiness (sequential)

1. **M8 step 3, lead capture live**: after the sender, the unsubscribe path and the privacy approval, set `LEAD_CAPTURE_ENABLED=true` for Production and redeploy.
2. **M8 step 4, owner inputs**: enter the prices and checkout URLs in `lib/offer.ts`, set `POLICY_STATUS` to approved for the pages the owner approved, enter the postal address. `purchaseOpen()` then returns true by its own rule; **flipping it is a publishing action and the coordinator asks before the deploy that makes it live.**
3. **M8 step 5, pre-launch verification**: full `pnpm e2e` against a preview deployment with the rotated bypass secret, then against production; `curl -sI https://<host>/handbook/ch13` redirects without a cookie; `/search-index.json` is not public; a test purchase end to end; `vercel logs --level error` clean; Spend Management unchanged. Each result in the step log, with the command and what it printed.
4. **M8 step 6, custom domain cutover**: outside this plan; `docs/_archive/cutover-runbook.md` when the owner is ready.

Exit for the whole plan: every section 6 box ticked or recorded as not applicable with the reason; `PROGRESS.md` "Where things stand" says so; the launch-handoff blockers 1 to 5 closed.

## Agent briefs: what every lane's brief must contain

Each lane is a fresh general-purpose agent in an isolated worktree, started in one batch per wave. Its brief is the only context it has, so it carries: the goal in the plan's words (the step text verbatim); the files it owns and the files it must not touch (the partition table above); what is already ruled out or decided (the section 4 answers it depends on, the `rules.ts` sentences); the verification commands and the exact output expected; the commit rules (Conventional Commits, the Co-Authored-By trailer, explicit staging, no push, no PR, no `docs/plans/*.md` edits); and the report shape (branch, SHAs, files, every changed sentence for content lanes, commands with printed counts, what is unverified). A fresh reviewer, never the author, reads the diff with a checklist tailored to the lane and runs typecheck and tests itself; every confirmed finding is fixed by the author in one new commit before the PR opens. The coordinator opens the PR, checks the run, merges on the owner's word, records in `PROGRESS.md`, and removes the worktree.

## Calendar

- Wave 1: an hour once the word is given.
- Wave 2a and 2c: one session of lane work in parallel (about four hours of wall clock); 2b: a short lane after.
- Wave 3: paced by the owner; items 1 and 2 are the only ones that hold later waves.
- Wave 4: one session once the account exists.
- Wave 5: half a session, after everything else.

Three sessions of engineering in all, spread across however long the owner inputs take.
