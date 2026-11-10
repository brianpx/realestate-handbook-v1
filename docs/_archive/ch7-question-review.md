# Chapter 7 question bank: draft questions for review

Prepared 9 November 2026. Six concepts and seventeen questions were written from the Chapter 7 text for the spaced-review bank (`../../content/data/concepts.ts` and `../../content/data/questions.ts`, each question marked `draft: true`). **None of them is shown to readers yet.** The four questions that already ship with the chapter's knowledge check (`../../content/data/knowledge-checks.ts`) are unchanged, are not tagged into the coach and are not listed here.

Status of every question below: **draft, awaiting owner review.**

## What I am asking you to check

You have worked as an agent, so the useful things only you can judge are below. Mark each question **Approve**, **Change** (say what) or **Drop**.

1. **Is the keyed answer the right one**, and are the other options clearly wrong rather than arguable?
2. **Does it match what a working agent would do**, not just what the chapter says?
3. **Is it too easy, too tricky, or testing the wording rather than the idea?**
4. **Does the explanation say anything the chapter does not?**

Every keyed answer is traceable to a sentence in `../../content/pages/ch7.html`; the quoted passages below were copied from that file. That shows the question matches the **book**. It does not show the book is right.

## How approved questions get used

Approved questions lose their `draft` flag and join the review deck. They also join Chapter 7's end-of-chapter check: `chapterCheck()` in `../../lib/coach/check.ts` serves every non-draft question tagged to the chapter. Today none of the Chapter 7 questions is reviewed, so `chapterCheck('ch7')` is empty and the chapter keeps its plain four-question check. **Approving even one question switches Chapter 7 to the coach check, which then asks only the approved questions.** Approve at least three or four (multiple choice plus one blank), or move the four shipped questions into tagged form first, as was done for Chapter 4.

| Concept | Anchor | Reviewed now | Draft awaiting you |
| --- | --- | --- | --- |
| `ch7.six-errors`: The six new-agent errors, what each looks like and what it costs | `#the-six-errors` | 0 | 3 |
| `ch7.belief-not-habit`: Five errors are habits a system fixes; expecting results too fast is a belief | `#the-six-errors` | 0 | 3 |
| `ch7.pitfall-cycle`: The errors feed each other in a loop that runs on its own | `#how-the-errors-feed-each-other` | 0 | 3 |
| `ch7.one-correction`: One system with four parts makes all six errors hard to commit | `#the-one-correction` | 0 | 3 |
| `ch7.diagnose-week`: Find the errors in a real week and the change that breaks the chain | `#try-it-on-sam` | 0 | 3 |
| `ch7.self-score`: Score yourself on the six errors and fix the highest score first | `#try-it-on-sam` | 0 | 2 |

## Things I would look at first

- **No speed-to-lead or figure-number items.** A parallel lane may trim Chapter 7's speed-to-lead material, so nothing here tests Sam's Monday call, the "Speed-to-lead automation" fix, or the pitfall figure by number (now Figure 7.1).
- **`ch7.diagnose-week.logo`**: the chapter never says which error Sam's logo morning is. The key ("Unstructured days") is an inference from the table row "Busy all day with errands, social media and email; zero conversations." Confirm you agree. The explanation now states that the chapter leaves the diagnosis to the reader and names the Table 7.1 row it rests on.
- **`ch7.diagnose-week.thirty-days`**: also an inference, but a close one: the table row for "Expecting results too fast" reads "Discouraged after 30 days with no closing; activity drops." Its explanation gets the same treatment.
- **`ch7.six-errors.scattered`**: "Under-documenting" is a near neighbour of "No system or database hygiene". The table separates them (scattered contacts, notes and tasks vs. no notes on offers or disclosures). Check the distinction is clear enough.
- **`ch7.pitfall-cycle.closes-loop`** quotes the figure note ("breaks the loop at its first link"); if that note is trimmed, replace the explanation's second sentence.
- **Three blanks** (`quitting-cost`, `system-fixes`, `closes-loop`) are close to verbatim sentences. They test key ideas, but say if you would rather have them as multiple choice.
- **Shorthand distractors.** "Paying for leads too early" stands for the table's "Paying for leads before the system is ready, or relying only on portals"; it is only ever a wrong option.

