# Webpage review: Finding, Keeping, and Nurturing Clients

Reviewed 18 October 2026. Scope is the published handbook at `index.html` (GitHub Pages: `https://brianpx.github.io/realestate-handbook-v1/`), the chapter fragments in `chapters/`, the scripts in `js/`, and `css/styles.css`.

Method: read the page shell, every chapter and appendix, the widget and navigation scripts, and the stylesheet. Confirmed with HTTP checks that the live site, `chapters/ch1.html`, and `downloads/AD_12-18_LegalChange_Draft5.pdf` all return 200 with no authentication. Did not run the widgets in a browser, did not run an accessibility scanner, and did not watch the overview video. Contrast and small-screen layout notes below are from the CSS, not from a rendered pass.

There is no docs connector in this session. This file is the report.

## Summary

The handbook is a coherent training product: one system (find, nurture, keep), a chapter pattern a new agent can work in a day, and a real set of calculators, drills, and planners. The shell is unusually careful about keyboard use, focus, captions, and phone scrolling.

It is not ready to sell as-is. Three scoreboards disagree, the nurture plan is 8–12 touches in the prose and 13 in the tool, and “8x8” means eight days in one table and eight weeks everywhere else. The legal chapter hosts a 2018 California Association of REALTORS® draft form and never teaches the post-2024 rules a 2026 manual has to teach. The email gate collects an address without saying why, and it does not protect the chapters. Those are the items to fix before a paid offer, and they are also the outline of the paid offer: coaching on the scorecard, a brokerage setup sprint, and a compliance module the current chapter only sketches.

## What the page is

`index.html` is a single-page book. `js/app-with-cover.js` fetches `chapters/*.html` and appends the next chapter as the reader nears the edge. Widgets in `js/widgets.js`, `js/widgets-practice.js`, `js/widgets-plan.js`, and `js/interactive.js` upgrade the static tables after load. Progress, checklist ticks, calculator entries, and quiz confidence stay in `localStorage` on that browser. Appendix E says so, plainly.

The public promise is a free practical manual (`index.html` structured data, `isAccessibleForFree: true`). The first screen is an email gate (`index.html` lines 150–160) posted to a Formspree endpoint hardcoded in `js/app-with-cover.js` line 269. The code comment on line 309 is accurate: this is lead capture, not access control.

A second, unused app lives in `js/app.js`. A nested folder, `realestate-handbook-v1/README.md`, still tells a reader to open `book.html`. That file is empty.

## Errors

### Content the reader can get wrong

**Two different 8x8s.** The glossary (`chapters/app-d.html`) and Appendix B.2 define 8x8 as eight touches over eight weeks for a new sphere contact. Table 5.1 (`chapters/ch5.html`) puts “8x8 New Contact” in the first 8 days and assigns it to both brand-new leads and fresh sphere contacts. The caption underneath tries to split “eight-day” and “eight-week” versions. The table cell still lists both audiences on the eight-day row. A new agent building the plan from the table will install the wrong cadence. Appendix C then points the sphere plan at B.2, which is the eight-week one.

**The nurture count does not survive contact with the tool.** Chapter 5’s objective is “8 to 12 touches over 90 days.” The one-card in Chapter 13, and the Chapter 13 quiz that grades it (`js/widgets-practice.js`, the “how many times” question), both say 8 to 12. Appendix B.1 and `NURTURE_TOUCHES` in `js/widgets.js` are 13 touches on days 0, 0, 1, 3, 7, 10, 14, 21, 30, 45, 60, 75, and 90. With JavaScript on, the explorer replaces Figure 5 and shows 13. With JavaScript off, or with Settings → essential tools only (`setupNurtureTimeline` is skipped in that mode), the reader sees the static Figure 5 sentence, which starts on day 1, skips touches 9–11, and labels day 60 as touch 12.

**“Value every third touch” and “every third or fourth touch” are both on the Figure 5 caption and in the chapter body.** The tool marks touches 3, 6, 9, and 12. Pick one rule and use it in the figure, the caption, and the quiz.

**Three scoreboards.**

