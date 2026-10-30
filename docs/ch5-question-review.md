# Chapter 5 question bank: draft questions for review

Prepared 20 October 2026. 6 questions were written from the Chapter 5 text for the spaced-review bank (`content/data/questions.ts`, each marked `draft: true`). **None of them is shown to readers yet.** The 4 questions that carry the chapter's original check (three multiple choice and one blank) are not marked draft and are not listed here.

## What I am asking you to check

You have worked as an agent, so the useful things only you can judge are below. Mark each question **Approve**, **Change** (say what) or **Drop**.

1. **Is the keyed answer the right one**, and are the other options clearly wrong rather than arguable?
2. **Does it match what a working agent would do**, not just what the chapter says?
3. **Is it too easy, too tricky, or testing the wording rather than the idea?**
4. **Does the explanation say anything the chapter does not?**

Every keyed answer is traceable to a sentence in `content/pages/ch5.html`; the quoted passages below were checked against that file word for word. That shows the question matches the **book**. It does not show the book is right.

Lines marked "Reviewer note" are a first pass by Claude. They are leanings, and the decision is yours.

## How approved questions get used

Approved questions lose their `draft` flag and join the review deck, where a concept the reader missed is asked again with a different question than last time. **They also join the end-of-chapter check**, because `chapterCheck()` in `lib/coach/check.ts` serves every non-draft question for the chapter and `check.test.ts` pins it to the original four. Approving all 6 would grow the Chapter 5 check from 4 to 10. Decide whether to cap the check or mark some questions review-only before approving in bulk.

| Concept | Reviewed now | Draft awaiting you |
| --- | --- | --- |
| Most conversions come after several touches, not one | 1 | 1 |
| A nurture plan is front-loaded, mixed-channel, valuable every third touch, and long | 1 | 1 |
| Start with three plans: the 8x8, the Quarterly Call Plan and the 90-day new-lead plan | 0 | 2 |
| Qualify early with four questions, then stage the lead | 1 | 1 |
| The Friday pipeline review | 1 | 1 |

`ch5.starter-library` has **no** reviewed question, so that idea never enters the review loop until one of its two drafts is approved.

## Things I would look at first

- **The shipped `ch5.multi-touch.fifth-to-twelfth` question** says "Industry follow-up data says…", but the chapter says "Many agents and industry trainers report… treat that as a working assumption and track your own." The prompt states as data what the chapter hedges. Rewording it ("The chapter reports that most conversions…") means bumping its `version`.
- **The keyed answer is the longest option** (by eye) in `no-answer` and `jordan`, and in the shipped `four-questions` and `monday-call`. Even out option lengths when editing.
- **`ch5.starter-library.nobody-leaves`**: the idea should square with Chapter 11's opt-out and do-not-call guidance.
- **`ch5.starter-library.first-three`**: the chapter calls one plan "the 90-day new-lead plan" and elsewhere "Instant Response". Confirm they are the same plan.

## The questions

### 1. `ch5.multi-touch.no-answer`
*Most conversions come after several touches, not one · multiple choice · scenario*

**A lead has not replied to your first three touches. What does the chapter say to do?**

- A. Move them to the quarterly plan
- B. Keep the plan going until they say stop or until they buy ✓
- C. Pause for six months, then restart
- D. Delete them from the database

Explanation shown to the reader: Unanswered calls are normal. A lead who has not replied to three touches is still a lead.

Chapter source:
> Treating "no answer" as "not interested". Unanswered calls are normal. A lead who has not replied to three touches is still a lead. The plan continues until they say stop or until they buy.

Note: Labelled scenario, but it is recall of one sentence. "Move them to the quarterly plan" is the only arguable wrong option: the chapter does roll plans into the quarterly plan, but after the 90 days, not after three quiet touches.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

Reviewer note (Claude, pre-pass; the decision is yours): Leaning approve. The keyed option is the longest (57 vs 34 characters); even out the lengths. It overlaps the shipped `fifth-to-twelfth` question.

---

### 2. `ch5.plan-properties.front-loaded`
*A nurture plan is front-loaded, mixed-channel, valuable every third touch, and long · multiple choice*

**A front-loaded nurture plan puts how many touches in the first 14 days?**

- A. Two
- B. Four
- C. Seven ✓
- D. Thirteen

Explanation shown to the reader: Seven touches in the first 14 days, while interest is highest.

Chapter source:
> Front-loaded. Seven touches in the first 14 days, while interest is highest.

Note: "Thirteen" is the plan's total number of touches, so it is a good distractor. This is a number recall question.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

Reviewer note (Claude, pre-pass; the decision is yours): Leaning approve. Plain recall, but the number is one a reader will use when building the plan.

---

### 3. `ch5.starter-library.first-three`
*Start with three plans: the 8x8, the Quarterly Call Plan and the 90-day new-lead plan · multiple choice*

