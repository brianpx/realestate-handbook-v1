# Chapter-by-chapter instructional review

Reviewed 19 October 2026. Source: `content/pages/*.html` (the Next.js copy of the chapters), plus the quiz bank in `legacy/js/widgets-practice.js` and the tool list in Appendix E. Appendices A–F were read for cross-references but are not reviewed here.

Each chapter has its own file. Every file uses the same seven sections so they can be compared side by side:

1. **Verdict**: one paragraph, plus a rating for each lens.
2. **Title vs. content**: does the chapter teach what its title promises?
3. **Learning objectives**: each objective traced to where it is taught, practiced and assessed, with a rewrite where needed.
4. **Opening and transition**: what is there now, and a ready-to-paste replacement.
5. **Exercises**: relevance, and how they build on earlier chapters.
6. **Diagrams**: what is missing, with a drawing prompt for each.
7. **Prose and accuracy**: line-level notes.

This is a review only. No chapter content was edited.

| File | Chapter | Overall |
|---|---|---|
| [00-preface.md](00-preface.md) | Preface: How to use this handbook | Needs work |
| [01-mindset-and-business-foundations.md](01-mindset-and-business-foundations.md) | 1. Mindset and business foundations | Good bones, title overpromises |
| [02-finding-clients.md](02-finding-clients.md) | 2. Finding clients | Strong, exercises need a thread |
| [03-marketing-and-brand-presence.md](03-marketing-and-brand-presence.md) | 3. Marketing and brand presence | Weakest in Part II |
| [04-technology-and-systems.md](04-technology-and-systems.md) | 4. Technology and systems | Retitle, fix figures |
| [05-nurturing-leads.md](05-nurturing-leads.md) | 5. Nurturing leads | Best chapter, plan names collide |
| [06-scripts.md](06-scripts.md) | 6. Scripts | Missing the scripts the book asks for |
| [07-common-errors.md](07-common-errors.md) | 7. Common errors and pitfalls | Recap chapter, should teach by case |
| [08-organized-and-motivated.md](08-organized-and-motivated.md) | 8. Staying organized and motivated | Targets contradict Chapter 1 |
| [09-clients-and-objections.md](09-clients-and-objections.md) | 9. Working with clients and objections | Good, pattern not modeled |
| [10-keeping-clients.md](10-keeping-clients.md) | 10. Keeping clients | Exercises assume past clients |
| [11-legal-and-professional-standards.md](11-legal-and-professional-standards.md) | 11. Legal protection and professional standards | Too late in the book |
| [12-execution-plans.md](12-execution-plans.md) | 12. Daily, weekly and monthly execution plans | Should be the capstone |
| [13-resources-and-next-steps.md](13-resources-and-next-steps.md) | 13. Resources and next steps | Has no instructional frame |

---

## Cross-cutting findings

These recur across chapters. They are listed once here and referenced from the chapter files.

### 1. The book teaches a method, but the chapters do not yet teach as a sequence

Every chapter follows a good template: objectives, teaching, script or table, Try it, Checkpoint, Key takeaways. What is missing is the connective tissue.

- Chapters 3, 6, 8, 10, 11 and 13 have no part intro at all. Chapters 1, 2, 4, 5, 7, 9 and 12 have a one-line italic part intro, and in most cases that is a theme statement, not a bridge.
- No chapter says *where the reader is coming from*. None says *what problem this chapter solves that the last one left open*.
- The preface's 4-week reading plan orders chapters 1, 4, 12 / 2, 5, 6 / 7, 8, 9 / 3, 10, 11, 13. That differs from book order. A transition written as "last chapter you did X" is false for anyone following the plan. **Decision needed:** either reorder the book to match the plan, or drop the plan to book order and write bridges that hold in both orders (see Decision A).

**Recommended chapter opening template** (about 100–140 words, three short paragraphs):

1. *Where you are.* One sentence naming what the reader now has from the previous chapter.
2. *The gap.* The question that chapter leaves open and that this one answers.
3. *What you'll do.* One sentence on the outcome, then the learning-objectives box.

Each chapter file contains a drafted opener in this shape.

### 2. Learning objectives are not aligned to the checkpoints or exercises

Best practice is constructive alignment: every objective is taught, practiced and assessed, and nothing is assessed that was not taught. Today:

- Checkpoints ask for things the chapter never teaches. Chapter 1 asks "which three numbers will you track" but the chapter never names three. Chapter 12 says "the same four numbers" and then lists thirteen.
- Several objectives name a disposition, not a skill ("treat your CRM as your daily headquarters").
- Several are promises the chapter does not keep. Chapter 2: "without feeling like a salesperson". Chapter 3: "Set up a home base with your Agent Site and Client App", which are never defined.
- Checkpoints are mostly recall ("what are the six parts of the CRM setup?"). Recall is fine for a first pass, but each checkpoint should end with at least one *apply* question and one *from an earlier chapter* question (spaced retrieval).

Each chapter file has an alignment table and rewritten objectives using observable verbs.

### 3. A cumulative project would make exercises build on one another

Today every "Try it today" stands alone. Many are good. Few depend on an earlier answer. The strongest single improvement is a **running artifact the reader builds across the book**, titled *My 90-Day Business Plan* (one page, filled in a section at a time):

| After chapter | Reader adds to the plan |
|---|---|
| 1 | Income goal → daily conversation number |
| 2 | Weekly conversation number split across lead sources; sphere list started |
| 3 | Content calendar (two posts a week) and a listing-marketing checklist |
| 4 | CRM setup done; daily rhythm blocks; speed-to-lead test result |
| 5 | The three follow-up plans running; qualifying answers on five leads |
| 6 | Three scripts in the reader's own words, recorded |
| 7 | Highest-scoring error and its named fix |
| 8 | Weekly time-block and the five scorecard numbers |
| 9 | One-page buyer consultation; two objection responses |
| 10 | Post-close plan; five vendors |
| 11 | Compliance card: disclosure timing, consent rule, three "ask first" situations |
| 12 | Dated 90-day roadmap, assembled from all of the above |
| 13 | Day-90 review date and the next-90 plan |