| Place | What it tells the agent to track |
| --- | --- |
| Table 8.2 (`chapters/ch8.html`) | Six weekly numbers: calls 40–60, conversations 15–25, follow-ups 30–50, appointments set 3–6, one open house, database updated daily |
| Chapter 12, “Measure every week” | Four numbers: conversations, appointments set, follow-ups, pipeline value. The checkpoint grades those four |
| Appendix A | Thirteen rows, including appointments held, 15 new contacts, 2 posts, morning blocks, pipeline count, and referrals |

Appendix A opens with “Targets match Table 8.2.” They match on the overlapping rows only. The Chapter 8 checkpoint then recites Table 8.2’s six, so a reader who fills in Appendix A and then takes the checkpoint is holding two lists. Table 4.1 budgets prospecting at 60–90 minutes. Table 8.1 blocks 9:30–11:30, which is two hours. The weekly planner defaults to 90 minutes (`js/widgets-plan.js`, `prospecting: 90`).

**Chapter 2’s checkpoint asks for three prerequisites before paying for online leads.** The chapter itself gives one: do not buy leads until the follow-up system has been built and tested on the sphere. Speed and persistence, which the answer key lists (`js/widgets-practice.js`, `ch2`), are what make those leads pay off, and Chapter 3 is where the actual three-part test lives (automated reply, call before 9 a.m., a 90-day plan). The answer key blends the two chapters into a question Chapter 2 did not ask.

**Conversion rates have no denominator.** Figure 2 compares sphere “15–30%+” with Zillow “1–5%” and the pitfall says the sphere converts at five to ten times a portal lead. The figure never says percent of what: names in the database, conversations, or inquiries. Those are different units. The lead-source chart copies the same ranges (`LEAD_SOURCES` in `js/widgets-practice.js`) and caps the axis at 30%, so the “+” on the sphere row is not drawn. The cost-per-closed-deal calculator underneath is the sound half of this tool. The bar chart should wait until the unit is defined, or it should be labeled as illustrative.

**“Eight conversations per appointment” sits next to “about 20.”** Table 1.1 uses about 20 conversations per appointment for a new agent, blended across sources. The field note two paragraphs later uses eight as if it were the working example. It reads as a personal ratio the agent might later discover. It needs the words “for example, if your own ratio turns out to be eight.”

**The post-close plan changes length depending on where you look.** Table 10.1 and the Chapter 10 checkpoint list six touches, including an annual appreciation event. The scheduler (`POST_CLOSE_STEPS` in `js/widgets-plan.js`) expands “Quarterly” into months 3, 6, and 9, keeps the anniversary at month 12, leaves the annual event as a footnote, and then announces “7 scheduled touches.” Table 5.1’s “Post-Close Thank You” is “4 to 6” touches in the first 60–90 days, which is a third schedule. Quarter 4 is silently replaced by the anniversary. Say that in the tool.

**Table 9.2’s caption says the first eight objections are the ones you will hear most.** The table has ten rows. Rows 3 and 8 (“I already have an agent” and “I’m working with another agent on a home”) are the same situation. The “we want to interview other agents” script box repeats row 10.

**Chapter 1’s field note and the income math are otherwise consistent.** $80,000 ÷ $6,500 rounds up to 13 closings, × 3 appointments × 20 conversations ÷ 48 weeks is about 16 a week, or 3 to 4 a day. The calculator uses that ladder. The stress-test buttons scale the tiles and the sentence under them, and they leave the “Your number” column on the unstressed plan. The sentence explains the gap. The column should move with the buttons, or the buttons should say they do not change the column.

### Legal and distribution

**The sample disclosure is a copyrighted California form, and it is the wrong vintage.** `chapters/ch11.html` offers “your state’s agency disclosure form (view a sample)” and loads `downloads/AD_12-18_LegalChange_Draft5.pdf`. The PDF is C.A.R. Form AD, Revised 12/18, and the filename says it is a draft. It is publicly downloadable on the live site. A 2026 handbook should not ship a 2018 draft, should not present a California statutory form as a generic sample, and should not republish a C.A.R. form unless the publisher has a license. Replace the iframe with a pointer to the reader’s broker or association.

