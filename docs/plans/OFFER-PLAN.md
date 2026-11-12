# Offer plan: pricing, upgrade, terms and policies

Status: owner decisions recorded 2026-11-11; nothing here is built. Only the launch price (1.3) is still open. Supersedes the prices in OD-23 (Pro was $149) and `docs/plans/COMPLETION-PLAN.md` wave 3 item 2, which should be updated when this is adopted. Detail for part 2 lives in `docs/plans/UPGRADE-PLAN.md`.

Read before this plan: `lib/tiers.ts`, `lib/offer.ts`, `app/(public)/{pricing,refunds,updates,terms}/page.tsx`, `content/site/faq.ts`, `lib/access/entitlement.ts`.

## 0. Decisions

| # | Decision | State |
| --- | --- | --- |
| 1 | Basic $79, Pro $129, one-time | Decided |
| 2 | Pro-minus-Basic upgrade ($50), no expiry | Decided |
| 3 | Refunding Basic cascades to the upgrade | Decided |
| 4 | Ineligible upgrade orders go to manual review | Decided |
| 5 | Pro includes future upgrades and additions; wording in 3.2 | Decided; owner approved the wording. A professional's review is still required before the policies are approved |
| 6 | Refund window: **14 days**, any reason, counted per purchase | Decided |
| 7 | Upgrade covers the edition the Basic owner bought (2.2) | Decided |
| 7a | Devices wording | Proposed copy in 3.4; not yet confirmed |
| 8 | Launch price for early buyers | Open, optional (1.3) |

## 1. Pricing plan

### 1.1 Prices

| Plan | Price | Notes |
| --- | --- | --- |
| Free | $0 | Overview, Chapters 1 and 7, four tools, one script |
| Basic | $79 | All 13 chapters and appendices, essential tools, corrections to edition 1.0 |
| Pro | $129 | Everything in Basic, every tool, the coach, the PDF, **and every future edition and addition** |
| Pro upgrade | $50 | Basic owners only; always derived as Pro minus Basic |

The future-editions promise changes what Pro is. Before, Pro was Basic plus a PDF and a coach, which was thin at +$70. Now it is "buy once, never pay again", which is a clearer reason to pay $50 more. That supports $129. It also means Pro's price carries an open-ended obligation (3.2), so I would not go below $129.

### 1.2 Where the numbers live

One source each, so copy cannot drift:
- `lib/tiers.ts`: `priceDisplay` for Basic and Pro. The upgrade price is computed from them, not typed.
- `lib/offer.ts`: new `REFUND_DAYS`, used by the refund page, the FAQ and the Terms block.
- Prices stay out of the code until the Lemon Squeezy products and checkout URLs exist, because `purchaseOpenFor()` needs a price and a link together (an unfinished price must not open the store).

### 1.3 Launch price (optional)

Suggested: $59 Basic / $99 Pro (upgrade stays $40 at launch) for the first 30 days or first 100 buyers, then the list prices. It needs a separate Lemon Squeezy variant or discount code and a visible end condition. Skip it if you would rather launch simply: the free sample is already the trial.

### 1.4 Checks after launch

At about 50 paid sales, compare Basic to Pro share and upgrade take-up. Mostly Basic with few upgrades: Pro does not look worth $50 more, so reconsider what it includes. Mostly Pro: Basic is priced too high or too thin. Verify Lemon Squeezy's current fee schedule before judging margin; I did not check it.

## 2. Upgrade plan (summary)

Full design, code changes and tests are in `docs/plans/UPGRADE-PLAN.md`. In short:
- `entitlement()` already takes the highest tier across live grants, so an upgrade is a second `pro` grant with its own billing record. No migration.
- The upgrade is a third Lemon Squeezy product with `product_key` `handbook-1.0-upgrade`. The webhook grants Pro only if the user has a live Basic purchase grant and no live Pro grant; otherwise the order is stored as `unmatched`, no grant is made, and you review it.
- Fix the membership projection tie-break so it shows `pro` over `basic` (display only).
- The upgrade link shows only to signed-in Basic members: pricing page, account page, and the coach upsell card.

