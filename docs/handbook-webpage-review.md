# Webpage review: Finding, Keeping, and Nurturing Clients

Reviewed 18 October 2026; revised 19 October 2026 after an external critique of this report. Scope is the published handbook at `index.html` (GitHub Pages: `https://brianpx.github.io/realestate-handbook-v1/`), the chapter fragments in `chapters/`, the scripts in `js/`, and `css/styles.css`.

## Method and limits

Read the page shell, every chapter and appendix, the widget and navigation scripts, and the stylesheet. Confirmed with HTTP checks that the live site, `chapters/ch1.html`, and `downloads/AD_12-18_LegalChange_Draft5.pdf` all return 200 with no authentication. Confirmed in Node that `"a;b".replace(/;/g, '\;')` returns `a;b`.

**Which copy was reviewed.** The findings describe the live site, which serves `origin/main` at `0fa621c` (Pages build status `built`, 17 October 2026). `main` was pushed on 19 October 2026 (`ade9c01`; Pages build `built`) and now serves the fixes. E4, E5, E6 and L1 were present on the site as reviewed and are **fixed and live**; the verification results are under R4 and R7. The same push also shipped unreviewed content and script changes from the pre-migration snapshot (`7dde930`), so the findings below describe the site as it stood before that push.

Not done: no widget was run in a browser, no accessibility scanner was run, the overview video was not watched. Contrast, keyboard, and small-screen notes come from reading the CSS and JS, not from a rendered pass. Every "working" claim below is therefore **by code reading, unverified in a browser** until the verification step in the repair list is done.

Findings are tagged by how they were established: **verified** (observed or reproduced), **read** (from source or text), **judgment** (a recommendation).

This file is the report. Its two jobs are kept apart: Part 1 (findings and the repair list) is the release criteria. Part 2 (paid offerings) is a discovery agenda and is not authorization to gate content.

## Summary

The handbook is a coherent training product: one system (find, nurture, keep), a chapter pattern a new agent can work in a day, and a real set of calculators, drills, and planners. By code reading, the shell is careful about keyboard use, focus, captions, and phone scrolling.

The strongest findings are contradictions between prose, tools, and answer keys: the nurture count (8–12 in prose, 13 in the tool), two meanings of "8x8," quiz answers that do not match their chapters, and conversion rates with no stated denominator. Fix these from shared source data with consistency checks, so the Next.js migration does not just relocate them.

Separately, the legal chapter hosts a 2018 California form of unverified provenance and does not cover the post-2024 buyer-agreement and compensation rules a 2026 manual should address. The email gate does not say how the address is used, adds reading friction, and has no way through when the form post fails.

## What the page is

`index.html` is a single-page book. `js/app-with-cover.js` fetches `chapters/*.html` and appends the next chapter as the reader nears the edge. Widgets in `js/widgets.js`, `js/widgets-practice.js`, `js/widgets-plan.js`, and `js/interactive.js` upgrade the static tables after load. Progress, checklist ticks, calculator entries, and quiz confidence stay in `localStorage` on that browser. Appendix E says so, plainly.

The public promise is a free practical manual (`index.html` structured data, `isAccessibleForFree: true`). The first screen is an email gate (`index.html` lines 150–160) posted to a Formspree endpoint hardcoded in `js/app-with-cover.js` line 269. The code comment on line 309 is accurate: this is lead capture, not access control.

A second, unused app lives in `js/app.js`. A nested folder, `realestate-handbook-v1/README.md`, still tells a reader to open `book.html`. That file is empty.

## Findings

IDs are used by the repair list below.

### Content the reader can get wrong

**C1. Two different 8x8s (read; fixed 19 Oct, live).** Resolved: Table 5.1 has an eight-week 8x8 row for fresh sphere contacts and a separately named "New-lead sprint" (first 8 days) for brand-new online leads, and the caption says 8x8 means only the eight-week sphere plan. This was already in the static snapshot deployed in `1d913a5`; checked in the repo files, not re-read from the live site. The original finding follows. The glossary (`chapters/app-d.html`) and Appendix B.2 define 8x8 as eight touches over eight weeks for a new sphere contact. Table 5.1 (`chapters/ch5.html`) puts "8x8 New Contact" in the first 8 days and assigns it to both brand-new leads and fresh sphere contacts. The caption underneath tries to split "eight-day" and "eight-week" versions, but the table cell still lists both audiences on the eight-day row. A new agent building the plan from the table can install the wrong cadence. Appendix C then points the sphere plan at B.2, the eight-week one.