## The questions

### 1. `ch7.six-errors.scattered`
*The six new-agent errors · multiple choice*

**Your contacts are in your phone, your notes are in email and your tasks are in your head. Which of the six errors is that?**

- A. Under-documenting
- B. Unstructured days
- C. No system or database hygiene ✓
- D. Slow or inconsistent follow-up

Explanation shown to the reader: It costs lost leads, missed anniversaries and no way to measure. The fix is everything in your CRM, every day (Chapter 4).

Chapter source:
> No system or database hygiene | Contacts in the phone, notes in email, tasks in memory. | Lost leads, missed anniversaries, no way to measure. | Everything in your CRM, every day (Ch. 4).

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 2. `ch7.six-errors.fee-in-writing`
*The six new-agent errors · multiple choice · scenario*

**A client says "you told me the fee was negotiable," and you have nothing in writing. Which error caught up with you?**

- A. Expecting results too fast
- B. Under-documenting ✓
- C. Slow or inconsistent follow-up
- D. Unstructured days

Explanation shown to the reader: Under-documenting costs risk, disputes and forgotten details that lose trust. The fix is notes in your CRM after every conversation (Chapter 11).

Chapter source:
> Under-documenting | Verbal agreements, no notes on offers or disclosures. | Risk, disputes, and forgotten details that lose trust. A client says "you told me the fee was negotiable," and you have nothing in writing. | Notes in your CRM after every conversation (Ch. 11).

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 3. `ch7.six-errors.quitting-cost`
*The six new-agent errors · fill in the blank*

**Expecting results too fast costs you this: quitting at the exact point the ______ would have paid.**

Keyed answer: **pipeline**. Also accepted: the pipeline, your pipeline.

Explanation shown to the reader: It looks like being discouraged after 30 days with no closing, so activity drops. The fix is tracking leading indicators, reviewing weekly and a 90-day horizon.

Chapter source:
> Expecting results too fast | Discouraged after 30 days with no closing; activity drops. | Quitting at the exact point the pipeline would have paid. | Track leading indicators; review weekly; 90-day horizon (Ch. 12).

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 4. `ch7.belief-not-habit.different`
*Five errors are habits; expecting results too fast is a belief · multiple choice*

**Five of the six errors are habits. What makes "expecting results too fast" different?**

- A. It only affects agents who buy online leads
- B. It is a habit that only willpower can fix
- C. It is a belief, and information is what fixes it ✓
- D. It fixes itself once the first closing arrives

Explanation shown to the reader: A system fixes habits. This one is a belief, and what fixes it is information: the 90-day timeline in Chapter 12.

Chapter source:
> Five of the six are habits, and a system fixes habits. "Expecting results too fast" is different: it is a belief, and what fixes it is information, namely the 90-day timeline in Chapter 12.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 5. `ch7.belief-not-habit.system-fixes`
*Five errors are habits; expecting results too fast is a belief · fill in the blank*

**Five of the six errors are habits, and a ______ fixes habits.**

Keyed answer: **system**. Also accepted: none.

Explanation shown to the reader: The correction works not because you become a different person, but because the system does the remembering.

Chapter source:
> Five of the six are habits, and a system fixes habits.
> It works not because you become a different person, but because the system does the remembering.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 6. `ch7.belief-not-habit.information`
*Five errors are habits; expecting results too fast is a belief · multiple choice · scenario*

**You are 30 days in with no closing and starting to think this is not working. What does the chapter say fixes that belief?**

- A. Buying more leads so a closing comes sooner
- B. The 90-day timeline in Chapter 12 ✓
- C. Working longer days until a contract arrives
- D. Switching to a different CRM

Explanation shown to the reader: Expecting results too fast is a belief, not a habit, and what fixes it is information, namely the 90-day timeline in Chapter 12.

Chapter source:
> "Expecting results too fast" is different: it is a belief, and what fixes it is information, namely the 90-day timeline in Chapter 12.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 7. `ch7.pitfall-cycle.order`
*The errors feed each other in a loop · multiple choice*

