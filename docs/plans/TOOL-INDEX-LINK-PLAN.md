# Plan: "Every tool" links to the tool index

Status: proposed 2026-11-11; nothing here is built.

## Problem

In the pricing table, the Pro cell of the "Interactive tools" row says "Every tool" (`lib/tiers.ts`, FEATURES). It is plain text: `FeatureCell` in `components/site/PricingTable.tsx` renders every string value as a `<span>`. The list it refers to, "Every interactive tool (N)", is the `<details>` in `components/site/ToolIndex.tsx`, rendered just below the table on `/pricing` and in the "What's inside" section on `/`. It has no `id` and nothing targets it.

Wanted: clicking "Every tool" scrolls to that `<details>` and opens it.

## Decisions to confirm

| # | Question | Default |
| --- | --- | --- |
| 1 | Does Basic's "The five essential tools" link there too? | No. The index lists all 20, so the link would imply Basic gets them. Only Pro links. |
| 2 | Link on the home page too? | No. The home page has no pricing table; this is a `/pricing` change only. The new `id` is harmless there. |

## Design

1. **Anchor target.** `ToolIndex` gives its `<details>` `id="tool-index"`. Each page renders it once, so the id is unique. Add `scroll-mt-*` so the sticky public header does not cover the summary.
2. **Data.** `FeatureValue` in `lib/tiers.ts` is `string | boolean`. Rather than widen that union for every consumer, add an optional `links?: Partial<Record<TierId, string>>` to `Feature`, with `pro: '#tool-index'` on the Interactive tools row. `FeatureCell` takes an optional `href` and wraps the text in an anchor. This keeps `cellValue` and the "Not published yet" logic untouched.
3. **Open on navigation.** A bare `#tool-index` anchor scrolls but does not open a closed `<details>`. Add a small client component, `components/site/OpenOnHash.tsx` (`"use client"`, leaf only), mounted next to the `<details>` on `/pricing`. It:
   - on mount and on `hashchange`, if `location.hash` matches the id, sets `details.open = true`, then calls `scrollIntoView({ block: 'start' })`;
   - covers a direct landing on `/pricing#tool-index` as well as an in-page click;
   - removes its listener on unmount.
   It takes the `id` as a prop and looks the element up with `document.getElementById`, so `ToolIndex` stays a Server Component.
4. **Same-page click.** Clicking a link to the hash already in the URL fires no `hashchange`. The anchor's `onClick` is on the server-rendered cell, so instead the component listens for `click` on `a[href="#tool-index"]` at the document level and opens the element then. If this proves fiddly, fall back to making the cell a small client link component.
5. **Motion.** Use `behavior: 'smooth'` only when `prefers-reduced-motion: no-preference`.
6. **Styling.** Use the existing link treatment in the table (underline, inherits `text-muted-foreground`). Check focus ring and contrast in light and dark; the phone tab view shows the same cell, so it needs the same check there.

## Files

| File | Change |
| --- | --- |
| `components/site/ToolIndex.tsx` | `id`, `scroll-mt-*` |
| `lib/tiers.ts` | optional `links` on `Feature`; Pro link on the Interactive tools row |
| `components/site/PricingTable.tsx` | `FeatureCell` renders the anchor, desktop grid and phone card |
| `components/site/OpenOnHash.tsx` | new client leaf |
| `app/(public)/pricing/page.tsx` | mount `OpenOnHash` |
| `e2e/site.spec.ts` | new test (below) |
| `components/site/OpenOnHash.test.tsx` | unit test (happy-dom) |

No dependency, lockfile, CI or config change. Read `node_modules/next/dist/docs/` for the current `Link` and hash-navigation guidance before writing the client component, per AGENTS.md.

## Verification

- Unit (Vitest + happy-dom): the component opens a closed `<details>` when the hash matches on mount, on `hashchange`, and on a click of a matching anchor; does nothing for other hashes; removes its listeners on unmount.
- E2E (Playwright, `e2e/site.spec.ts`):
  - on `/pricing`, click "Every tool"; assert `.pub-tool-index` has `open`, its summary is in the viewport, and the URL ends in `#tool-index`;
  - load `/pricing#tool-index` directly; assert it is open;
  - at a phone width, switch to the Pro tab, click the link, assert the same;
  - assert "The five essential tools" is not a link.
- Existing "lists every tool from Appendix E" test must still pass unchanged.
- `pnpm typecheck`, then `pnpm test` for the touched files, then `pnpm e2e` against a build (the dev server on :3000 belongs to another session).
- Manual: keyboard (Tab to the link, Enter), screen reader name is still "Interactive tools: Every tool", reduced-motion on and off.

## Risks

- **Concurrent sessions edit this tree.** `git status` shows many uncommitted changes, including `components/site/PublicHeader.tsx` and `app/(public)/site.css`. Re-check status before every edit and stage only my files.
- **Branch.** The checkout is on `feat/support-outline`, which is unrelated. Branch as `feat/tool-index-link` before editing.
- **Sticky header offset** differs between desktop and phone; verify `scroll-mt` on both.
- **Server/client boundary.** Keep `OpenOnHash` a leaf so `PricingTable` and `ToolIndex` stay Server Components.

## Out of scope

Linking Basic's cell, linking the home page's "What's inside" to the index, and any change to the table contents. Mention-only: the pricing copy says "Every tool" for Pro but the index lists all 20 tools, so Basic's five should be marked in the index if we ever want the two to line up.
