# Basic to Pro upgrade plan

Status: owner decisions recorded 2026-11-11 (below); nothing is built yet. **Corrected the same day against `origin/main` at `a2fe58f`:** the first draft was written from a stale checkout and said the billing webhook did not exist. It does (PR #51, `lib/billing/**`, `app/api/billing/webhook`); the sections below now describe changes to that code. Part 2 of `docs/plans/OFFER-PLAN.md`, which also covers pricing, the refund window with an upgrade, and the terms copy. Written 2026-11-11 after reading `lib/access/*`, `db/migrations/003_access_billing.sql`, `lib/offer.ts`, `lib/tiers.ts` and `components/handbook/UpsellCard.tsx`.

## Recommendation

A Basic buyer pays the difference to reach Pro: **Pro price minus Basic price** ($79 Basic, $129 Pro, so $50), with no time limit. It is a third hosted-checkout product, "Pro upgrade", shown only to signed-in Basic members.

## Owner decisions (2026-11-11)

1. **Prices:** Basic $79, Pro **$129** (changed from $149 in OD-23, 9 Nov 2026), upgrade **$50**, no expiry. The upgrade price must always equal Pro minus Basic, so derive it rather than enter it twice.
2. **Refund of Basic after an upgrade:** cascade. Both grants are revoked and the owner is prompted to refund the $50 too.
3. **Ineligible upgrade orders:** manual review. They land as `unmatched` with no grant.
4. **Timing:** still open. Default is to extend the merged billing code before purchase opens.

## What the code already does

- `entitlement()` (`lib/access/entitlement.ts`) takes the **highest tier across all live grants** (`higherTier`). A second, live `pro` grant on a user who already has a `basic` grant is enough to make them Pro. No tier-change logic is needed.
- `access_grants` has no uniqueness on `(user_id, tier)`, and `billing_records` is unique only on `(provider, provider_object_id)`. A user can hold both a Basic and a Pro purchase today.
- Each grant carries its own `billing_record_id` and can be revoked on its own (`revokeGrant`). Refunding the upgrade therefore revokes only the Pro grant and leaves Basic untouched, which is the behaviour we want.
- `recomputeMembership` / `currentGrant` rank paid grants by longest `endsAt`, with both indefinite. The projection may show `basic` or `pro` as the current tier depending on sort order. It is display-only (enforcement never reads it), but the admin list would be wrong. See change 3.
- `coachOpen`, `toolOpen` and `pageOpen` all read the computed entitlement, so every Pro-only surface unlocks as soon as the Pro grant exists.

## What is missing

1. **The webhook exists but knows two products.** `lib/billing/types.ts` maps Lemon Squeezy variant ids to a tier (`VARIANT_TIER`: 2357693 Basic, 2357694 Pro, both test-mode ids) and stamps every record with the one `PRODUCT_KEY = 'handbook-v1'`. An upgrade variant would be `unmatched` (`unknown_variant`) today, and a refund only revokes the grant of the refunded record (`planMirror` in `lib/billing/plan-mirror.ts`), so the cascade does not exist.
2. **No upgrade product, price or link** in `lib/tiers.ts` / `lib/offer.ts`.
3. **No upgrade UI.** `UpsellCard` shows "See plans and buy" to a Basic member who hits a Pro-only feature (coach) but cannot say "upgrade for $50". `/pricing` does not mention it.
4. **No eligibility check.** A hosted checkout link is public. Anyone who finds the $50 link could buy it.

## Design

### Product mapping

`lib/billing/types.ts` holds `VARIANT_TIER` (variant id to tier) and one `PRODUCT_KEY`. Replace the variant map with a map from variant id to `{ tier, productKey, upgrade }`, so the adapter (`mapResource` in `lib/billing/adapters/lemonsqueezy.ts`) and the processor (`process-event.ts`, which stamps `PRODUCT_KEY` today) read the product from the order instead of a constant. Live-mode variant ids will differ from the test-mode ones now in the file (an open item in PROGRESS), so the upgrade needs both.

| Product | `product_key` | `billing_records.tier` | Eligibility |
| --- | --- | --- | --- |
| Basic | `handbook-v1` | `basic` | none |
| Pro | `handbook-v1` | `pro` | none |
| Pro upgrade | `handbook-v1-upgrade` | `pro` | user has a live Basic **purchase** grant and no live Pro grant |

The upgrade gets its own `product_key` so reporting and the `billing_records_user_product` index can tell an upgrade from a full Pro sale. `amount_cents` records the $50, so revenue stays correct.

### Eligibility (the part that needs a decision)

The webhook, not the link, is what protects the price. On a paid upgrade event:

- Match the order to a user as any purchase is matched. The signed-in checkout link (`checkoutUrlFor({ tierId, userId, email })` in `lib/offer.ts`) already carries `checkout[custom][user_id]`, so the upgrade link can be built the same way from a new `BILLING_CHECKOUT_URL_UPGRADE` variable. The custom field is a URL a buyer can edit, so eligibility is still decided from the database, not from the link.
- **Eligible:** create the billing record (`paid`) and a `purchase` grant at `pro` in one transaction, with an audit row (`grant.create`, actor `webhook`), then `recomputeMembership`.
- **Not eligible** (no Basic grant, or already Pro): store the billing record and event as `unmatched`, create **no grant**, and surface it in the admin billing list for a manual refund or a manual full-price top-up. Never silently grant Pro for $50 to someone who never bought Basic.

Decided: manual review. Because the user id already travels in the signed-in link, the remaining gap is someone who finds the public $50 link and pays without being a Basic owner; the order is then `unmatched` with no grant and you refund it. A single-use discount code per user would close that before payment but needs provider API code; revisit if unmatched orders become frequent.

### Refunds

- Upgrade refunded: revoke the upgrade grant (`refund`); the reader drops to Basic. Handled by the generic refund path with no special case.
- Basic refunded while the upgrade grant is live: the Pro grant would keep full access, so the reader would have refunded the Basic price and kept Pro for $50. Decided rule: **refunding Basic revokes the Basic grant and, if an upgrade grant exists, the upgrade grant too**, and the admin screen prompts the owner to refund the $50 as well. This must be stated in the refund policy (`/refunds`), which is still a draft.
- Chargebacks follow the same two rules.

### Copy and UI

- `/pricing`: under the table, "Already have Basic? Upgrade to Pro for {upgrade price}. Sign in to see your upgrade link." The line shows only once purchase is open, like the rest of the page.
- Account page and `UpsellCard` (the `basic` branch for the `coach` feature): "Upgrade to Pro for {upgrade price}" with the checkout link, shown only when `entitlement` is `member` at `basic` and the upgrade is configured.
- Anonymous and free-tier visitors never see the link.
- `FEATURES` in `lib/tiers.ts` is unchanged. The upgrade adds no feature, only a price path.

## Changes by file

1. `lib/billing/types.ts`: replace `VARIANT_TIER` with the variant map above (Basic, Pro, upgrade; test and live ids). Keep the comment that a later edition is a different key, and amend it (see OFFER-PLAN 3.2): Pro grants must also cover later editions.
2. `lib/billing/adapters/lemonsqueezy.ts`: `ProductOrder` gains `productKey` and an `upgrade` flag.
3. `lib/billing/process-event.ts`: use the order's `productKey` instead of `PRODUCT_KEY`; before mirroring an `upgrade` order, load the user's live grants and apply the eligibility rule. An ineligible order is mirrored with `grant: 'none'` (stored, no grant, event `unmatched`), the way an unknown metadata user already is.
4. `lib/billing/plan-mirror.ts`: the cascade. When a refunded record is Basic and the same user holds a live grant from a `handbook-v1-upgrade` record, plan a second `grantRevoke`. `MirrorPlan.grantRevoke` is a single object today, so it becomes a list; both stores (`neon-store.ts`, `memory-store.ts`, `file-store.ts`) and their tests change with it. The audit row for each revoke must be written.
5. `lib/access/membership.ts`: in `currentGrant`, break ties by tier rank (pro before basic) after the paid-first and `endsAt` ordering, so the projection shows the tier entitlement computes.
6. `lib/offer.ts`, `lib/tiers.ts`: the upgrade price (derived as Pro minus Basic), `BILLING_CHECKOUT_URL_UPGRADE` in the signed-in link builder and `.env.example`, `purchaseOpenFor` requiring the upgrade once it is part of the offer, and an `upgradeUrlFor` that is null unless purchase is open and the reader is a Basic member.
7. `components/handbook/UpsellCard.tsx`, `app/(public)/pricing/page.tsx`, `app/(product)/account/page.tsx`: the copy and the link above.
8. Docs: `/refunds` and `/updates` gain the upgrade and refund-cascade sentences when the upgrade ships (not before: the product does not exist yet); `docs/plans/COMPLETION-PLAN.md` wave 3 item 2 and the owner-inputs list gain the upgrade variant.
9. No migration is required. `billing_records.product_key` is free text and `tier` already allows `pro`. There is still no unique index on `access_grants.billing_record_id` (an open PROGRESS item): fix it before the upgrade ships, because a double-delivered upgrade order would otherwise create two live Pro grants.

## Tests

- `entitlement.test.ts`: Basic grant plus live Pro grant resolves to `member / pro`; Pro grant revoked resolves back to `member / basic`; Basic revoked with Pro live resolves to `member / pro` (this is what the cascade rule exists to prevent in the webhook, and the test documents it).
- `membership.test.ts`: both grants indefinite, the projection shows `pro`.
- `offer.test.ts`: purchase stays closed while the upgrade price or link is missing; `upgradeUrlFor` is null for anonymous, free and Pro readers and set for Basic.
- Billing tests (`lib/billing/*.test.ts`, all three stores): eligible upgrade creates the grant; ineligible lands as `unmatched` with no grant; a replayed event changes nothing; refund of the upgrade leaves Basic; refund of Basic revokes both.
- E2E: a Basic member sees the upgrade card on the coach page; a free member does not.

## Still open

1. **Timing.** The webhook is built, so the upgrade is a follow-on change to it. Either build it before purchase opens (recommended: it touches the same refund path that is being reviewed now), or launch without it and handle the first upgrades by hand: the owner records a Pro `complimentary`/`promo` grant through the admin screen after taking the $50 by a discounted Pro checkout. That works because `grantInputSchema` already accepts hand-made grants.
2. **Billing items already open in PROGRESS** that the upgrade depends on: the `test_mode` check with live variant ids, the unique index on `access_grants.billing_record_id`, and the owner's call on `fraudulent`.

## Not verified

Lemon Squeezy is the provider (OD-23) and its checkout link carries the user id. I did not check whether it can issue single-use discount codes. Nothing in this plan was run; it is a reading of the code on `origin/main` at `a2fe58f`.
