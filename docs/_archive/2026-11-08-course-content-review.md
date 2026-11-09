# Course content review and revision plan

Reviewed 8 November 2026; revised the same day after a second-reader critique, and again after a cross-plan review against `docs/_archive/user-database-plan.md` and `docs/_archive/vercel-pro-migration-meded.md` (phasing, severity labels, Decision H, definition of done). Source: `content/pages/*.html` (preface, Chapters 1–13, Appendices A–F), the quiz and drill data in `content/data/`, the coach routing in `lib/coach/` and `components/widgets/CoachCheck.tsx`, and the site FAQ in `content/site/faq.ts`. This is a plan; no content was edited.

Most of the 19 October chapter review (`docs/chapter-reviews/`) has landed: the Chapter 1 ladder agrees with Table 8.2, every part has an intro, the Sam case exists, and Chapter 12 assembles the 90-Day Business Plan. What remains needs coordinated editorial and software work, not chapter-level editing alone: the shared rules and targets (reading order, consent rule, speed-to-lead standard, scorecard rows, plan milestones) need one authoritative source, and the chapters, quizzes, coach and widgets need to be checked against it.

## Priorities

1. **Decide** the reading sequence, the quick-start scope, the intended jurisdiction, and the CRM positioning (Decisions A–D below).
2. **Correct learner-facing contradictions** across text, assessments and widgets. Contradictory feedback teaches the wrong answer or penalizes a learner who followed the text.
3. **Define the core follow-up plans** and when each is created, personalized and activated.
4. **Fill the essential practice gaps** and approve coach questions for the uncovered chapters.
5. **Trim repetition**, then update the legend, figure numbering and colophon.

## Decisions for the author

| | Decision | Recommendation |
|---|---|---|
| A | Reading plan order vs. book order | Make the plan follow book order and update `content/data/plan.ts` to match. Add a short, self-contained **quick start** (minimum CRM setup, the daily block, the first outreach, and the "before your first outreach" rules), linking to the sections that teach each item. Chapter 12 then stays a genuine capstone. Moving "set up your CRM this week" into Chapter 1's Try It is not enough on its own, because Chapter 1 does not carry the setup instructions. |
| B | Early safeguards | The plan puts Chapter 11 in week four while outreach starts in week one or two. Put a minimum "before your first outreach" checklist in the quick start (consent before automated texts, describe property not people, agency disclosure at first substantive contact, do-not-call), and keep Chapter 11 as the full treatment. |
| C | CRM positioning | Choose one: vendor-neutral instructions with clearly labeled optional Keller Williams Command examples, or an explicitly Command-oriented edition. Then make the site copy (FAQ, footer, About, Terms) and the handbook vocabulary (Marketing Profile, Client App, Agent Site, "productivity coach") agree. A single preface sentence does not resolve the mismatch. |
| D | Jurisdiction | Appendix F is California-weighted (C.A.R., DRE) alongside national resources and the ARELLO directory. Decide whether the handbook is California-first or national, and label Appendix F accordingly. |
| E | Post-close plan timing | Distinguish three moments: create the template, personalize the messages, activate it for a client. Then state once when each happens and apply it to Chapter 4 step 3, Chapter 5, Chapter 12, the preface and Appendix C. |
| F | Table 5.1's four undetailed plans | Drop them or give each an executable sequence in Appendix B. |
| G | Where shared rules are defined | Define speed-to-lead and the 9 p.m. test once (Chapter 4) and the consent rule once (Chapter 11, with the quick-start summary). Reduce the rest to one-line pointers using one phrasing. Keep brief reminders beside texting exercises and automation instructions, because those serve as practice cues rather than duplication. |
| H | Where shared rules live, in code | Introduce one shared rules module (for example `content/data/rules.ts`, or a short dedicated appendix the module is generated from) that chapter text, widgets, tests and the coach reference. Canonical phrasing for the consent rule, the speed-to-lead standard and the 9 p.m. test, and the post-close milestone is signed off once and written there. Name one canonical-phrasing owner so writers do not re-litigate wording chapter by chapter. |

## Work sequence