**The book is dated 2026 and still teaches the pre-settlement commission conversation.** Structured data says `datePublished` 2026-10. Chapter 9’s fee objection assumes “your commission” and “what you net.” Chapter 12’s day-60 milestone is “buyer agreement signed,” inside a consultation, with no statement that a written buyer agreement is required before touring. Nothing in the chapters, glossary, or Appendix F mentions offers of compensation leaving the MLS, seller concessions, or who pays the buyer’s agent. That is the rule set a new agent in 2026 will be corrected on in week one. The Chapter 11 “read this first” box already defers to the broker. The tactics chapters do not.

**Automated texts are prescribed without a consent step.** Appendix B.1 and Chapter 4 tell the agent to fire a text and an email the moment a lead arrives, then to keep texting on a 90-day plan. Chapter 11 has one bullet on do-not-call and opt-out, and Appendix F links the National Do Not Call Registry. The plans themselves never say: get permission before an automated marketing text, honor quiet hours, and stop on the first opt-out. An inquiry is not, by itself, permission for a 13-touch text sequence. The same gap applies to expired, FSBO, and door-knock prospecting in Chapter 2, which never points at that Chapter 11 bullet.

**Fair Housing drill matches the chapter, and the chapter’s “good area” answer needs a broker’s edit.** The drill correctly marks “great for families” and “perfect for young professionals” as problems, and property features as acceptable. The endorsed answer to “is this a good area?” is to hand over school and crime statistics. That is what Chapter 11 says. School ratings and crime maps are also a common steering path. The line should tell the agent to give the same third-party sources to every client and not to editorialize, and it should say to confirm the script with the broker. The drill already ends with “ask your broker.” The answer key should be as careful as the disclaimer.

**The legal disclaimer is styled as a checkpoint.** `chapters/ch11.html` puts “READ THIS FIRST” in `div.box.checkpoint`. The script only enhances a box whose title contains “CHECKPOINT,” so it does not become a quiz. It still looks like one. Use a class of its own.

### Engineering

**The email gate fails open as a lock and fails closed as a reader.** Anyone can fetch `chapters/ch1.html` (confirmed live, HTTP 200, `access-control-allow-origin: *`). Setting `localStorage.handbookAccess` also dismisses the dialog. The reverse failure: if Formspree errors, the dialog stays up, the rest of the page is `inert`, and there is no skip. A lead form should never be the only way to read a book the files already expose.

**The gate asks for an email and does not say what happens to it.** No privacy notice, no statement of what the address will be used for, no consent checkbox, no link to opt out. The handbook’s own Chapter 11 standard (“honor every opt-out”) is not applied to the handbook.

**Structured data contradicts the gate.** `index.html` declares `isAccessibleForFree: true` on a page whose first paint, with JavaScript, is a modal.

**Calendar export drops semicolons.** `icsEscape` in `js/widgets.js` does `replace(/;/g, '\;')`. In JavaScript that replacement string is a bare semicolon, so the escape is a no-op (confirmed in Node: `"a;b"` stays `"a;b"`, while commas are escaped). An ICS field splits on `;`. Current built-in event text may not include one. The first customized description that does will produce a broken file. Write `'\\;'`.

**`chapters/pref.html` has a stray `</div>` and a `<!-- CHAPTER 1 -->` comment** after the legend. The fragment is injected inside `.chapter-section`. The extra close tag is an HTML error (tag balance check: unexpected `</div>`). It happens to fall after the visible content.

**`js/app.js` is a second navigator that the page does not load.** Its page list omits the cover, Appendix E, and Appendix F, and it binds `#prevBtn` and `#nextBtn`, which are not in `index.html`. Loading it would throw. Delete it or stop leaving it next to the real entry point.

**`realestate-handbook-v1/book.html` is zero bytes.** The README beside it says to open that file for “the full interactive experience” and says the book is one self-contained HTML file. The live book is `index.html` plus the `chapters/` fragments. The README also says the book was prepared for a named person and that Chapter 4 is KW Command. Neither fact appears on the site.