**C2. The nurture count does not survive contact with the tool (read; fixed 19 Oct, live).** Resolved to one plan of 13 touches over 90 days. Checked against the static files deployed in `1d913a5`: Appendix B.1, the no-JS Figure 5 and `NURTURE_TOUCHES` agree on all 13 days; no chapter, `index.html` or `js/widgets-practice.js` states any other digit count next to "touch"; the Chapter 13 quiz key says 13. Not separately checked: the Chapter 13 one-card wording, and the no-JS and essential-tools renderings in a browser. The original finding follows. Chapter 5's objective is "8 to 12 touches over 90 days." The one-card in Chapter 13, and the Chapter 13 quiz that grades it (`js/widgets-practice.js`, the "how many times" question), both say 8 to 12. Appendix B.1 and `NURTURE_TOUCHES` in `js/widgets.js` are 13 touches on days 0, 0, 1, 3, 7, 10, 14, 21, 30, 45, 60, 75, and 90. With JavaScript on, the explorer replaces Figure 5 and shows 13. With JavaScript off, or with Settings → essential tools only (`setupNurtureTimeline` is skipped in that mode), the reader sees the static Figure 5 sentence, which starts on day 1, skips touches 9–11, and labels day 60 as touch 12.

*Qualification:* an early post-close sequence and an annual relationship plan can legitimately have different touch counts. The defect is that one plan has two counts and nothing says which framework applies. Decide what each sequence is for, then give each one count.

**C3. Value cadence (read; fixed).** Both the static site and the Next.js port now say every third touch (3, 6, 9, 12), and no page says "third or fourth". The original finding follows. "Value every third touch" and "every third or fourth touch" both appear in the Figure 5 caption and chapter body. The tool marks touches 3, 6, 9, and 12. Pick one rule for figure, caption, and quiz.

**C4. Three scoreboards (read).**

| Place | What it tells the agent to track |
| --- | --- |
| Table 8.2 (`chapters/ch8.html`) | Six weekly numbers: calls 40–60, conversations 15–25, follow-ups 30–50, appointments set 3–6, one open house, database updated daily |
| Chapter 12, "Measure every week" | Four numbers: conversations, appointments set, follow-ups, pipeline value. The checkpoint grades those four |
| Appendix A | Thirteen rows, including appointments held, 15 new contacts, 2 posts, morning blocks, pipeline count, and referrals |

*Qualification:* different scorecards are not automatically errors. A daily activity checklist, a weekly coaching scorecard, and an executive summary can legitimately track different measures. The problem is that Appendix A opens with "Targets match Table 8.2" when they match only on the overlapping rows, and that the Chapter 8 and Chapter 12 checkpoints grade a list the reader may not be holding. Define each one's purpose and audience first; then collapse only the overlap into Appendix A. Where a quiz asks about a scorecard, name which one.

Related: Table 4.1 budgets prospecting at 60–90 minutes. Table 8.1 blocks 9:30–11:30, which is two hours. The weekly planner defaults to 90 minutes (`js/widgets-plan.js`, `prospecting: 90`).

**C5. Chapter 2's checkpoint asks for three prerequisites before paying for online leads (read).** The chapter gives one: do not buy leads until the follow-up system has been built and tested on the sphere. Speed and persistence, which the answer key lists (`js/widgets-practice.js`, `ch2`), are what make those leads pay off, and Chapter 3 is where the actual three-part test lives (automated reply, call before 9 a.m., a 90-day plan). The answer key blends two chapters into a question Chapter 2 did not ask.

**C6. Conversion rates have no denominator (read).** Figure 2 compares sphere "15–30%+" with Zillow "1–5%," and the pitfall says the sphere converts at five to ten times a portal lead. The figure never says percent of what: names in the database, conversations, or inquiries. The lead-source chart copies the ranges (`LEAD_SOURCES` in `js/widgets-practice.js`) and caps the axis at 30%, so the "+" on the sphere row is not drawn. The cost-per-closed-deal calculator is the sound half of this tool. Name the unit, or label the chart illustrative.

**C7. "Eight conversations per appointment" next to "about 20" (read).** Table 1.1 uses about 20 for a new agent. The field note two paragraphs later uses eight as if it were the working example. Add "for example, if your own ratio turns out to be eight."