- **Phase 0 (blocking, short).** Resolve Decisions A–D and sign off the exact canonical phrasing for the consent rule and the speed-to-lead / 9 p.m. test. That phrasing feeds Decisions G and H and everything below.
- **Phase 1 (high-priority consistency).** Fix every text-vs-assessment and text-vs-widget contradiction in §2. Align post-close plan timing (Decision E). Update scorecard thresholds to match Table 8.2 and Appendix C's test time to match Chapter 4. Implement the reading-plan decision and fix forward references (§1). Introduce the shared rules module (Decision H) and point the existing consistency tests at it.
- **Phase 2 (core plans and practice).** Define or drop the four undetailed plans (Decision F). Add the under-contract communication checklist (§3); it is high-value and low-effort and belongs here, not in polish. Fill the highest-value script and objection gaps from §4: the buyer-agreement objection, the quarterly call, the lender/attorney introduction, and seller-variant qualifying questions. Add cost per appointment alongside cost per closed deal.
- **Phase 3 (polish).** Trim repetition once the rules are standardized (Decision G, §6). Combine the two Friday habits into one definition. Update the legend, figure numbering and colophon (§7).
- **Phase 4 (coach coverage, separate track).** Author concepts and questions for the uncovered chapters only after the content rules are frozen (§5). Rough sizing: eight chapters × 4–6 concepts × 2–3 questions, about 80–140 new items, each needing agent review and sign-off.

**Definition of done for Phase 1.** All non-draft questions and checkpoints match chapter text; the scorecard and Appendix C match their source tables; the reading plan and forward references are consistent; the shared rules module exists and is referenced by text, widgets and tests; the existing tests pass and the new assertions in Verification are in place.

## Findings

### 1. Sequencing and prerequisites (high priority)

- **The reading plan contradicts the chapter openers.** The preface and `plan.ts` schedule Chapters 1, 4 and 12 in week one. Chapter 12 opens with "You have now met every part of the system" and assembles outputs from Chapters 1 to 11. Chapter 4's Try It imports "the sphere list you built in Chapter 2," which a week-one reader has not built. This affects the learning experience, not only prose. See Decision A.
- **Professional safeguards arrive after outreach begins.** Chapters 2, 4, 5 and 6 have the learner announcing, importing, automating and hosting open houses before Chapter 11. See Decision B.
- **Post-close plan timing is stated four ways.** Chapter 4 step 3 builds it in week one; Chapter 5 names three starter plans and omits it; Appendix C requires it in week one; Chapter 12 schedules it for days 61 to 90 and its plan-assembly list says "three follow-up plans running"; the preface promises three. See Decision E.

### 2. Learner-facing contradictions (high priority)

Tracked as a checklist. **Critical** items teach the wrong answer or touch compliance; **High** items penalize a learner who followed the text or misstate the product; **Medium** is wording drift.

Text versus assessment:

- [ ] **Critical.** **Chapter 2 checkpoint answer 1** (`content/data/checkpoints.ts`) still says sphere converts "five to ten times" better; the chapter says "often converts far better." The matching quiz item in `knowledge-checks.ts` is bypassed, because Chapter 2 has non-draft tagged questions and `CoachCheck` routes covered chapters to the tagged bank. Fix the checkpoint answer; retire the old quiz item so it cannot resurface.
- [ ] **Critical.** **Chapter 10 quiz MCQ 1** says homeowners move "within seven to ten years"; the chapter says "a decade or two." Chapter 10 has no tagged questions, so this stale item is displayed.
- [ ] **Critical.** **Chapter 5 quiz stem** says "industry follow-up data says"; the chapter softened this to "many agents and industry trainers report." Same wording in `questions.ts` (`ch5.multi-touch.fifth-to-twelfth`, non-draft, so it is live).
- [ ] **Critical.** **Chapter 4 blank** asserts conversion is highest under five minutes while Figure 4 is labelled illustrative and a draft question (`ch4.speed-to-lead.figure-4`) tests that it is not measured data. Reword the blank so it tests the standard (automated reply in a minute, call in minutes), not the figure.
- [ ] **Medium.** **Chapter 6 explains** drift: "gets no reply" vs. the chapter's "rarely"; "thank them and move on" vs. "keep in touch."

Text versus widget:

- [ ] **High.** **Scorecard** (`content/data/scorecard.ts`) scores zero open houses red in any week, although Table 8.2 allows one in the first 30 days. Either change the row mode or the table wording.
- [ ] **High.** **Appendix C** runs the speed-to-lead test at 8 p.m.; Chapter 4 and the 9 p.m. test say 9 p.m.
- [ ] **High.** **Qualifying drill** scenario 4 sends a seller to "Seller Long-Term Nurture in Table 5.1." The table names that plan, but the handbook provides no executable sequence for it.

Text versus site:

