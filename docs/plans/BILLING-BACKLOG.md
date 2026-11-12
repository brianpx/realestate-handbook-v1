# Billing backlog

Open work on the Lemon Squeezy billing lane (M7 steps 2 to 6), filed on 11 November 2026 from the two reviews of PRs #51 and #52. `PROGRESS.md` holds the history; this file holds what is left. Tick a box when its fix is merged and add the PR number beside it. Purchase is closed (`purchaseOpen()` is false) and no billing variable is set on Vercel, so none of this is reachable by a buyer today.

Each item says what is wrong, where, a direction for the fix, and what it waits on. The directions are suggestions from the review, not decisions.

## A. Blocks opening purchase

- [ ] **A1. An order whose deliveries all fail is never ingested.**
  - **Problem:** if every delivery of an order fails before its record is written (Lemon Squeezy tries four times over about three minutes), nothing picks the order up later. The buyer has paid and has no record, no grant and no email. Resending the same body by hand is refused as stale, because the five-minute window is measured on the order's `updated_at`.
  - **Where:** `reconcileBilling` in `lib/billing/reconcile.ts` walks `listNonTerminal()` records only; `requeueStuckReceived` only marks the event `failed`.
  - **Direction:** have the daily pass finish events left `failed`: list them (a new store method on all three stores), fetch each order by the event's object id, mirror it and mark the event `processed`. This also satisfies the half of M7 step 6 that says a failed delivery converges "after one reconcile pass", which no test covers today.
  - **Waits on:** nothing.

- [ ] **A2. Test mode is not checked, and only the test-mode variants are mapped.**
  - **Problem:** `mapResource` never reads the order's `test_mode` flag, and `VARIANT_TIER` holds only the two test-mode variant ids. With live keys every real order is `unmatched` and grants nothing, silently. With test keys on Production a test checkout would grant real access.
  - **Where:** `lib/billing/types.ts` (`VARIANT_TIER`), `lib/billing/adapters/lemonsqueezy.ts` (`mapResource`).
  - **Direction:** take the variant ids from the environment, one pair for test mode and one for live, and refuse an order whose `test_mode` does not match the deployment (Production takes live orders only; Preview and local take test orders only).
  - **Waits on:** the owner, for the live variant ids of Basic and Pro.

- [ ] **A3. The hosted exit of wave 4 is still open.**
  - **Problem:** the Neon statements have only run through `psql` on a local Postgres 17, never through the Neon HTTP driver. No billing variable is set on Preview, and no test purchase has been made against a deployment. M7 steps 2 and 5 are ticked with those parts deferred in their own notes.
  - **Direction:** add `lib/billing/neon-store.integration.test.ts` in the pattern of the other four integration tests (claim, mirror, refund, flag) and run it against the `development` Neon branch; then set the Preview variables in test mode and make one test purchase.
  - **Waits on:** the owner's yes to a hosted database write and to the Preview variables (the M7 hand-off note of 10 November asks the same).

## B. Wants an owner decision

- [ ] **B1. A flagged buyer reads "fraudulent" on `/account`.** The purchase panel shows the provider's status word for every order. Softer wording for this one status ("under review", or the support address) is the owner's call. Where: `app/(product)/account/page.tsx`.

- [ ] **B2. The ready link records terms acceptance nobody gave.** A reader created from a checkout address gets a sign-in token minted with the current terms version, so the first sign-in writes `accepted_terms_version` for someone who never saw the consent form. Where: `issueSignIn` in `lib/billing/env.ts`. Either the checkout page states that buying accepts the terms (then this is correct and needs a line in the terms), or the token carries no version and the reader is asked on first sign-in.

- [ ] **B3. `link-billing` on a record that already has a user.** On Postgres the record moves to the new user but the purchase grant stays with the first one, so both read as members and the admin list shows the new owner with no membership. The memory and file stores do not move the record at all, so no test can cover the Postgres behaviour. Where: `linkBilling` in `lib/access/neon-store.ts`, `attachUser` in the three billing stores, the `link-billing` case in `lib/admin/handler.ts`. Decide: refuse the action when the record has a user, or move the grant with an audit row. Then make the three stores agree.

## C. Fix when the lane is next open

- [ ] **C1. Two mirrors of one order at the same moment can insert two live grants.** The `not exists (select 1 from live_grant)` guard in `commitMirror` reads the statement's snapshot, and `access_grants.billing_record_id` has no unique index. A refund revokes both, but an admin revoke of one leaves the other live. Fix: a migration adding a partial unique index on `billing_record_id` where `revoked_at is null`, then `on conflict do nothing`. Needs a yes for the migration.

- [ ] **C2. A grant inserted after `link-billing` has no audit row of its own.** The mirror writes its audit row only when the record's status, tier, user or access end changes. Where: `planMirror` in `lib/billing/plan-mirror.ts` and the matching part of `commitMirror`.

- [ ] **C3. `/account` waits on the provider with no timeout.** The Neon store has no manage-link column, so with an API key set every render awaits one order fetch per record, in sequence, and `fetchResource` passes no abort signal. A slow provider stalls the page that also holds sign-out-everywhere and delete-account. Fix: a timeout on the fetch at least; better, load the link on demand.

- [ ] **C4. `resend-ready-email` does not refuse a deleted or disabled account.** `create-grant` and `suspend` do. A deleted account keeps its paid record, so a resend mints a token and mails the anonymised address. Where: `lib/admin/handler.ts`.

- [ ] **C5. The daily pass re-reads every purchase for ever.** `paid` is non-terminal, so each lifetime purchase is fetched again every day, one after another, inside a 60-second function. Once the loop no longer fits, the steps after it never run. Fix: re-read a paid order only while it can still be refunded (the 14-day policy plus a margin), or work through the oldest-checked first in bounded batches.

- [ ] **C6. `BILLING_API_BASE` is honoured on hosted deploys.** The order fixture is ignored whenever `VERCEL_ENV` is set; this override is not, and it is missing from `.env.example`. If set, the API key and the order that decides access go to that host. Fix: ignore it on hosted deploys and document it. Where: `lemonSqueezyFromEnv`.

- [ ] **C7. With no mailer, a granted event ends `failed`.** The grant commits, the ready email is skipped, the webhook answers 500 four times and the event row stays `failed`, though the reconcile sends the email later. Fix: treat a skipped send as processed and leave the email to the daily pass. Where: `sendReadyEmail` in `lib/billing/process-event.ts`.

- [ ] **C8. A record goes back to `paid` after a revoke.** A later paid-looking read cannot restore access, because the revoked grant blocks it, but the record's status returns to `paid` and re-enters the daily pass. Fix: a refunded or flagged record is not overwritten by a read that does not revoke.