**C8. The post-close plan changes length depending on where you look (read; fixed 19 Oct, live in `3f1ffc0`).** Decision: the post-close plan is the first year of the relationship, with six steps and seven dated touches per client (closing day, 1 week, 30 days, months 3, 6 and 9, and the month-12 anniversary in place of a fourth quarter). The annual appreciation event or gift is scheduled once a year, not per client. After year one the client stays on the Quarterly Call Plan (B.3). Chapter 10's objective, Table 10.1 caption, checkpoint question, Appendix B.4 and Table 5.1 (now "Post-Close Plan, 7 in year one") say this, and the scheduler already produced seven dated touches. Live check of `ch10.html` and `ch5.html` after the Pages build; the scheduler rendered 7 rows in a local browser run. The original finding follows. Table 10.1 and the Chapter 10 checkpoint list six touches, including an annual appreciation event. The scheduler (`POST_CLOSE_STEPS` in `js/widgets-plan.js`) expands "Quarterly" into months 3, 6, and 9, keeps the anniversary at month 12, leaves the annual event as a footnote, and announces "7 scheduled touches." Table 5.1's "Post-Close Thank You" is "4 to 6" touches in the first 60–90 days. Quarter 4 is silently replaced by the anniversary. Distinguish the early post-close sequence from the annual relationship plan, then say in the tool what it schedules and what it leaves out.

**C9. Table 9.2 (read).** The caption says the first eight objections are the ones you will hear most; the table has ten rows. Rows 3 and 8 ("I already have an agent" and "I'm working with another agent on a home") are the same situation. The "we want to interview other agents" script box repeats row 10.

**C10. Income math is otherwise consistent (read).** $80,000 ÷ $6,500 rounds up to 13 closings, × 3 appointments × 20 conversations ÷ 48 weeks is about 16 a week, or 3 to 4 a day. The stress-test buttons scale the tiles and the sentence under them but leave the "Your number" column on the unstressed plan. Move the column with the buttons, or say they do not change it.

### Legal and distribution

Legal findings need an authoritative source, a jurisdiction, and a review date attached before the text changes. Rule statements below are scoped to what the sources support; the repair list requires a broker or counsel review. The book is jurisdiction-neutral but its examples are Keller Williams and, in one file, California, so state requirements are handled separately from the national rule.

**L1. Agency-disclosure sample (verified live, 19 Oct: the PDF returns 200 and `ch11.html` loads it in a dialog iframe; fixed and live 19 Oct: removed in `ade9c01`).** `chapters/ch11.html` offers "your state's agency disclosure form (view a sample)" and loads `downloads/AD_12-18_LegalChange_Draft5.pdf` (verified publicly downloadable, HTTP 200). Two separate issues, recorded separately:

- *Outdated draft presented as a generic sample:* the PDF is C.A.R. Form AD, Revised 12/18; the filename says draft. It is a California form shown in a book that tells every reader to use "your state's" form. **Established.**
- *License:* whether the publisher permits this republication is **unverified**. Public availability does not answer that. Check the C.A.R. terms or ask the publisher before characterizing it as infringement.

Either way, replace the iframe with a pointer to the reader's broker or association.

**L2. Post-settlement buyer-agreement and compensation rules (read, source needed).** The book is dated 2026 (`datePublished` 2026-10). Chapter 12's day-60 milestone is "buyer agreement signed" inside a consultation, with no statement of when a written agreement is required. Nothing in the chapters, glossary, or Appendix F mentions offers of compensation leaving the MLS, seller concessions, or who pays the buyer's agent.

Scope the claim carefully. NAR's practice rule requires a written agreement before touring for MLS participants working with buyers, with exceptions (for example, an agent hosting an open house solely for sellers); see [NAR settlement FAQs](https://www.nar.realtor/the-facts/nar-settlement-faqs). Do not write "required before touring" without that scope. State law and brokerage policy add separate requirements and must be handled per jurisdiction. Source, jurisdiction, and review date: to be attached by the broker reviewer (open item).

**L3. Fee-objection script (judgment).** Chapter 9's fee objection assumes "your commission" and "what you net." That framing is not inherently obsolete: whether it needs correcting depends on the assumed response and who pays whom. Review the script's response and payment assumptions against L2, then edit; do not rewrite on the premise that the phrase itself is wrong.