- [ ] **High.** The FAQ, footer, About and Terms pages say worked examples "use Keller Williams Command screens and terms, and each is labeled as an example." No chapter names Keller Williams or Command and nothing is labeled, while Command vocabulary remains in Chapters 3 and 4, Appendix C and the glossary. See Decision C.

Text versus text:

- [ ] **Critical.** **The texting-consent rule has four phrasings** across Chapters 2, 4, 5, 6 and 11, Appendix B.1 and Appendix C (detail in §6). A compliance rule stated four ways is a contradiction, not only repetition; it is fixed by Phase 0 sign-off and Decision H, and trimmed in Phase 3.

### 3. Core follow-up plans

- **Table 5.1 lists eight plans; the handbook gives executable sequences for four** (Appendix B.1–B.4). Monthly Neighborhood Nurture, Buyer Long-Term Nurture and Seller Long-Term Nurture have no sequence anywhere. Home Anniversary has guidance in Chapter 10 but no separately listed ongoing plan. "Your CRM's library already contains plans for most of these" assumes one vendor. See Decision F.
- **Appendix B promises four plans and delivers three tables.** B.4 is a paragraph restating Table 10.1. Give it a table like its siblings or point to Table 10.1 and drop the "four plans" claim.
- **Under contract has no plan.** The pipeline has an "Under contract" stage and Chapter 9 says to send a weekly update "even when nothing has changed," but there is no touch list or script. An under-contract **communication checklist** fits the preface's scope; a transaction-management chapter would not.

### 4. Practice gaps

Named workflows need enough instruction to execute them. Not every exercise needs a full model answer, but these are workflows the handbook itself assigns:

- **Scripts the book asks for and does not model.** Chapter 10's Try It has the reader write the one-week call, the 30-day review request and the anniversary card "using the Chapter 6 rules," and Chapter 6 models none. There is no script for the quarterly call the whole database eventually lives on, and none for introducing yourself to a lender or attorney, though Chapter 2 ranks referral partners second and Chapter 13 says "meet three and pick one."
- **The buyer-agreement objection is absent.** Chapter 11 calls the written buyer agreement a rule a 2026 agent "will be corrected on in week one," and Table 9.1 step 5 signs it, but "Why do I have to sign before you show me homes?" is in neither Table 9.2 nor the objection trainer.
- **The four qualifying questions are buyer-only.** Table 5.2's financing row assumes a buyer; seller questions only surface in Table 9.1 step 2. A seller variant would also make the qualifying drill's seller scenario coherent.
- **Day-90 lead-source evaluation.** Cost per closed deal can exist by day 90 but will usually be unavailable or unstable, since Chapter 12 expects closings in the second 90 days and Chapter 2's own example closes in month five. Teach cost per appointment alongside it as the early measure, in Chapter 2 and Chapter 12, and let the lead-sources widget show both.
- **Reviews as marketing.** Chapter 10 says "reviews drive online leads" and the post-close script asks for one, but Chapter 3's home-base section never mentions review profiles.
- **Money management.** Chapter 1 warns of several months of expenses before income and Appendix F links the IRS self-employed page, but nothing covers a runway budget or setting aside a share of each commission. A compact worksheet would help; it should not delay the contradiction fixes above.
- **Objectives not assessed.** Chapter 1's "name the first three things you check" in the CRM is taught in Chapter 4 (the checkpoint answer says so). Chapter 8's "respond to a slow week," Chapter 11's "record the seven documentation items," and all of Chapter 13's objectives have no checkpoint or exercise.

### 5. Coach coverage (product deliverable)

The tagged bank in `content/data/questions.ts` holds 52 questions, 37 draft and 15 non-draft, spanning Chapters 2, 4, 5 and 12 only (21 concepts in `concepts.ts`). `lib/coach/review.ts` and `lib/coach/check.ts` exclude draft questions, so the review deck and the coach-routed chapter checks run on 15 items. Expanding coverage to Chapters 1, 3, 6–11 and 13 means authoring concepts and questions, an accuracy review by someone who has worked as an agent, sign-off (clearing `draft`), and validation against the chapter text. Plan it as a deliverable with an owner, not as a content tweak.

### 6. Repetition (standardize first, then trim)

Keep: a chapter explanation, an appendix checklist, and a one-line reminder beside the exercise that applies the rule. Remove: repeated full explanations and inconsistent wording.

