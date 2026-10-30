# Plan: on-this-page outline and procedure blocks

Drafted 21 October 2026 and built the same day. File names and the layout numbers come from reading the repo. This is the implementation plan for borrowing two pieces of the Attio help article at `https://attio.com/help/reference/managing-your-data/objects/manage-standard-objects`: the in-page outline, and the short procedure (outcome, steps, one figure).

The landmark pass made the chapter title an `h1` and each section an `h2`. The outline collects those `h2`s. Callout titles stay `h3`.

The left book menu, the lesson frame (objectives, field notes, try-it, checkpoints, takeaways), breadcrumbs, permission banners, chapter FAQs, copy-link headings, and the `/preview` sample lesson stay as they are.

## What changes

1. A chapter with four or more section headings gets an "On this page" list. On a wide main column it is a sticky rail beside the card. On every narrower width the same list sits in the card, after the opening and before the first section.
2. Chapter 4's CRM setup, Appendix C, and Chapter 12's 90-day phases read as procedures: one outcome, the steps that already exist, and one figure. No new milestone lists.

## Layout

`#main-content` is the scroll container (`app/globals.css`). The sidebar is 320px (`#sidebar`) and the card is `max-width: 900px` with 60px of main padding. A 200px rail beside that card needs about 1160px inside the main column, which is a viewport of about 1600px with the current shell. A 1200px viewport cannot hold both, so the rail is not tied to a viewport breakpoint.

Use a container query on `.chapter-slot` (a width-only wrapper around the frame, inside `#main-content`, not on the scroll container itself). The rail is a sibling of the card, so its sticky containing block stays `#main-content`:

- Main content box under 1160px: one card. The outline is in normal flow.
- 1160px and up: the frame is a centered grid, `minmax(0, 900px)` plus a 200px column and a 28px gap. The card width does not shrink. The rail is `position: sticky; top: 24px` and sticks for the height of the chapter.

The browser check confirmed the rail stays near the top of `#main-content` after a jump.

Phone layout (the existing 900px shell in `app/globals.css`) is unchanged: the book menu stays the top menu, and the outline is just another short list in the card. `h1, h2, h3, h4` have `scroll-margin-top: 72px` there so a jump clears the sticky search row. Print hides `.chapter-outline` the same way it hides `#sidebar`, and forces the frame back to one column.

## Outline

Server-rendered from the page HTML. One client component owns the scroll spy and renders the list twice (stacked copy and rail copy). CSS shows one of them. The hidden copy is `display: none`, so it stays out of the accessibility tree.

`lib/outline.ts`:

- Collect `h2` text and `id` from the chapter HTML, in order. An `h2` with no id is skipped, which leaves out the objectives heading and "KEY TAKEAWAYS". Callout titles are `h3` and are not collected.
- Return nothing when fewer than four section headings have ids. That drops Chapter 6 (two headings and a stack of scripts), the short appendices, and the cover.
- Pages that qualify today: preface, Chapters 1–5 and 7–13, and Appendix B.

Placement of the stacked list, so it is not stranded under Chapter 12's roadmap widget: cut the opening HTML after `.learning-objectives` when that block occurs before the first `h2`; otherwise cut after `</h1>` (the preface, whose first section heading comes before the objectives). `components/shell/ChapterView.tsx` already splits widget segments; this is a second split of the opening HTML only. `.learning-objectives` has no nested `div`. Render intro, outline, remainder.

The nav is `<nav aria-label="On this page">` with a list of links. Scroll spy sets `aria-current="location"` on the section in view. Use `aria-current="page"` only on the book menu (`components/shell/Sidebar.tsx`). Observer root is `#main-content` above the phone breakpoint and the viewport on phones, matching `lib/scroll-anchor.ts`. A click updates the hash and moves focus to the heading (`tabIndex = -1`), the same landing search uses in `lib/search-jump.ts`. No smooth scroll.

### Heading ids

Keep every existing `id`. `content/data/concepts.ts` and `lib/coach/anchors.test.ts` deep-link to them (`the-one-time-setup`, `days-1-to-30`, `starter-library`, and the rest).