**L4. Automated texts are prescribed without a consent step (read).** Appendix B.1 and Chapter 4 tell the agent to fire a text and an email the moment a lead arrives, then to keep texting on a 90-day plan. Chapter 11 has one bullet on do-not-call and opt-out, and Appendix F links the National Do Not Call Registry. The plans never say: get permission before an automated marketing text, honor quiet hours, stop on the first opt-out. Chapter 2 prospecting (expired, FSBO, door-knock) does not point at the Chapter 11 bullet. Source and review date: to be attached by the reviewer.

**L5. Fair Housing "good area" answer (read).** The drill correctly marks "great for families" and "perfect for young professionals" as problems. The endorsed answer to "is this a good area?" is to hand over school and crime statistics, which is what Chapter 11 says. School ratings and crime maps are also a common steering path. Tell the agent to give the same third-party sources to every client without editorializing, and to confirm the script with the broker. The drill already ends with "ask your broker"; the answer key should be as careful as the disclaimer.

**L6. The legal disclaimer is styled as a checkpoint (read).** `chapters/ch11.html` puts "READ THIS FIRST" in `div.box.checkpoint`. The script only enhances a box whose title contains "CHECKPOINT," so it does not become a quiz, but it looks like one. Use a class of its own.

### Engineering

**E1. The email gate is bypassable and had no failure path (verified; failure path fixed and live 19 Oct, `ade9c01`).**

- *Bypassable:* `chapters/ch1.html` is publicly fetchable (verified, HTTP 200), and setting `localStorage.handbookAccess` also dismisses the dialog. The chapter URLs being public is what makes the gate bypassable; permissive CORS (`access-control-allow-origin: *`, observed) only matters for cross-origin script reads and is not the cause.
- *No escape (fixed):* before the 19 Oct push, if Formspree errored the dialog stayed up, the page stayed `inert`, and there was no skip. The live gate now has a "Continue without email" button, and the error message points to it and moves focus there. Verified in a local browser run at 360px with the Formspree request forced to HTTP 500: error shown, focus on the skip button, Enter dismisses the gate, page no longer `inert`, access flag stored. Not tested: a screen reader, the successful-submit path, or the live site in a browser. Bypassability is unchanged by design (the gate is lead capture, not access control).

**E2. The gate did not say what happens to the address (partly fixed, live 19 Oct, `1d913a5`).** Before: no privacy notice, no statement of use, no consent checkbox, no opt-out. Now the gate has a "How your email is used" disclosure: the address goes to Formspree and then to the author, is used only for follow-up notes about the handbook, stops on a reply of "unsubscribe," is not sold, and nothing is sent if the reader continues without email. Still open: there is no separate privacy page, no consent checkbox (not necessarily needed), and the opt-out promise is only true if the author actually sends notes and honors replies, which has not been confirmed. The handbook's own Chapter 11 standard ("honor every opt-out") is not applied to the handbook. Undisclosed use is the stronger problem; collecting an email on a free publication is not by itself contradictory.

**E3. Structured data and the modal (resolved).** `isAccessibleForFree: true` alongside a first-paint modal is not automatically a contradiction; it would be a problem only if the modal blocked reading with no way through (E1). As of 19 Oct the live page's source no longer contains `isAccessibleForFree` at all, and E1 is fixed. If the declaration is wanted back, it is now accurate to add.