A **recurring case** (a fictional new agent, "Sam", who already appears in Chapter 5's text example) would let each chapter show a worked example before the reader tries their own. At present worked examples are almost absent. Chapter 1's goal ladder is the one good model, and the rest of the book should follow it.

### 4. Numbers contradict each other across chapters

These are teaching problems, not only copy errors: a reader who follows the book's own method (Chapter 1) gets different answers than the book later prescribes (Chapter 8).

| # | Conflict | Where |
|---|---|---|
| a | **Chapter 1's ladder gives about 0.8 appointments a week** (16 conversations ÷ 20 per appointment). **Table 8.2 targets 3–6 appointments set and 2+ held.** Those targets imply a ratio of roughly 1 appointment per 4–5 conversations, and about 100+ held appointments a year against the 39 the ladder needs. | Ch. 1 Table 1.1; Ch. 8 Table 8.2; Ch. 12 |
| b | Chapter 1 says to block **9:00–11:00**. Chapter 8 blocks **9:30–11:00** (a 90-minute prospecting block). Chapter 4 budgets 60–90 minutes. | Ch. 1 Try it; Table 8.1; Table 4.1 |
| c | Friday pipeline review is a **30-minute Friday-afternoon** block in Chapter 5 and **Friday 9:30, after prospecting** in Table 8.1. | Ch. 5 Try it; Table 8.1 |
| d | **One open house a week** in Table 8.2, **one open house in the first 30 days** in Chapter 12. | Table 8.2; Fig. 7 |
| e | "**Four numbers**" every week (objective) versus thirteen rows in Table 8.2 and Appendix A. | Ch. 12 |
| f | "**Three numbers**" in Chapter 1's checkpoint; the chapter never names them. | Ch. 1 |
| g | "Write next month's **four weekly posts**" versus Table 3.1 (two weekly items) versus Table 8.2 (2 posts a week). | Ch. 3 |
| h | Three overlapping new-lead plans in Table 5.1 (8-touch sprint, 3–5 touch instant response, and the 13-touch plan that is not in the table at all). | Ch. 5 |
| i | Post-close "six touches" (Table 10.1) versus "4 to 6 in 60–90 days" (Table 5.1) versus the scheduler. | Ch. 5, 10 |

Item (a) is the one to fix first. It undermines the book's central claim that you work backward from income.

### 5. Compliance arrives after the reader needs it

Chapters 2–6 tell a new agent to send an announcement text to 20 people, import contacts into automated plans, text leads within a minute, and hold open houses. Consent for texts, Fair Housing in marketing, and agency disclosure are all in Chapter 11. A reader who works in order will have done the risky things first.

Two options, not mutually exclusive:

- Add a half-page **"Rules of the road"** callout to Chapter 1 or Chapter 2: three rules (consent before automated texts, describe property not people, disclose agency at first substantive contact), each pointing to Chapter 11.
- Move Chapter 11 to follow Chapter 6, or split it so the consent and Fair Housing sections come before Chapter 5.

Chapter 11 also lacks anything on referral-fee rules when an agent and a lender or vendor exchange referrals (Chapter 10's vendor list, Chapter 13's "lender partners … send you referrals"). One sentence deferring to the broker would cover it.

### 6. Several "figures" are text, not diagrams

Figures 2 (table), 3 (one line of arrows), 4 (three bullets), 5 (a numbered list), 6 (one line of arrows) and 7 (a checklist) are not diagrams. Chapters 1, 3, 6, 8, 9, 10, 11 and 13 have no figure at all. Each chapter file lists the specific diagrams to add. The shared style for all drawing prompts is below.

**Numbering.** The book numbers figures in one global sequence (Figure 1 in the preface through Figure 7 in Chapter 12). Adding diagrams breaks that sequence, so the prompts use chapter-based numbers (Figure 5.1, 8.2, and so on). Switching the book to chapter-based numbers is a small change and makes later additions painless.

**Shared diagram style (prepend to every prompt):**

> Flat vector infographic, 16:9, white background (#FFFFFF) with a very light slate panel (#F8FAFC). Navy (#0F172A) for headings, blue (#2563EB) for the main path and primary shapes, deep blue (#1E3A8A) for emphasis, slate (#334155) for body text, light grey (#CBD5E1) for connectors and borders. One accent color only for "warning / problem": amber (#B45309). Sans-serif type (Inter, SF Pro or Segoe UI), minimum 18 pt equivalent so labels stay legible on a phone. Rounded rectangles, 2 px strokes, generous whitespace, no gradients, no stock icons, no drop shadows. Every shape labelled in plain words. Include a one-line caption under the title. Output as SVG so it stays sharp and can carry alt text; also provide a two-sentence alt-text description.

### 7. Claims without a source

These read as facts. A skeptical reader, or a broker, will ask where they come from.

- "The majority of conversions happen between the fifth and twelfth contact" (Ch. 5, Preface part-intro).
- "Highest conversion window under five minutes" (Ch. 4, Fig. 4). The figure shows no data.
- "A single channel reaches a third of your list" (Ch. 5).
- "The average homeowner moves again within seven to ten years" (Ch. 10). This figure should be checked against current NAR tenure data, which has been rising.
- "Agents in their fifth year often get more than half their business" from referrals (Ch. 10).
- "Sphere converts at five to ten times a portal lead" (Ch. 2), while Figure 2 itself says its ranges are not comparable.
- "Most of these pitfalls disappear within a month" (Ch. 7).
- "A message with no question gets no reply" (Ch. 6).

Fix: cite, soften ("often", "in many offices"), or label as the author's working assumption.

### 8. Brokerage- and vendor-specific vocabulary is used without definition

"Agent Site", "Client App", "Marketing Profile", "Opportunities", "Smart Plans" (Appendix C), "productivity coach", "8x8", "QCP", and a single named product ("Follow Up Boss" in Ch. 4) appear as if every reader shares one system. If the handbook is for one brokerage, say so in the preface and define each term at first use (the dotted-glossary mechanism exists). If it is for the general market, use generic terms and add a short "if your CRM calls this something else" note.

### 9. Prose

The voice is a real strength: plain, second person, concrete, with a clear stance. It breaks in three recurring ways:

- **Second-person slips**: "Agents who treat your CRM as non-negotiable" (Ch. 1).
- **Staccato imperatives in runs of three or more** ("Preview the home… Invite the 20… Set up…") with no sentence that says *why* the sequence works. Best practice is to give the reason once, then the list.
- **Definitions that arrive after the term has been used**: "conversation" is defined in the table caption after the reader has already met it twice; "Opportunity" is capitalised as a CRM term in Ch. 1 and never defined until Ch. 4–5.

---

## Decisions for the author

| | Decision | Recommendation |
|---|---|---|
| A | Book order versus the 4-week reading plan | Make the book order the reading order. Move Chapter 4 (CRM setup) ahead of Part II, or add a visible "build the system first, spend later" signpost at the top of Chapters 2 and 3. |
| B | Whose handbook is this: one brokerage's or general | Decide, then apply cross-cutting item 8. |
| C | Reconcile the Chapter 1 ladder with the Chapter 8 targets | Either lower Table 8.2 appointments to match the ladder, or present the ladder as a worked example with a 1-in-5 ratio for *held first conversations* and say why. The ladder's 20:1 should not stand beside a 4:1 target. |
| D | Where compliance lives | Add the "Rules of the road" callout early and keep Chapter 11 as the deep dive. |
| E | Adopt the cumulative *90-Day Business Plan* and a recurring case | Recommended. It is the largest improvement to exercises and costs mostly rewording. |
