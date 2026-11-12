# Plan: left sidebar behaviour

Status: proposed 2026-11-11; nothing here is built. Findings come from reading `components/shell/Sidebar.tsx`, `SidebarSearch.tsx`, `Settings.tsx`, `ProgressItem.tsx` and the sidebar CSS in `app/globals.css`, plus a Chromium probe (1280px wide, heights 600/700/800/900) against a production build of the working tree.

## Problem

The desktop sidebar spends most of a laptop-height window on a 413px header before the reader sees any navigation. Measured:

- At 600px tall the nav list is 116px high: the progress card and "GET STARTED", no rows. At 800px it is 316px.
- Scrolling the main panel past 60px collapses the header, and every row jumps up 413px (list height 116 to 529px at 600px tall; 316 to 729px at 800px).
- Search results make the whole sidebar scroll (`scrollHeight` 2336px against 600-900px visible). The search box leaves the top, and the last result stops 12px short of the bottom (bottom edge 612px in a 600px window). At 700px tall only about 3 results fit under the header.
- Between 901 and 1100px the fixed 320px rail takes 36% to 29% of the window; at 901px the content card is 461px wide.

Code-read findings, not measured in a browser:

- A non-passive `touchmove` listener on `document` stays attached on every page (`Sidebar.tsx:124-142`), though it only acts while the phone menu is open.
- The current page is never scrolled into view in the nav list.
- Part titles are `<li role="presentation">`, so assistive technology hears one flat list of about 40 links.
- Settings and the legal line sit inside `<nav>`, at the bottom of that scroll area.
- Pressing Enter in the search box does nothing; the cap of 12 results is not shown.
- Tapping the phone backdrop does not dismiss open search results.
- Focus moves to the page heading on every route change, so a keyboard user re-tabs through the sidebar to go to the next chapter.

Not reproduced, dropped: wrapped labels colliding with the read tick or lock badge at Large text.

## Decisions to confirm

| # | Question | Default |
| --- | --- | --- |
| 1 | Desktop header: always compact (logo beside the title, as phones have now), or keep the large one and collapse it at load on short windows? | Always compact. Removes the scroll-triggered jump and the `header-collapsed` state and its JS. |
| 2 | Collapsible parts in the nav? | Yes, one part open at a time by default (the current one). Cuts the list from about 40 rows to about 15. Parts are disclosure buttons, not a menu. |
| 3 | Settings: pinned footer button that opens a popover, or stay in the list? | Pinned footer, outside `<nav>`. The auto-fold-on-scroll-up handlers go with it. |
| 4 | Sidebar width between 901 and 1100px? | Narrow the rail to 260px in that range. A desktop collapse toggle is out of scope. |
| 5 | Keep "Interactive tools" and Appendix E as two rows to one page? | Keep both; mark the tools row current as well when on Appendix E. |

## Design

### Phase 1: no-risk fixes (one commit each)

1. **Passive touch handling.** Register the `touchstart`/`touchmove` listeners inside `syncScrollLock` when it locks and remove them when it unlocks. The file already relies on `inert`, `overscroll-behavior: contain` and the backdrop's `touch-action: none` for the rest.
2. **Active row in view.** On mount, route change and menu open, scroll the list so the active row is visible: `scrollTop` arithmetic on `#navList`, not `scrollIntoView`, which would also scroll the page on phones.
3. **Search Enter.** Enter in the input opens the first result via the existing `choose`. Show "Showing 12 of N" when capped; this needs `searchEntries` to return the total.
4. **Phone backdrop.** Outside-tap clears the query as well as closing the menu.
5. **Smaller items.** `aria-label` on the toggle names what it opens (menu, with the current wording kept for search); mark the tools row current on Appendix E; replace `transition: all` with colour and background; add a visually hidden "(read)" span for the tick in place of the CSS alt-text syntax.

### Phase 2: layout (one change; fixes search clipping and the jump together)

1. `#sidebar` becomes a column: compact header (about 72px), search row, then one scroll region. Results and the nav list share that region; only the active one is displayed.
2. Remove `header-collapsed`, `--header-h`, the 60/8px thresholds and their `scroll` listener from `Sidebar.tsx`, and the matching CSS. Phone behaviour is unchanged: it already uses the compact header and sticky row.
3. Drop the `-12px` bottom margin on `.search-results` and give the region bottom padding so the last result is fully reachable.
4. Show a thin scrollbar on the nav region on desktop (or a bottom fade mask) in place of `scrollbar-width: none`.
5. Between 901 and 1100px set `#sidebar` width to 260px.
6. Move `Settings` and the legal line out of `<nav>` into a pinned footer of the sidebar column. Settings opens as a popover or stays a `<details>`; decide at build time with the shadcn components already in use. Remove the global wheel/touch/key handlers that fold it.
7. Keep the progress card at the top of the list region; it scrolls with the list.