**Print prints whatever has been fetched.** Chapters load as the reader approaches them (`fillContinuous` in `js/app-with-cover.js`). The scorecard’s Print button calls `window.print()`, and the print CSS hides the sidebar. A reader who prints from Chapter 1 does not get the book.

**Search covers headings only.** `SEARCH_SELECTOR` in `js/search.js` is `h2, h3, h4, dt, .diagram-title`. “Wire fraud,” “do not call,” and “buyer representation agreement” live in paragraphs, lists, and checklist items, so they do not appear. Cmd/Ctrl+K focusing the box does work, and the gate correctly blocks it while `inert`.

## Redundancy

Some repetition is the method. The preface says to work one chapter a day, and the key takeaways, the Friday-review habit, and the Chapter 13 one-card are doing that job. Keep them.

These copies disagree, so they cost more than they teach:

- Daily rhythm, four times, with two different prospecting lengths: Figure 3, Table 4.1, the Chapter 8 sample day, Table 8.1, plus the planner.
- “Open the CRM first and update it last,” in Chapters 1, 4, 8, and 13. Fine as a refrain once the tables match.
- Speed-to-lead, in Chapters 2, 4, and 7, the timer, and the one-card. The bands (under 5 minutes, 5–30, after 30) are consistent. The touch count they attach to is not.
- “I’m just looking,” as a Chapter 6 script and as Table 9.2 row 1. “Interview other agents,” as a script box and as row 10.
- Post-close, as a Chapter 9 teaser, Table 10.1, Appendix B.4 (which only points back at Table 10.1), and the scheduler.
- Appendix E’s tool table, which restates widgets the scripts already inject. Useful as an index. It will drift, and `trimToolIndex` already special-cases essential mode so the table can lie.

Dead copies to remove rather than reconcile: `js/app.js`, the empty `book.html`, and the nested README’s description of a one-file book. `downloads/Finding Keeping and Nurturing Clients 2.docx` is not linked from the site.

## Missing elements

**Identity.** The page never says who wrote it, which brokerage it assumes, or how to ask a question. The only byline is the colophon in Appendix D (“figures supplied by the author”) and a README that is not on the site. Logos and the cover carry the title. There is no about line, no contact, and no copyright notice a reader can find without reaching the glossary.

**The product the gate implies.** An address is collected and then nothing in the product uses it. No confirmation, no “what you’ll get,” no return visit that recognizes the reader, no way to recover progress on a second device. Appendix E is honest that data stays on one device. The gate implies an account the book does not have.

**A single CRM, named or removed.** The prose says “your CRM.” The tasks are Keller Williams Command tasks: Agent Site, Client App, Marketing Profile, Opportunities, 8x8, Quarterly Call Plan. Appendix C’s checklist group is `data-checklist="app-c-smartplans"`. Chapter 4 then names Follow Up Boss as a later, optional second CRM. An agent not on Command cannot complete Chapter 3’s “finish your Agent Site” exercise as written. Either say “Keller Williams Command” or give the generic equivalent in parentheses (website, consumer search app, pipeline stages, drip campaigns).

**Wayfinding at the end of a chapter.** Continuous scroll has no “next chapter” control. `js/app.js` expected previous and next buttons. On a phone the table of contents is behind the menu. A reader who stops at a checkpoint has no cue that the next part is below, other than more page.

**The Appendix A closer.** “One change to make next week:” has no line to write it on. The Friday-review habit is the point of the scorecard. The blank is the habit.

**Dates on Figure 7.** The try-it says to write today’s date beside “Day 1” on the figure. The roadmap widget does have a start date. The static figure does not have a place to write. The sentence should point at the widget.

**Body search, full-book print, and a real noscript book.** The noscript block lists chapter titles and does not link to the fragments. The sitemap has only the homepage, which matches the single URL, and it also means the chapters are invisible to a crawler. That is acceptable for an app and weak for a manual people discover by search.

**Sitewide disclaimer.** “Not legal advice” appears in the Chapter 11 box and again in the Appendix D colophon. Scripts, fee talk, texting plans, and the income calculator sit in front of that. One line in the footer of `index.html`, present on every chapter, is the right weight.