**Which sequence matches the loop the chapter describes?**

- A. Unstructured days, then paying for leads, then under-documenting, then slow follow-up
- B. Lost leads, then under-documenting, then paying for leads, then discouragement
- C. Slow follow-up, then lost leads, then an empty pipeline, then discouragement ✓
- D. Discouragement, then paying for leads, then slow follow-up, then an empty pipeline

Explanation shown to the reader: Slow follow-up loses leads, lost leads mean an empty pipeline, an empty pipeline is discouraging, discouragement makes the day unstructured, and an unstructured day produces slow follow-up.

Chapter source:
> Slow follow-up loses leads. Lost leads mean an empty pipeline. An empty pipeline is discouraging. Discouragement makes the day unstructured, and an unstructured day produces slow follow-up. The loop runs on its own once it starts.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 8. `ch7.pitfall-cycle.bad-year`
*The errors feed each other in a loop · multiple choice*

**Why can a bad month turn into a bad year, according to the chapter?**

- A. Each error takes about a year to unlearn
- B. Leads from a slow month stay cold for a year
- C. Brokers stop helping agents who start slowly
- D. The errors reinforce one another in a loop ✓

Explanation shown to the reader: New agents fall into the same six traps and they reinforce one another. The loop runs on its own once it starts.

Chapter source:
> New agents fall into the same six traps. They reinforce one another, which is why a bad month can become a bad year.
> The loop runs on its own once it starts.

Note: the shipped knowledge check already asks "How do the six new-agent errors relate to each other?" This stem asks the consequence instead.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 9. `ch7.pitfall-cycle.closes-loop`
*The errors feed each other in a loop · fill in the blank*

**Discouragement makes the day unstructured, and an unstructured day produces slow ______ , which starts the loop again.**

Keyed answer: **follow-up**. Also accepted: follow up, followup, follow-ups, follow ups.

Explanation shown to the reader: These are not six separate problems. The loop runs on its own once it starts, which is why installing a simple system breaks it at its first link.

Chapter source:
> These are not six separate problems. [...] Discouragement makes the day unstructured, and an unstructured day produces slow follow-up. The loop runs on its own once it starts.
> Each error causes the next. Installing a simple system breaks the loop at its first link.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 10. `ch7.one-correction.not-a-part`
*One system with four parts · multiple choice*

**Which of these is not one of the four parts of the one correction?**

- A. Buy a larger batch of online leads ✓
- B. Install your CRM and follow-up plans
- C. Protect a daily prospecting and follow-up block
- D. Review every Friday

Explanation shown to the reader: The four parts: install your CRM and follow-up plans, protect a daily prospecting and follow-up block, track activity not closings, and review every Friday.

Chapter source:
> Install your CRM and follow-up plans. [...] Protect a daily prospecting and follow-up block. [...] Track activity, not closings. [...] Review every Friday.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 11. `ch7.one-correction.structure`
*One system with four parts · multiple choice*

**Why does a protected daily prospecting and follow-up block help, according to the chapter?**

- A. It adds hours to your working day
- B. Structure replaces willpower ✓
- C. Clients stop calling during that time
- D. It lets you skip the Friday review

Explanation shown to the reader: You do not need willpower. You need a system that makes the errors hard to commit, and a protected block is part of it.

Chapter source:
> Protect a daily prospecting and follow-up block. Structure replaces willpower.
> You do not need willpower. You need a system that makes the errors hard to commit.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 12. `ch7.one-correction.track-activity`
*One system with four parts · multiple choice*

**What does tracking activity instead of closings give you while you wait for results?**

- A. A guarantee of at least one closing within 30 days
- B. A reason to skip the daily block when busy
- C. Proof for your broker that you need more leads
- D. Weekly progress you can see, so the wait is bearable ✓

Explanation shown to the reader: Track activity, not closings. You can see progress every week, so the 90-day wait is bearable.

Chapter source:
> Track activity, not closings. You can see progress every week, so the 90-day wait is bearable.

Note: the shipped knowledge-check blank already uses this sentence ("Track activity, not ______"). This question tests why, not the word.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 13. `ch7.diagnose-week.logo`
*Find the errors in a real week · multiple choice · scenario*