### Phase 3: structure and keyboard

1. **Grouped nav.** Each part becomes an `<li>` with an `<h2>` (or `aria-labelledby`) and a nested `<ul>`, replacing the `role="presentation"` titles. With decision 2, the heading becomes a `<button aria-expanded>` inside the heading; the current part opens on load and on navigation, and a part with the active row cannot be collapsed.
2. **Focus after navigation.** Keep focusing the page heading for screen readers. Confirm the chapter pages carry prev/next links near the top as well as the bottom (`ChapterEnd` covers the bottom; not checked for the top). Drop the `#pageStatus` write when the focused heading already announces the page.
3. **Search landmark.** Move the menu toggle out of `<search>`; keep it visually in the same row.

## Files

| File | Change |
| --- | --- |
| `components/shell/Sidebar.tsx` | touch listeners scoped to the lock; active-row scroll; header-collapse code removed; grouped, collapsible nav; footer split; toggle label |
| `components/shell/SidebarSearch.tsx` | Enter opens first result; cap notice; toggle moved out of `<search>`; backdrop clear |
| `lib/search-query.ts` | return the total beside the capped list |
| `components/shell/Settings.tsx` | pinned footer / popover; fold-on-scroll handlers removed |
| `app/globals.css` | column layout, compact header, scrollbar, 901-1100px rail, `transition`, group styles; header-collapse rules removed |
| `e2e/css.spec.ts`, `e2e/a11y.spec.ts`, `e2e/mobile-layout.spec.ts`, `e2e/site.spec.ts`, `e2e/access.spec.ts` | update selectors that assume `#navList > li` order, `.nav-section-title`, `header-collapsed` and Settings inside the list |
| `components/shell/Sidebar.test.tsx` | new: active-row scroll, lock/unlock listener lifecycle, grouped nav markup |
| `components/shell/SidebarSearch.test.tsx` | extend: Enter, cap notice |

Several of these files are modified and uncommitted in the working tree by other sessions (`Sidebar.tsx`, `SidebarSearch.tsx`, `globals.css`, `css.spec.ts`, `site.spec.ts`). Start from a clean commit of that work, or build in a worktree on a branch off the commit that contains it.

## Tests

New e2e (desktop, 1280 x 600 and 700):

1. Nav list is at least 300px tall on first paint at 600px height; no row moves when `#main-content` scrolls 200px.
2. With 12 search results, the search input stays in view after the results list scrolls to its end, and the last result's bottom is within the viewport.
3. Enter in the search box navigates to the first result's page.
4. On `/handbook/ch12` the active row is inside the nav region's visible box on load.
5. At 1000px wide the rail is 260px.
6. Tools and Appendix E rows both `aria-current` on `/handbook/app-e`.

Regression (existing, kept passing): `a11y.spec.ts` inert menu and Tab containment, `mobile-layout.spec.ts` menu height, `access.spec.ts` lock badges, `settings.spec.ts`, search specs under `e2e/parity`.

Unit: touch listeners are added on lock and removed on unlock (none while closed); grouped markup exposes headings and nested lists.

## Verification

`pnpm typecheck`, `pnpm test`, then `pnpm e2e` on the touched specs (port 3187 is shared; check `lsof -nP -iTCP:3187 -sTCP:LISTEN` first). Browser check of phone width (375 x 667) for menu, search and Settings, and a keyboard-only pass through the grouped nav. Re-run the 600/700/800/900px measurements for the jump and the search region. Safari/iOS scroll lock after Phase 1 item 1 is not testable here; needs a device or BrowserStack pass.

## Risks

- Phase 3 grouping changes markup that several specs and `data-page` selectors rely on; keep `data-page` and `.nav-item` unchanged.
- Removing the header collapse on desktop is a visible change; decision 1 should be confirmed with design before Phase 2.
- Settings in a popover must keep the ids the e2e checks and static-site selectors use (`settingDark`, `settingTrack`, and so on, see the comment in `Settings.tsx`).
- The first-run `fonts.ready` measurement of `--header-h` is needed only by the collapse; check nothing else reads it before deleting.

## Out of scope

Desktop sidebar collapse toggle; changing search ranking or the index; the page-level Settings behaviours unrelated to the sidebar; Safari/Firefox alt-text support for the read tick beyond the hidden-span replacement.
