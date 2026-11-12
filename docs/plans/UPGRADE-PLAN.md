# Basic to Pro upgrade plan

Status: owner decisions recorded 2026-11-11 (below); nothing is built yet. Part 2 of `docs/plans/OFFER-PLAN.md`, which also covers pricing, the refund window with an upgrade, and the terms copy. Written 2026-11-11 after reading `lib/access/*`, `db/migrations/003_access_billing.sql`, `lib/offer.ts`, `lib/tiers.ts` and `components/handbook/UpsellCard.tsx`.

## Recommendation

A Basic buyer pays the difference to reach Pro: **Pro price minus Basic price** ($79 Basic, $129 Pro, so $50), with no time limit. It is a third hosted-checkout product, "Pro upgrade", shown only to signed-in Basic members.

## Owner decisions (2026-11-11)

1. **Prices:** Basic $79, Pro **$129** (changed from $149 in OD-23, 9 Nov 2026), upgrade **$50**, no expiry. The upgrade price must always equal Pro minus Basic, so derive it rather than enter it twice.
2. **Refund of Basic after an upgrade:** cascade. Both grants are revoked and the owner is prompted to refund the $50 too.
3. **Ineligible upgrade orders:** manual review. They land as `unmatched` with no grant.
4. **Timing:** still open. Default is to build inside M7 with the webhook.

## What the code already does

- `entitlement()` (`lib/access/entitlement.ts`) takes the **highest tier across all live grants** (`higherTier`). A second, live `pro` grant on a user who already has a `basic` grant is enough to make them Pro. No tier-change logic is needed.
- `access_grants` has no uniqueness on `(user_id, tier)`, and `billing_records` is unique only on `(provider, provider_object_id)`. A user can hold both a Basic and a Pro purchase today.
- Each grant carries its own `billing_record_id` and can be revoked on its own (`revokeGrant`). Refunding the upgrade therefore revokes only the Pro grant and leaves Basic untouched, which is the behaviour we want.
- `recomputeMembership` / `currentGrant` rank paid grants by longest `endsAt`, with both indefinite. The projection may show `basic` or `pro` as the current tier depending on sort order. It is display-only (enforcement never reads it), but the admin list would be wrong. See change 3.
- `coachOpen`, `toolOpen` and `pageOpen` all read the computed entitlement, so every Pro-only surface unlocks as soon as the Pro grant exists.

## What is missing

1. **The webhook does not exist.** `003_access_billing.sql` says the billing tables are written "until M7 (the webhook and the admin screens)". There is no webhook route under `app/api/`. The upgrade is one more product in a webhook that still has to be built, so this plan belongs inside M7, not after it.
2. **No upgrade product, price or link** in `lib/tiers.ts` / `lib/offer.ts`.
3. **No upgrade UI.** `UpsellCard` shows "See plans and buy" to a Basic member who hits a Pro-only feature (coach) but cannot say "upgrade for $50". `/pricing` does not mention it.
4. **No eligibility check.** A hosted checkout link is public. Anyone who finds the $50 link could buy it.

## Design

### Product mapping

One table in the webhook decides what a paid order means, keyed by the provider's product or variant id:

| Product | `product_key` | `billing_records.tier` | Eligibility |
| --- | --- | --- | --- |
| Basic | `handbook-1.0` | `basic` | none |
| Pro | `handbook-1.0` | `pro` | none |
| Pro upgrade | `handbook-1.0-upgrade` | `pro` | user has a live Basic **purchase** grant and no live Pro grant |

The upgrade gets its own `product_key` so reporting and the `billing_records_user_product` index can tell an upgrade from a full Pro sale. `amount_cents` records the $50, so revenue stays correct.

### Eligibility (the part that needs a decision)

The webhook, not the link, is what protects the price. On a paid upgrade event:

- Match the order to a user by the checkout's custom field or email, as for any purchase.
- **Eligible:** create the billing record (`paid`) and a `purchase` grant at `pro` in one transaction, with an audit row (`grant.create`, actor `webhook`), then `recomputeMembership`.
- **Not eligible** (no Basic grant, or already Pro): store the billing record and event as `unmatched`, create **no grant**, and surface it in the admin billing list for a manual refund or a manual full-price top-up. Never silently grant Pro for $50 to someone who never bought Basic.

Decided: manual review. A server-generated per-user checkout URL (provider API, custom data plus a single-use discount code) would close the hole before payment, but it needs provider API code and a secret, which this site avoids today. Revisit if unmatched orders become frequent.

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

1. `lib/tiers.ts`: add `upgrade?: { priceDisplay: string | null; checkoutUrl: string | null }` on the Pro tier, plus a helper `upgradeFor(tier)` returning it only for Basic members.
2. `lib/offer.ts`: `purchaseOpenFor` also requires the upgrade price and link once the upgrade is part of the offer (keeps "closed until everything is set"). Add `upgradeUrlFor(entitlement)`; null unless purchase is open and the reader is Basic.
3. `lib/access/membership.ts`: in `currentGrant`, break ties by tier rank (pro before basic) after the paid-first and `endsAt` ordering, so the projection shows the tier entitlement computes.
4. Webhook (M7, new): the product mapping table, the eligibility rule and the `unmatched` path above. Idempotent on `billing_events (provider, provider_event_id)`, as already designed.
5. Refund path (M7): the cascade rule above, with an audit row for each revoked grant.
6. `components/handbook/UpsellCard.tsx`, `app/(public)/pricing/page.tsx`, `app/(product)/account/page.tsx`: the copy and the link above.
7. Docs: `docs/_archive/launch-handoff.md` owner inputs gain "upgrade price and checkout link"; `/refunds` and `/updates` draft copy gain the upgrade and refund-cascade sentences.
8. No migration is required. `billing_records.product_key` is free text and `tier` already allows `pro`.

## Tests

- `entitlement.test.ts`: Basic grant plus live Pro grant resolves to `member / pro`; Pro grant revoked resolves back to `member / basic`; Basic revoked with Pro live resolves to `member / pro` (this is what the cascade rule exists to prevent in the webhook, and the test documents it).
- `membership.test.ts`: both grants indefinite, the projection shows `pro`.
- `offer.test.ts`: purchase stays closed while the upgrade price or link is missing; `upgradeUrlFor` is null for anonymous, free and Pro readers and set for Basic.
- Webhook tests (M7): eligible upgrade creates the grant; ineligible lands as `unmatched` with no grant; a replayed event changes nothing; refund of the upgrade leaves Basic; refund of Basic revokes both.
- E2E: a Basic member sees the upgrade card on the coach page; a free member does not.

## Still open

1. **Timing.** Build inside M7 with the webhook (recommended), or launch without it and handle the first upgrades by hand: the owner records a Pro `complimentary`/`promo` grant through the admin screen after taking the $50 by a discounted Pro checkout. That works because `grantInputSchema` already accepts hand-made grants.

## Not verified

The billing provider is not chosen (`provider` allows stripe, lemonsqueezy, paddle). Whether the chosen provider can pass a user reference through a public checkout link, and whether it can issue single-use discount codes, decides the eligibility design. Nothing in this plan was run; it is a reading of the code.