**Permanence and edition.** `bookEdition` is “1.0” in structured data only. There is no changelog. Cache-bust query `v=20261100` is a filename convention, not a version the reader can see.

## What is working

- The architecture of the book is clear: find, nurture, keep, then a 90-day install. The four-week reading plan in the preface is usable on a Monday.
- Chapter pattern is stable: objectives, teaching, a script or table, try-it, checkpoint, takeaways. Checkpoint answer keys track the chapter text closely, aside from the mismatches named above.
- The income ladder’s arithmetic is right, and the calculator, the stress test, and the “above Table 8.2” warning are the right teaching move.
- Practice tools are the product, not decoration: script hide-and-reveal, objection trainer, qualifying drill, consultation lab, Fair Housing drill, pipeline Monday-call flag, post-close dates, `.ics` export, scorecard status that uses words as well as color (`Hit`, `Close`, `Miss`).
- The shell respects a lot of what usually gets skipped: skip link, `aria-current`, a live region for page changes, focus moved into the new chapter, the gate marked `aria-modal` and the page set `inert`, captions on the overview video, reduced-motion handling, 44px targets on coarse pointers, “opens in a new tab” text for Appendix F, honeypot plus a client-side throttle on the form.
- Glossary terms become buttons with a definition, and Escape returns focus.
- Local-only storage is disclosed in Appendix E before the tool table. That sentence should stay, including in any paid version that changes it.

## Improvements before any charge

Do these in this order. Each one removes a contradiction a paying reader would find in the first week.

1. Make one nurture plan. Publish the 13-touch Appendix B.1 schedule as Figure 5, in the static HTML, so essential mode and noscript match the tool. Change the objective, the one-card, and the Chapter 13 quiz to that count, or change the plan to 8–12 and delete the extra rows. Define 8x8 once, as the eight-week sphere plan, and rename the eight-day sequence so it cannot be confused with it.
2. Make one weekly scorecard. Let Appendix A be that list, point Table 8.2 and Chapter 12 at it, and make the Chapter 8 and Chapter 12 answer keys match the rows. Align the morning block with one duration.
3. Name the denominator on Figure 2, or drop the percentages and keep the cost calculator.
4. Remove the C.A.R. PDF from the repo and from Pages. Link to “the form your broker gives you.”
5. Add a short 2026 section to Chapter 11, and a pointer from Chapters 9 and 12: written buyer agreement before touring, compensation is negotiable and is no longer an MLS field, confirm both with the broker. Add a consent line to every plan that sends an automated text.
6. Put a one-line disclaimer and a one-line “who this is for” (Command, or CRM-neutral) in the shell, not only in Appendix D.
7. Rewrite the gate: what the email is for, a link to a privacy note, and a way through if the form post fails. Stop describing the book as access control. Either drop `isAccessibleForFree` or drop the modal.
8. Fix the stray tag in `chapters/pref.html`, the ICS semicolon escape, and delete `js/app.js` and the empty `book.html` path, or make the README describe `index.html`.
9. Index the body in search. Load every chapter before print. Give Appendix A a “one change” field. Add a next-chapter link at each checkpoint.

## Paid service

The free page is already a lead magnet that forgets to nurture the lead. The paid business should be the layer the static book cannot be: someone, or a system, that watches the Friday numbers and installs the CRM. Price the implementation and the accountability. Do not price a second copy of the prose until the contradictions above are gone.

### 1. New-agent cohort (the closest fit)

The book already tells the reader to hand milestone dates to a productivity coach and to share Friday numbers with an accountability partner. Neither person can see the page. The scorecard, the 90-day roadmap, checkpoint confidence, and the “Monday call” pipeline flag are all on the device.

Offer: a 90-day cohort. The agent keeps this handbook. Once a week the scorecard and the four milestone checks sync to a coach view. The coach’s job is the Friday review the book already specifies: one change for next week, written in the blank Appendix A does not have yet. Office productivity coaches are the buyer. The agent is the user.

What to build that does not exist: an account, a coach seat, and a weekly snapshot. What not to build: a CRM. Command or Follow Up Boss stays the system of record. This product watches the activity the CRM does not grade.

### 2. Setup sprint (the offer Appendix C already is)