- **Speed-to-lead and the 9 p.m. test** are explained in Chapters 2, 3, 4, 5, 7, 12 and 13. The test is defined in Chapter 3 but belongs to Chapter 4; Chapter 2 forward-references Chapter 3 for it. See Decision G.
- **The texting-consent rule** appears in Chapters 2, 4 (twice), 5, 6 and 11, Appendix B.1 and Appendix C, with four different phrasings. Standardize the phrasing; keep the reminders beside B.1 and the Chapter 5 Try It; shorten the rest. See Decision G.
- **The daily rhythm** is stated in Table 4.1, Chapter 8's "A sample day," and Chapter 12's one-liner, with slightly different times in Chapter 8. Keep Table 4.1 and the weekly grid; cut the Chapter 8 prose.
- **The 13 scorecard rows** appear in Table 8.2, Appendix A, and as four bullets in Chapter 12. A short Chapter 12 summary can help assembly, but it must not read as a second scorecard. Replace the bullets with one sentence pointing at Appendix A.
- **Two Friday habits are never combined.** Chapter 5's per-contact pipeline review and the Chapter 8/12 scorecard review share one Table 8.1 slot and both end in "one thing" to change ("one thing" in Chapter 8, "one number" in Chapter 12); Chapter 13's card adds "fix one thing a month." State once what the Friday half-hour contains.
- **Verbatim repeats inside a chapter.** Chapter 5: "curious, early, unsure of financing, or waiting on a life event" in the intro and the first section; "nobody leaves your database unless they ask to" twice. Chapter 1: freedom is "the reason many come and the reason many leave," twice.
- **Duplicates across chapters.** "I'm just looking" is a Chapter 6 script and a Table 9.2 row with near-identical wording. Chapter 12 shows the static roadmap SVG immediately before the interactive roadmap with the same phases. Chapter 13's "Do these this week" repeats Chapter 4 and 12 Try Its. Chapter 10's timeline and flywheel figures both enumerate the six post-close steps.

### 7. Legend, figures and credits

- The preface legend omits the legal box, key takeaways and learning objectives.
- Only Figures 2 to 7 carry numbers; there is no Figure 1, and roughly twenty newer diagrams are unnumbered. The Appendix D colophon credits "Figures 1 to 5" and "Figures 6 and 7," and calls the conversion ranges "typical industry ranges" while Figure 2 calls them illustrative.

## Cross-plan notes

- **User-database plan** (`docs/_archive/user-database-plan.md`). Its D1 (free pages = Chapter 1 and Chapter 7 in full) and D3 (gate all of `/handbook` behind sign-in) interact with Decisions A and B here, and its section 13 already points back at this plan. Once the free-page set is locked, re-validate that those pages are self-contained and that the minimum "before your first outreach" safeguards appear in the free material or in a quick start a free reader can reach. Do not start Phase 4 coach coverage until both plans' content rules are stable.
- **Vercel migration plan** (`docs/_archive/vercel-pro-migration-meded.md`). Orthogonal. Phases 0–3 can proceed in parallel; the handbook is not yet behind a paid gate. After the migration, any environment variable a future coach or widget feature needs follows that plan's Sensitive and environment-scoped rules.
- **Shared-rule freeze.** Both this plan and the user-database plan benefit from freezing the canonical phrasing of consent, speed-to-lead and post-close timing before coach questions or billing-related copy are written against them. That is why Phase 0 is short and blocking.

## Verification

After the edits, the existing consistency tests (`lib/nurture-consistency.test.ts`, `lib/scorecard-consistency.test.ts`, `lib/coach/anchors.test.ts`) should be extended so the shared rules have one source and drift fails a test:

- Reading plan: `plan.ts` units match the preface list and every chapter's forward references point only to earlier units.
- Consent and speed-to-lead: one canonical phrasing, asserted in every page that restates it.
- Post-close timing: one milestone, asserted in Chapter 4, Chapter 5, Chapter 12, the preface and Appendix C.
- Assessment: every non-draft question's `explain` and answer text is found in its chapter's HTML; every checkpoint answer's numeric claims appear in the chapter.
- Widgets: scorecard thresholds match Table 8.2 wording; Appendix C's test time matches Chapter 4.
- Forward-reference integrity (after Decision A): no chapter points to a later chapter for a rule it expects the learner to already know.
- Content lint (optional): once canonical wording is set, a script greps `content/pages/` for the retired phrasings and fails on any hit.
- Widget snapshots (optional): snapshot or visual checks for the scorecard, lead-sources and roadmap widgets if the e2e infrastructure supports them.