Add an `id` to every other section `h2` on a page that gets an outline. Slug the full heading: lower case, `&` to `and`, punctuation dropped, spaces to hyphens. One exception, so the set matches its siblings: `Days 31 to 60: build the rhythm` in `content/pages/ch12.html` becomes `days-31-to-60`, next to `days-1-to-30` and `days-61-to-90`. `Referral partners` in `content/pages/ch2.html` is the other Chapter 2 gap (`referral-partners`).

Appendix C has no section heading in `content/pages/app-c.html`. Its five group titles are rendered by `components/widgets/Checklists.tsx` as `h2`. Do not build an outline from those. The checklist headings are already the page's structure, and a second list would track a widget.

## Procedure blocks

A `.procedure` section is presentation only. Reuse the numbered-badge list already in `.note-dialog-body ol` (`app/globals.css`), scoped to `.procedure > ol`. Do not restyle every list in the book.

**Chapter 4, "The one-time setup"** (`content/pages/ch4.html`). The outcome sentence, the six-item `<ol>`, and `fig-crm-setup.svg` are already there. Wrap the heading and those three pieces in `<section class="procedure">`. Do not change the words. The six steps stay the source; Appendix C stays the checklist.

**Appendix C** (`content/pages/app-c.html`). Keep "Finish every item in your first week." Add `fig-crm-setup.svg` in the existing `.diagram-box` pattern, and one sentence: the groups follow the Chapter 4 setup, in the same order. Do not copy the six steps. The checklist is five groups (profile, contacts, follow-up plans, pipeline and routing, mobile and testing) in `content/data/checklists.ts`, not six rows, so the new sentence must not say "six."

**Chapter 12** (`content/pages/ch12.html`). The day-30/60/90 milestones already appear twice: the phase paragraphs and the roadmap checklist (`content/data/checklists.ts`, keys `ch12-d1` through `ch12-d3`). Do not add a third wording. Put `id={group.id}` on the checklist titles in `components/widgets/Checklists.tsx` (they are `h3` on this page, so they stay out of the outline). Under each phase paragraph, add one link to that title: the steps for the phase are the matching group on the roadmap. The figure (`fig-roadmap-90.svg`) and the checklist remain the procedure. "Assemble your 90-Day Business Plan" already has its own ordered list; leave that list as it is.

## Files

- `lib/outline.ts`, `lib/outline.test.ts` — collect headings, threshold, slug for new ids, intro cut point.
- `content/pages/*.html` — missing section-heading ids on the outlined pages; Chapter 4 wrap; Appendix C figure and sentence; Chapter 12 phase links. No edits to existing ids.
- `components/shell/ChapterOutline.tsx` — the two lists and the scroll spy.
- `components/shell/ChapterView.tsx` — frame, intro split, outline. Render nothing when the outline is empty.
- `components/widgets/Checklists.tsx` — ids on group titles.
- `app/globals.css` — frame, rail, stacked list, `.procedure`, print hide.
- `e2e/print.spec.ts` — the outline is hidden in print. Chapter 8 qualifies, so this is visible on the page that test already opens.
- A short Playwright spec for the outline and the Chapter 4 procedure.

Home, guided setup, plan, review, and account do not use `ChapterView`. They get no outline.

## Tests

- Unit: Chapter 2 returns seven items and keeps `sphere-of-influence`. Chapter 6 and Appendix C return none. Ids on each outlined page are present and unique. The Chapter 12 cut falls after the learning objectives and before the roadmap figure. Existing `lib/coach/anchors.test.ts` still passes untouched.
- Playwright, in `e2e/outline.spec.ts`: 1680px (rail visible, stacked copy absent, card still at most 900px), 1280px (list inside the card, no rail), the 1160px column edge (rail hidden at 1590px, visible at 1610px), and 390px (list inside the card, book menu still the hamburger, and a heading jump lands below the search row). Full width stays one column at 1680px and shows the rail beside a card of at most 1400px at 2100px. On Chapter 2, activate "Open houses" from the rail and from the stacked list, and assert the heading is in view and focused. Tab from the first rail link to the next. On Chapter 6, the nav is absent. Print of Chapter 8 hides the outline.
- Appendix C's checklist still counts 23 items (`e2e/parity/checklists-scorecard.spec.ts` already expects that total).

## Out of scope

Left sidebar contents and width. Nesting section links under the current chapter in that menu. Breadcrumbs. Plan or permission callouts. A chapter FAQ. Copy-link headings. Any change to `/preview`. Rewriting lesson boxes into help-center articles.