Appendix C is a first-week checklist: profile, import, four plans, pipeline stages, mobile app, a speed-to-lead test at 8 p.m. Appendix B is the message library. The try-it boxes say “rewrite it in your own voice.”

Offer: a done-with-you install. One working session to import and tag the sphere, turn on the four plans in the agent’s words, run the friend-at-8-p.m. test, and block the calendar from Table 8.1. The handbook is the leave-behind. The fee is the afternoon and a two-week check that the plans are actually firing.

This is also where the Command-versus-neutral decision becomes packaging. A KW office buys a Command sprint. An independent brokerage buys the same sprint against its own CRM, with the product names translated. Shipping one anonymous hybrid, as the site does now, makes both versions worse.

### 3. Office license

Recruiting and onboarding already need a 30-60-90. The reading plan, the quizzes, and essential-tools mode are a curriculum with a completion trail stuck in each browser.

Offer: per-seat annual license for an office. Branded cover, the office’s required scripts swapped into Chapter 6, a completion report (chapters read, checkpoints marked confident, day-30 milestones). New agents get the book in week one. The team leader gets the report the book currently tells the agent to deliver by hand.

Gate the full book at the office, not at a personal Formspree address. Keep Chapters 1 and the income calculator open, because that chapter is the sales tool.

### 4. Compliance module

Chapter 11 is the thinnest chapter and the one that can hurt a reader. A paid add-on is the state layer: when agency disclosure is due in that state, the current buyer-agreement rule, a texting and do-not-call checklist wired into Appendix B, and forms the brokerage is licensed to hand out. The Fair Housing drill stays, with the broker-approved “good area” answer for that office.

Do not sell a national PDF library. Sell a short, dated, broker-reviewed packet, and put the date on it. Pull the 2018 draft down whether or not this module is built.

### 5. Practice gym

The objection trainer, script practice, qualifying drill, consultation lab, and Fair Housing drill already behave like software. They do not keep a schedule, they do not listen to the agent, and they reset when the browser is cleared.

Offer: a subscription on top of the book. Spaced repeat of the objections the agent marked “needs work,” a recording the agent can play back (the Chapter 6 try-it already says to record on the phone; the page never takes the audio), and a score that persists. This is the piece that can be sold to an agent who already has a CRM and does not want a cohort.

The scripts have to be updated with the compensation language from item 4 before this is worth a fee. Practicing “your commission is too high” as the default fee objection trains the wrong conversation.

### What the free tier should be

Use the book’s own rule: give value before the ask.

- Open: cover, preface, Chapter 1 with the calculator, and the one-card from Chapter 13.
- Email: optional, with a sentence about what will be sent, for the nurture sequence the book teaches (a short plan, not a modal blockade). Send the Appendix B checklist. That is the product demonstrating itself.
- Paid: the rest of the chapters, the drills, cloud progress, and either the cohort, the sprint, or the office seat.

The current gate inverts the book. It asks first, delivers the whole book to anyone who can open a chapter URL, and never follows up.

### What not to add

- A second CRM, pipeline stages and all. The pipeline calculator and the `.ics` export are enough until a coach view exists. A half-CRM will lose leads, which is the failure Chapter 4 warns against.
- More chapters that restate find, nurture, and keep. The next pages should be the state packet, the Command (or not-Command) translation, and the Friday snapshot.
- Video lessons that repeat the chapters. One overview video is already on the preface. Further video belongs inside the practice gym, as the agent’s own recordings.

## Suggested sequence

1. Correct the nurture count, the 8x8, the scorecard, and Figure 2’s unit. Fix the stray tag, the ICS escape, and the dead `book.html` / `app.js` path.
2. Take the C.A.R. draft off the public site. Add the broker disclaimer and the texting-consent line. Draft the 2026 compensation and buyer-agreement section with a broker before it is published.
3. Rewrite the gate as a disclosed opt-in. Point the README at `index.html`.
4. Pilot the setup sprint with one office, using Appendix B and Appendix C as the agenda, before building accounts.
5. Add coach sync only after a pilot has run Friday reviews by hand and the scorecard rows are stable.