### 2.1 How the refund window works with an upgrade

Each purchase has its own window, counted from its own payment date.

| Situation | Result |
| --- | --- |
| Refund the upgrade inside its window | Pro grant revoked, reader keeps Basic; $50 returned |
| Refund Basic inside its window, upgrade also live | Both grants revoked; you refund $79 and the $50. Reader returns to the free set |
| Refund Basic after its window but upgrade is inside its own | Only the upgrade refund is available. Basic is not refundable |
| Chargeback on either | Same as the matching refund row |

State the first and second rows in `/refunds` in plain words; the cascade is otherwise a surprise.

### 2.2 Future editions and the upgrade

Decided: once a new edition ships, a Basic owner who pays $50 to become Pro would otherwise get that edition for a quarter of its price. So the $50 upgrade covers the **edition the Basic owner bought**; when a new edition ships, Basic owners get the existing-buyer discount on it as already promised, and Pro is priced at that edition's Pro price. Say so on `/updates`.

## 3. Terms, policies and devices

### 3.1 Refund policy

The current draft on `/refunds` says 14 days for any reason, hard-coded twice. You asked about 7.

Decision: **14 days**. Reasons:
- It is what the draft already says and what the policy page calls "the policy the owner has set".
- Consumer-protection rules in some places (the EU and UK give a 14-day cooling-off period for online purchases, which can be waived for digital content only with the buyer's explicit consent at checkout) make a shorter promise riskier than it looks. The page already flags this as needing a professional's review; I am not giving legal advice.
- 7 days is defensible because the free sample lets people judge first, and it lowers refund exposure. It is the shortest I would accept. The cost is conversion: a short window reads as less confident.

Decided: 14 days. It is a single constant, `REFUND_DAYS`. Drafting changes:
- Keep "for any reason, however much you have used".
- Add the per-purchase window and the upgrade/cascade rows from 2.1.
- Replace the two open `Decision` notes with: how long a decision takes (suggest "within 3 business days"), and that the money returns by the original payment method through Lemon Squeezy, with timing set by the card issuer.
- Add: refund requests go to the support address from the account's email.

### 3.2 Updates, editions and "future upgrades or additions"

Current `OFFER.updatesTerm`: corrections and updates to edition 1.0; a future edition is a separate purchase with a discount. Your decision changes this for Pro. Terms as approved by the owner (a professional's read is still needed before the updates policy is approved):

- **Basic:** corrections and improvements to the chapters and essential tools of edition 1.0. A future edition is a separate purchase at an existing-buyer discount.
- **Pro:** everything in Basic, plus every new chapter, tool or script added to the handbook and every future edition, at no further charge, for as long as the handbook is published.

Rules this needs, none of which are in the code yet:
1. **"Lifetime" must be bounded.** Use "for as long as the handbook is published" and reserve the right to retire it with notice. Without that, a Pro sale is an obligation with no end.
2. **What counts as a new edition versus an addition** is your call; keep it plain. Suggested: an edition is a re-write of the book with a new title/edition number; anything else is an addition.
3. **Entitlement.** Grants have no edition field today. `product_key` on the billing record carries the edition (`handbook-1.0`). When edition 2 ships, `entitlement()` must treat any live `pro` grant as covering every edition and a `basic` grant as covering only its own. No migration is needed now, but write that rule into a test the day a second edition exists.
4. **Access term** ("lifetime access to edition 1.0 for one person, not transferable") stays, and gains "Pro: and later editions".

### 3.3 Terms at a glance (pricing page)

Proposed rows, replacing the current block:

| Row | Text |
| --- | --- |
| Price | Basic $79; Pro $129; Pro upgrade for Basic owners $50. One-time. |
| Access | Lifetime access to edition 1.0 for one person, not transferable. Pro also covers later editions. |
| Updates | Basic: corrections and improvements to edition 1.0. Pro: also every new chapter, tool and edition. |
| Refunds | `REFUND_DAYS` days, any reason. Link to the policy. |
| Devices | See 3.4. |
| Support | The support address; self-help on the support page. No priority support (Pro priority support is an open owner call in COMPLETION-PLAN wave 3 item 3). |

In `lib/tiers.ts` the single "Updates" row in `FEATURES` becomes two rows so the comparison table says it too: "Corrections to edition 1.0" (Basic and Pro) and "New chapters, tools and editions" (Basic: discount on a new edition; Pro: included).

The Refunds row currently reads "Not published yet" until the policy is approved. Better: show the window as soon as `REFUND_DAYS` is set, with the policy marked draft until approved.

### 3.4 Devices

Today: "Works in the browser on a phone, tablet or computer, with nothing to install. Progress is saved per browser on each device with no sync; move it with a backup file."

What is true, from the code and FAQ: purchase follows the account (the same email signs in anywhere); progress is in `localStorage`, so it is per browser, not per device, and a second browser on the same computer starts empty.

Proposed:

> Use it in the browser on any phone, tablet or computer, with nothing to install. Your purchase follows your account, so you can sign in on every device you own. Your progress does not follow you: it is saved in each browser separately and is not sent to a server. To move it to another device or browser, download a backup file on the first and restore it on the second.

Also add one sentence on `/updates` and the Terms "Your use" list: access is for one person, who may use it on their own devices.

Optional, not in this plan: cross-device progress sync is the obvious future Pro addition and fits the new "additions" promise. Do not announce it unless you intend to build it.

### 3.5 Other pages to keep consistent

`/terms`: add the one-person/own-devices line; its access and liability `Decision` notes stay for the professional review. `/updates`: replace the single updates paragraph with the Basic and Pro terms and the new-edition rule in 2.2. `content/site/faq.ts`: the "support and updates" answer, "Can I get a refund?" (state the window), and a new "Can I upgrade from Basic to Pro?" answer. `/support`: unchanged.

## 4. Work order

**A. Owner decisions (no code).** Done except launch price yes/no (1.3). Refund window, the 3.2 wording and the 2.2 rule are decided.

**B. Copy and configuration (can land before billing).** Branch `docs/offer-terms` off `main`, after the current uncommitted work on `feat/owner-postal` is committed or merged, because `lib/offer.ts` and `lib/offer.test.ts` are already modified there.
1. `lib/offer.ts`: add `REFUND_DAYS`, the per-plan updates terms; keep `purchaseOpenFor` semantics.
2. `lib/tiers.ts`: split the Updates row; derived upgrade price helper (no price entered yet).
3. Pricing page terms block, `/refunds`, `/updates`, `/terms`, FAQ copy as in section 3.
4. Tests: `lib/offer.test.ts`, `lib/tiers.test.ts`, and any `e2e/site.spec.ts` text assertions on the changed copy. Verify with `pnpm typecheck`, `pnpm test`, then `pnpm e2e`.
5. Policies stay `draft` in `POLICY_STATUS`. Nothing opens purchase.

**C. Billing lane (COMPLETION-PLAN wave 4, M7).** Add the upgrade product mapping, eligibility rule, `unmatched` path, refund cascade and membership tie-break from the upgrade plan. Tests as listed there, plus a webhook fixture for each row of 2.1.

**D. Launch readiness (wave 5).** In Lemon Squeezy test mode create the three products (Basic $79, Pro $129, Pro upgrade $50) and buy, upgrade and refund each way in 2.1 on a preview deployment; get a professional's read of `/terms`, `/refunds` and `/updates`; approve the policies in `POLICY_STATUS`; replace the stand-in postal address; enter prices and checkout URLs in `lib/tiers.ts`; then ask before the deploy that makes purchase live.

## 5. Risks and unverified points

- The refund window and the "future editions" wording are commitments to customers. Both need a professional's review before approval; I have not had one.
- I did not check Lemon Squeezy's refund mechanics, fees, or whether its checkout can carry a user reference. The eligibility design assumes manual review for that reason.
- `lib/offer.ts` is modified and uncommitted on `feat/owner-postal`; other sessions edit this tree. Re-check `git status` before starting part B.
- Not examined: `/privacy` (the billing data it must disclose changes when payments go live) and `/support`.