**Sam spent Tuesday morning on a logo. Which of the six errors is that closest to?**

- A. Under-documenting
- B. No system or database hygiene
- C. Unstructured days ✓
- D. Paying for leads too early

Explanation shown to the reader: The chapter leaves Sam's week for you to diagnose. A morning on a logo is busy work, not conversations, which matches "Unstructured days" in Table 7.1: busy all day with errands, social media and email; zero conversations. The fix is a time-blocked daily rhythm (Chapter 8).

Chapter source:
> Tuesday Sam spent the morning on a logo.
> Unstructured days | Busy all day with errands, social media and email; zero conversations. | Activity without leading indicators; nothing compounds. | Time-blocked daily rhythm (Ch. 8).

Note: the chapter asks the reader to find the errors and does not give the answer; the key is an inference, and the explanation now says so and names the Table 7.1 row it rests on. The chapter does not say Sam had zero conversations that morning, so the explanation calls the logo "busy work, not conversations" rather than claiming none happened.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 14. `ch7.diagnose-week.friday`
*Find the errors in a real week · multiple choice · scenario*

**Sam skipped the pipeline review on Friday. Which part of the one correction is missing?**

- A. Review every Friday ✓
- B. Install your CRM and follow-up plans
- C. Track activity, not closings
- D. Protect a daily prospecting and follow-up block

Explanation shown to the reader: Review every Friday: small drifts get corrected before they become habits.

Chapter source:
> Friday Sam did no pipeline review.
> Review every Friday. Small drifts get corrected before they become habits.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 15. `ch7.diagnose-week.thirty-days`
*Find the errors in a real week · multiple choice · scenario*

**Sam has closed nothing in 30 days, had no appointment on Thursday and felt low. Which error is Sam at risk of?**

- A. Under-documenting
- B. Paying for leads too early
- C. No system or database hygiene
- D. Expecting results too fast ✓

Explanation shown to the reader: The chapter leaves Sam's week for you to diagnose. No closing in the first 30 days and feeling low matches "Expecting results too fast" in Table 7.1: discouraged after 30 days with no closing; activity drops.

Chapter source:
> Sam closed no deals in the first 30 days. [...] Thursday Sam had no appointment and felt low.
> Expecting results too fast | Discouraged after 30 days with no closing; activity drops.

Note: also an inference the chapter leaves to the reader; the explanation says so and names the Table 7.1 row.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 16. `ch7.self-score.how`
*Score yourself and fix the highest score first · multiple choice*

**How does the chapter's Try It ask you to score yourself on the six errors?**

- A. Pass or fail on each error over the last year
- B. 1 (never) to 5 (every day) over the last two weeks ✓
- C. 1 to 10 on how you feel about this week
- D. By counting your closings in the last 30 days

Explanation shown to the reader: Score yourself honestly on each of the six errors from 1 (never) to 5 (every day), using the last two weeks, and write one example beside each score.

Chapter source:
> Score yourself honestly on each of the six errors from 1 (never) to 5 (every day), using the last two weeks. Write one example beside each score.

Note: this leans toward recall of the exercise's mechanics; drop it if you would rather test only ideas.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 17. `ch7.self-score.highest`
*Score yourself and fix the highest score first · multiple choice*

**You have scored yourself. What does the chapter say to do with your highest score?**

- A. Do the exercise in the chapter its Fix column names ✓
- B. Work on all six errors at once, starting this week
- C. Wait for your first closing, then come back to it
- D. Leave it unless your broker gives you the same score

Explanation shown to the reader: If the fix points ahead in the book, do its Try It now and return to the chapter later. Then ask your broker, a mentor or an accountability partner to score you too, and compare.

Chapter source:
> For your highest score, read the chapter named in the Fix column and do its exercise this week. If it points ahead in the book, do the Try It now and return to the chapter later.
> Ask your broker, a mentor or an accountability partner to score you too. Compare.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

## After your review

Send back the decisions (the numbers are enough). Approved questions get `draft` removed; changed ones are edited and their `version` bumped; dropped ones are deleted. Then run `pnpm test lib/coach` to confirm the bank is still consistent.