**Which three plans does the chapter say to start with?**

- A. The 8x8, the Quarterly Call Plan and the 90-day new-lead plan ✓
- B. Home Anniversary, Post-Close and the Quarterly Call Plan
- C. Buyer Long-Term Nurture, Seller Long-Term Nurture and the 8x8
- D. Monthly Neighborhood Nurture, the 8x8 and Home Anniversary

Explanation shown to the reader: Between them they cover the highest-impact activities. Add the neighborhood and long-term nurture plans once the first three are running consistently.

Chapter source:
> Start with three: the 8x8 for new sphere contacts, the Quarterly Call Plan, and the 90-day new-lead plan (the 13 touches in Figure 5). Between them they cover the highest-impact activities. Add the neighborhood and long-term nurture plans once the first three are running consistently.

Note: The chapter also says "Instant Response rolls into a long-term nurture" when it describes chaining plans. Check that "Instant Response" and "the 90-day new-lead plan" are the same plan in your CRM; if readers can read them as two plans, the question is fine but the chapter is inconsistent.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

Reviewer note (Claude, pre-pass; the decision is yours): Leaning approve. The options are well balanced in length. This concept has no live question yet, so approving one is what puts it in the review loop.

---

### 4. `ch5.starter-library.nobody-leaves`
*Start with three plans: the 8x8, the Quarterly Call Plan and the 90-day new-lead plan · fill in the blank*

**Chain plans so that nobody leaves the database unless they ______ .**

Keyed answer: **ask to**. Also accepted: 'ask', 'ask you to'.

Explanation shown to the reader: Instant Response rolls into a long-term nurture, which rolls into the Quarterly Call Plan.

Chapter source:
> Chain plans: Instant Response rolls into a long-term nurture, which rolls into the Quarterly Call Plan. Nobody leaves the database unless they ask to.

Note: A verbatim-sentence blank. The accepted answers are "ask to", "ask" and "ask you to". The idea behind it, that the lead asking to stop is the only exit, should line up with the opt-out and do-not-call material in Chapter 11 (stopping texts is not the same as leaving the database).

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

Reviewer note (Claude, pre-pass; the decision is yours): Leaning change. Keep the idea, but consider a short scenario ("a lead replies STOP to your text; what happens to their other plans?") only if the chapter answers it. Otherwise approve as a low-value blank.

---

### 5. `ch5.qualify.jordan`
*Qualify early with four questions, then stage the lead · multiple choice · scenario*

**On the day-7 call a lead says they want to move by next summer, have not spoken to a lender, and are not working with an agent. What stage and next step does the chapter give for this lead?**

- A. Active, with a showing this week
- B. Drop them until they get pre-approved
- C. Nurture, with a lender introduction as your next step ✓
- D. Send them to another agent

Explanation shown to the reader: In the chapter's example of Jordan, this is a nurture lead with a lender introduction as the next step.

Chapter source:
> Example. Jordan inquired about 14 Maple Street on Tuesday. On the day-7 call you learn: wants to move by next summer (timeline), a new job in the area (motivation), has not spoken to a lender (financing), not working with an agent (representation). Stage: nurture, with a lender introduction as your next step.

Note: The question drops Jordan's motivation, which is fine, but the stage rule the chapter states is what a reader should apply. Two of the wrong options ("Drop them until they get pre-approved", "Send them to another agent") are clearly silly.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

Reviewer note (Claude, pre-pass; the decision is yours): Leaning approve; the best of the drafts, because it asks the reader to apply the four questions. Keyed option is the longest (53 vs 32).

---

### 6. `ch5.pipeline-review.three-questions`
*The Friday pipeline review · multiple choice*

**Which is one of the three Friday pipeline review questions?**

- A. Is this person in the right stage? ✓
- B. How many open houses did I hold this month?
- C. What is their price range?
- D. Have they referred anyone yet?

Explanation shown to the reader: The three: when did I last have a real two-way conversation, what is the next step and is it scheduled, and is this person in the right stage.

Chapter source:
> Every Friday, open your Opportunities pipeline and your follow-up plan task list and ask three questions about every active contact:
>
> When did I last have a real two-way conversation with this person? What is the next step, and is it scheduled? Is this person in the right stage?

Note: The keyed option is short and the wrong options are plausible-sounding but absent from the chapter, so there is no length tell. It draws on the same section as the shipped `monday-call` question (the Friday review), so the two cover one idea from two sides.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

Reviewer note (Claude, pre-pass; the decision is yours): Leaning approve.

---

## After your review

Send back the decisions (the numbers are enough). Approved questions get `draft` removed; changed ones are edited and their `version` bumped; dropped ones are deleted. Then run `pnpm vitest run lib/coach` to confirm the bank is still consistent.
