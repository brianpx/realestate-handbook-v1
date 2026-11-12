# Plan: "Every tool" links to the tool index

Status: built on `feat/tool-index-link` (2026-11-11). Section "As built" records where the build differs from the first proposal.

## Problem

In the pricing table, the Pro cell of the "Interactive tools" row says "Every tool" (`lib/tiers.ts`, FEATURES). It was plain text: `FeatureCell` in `components/site/PricingTable.tsx` rendered every string value as a `<span>`. The list it refers to, "Every interactive tool (N)", is the `<details>` in `components/site/ToolIndex.tsx`, rendered below the table on `/pricing` and in the "What's inside" section on `/`. It had no `id` and nothing targeted it.

Wanted: clicking "Every tool" scrolls to that `<details>` and opens it.

## Decisions

| # | Question | Decision |
| --- | --- | --- |
| 1 | Does Basic's "The five essential tools" link there too? | No. The index lists all 20, so the link would imply Basic gets them. Only Pro links. |
| 2 | Link on the home page too? | No. The home page has no pricing table. The index still opens there on `#tool-index`, because the opener ships inside `ToolIndex`. |

## As built

1. **Anchor target.** `ToolIndex` gives its `<details>` `id={TOOL_INDEX_ID}` (`'tool-index'`, exported). Each page renders it once, so the id is unique. No `scroll-mt` was added: `app/(public)/site.css` already sets `scroll-padding-top` from the sticky header's height on `.pub` and `html:has(.pub)`.
2. **Data.** `Feature` in `lib/tiers.ts` gains an optional `links?: Partial<Record<TierId, string>>`; the Interactive tools row sets `links: { pro: '#tool-index' }`. `FeatureValue` is unchanged, so `cellValue` and the "Not published yet" logic are untouched. `lib/tiers.ts` writes the id as a literal because a library file should not import from a component; the comment on `Feature` points at the owner of the id.
3. **Cell.** `FeatureCell` takes an optional `href` and renders an underlined `<a>` in place of the `<span>`. Both the desktop grid and the phone card pass `feature.links?.[tier.id]`. The desktop grid's sr-only "Interactive tools: " prefix sits outside the anchor, so the link's name is "Every tool".
4. **Opening.** `components/site/OpenOnHash.tsx` (`"use client"`, renders `null`, takes the id as a prop) opens the `<details>`:
   - on mount, when `location.hash` names it (a direct load of `/pricing#tool-index`);
   - on `hashchange`;
   - on a click of any `a[href="#tool-index"]`, listened for at the document level, because a click on a link to the hash the URL already has fires no `hashchange`.
   `ToolIndex` renders it next to the `<details>`, so both pages get it and `ToolIndex` stays a Server Component. Listeners are removed on unmount.
5. **Scrolling.** The browser does it. Opening a `<details>` only adds content below its summary, so the target does not move. The first proposal had a `scrollIntoView` call and a reduced-motion branch; both were dropped as unnecessary, and the site's existing reduced-motion rule in `site.css` already covers smooth scrolling.

## Files

| File | Change |
| --- | --- |
| `components/site/ToolIndex.tsx` | `id`, exported `TOOL_INDEX_ID`, mounts `OpenOnHash` |
| `lib/tiers.ts` | optional `links` on `Feature`; Pro link on the Interactive tools row |
| `components/site/PricingTable.tsx` | `FeatureCell` renders the anchor, desktop grid and phone card |
| `components/site/OpenOnHash.tsx` | new client leaf |
| `components/site/OpenOnHash.test.tsx` | new unit tests (happy-dom) |
| `e2e/site.spec.ts` | three new tests |
| `app/(public)/pricing/page.tsx` | unchanged; the first proposal mounted the opener here |

No dependency, lockfile, CI or config change.

## Verification

Run in the worktree:

- `pnpm typecheck`: passed.
- `pnpm test components/site lib/tiers`: 6 files, 24 tests passed. The click test was mutation-checked: with the click handler broken it fails, with it restored it passes. An earlier version of that test passed even with the handler broken, because a leftover `hashchange` reopened the details; the test now waits for the `hashchange` to settle before it closes the details and clicks.
- `pnpm e2e e2e/site.spec.ts e2e/css.spec.ts` against a fresh build: 52 passed, before the unit-test fix (which did not touch app code). The new cases are a desktop click (URL ends `#tool-index`, index open and in the viewport), a direct load of `/pricing#tool-index`, and the Pro tab at 390px. The existing "lists every tool from Appendix E" test passes unchanged. The first e2e run failed on an assertion of mine, since "The five essential tools" renders in both the grid and the tabs; the assertion was removed and the zero-links check stays.
- A reviewer who had not written the code read the diff and found no real defects.

Not checked by hand: keyboard use (Tab to the link, Enter), screen-reader announcement, dark-mode contrast of the link.

## Known limits

- A Ctrl/Cmd-click or middle-click on the link also expands the index on the current page while the link opens in a new tab. Harmless.
- If a linked cell ever gains a `publishedWhen` term and shows "Not published yet", it would link with that text. The Interactive tools row has none today.

## Out of scope

Linking Basic's cell, linking the home page's "What's inside" to the index, and any change to the table contents. The pricing copy says "Every tool" for Pro but the index lists all 20 tools, so Basic's five are not marked in the index; mark them if the two should ever line up.
