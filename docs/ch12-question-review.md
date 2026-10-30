# Chapter 12 question bank: draft questions for review

Prepared 20 October 2026. Seven questions were written from the Chapter 12 text for the spaced-review bank (`content/data/questions.ts`, each marked `draft: true`). **None of them is shown to readers yet.** The four questions that already shipped with the chapter are unchanged and are not listed here.

## What I am asking you to check

You have worked as an agent, so the useful things only you can judge are below. Mark each question **Approve**, **Change** (say what) or **Drop**.

1. **Is the keyed answer the right one**, and are the other options clearly wrong rather than arguable?
2. **Does it match what a working agent would do**, not just what the chapter says?
3. **Is it too easy, too tricky, or testing the wording rather than the idea?**
4. **Does the explanation say anything the chapter does not?**

Every keyed answer is traceable to a sentence in `content/pages/ch12.html`; the quoted passages below were checked against that file word for word. That shows the question matches the **book**. It does not show the book is right.

## How approved questions get used

Approved questions lose their `draft` flag and join the review deck, and also the end-of-chapter check (`chapterCheck()` serves every non-draft question for the chapter). A concept the reader missed is asked again with a different question than last time, which is why each concept needs at least two. **`ch12.monthly-review` and `ch12.plan-assembly` have no reviewed question**, so those two ideas stay out of the review loop until at least one of their drafts is approved.

| Concept | Reviewed now | Draft awaiting you |
| --- | --- | --- |
| The first 90 days are three 30-day phases: install, build the rhythm, grow the pipeline | 2 | 1 |
| By day 90: five active opportunities, a first contract, the post-close plan built | 1 | 1 |
| One weekly scorecard: Appendix A, the same rows as Table 8.2 | 1 | 1 |
| The one-hour monthly review changes where your time goes | 0 | 2 |
| Assemble the 90-Day Business Plan from the Try Its in Chapters 1 to 11 | 0 | 2 |

## Things I would look at first

- **`ch12.scorecard.core-numbers`**: a short blank where only "five" and "5" count; "5 core" or "the five" would be marked wrong.
- **`ch12.plan-assembly.post-close`**: tests where an item sits in the chapter's list, which is closer to trivia than to a skill.
- **Option length**: the keyed answer is the longest option in 4 of the 6 multiple-choice drafts, which a test-savvy reader can use without knowing the chapter. Even the lengths out when editing.

## The questions

### 1. `ch12.phases.fifty-conversations`
*The first 90 days are three 30-day phases: install, build the rhythm, grow the pipeline · multiple choice*

**In days 1 to 30, at least how many real conversations should you have with your sphere?**

- A. 10
- B. 25
- C. 50 ✓
- D. 200

Explanation shown to the reader: About 12 a week, the lower end of the Chapter 8 range.

Chapter source:
> have at least 50 real conversations with your sphere (about 12 a week, the lower end of the Chapter 8 range)

Note: The distractors 10 and 25 are far enough off to be easy. The 12-a-week figure and the 50 total do not quite multiply out (about 4 weeks), which the chapter hedges with "about"; check that is fine to teach.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 2. `ch12.pipeline-milestone.by-day-90`
*By day 90: five active opportunities, a first contract, the post-close plan built · multiple choice*

**Which of these belongs to days 61 to 90?**

- A. Write your first contract ✓
- B. Finish your CRM setup
- C. Hold your first open house or networking event
- D. Get the content calendar running on its own

Explanation shown to the reader: The other three belong to days 1 to 30 and 31 to 60.

Chapter source:
> Write your first contract.
> Finish CRM setup (Chapter 4), import and tag contacts
> The content calendar from Chapter 3 should be running on its own.
> Hold one open house or one networking event.

Note: Each wrong option is a milestone from an earlier phase, so the question tests which phase, not whether the milestone matters. Check a reader could not reasonably argue an earlier item also continues into days 61 to 90.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 3. `ch12.scorecard.core-numbers`
*One weekly scorecard: Appendix A, the same rows as Table 8.2 · fill in the blank*

**If the full scorecard is too much at first, start with the ______ core numbers from Chapter 8.**

Keyed answer: **five**. Also accepted: '5'.

Explanation shown to the reader: Conversations, appointments set, follow-ups completed, new contacts added and morning blocks held. Then name the one number you will move next week.

Chapter source:
> start with the five core numbers from Chapter 8: conversations, appointments set, follow-ups completed, new contacts added and morning blocks held.

Note: Accepted answers: "five", "5". A reader who types "5 core" or "the five" is marked wrong. Decide whether to widen the list or change this to multiple choice.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 4. `ch12.monthly-review.questions`
*The one-hour monthly review changes where your time goes · multiple choice*

**Which is one of the four questions in the monthly review?**

- A. How many contacts are in my database?
- B. Which brokerage pays the best split?
- C. Where did leads stall in the pipeline? ✓
- D. How many hours did I work this month?

Explanation shown to the reader: The four: which source produced the most appointments per hour spent, which follow-up plan got the most replies, where leads stalled, and what one change you will make this month.

Chapter source:
> Which source produced the most appointments per hour spent? Which follow-up plan got the most replies? Where did leads stall in the pipeline? What one change will I make this month?

Note: The wrong options are things an agent might track, but none is one of the four. Check none reads as part of a monthly review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 5. `ch12.monthly-review.where-recorded`
*The one-hour monthly review changes where your time goes · multiple choice*

**Where does the chapter say to write the answers to your monthly review?**

- A. On a paper planner
- B. In an email to your broker
- C. In a spreadsheet separate from your CRM
- D. In your CRM, as a note titled "Monthly note" ✓

Explanation shown to the reader: So next month's review can find and check them.

Chapter source:
> Write the answers in your CRM as a note titled "Monthly note" so next month's review can find and check them.

Note: Tests a detail of the chapter's routine rather than an idea. Consider whether agents need to remember the exact note title or only that it goes in the CRM.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 6. `ch12.plan-assembly.post-close`
*Assemble the 90-Day Business Plan from the Try Its in Chapters 1 to 11 · multiple choice*

**Which chapter's Try It gives you the post-close plan for your 90-Day Business Plan?**

- A. Chapter 5
- B. Chapter 10 ✓
- C. Chapter 11
- D. Chapter 12

Explanation shown to the reader: The list runs from Chapter 1 to Chapter 11; the post-close plan is item 10.

Chapter source:
> Your post-close plan (Chapter 10).

Note: This tests the position of an item in the chapter's list, which is closer to trivia than to a skill. Keep or drop as you prefer.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 7. `ch12.plan-assembly.compliance-card`
*Assemble the 90-Day Business Plan from the Try Its in Chapters 1 to 11 · multiple choice*

**What goes on the compliance card in your plan?**

- A. Disclosure timing, the consent rule and three "ask first" situations ✓
- B. Your license number and your broker's phone number
- C. A list of every form you might need
- D. The dates of your continuing education classes

Explanation shown to the reader: The compliance card comes from Chapter 11.

Chapter source:
> Your compliance card: disclosure timing, consent rule, three "ask first" situations (Chapter 11).

Note: Legal-adjacent wording. The answer is the chapter's own list, not a statement of what the law requires.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

## After your review

Send back the decisions (the numbers are enough). Approved questions get `draft` removed; changed ones are edited and their `version` bumped; dropped ones are deleted. Then run `pnpm vitest run lib/coach` to confirm the bank is still consistent.