**E4. Calendar export does not escape semicolons (verified on the site before the 19 Oct push: `js/widgets.js` line 64 served `'\;'`; fixed and live since, now `'\\;'`).** `icsEscape` in `js/widgets.js` does `replace(/;/g, '\;')`. In a JavaScript string `'\;'` is `;`, so the replacement is a no-op (confirmed in Node: `"a;b"` stays `"a;b"`, while commas are escaped). RFC 5545 requires semicolons in `TEXT` values to be escaped (`\;`); see [RFC 5545 §3.3.11](https://www.rfc-editor.org/rfc/rfc5545.html). The fix is `'\\;'`. Describe the impact as invalid escaping with interoperability risk: it does not universally split a field or guarantee a broken file, and current built-in event text may not contain a semicolon at all.

**E5. `chapters/pref.html` has a stray `</div>` and a `<!-- CHAPTER 1 -->` comment (verified live: 22 opens, 23 closes; balanced on the live site as of 19 Oct)** after the legend. The fragment is injected inside `.chapter-section`. It falls after the visible content.

**E6. `js/app.js` is an unloaded second navigator (live: HTTP 200; HTTP 404 as of 19 Oct).** Its page list omits the cover, Appendix E, and Appendix F, and it binds `#prevBtn` and `#nextBtn`, which are not in `index.html`. Loading it would throw.

**E7. `realestate-handbook-v1/book.html` is zero bytes (not found on the live site, HTTP 404, and not in any `main` tree; it was deleted in history at `24ca95e`. The stale README described in this finding was not found in either tree, so treat the finding as unconfirmed).** The README beside it says to open that file and that the book is one self-contained HTML file. The live book is `index.html` plus the `chapters/` fragments. The README also says the book was prepared for a named person and that Chapter 4 is KW Command; neither appears on the site.

**E8. Print prints what has been fetched (read).** Chapters load as the reader approaches them (`fillContinuous` in `js/app-with-cover.js`). The scorecard's Print button calls `window.print()`, and the print CSS hides the sidebar, so a reader who prints from Chapter 1 gets a partial book.

*Acceptance criteria:* the scorecard Print button prints the scorecard, not the whole book (and not whatever happens to be loaded). If chapter and full-book printing are wanted, offer them as separate controls; full-book print loads every chapter first.

**E9. Search covers headings only (read).** `SEARCH_SELECTOR` in `js/search.js` is `h2, h3, h4, dt, .diagram-title`. "Wire fraud," "do not call," and "buyer representation agreement" live in paragraphs, lists, and checklist items, so they are not found. Cmd/Ctrl+K focusing the box works by code, and the gate blocks it while `inert`.

## Redundancy

Some repetition is the method. The preface says to work one chapter a day, and the key takeaways, the Friday-review habit, and the Chapter 13 one-card are doing that job. Keep them.

These copies disagree, so they cost more than they teach:

- Daily rhythm, four times, with two different prospecting lengths: Figure 3, Table 4.1, the Chapter 8 sample day, Table 8.1, plus the planner.
- "Open the CRM first and update it last," in Chapters 1, 4, 8, and 13. Fine as a refrain once the tables match.
- Speed-to-lead, in Chapters 2, 4, and 7, the timer, and the one-card. The bands (under 5 minutes, 5–30, after 30) are consistent. The touch count they attach to is not.
- "I'm just looking," as a Chapter 6 script and as Table 9.2 row 1. "Interview other agents," as a script box and as row 10.
- Post-close, as a Chapter 9 teaser, Table 10.1, Appendix B.4 (which only points back at Table 10.1), and the scheduler.
- Appendix E's tool table restates widgets the scripts already inject. Useful as an index; it will drift, and `trimToolIndex` already special-cases essential mode so the table can lie.

Dead copies to remove rather than reconcile: `js/app.js`, the empty `book.html`, and the nested README's description of a one-file book. `downloads/Finding Keeping and Nurturing Clients 2.docx` is not linked from the site.

## Missing elements

- **Identity.** The page never says who wrote it, which brokerage it assumes, or how to ask a question. The only byline is the colophon in Appendix D ("figures supplied by the author"). No about line, contact, or findable copyright notice.
- **What the gate delivers.** An address is collected and then nothing uses it: no confirmation, no "what you'll get," no return-visit recognition, no cross-device progress. Appendix E is honest that data stays on one device; the gate implies an account the book does not have.
- **A single CRM, named or removed.** The prose says "your CRM." The tasks are Keller Williams Command tasks (Agent Site, Client App, Marketing Profile, Opportunities, 8x8, Quarterly Call Plan); Appendix C's checklist group is `data-checklist="app-c-smartplans"`. Chapter 4 names Follow Up Boss as a later second CRM. An agent not on Command cannot complete Chapter 3's "finish your Agent Site" as written. Say "Keller Williams Command" or give the generic equivalent in parentheses.
- **Wayfinding at the end of a chapter.** Continuous scroll has no "next chapter" control; on a phone the table of contents is behind the menu.
- **The Appendix A closer.** "One change to make next week:" has no line to write it on. The Friday-review habit is the point of the scorecard.
- **Dates on Figure 7.** The try-it says to write today's date beside "Day 1" on the figure, which has no place to write. Point at the roadmap widget's start date.
- **Noscript and discoverability.** The noscript block lists chapter titles without links to the fragments. The sitemap has only the homepage, which also makes chapters invisible to a crawler.
- **Sitewide disclaimer.** "Not legal advice" appears in the Chapter 11 box and the Appendix D colophon only; scripts, fee talk, texting plans, and the income calculator sit in front of that. One footer line on every chapter is the right weight.
- **Edition.** `bookEdition` is "1.0" in structured data only. No changelog; cache-bust `v=20261100` is not a reader-visible version.

## What is working (by code reading; browser verification pending)

- The architecture is clear: find, nurture, keep, then a 90-day install. The four-week reading plan in the preface is usable on a Monday.
- Chapter pattern is stable: objectives, teaching, a script or table, try-it, checkpoint, takeaways. Answer keys track the chapter text closely, aside from the mismatches above.
- The income ladder's arithmetic is right, and the stress test and the "above Table 8.2" warning are the right teaching move.
- Practice tools are the product: script hide-and-reveal, objection trainer, qualifying drill, consultation lab, Fair Housing drill, pipeline Monday-call flag, post-close dates, `.ics` export, scorecard status that uses words as well as color (`Hit`, `Close`, `Miss`).
- The shell appears to handle what usually gets skipped: skip link, `aria-current`, a live region for page changes, focus moved into the new chapter, the gate marked `aria-modal` with the page `inert`, captions on the overview video, reduced-motion handling, 44px targets on coarse pointers, "opens in a new tab" text for Appendix F, honeypot plus a client-side throttle. **Whether these work in a real browser, screen reader, or phone has not been tested.**
- Glossary terms become buttons with a definition, and Escape returns focus.
- Local-only storage is disclosed in Appendix E before the tool table. Keep that sentence in any version that changes storage.

## Repair list (release criteria)

Priority order: misleading instructional content, the form's provenance, messaging guidance, the gate's failure behavior, then the rest. Each item is done when its verification passes. Fix content from shared source data (one nurture schedule, one scorecard definition list) and add a consistency check, so the Next.js port does not copy the discrepancies.

| # | Findings | Evidence | Impact | Proposed fix | Verification |
| --- | --- | --- | --- | --- | --- |
| R1 (**done, live 19 Oct**; consistency test only in the Next port) | C1, C2, C3, C8 | `ch5.html` Table 5.1 and Figure 5; `NURTURE_TOUCHES`; App. B.1/B.2; `POST_CLOSE_STEPS` | Agent installs the wrong cadence; quiz grades a count the tool contradicts | Decide purpose and count of each sequence (new-lead, sphere 8x8, early post-close, annual plan). Single data source feeds tables, Figure 5 (static HTML too), tool, one-card, quiz. Rename the eight-day sequence. | Unit test reading the data source against chapter text; render with JS off and essential mode and compare to tool. **Done:** `lib/nurture-consistency.test.ts` in the Next port (uncommitted at time of writing) checks B.1, the no-JS Figure 5, every digit touch count, the value cadence, 8x8 and the post-close plan against the data; six deliberate errors were caught in a scratch copy. For the static site, a one-off script checked B.1, Figure 5 and the counts; no committed test exists there. **Open:** a browser comparison with JS off and in essential-tools mode, the Chapter 13 one-card wording, and a committed check for the static site |
| R2 | C4, C5, C7 | Table 8.2, Ch12, App. A, Table 4.1/8.1, `ch2` answer key | Reader holds two lists; quiz tests content the chapter did not teach | State purpose of each scorecard; make App. A the superset, point others at it; align checkpoint keys to the named scorecard; one prospecting duration; fix Ch2 key | Checklist: each quiz answer traceable to text on the same page |
| R3 | C6 | Figure 2, `LEAD_SOURCES` | Unlike units compared | Name the denominator or label illustrative; draw the "+" | Read-through by author of source figures |
| R4 (**done, live 19 Oct**) | L1 | `ch11.html`, `downloads/AD_12-18_LegalChange_Draft5.pdf` | Outdated draft presented as generic; license unverified | Remove the iframe and PDF from the repo and Pages; point to broker or association. Record license as "unverified" in the decision log. | **Verified 19 Oct:** PDF URL returns 404; `ch11.html` has no reference to it |
| R5 | L2, L3, L4, L5, L6 | Ch9, Ch11, Ch12, App. B.1, Ch4, Ch2 | 2026 reader corrected in week one; texting without consent step | Add a dated Ch11 section with pointers from Ch9 and Ch12, scoped per L2 (MLS participants, exceptions, state separately), each with source, jurisdiction, review date. Add consent/quiet-hours/opt-out line to every plan that sends texts. Edit the "good area" answer. Own CSS class for the notice. | Broker/counsel sign-off recorded with date; each legal statement has a cited source |
| R6 (**mostly done, live 19 Oct**) | E1, E2, E3 | `index.html` 150–160, `app-with-cover.js` 269, 309 | No way through on Formspree failure; undisclosed use of the address | Disclose use and link a privacy note; add a skip/continue path on failure; stop calling it access control; revisit `isAccessibleForFree` after. | Browser test: block the Formspree request and confirm the reader can proceed; screen-reader pass of the dialog. **Done 19 Oct (local browser, 360px):** Formspree forced to 500, reader proceeds via the skip button. **Open:** screen-reader pass, successful-submit path, live-site browser check, confirm the "unsubscribe" promise is real, decide whether a separate privacy page is wanted |
| R7 (**done, live 19 Oct**; E7 unconfirmed, nothing to remove) | E4, E5, E6, E7 | `icsEscape`; `pref.html`; `js/app.js`; `book.html`; README | ICS interoperability risk; HTML error; dead code | `'\\;'`; remove stray tag; delete `app.js` and `book.html`; fix README | Unit test for `icsEscape` with `;` and `,`; HTML validator; import an exported `.ics` into a calendar. **Verified 19 Oct (live):** `widgets.js` serves `'\\;'`; `pref.html` 22/22 divs; `js/app.js` 404. Not yet done: unit test, HTML validator, calendar import |
| R8 | Missing: CRM, disclaimer, identity | Ch3, App. C, shell | Non-Command reader blocked; disclaimer far from the advice | Name Command or add generic equivalents; footer disclaimer; who-this-is-for line; about/contact | Read-through; footer present on every route |
| R9 | E8, E9, wayfinding, App. A blank | `search.js`, print CSS, Ch checkpoints | Weak search; partial print | Index body text; scorecard Print prints the scorecard; separate chapter/full-book print; "one change" field; next-chapter link | Browser test: print preview per control; search for "wire fraud" finds the paragraph |
| R10 | All "working" claims | None rendered | Praise unverified | Rendered pass: keyboard, focus, screen reader, 360px phone, contrast check, scanner run | Recorded results appended to this file |

## Part 2: Paid offerings (discovery, not authorization)

This part is hypotheses. It does not authorize gating content, and it does not override the existing plans. `docs/nextjs-migration-plan.md` recommends keeping reading anonymous with accounts optional for sync ("gating content is a business decision, not a migration step"), and `docs/reading-plan-coach.md` assumes the learning loop works with no account. **The business model is an explicit decision for the owner to make; until then, the earlier report's suggestion to put most chapters behind payment is withdrawn.**

The through-line worth testing is that the paid layer should be what a static book cannot be: someone or something that watches the Friday numbers and installs the CRM. Each offer below needs customer evidence (interviews, a pilot, willingness to pay) before anything is built.

- **New-agent cohort.** The book tells the reader to hand milestone dates to a productivity coach and share Friday numbers with an accountability partner, and neither can see the page. Hypothesis: office coaches would pay for a weekly scorecard snapshot. Needs accounts and a coach seat; not a CRM.
- **Setup sprint.** Appendix C is already a first-week checklist. Hypothesis: a done-with-you install (import and tag the sphere, turn on four plans, the 8 p.m. speed-to-lead test, calendar blocks) is the lowest-build way to learn. Command-versus-neutral becomes packaging here.
- **Office license.** Hypothesis: onboarding needs a 30-60-90 with a completion report. Which content would be gated, if any, is part of the business-model decision above.
- **Compliance module.** A dated, broker-reviewed state packet, not a national PDF library. Pull the 2018 draft down regardless (R4).
- **Practice subscription.** Spaced repeat of "needs work" objections, recordings, persistent score. Scripts need the R5 compensation review first.

What not to add: a second CRM; more chapters restating find, nurture, keep; video that repeats the chapters.

## Suggested sequence

1. R1–R3 and R7: content consistency from shared data, plus the small engineering fixes.
2. R4–R5: take the 2018 form down; start the broker review for the 2026 section and texting-consent line.
3. R6, R8: rewrite the gate as a disclosed, skippable opt-in; add disclaimer and CRM scope.
4. R9–R10: search, print, wayfinding; then the rendered accessibility and mobile pass.
5. In parallel and separate: decide the business model, then run customer discovery on Part 2. Pilot the setup sprint by hand before building accounts or coach sync.
