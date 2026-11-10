# Chapter 1 question bank: draft questions for review

Prepared 9 November 2026. Eighteen questions were written from the Chapter 1 text for the spaced-review bank (`../../content/data/questions.ts`, each marked `draft: true`), grouped under six new Chapter 1 concepts (`../../content/data/concepts.ts`). **None of them is shown to readers yet.** The four questions in Chapter 1's "Test your knowledge" box (`../../content/data/knowledge-checks.ts`) are unchanged, are not listed here, and none of the drafts repeats them.

Status of every question below: **draft, awaiting owner review**.

## What I am asking you to check

You have worked as an agent, so the useful things only you can judge are below. Mark each question **Approve**, **Change** (say what) or **Drop**.

1. **Is the keyed answer the right one**, and are the other options clearly wrong rather than arguable?
2. **Does it match what a working agent would do**, not just what the chapter says?
3. **Is it too easy, too tricky, or testing the wording rather than the idea?**
4. **Does the explanation say anything the chapter does not?**

Every keyed answer is traceable to a sentence in `../../content/pages/ch1.html`, or to Table 1.1, whose rows the chapter renders from `../../content/data/goal.ts`. The quoted passages below were checked against those files word for word. That shows the question matches the **book**. It does not show the book is right.

## How approved questions get used

Approved questions lose their `draft` flag and join the review deck. Today every Chapter 1 concept has **zero** reviewed questions, so none of the six ideas enters the review loop until at least one of its questions is approved.

Approving a question also adds it to Chapter 1's end-of-chapter check: `chapterCheck()` in `../../lib/coach/check.ts` serves every non-draft question for the chapter, and once Chapter 1 has any, its check switches from the plain four-question box to the tagged one (`check.test.ts` currently pins Chapter 1 as untagged, so the first approval has to update that test). If you approve some, consider also tagging the four shipped questions, as Chapter 4 did, so the check keeps asking them.

| Concept | Anchor | Reviewed now | Draft awaiting you |
| --- | --- | --- | --- |
| `ch1.business-owner` You own a small company: find customers, stay in touch, keep them | `#you-own-a-business-now` | 0 | 3 |
| `ch1.work-is-the-win` Control the conversations, not the yeses: a "no" still counts | `#the-work-is-the-win` | 0 | 3 |
| `ch1.leading-lagging` Set goals on leading indicators, because closings lag 60 to 120 days | `#leading-and-lagging-indicators` | 0 | 3 |
| `ch1.goal-ladder` Work backward from an income goal to a daily conversation target | `#working-backward-from-an-income-goal` | 0 | 3 |
| `ch1.runway` Plan your runway and set aside part of every commission check | `#working-backward-from-an-income-goal` | 0 | 3 |
| `ch1.crm-headquarters` Your CRM is your headquarters: open it first, update it last | `#your-crm-is-your-headquarters` | 0 | 3 |

## Things I would look at first

- **`ch1.runway`** links to `#working-backward-from-an-income-goal`, the top of the section, because Table 1.2 has no heading of its own. A dedicated anchor near the table would land the reader closer.
- **`ch1.runway.check-order`**: the chapter leaves the tax share to a tax professional ("many new agents start at a quarter to a third"). The question tests only the order, never a percentage. Confirm that is the lesson you want.
- **`ch1.goal-ladder.worst-day`** is a one-word blank close to the chapter's phrasing. It accepts "worst" and "bad" because the chapter uses both.
- **`ch1.crm-headquarters.first-90-days`** replaced an earlier blank ("open your CRM first and ___ it last") after the cross-chapter review found it duplicated `ch4.daily-rhythm.opens-closes`.
- I tried to keep the keyed option from being the longest. In 3 of 15 multiple-choice drafts it still is, by two to four characters (`costs-first`, `start-with`, `formula`).

## The questions

### 1. `ch1.business-owner.three-ways`
*You own a small company: find customers, stay in touch, keep them · multiple choice*

**According to Chapter 1, what three things does your company need?**

- A. A way to find, stay in touch with and keep customers ✓
- B. An office, a recognizable brand and a full-time assistant
- C. A license, a sponsoring broker and a polished website
- D. Listings, buyers who are ready to move and a lender

Explanation shown to the reader: A company needs a way to find customers, a way to stay in touch with them, and a way to keep them. That is the whole structure of the book.

Chapter source:
> A company needs a way to find customers, a way to stay in touch with them, and a way to keep them. That is the whole structure of this book.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 2. `ch1.business-owner.one-product`
*You own a small company: find customers, stay in touch, keep them · multiple choice*

**The agents who last think of themselves as owners of a small company with one product. What is that product?**

- A. Listings marketed to as many buyers as possible
- B. Access to homes before they reach the market
- C. The lowest commission in the neighborhood
- D. Guidance through a large financial decision ✓

Explanation shown to the reader: The chapter names the one product as trusted guidance through a large financial decision.

Chapter source:
> The agents who last think of themselves as owners of a small company with one product: trusted guidance through a large financial decision.

Note: the keyed option drops "trusted" so it is not given away by length; the explanation restores it.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 3. `ch1.business-owner.costs-first`
*You own a small company: find customers, stay in touch, keep them · multiple choice*

**Why does the chapter tell you to plan for several months of expenses before your first check?**

- A. Brokers hold back your first few checks
- B. Your first closing is guaranteed by month two
- C. A commission business pays only at closing ✓
- D. New agents cannot take listings at first

Explanation shown to the reader: In your first month you will likely pay fees, MLS access, a CRM and some marketing, and a commission business pays only at closing. Ask your broker for a realistic list of month-one costs.

Chapter source:
> It also comes with costs that arrive before income does. In your first month you will likely pay license and association fees, MLS access, a CRM and some marketing, and a commission business pays only at closing. Ask your broker for a realistic list of month-one costs, and plan for several months of expenses before your first check.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 4. `ch1.work-is-the-win.one-twentieth`
*Control the conversations, not the yeses: a "no" still counts · multiple choice*

**If it takes about 20 conversations to book one appointment, what is each "no"?**

- A. A sign your script needs changing
- B. One-twentieth of an appointment ✓
- C. A contact to remove from your list
- D. A rejection to recover from first

Explanation shown to the reader: Think in ratios: each "no" is one-twentieth of an appointment, not a rejection. Hit the daily number and the results follow on their own schedule.

Chapter source:
> Think in ratios. If it takes about 20 conversations to book one appointment, each "no" is one-twentieth of an appointment, not a rejection. Hit the daily number, and the results follow on their own schedule.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 5. `ch1.work-is-the-win.control`
*Control the conversations, not the yeses: a "no" still counts · fill in the blank*

**You cannot control who says yes. You can control how many real ______ you have today.**

Keyed answer: **conversations**. Also accepted: conversation, real conversations.

Explanation shown to the reader: The number of real conversations is yours to control, and a "no" still counts toward it.

Chapter source:
> You cannot control who says yes. You can control how many real conversations you have today, and a "no" still counts toward that number.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 6. `ch1.work-is-the-win.no-counts`
*Control the conversations, not the yeses: a "no" still counts · multiple choice · scenario*

**A homeowner you call has a real two-way talk with you about selling, then says "no". Does that count toward today's conversation number?**

- A. No, only conversations that book an appointment count
- B. Only once you have scheduled a follow-up with them
- C. Yes, a "no" still counts toward that number ✓
- D. Only if they agree to stay on your follow-up plan

Explanation shown to the reader: You control how many real conversations you have today, and a "no" still counts toward that number.

Chapter source:
> You can control how many real conversations you have today, and a "no" still counts toward that number.
> A *conversation* means a real two-way exchange about real estate with a person who could buy, sell or refer, not a voicemail.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 7. `ch1.leading-lagging.lagging`
*Set goals on leading indicators, because closings lag 60 to 120 days · multiple choice*

**Which of these is a lagging indicator?**

- A. Appointments set
- B. Contacts added to your database
- C. Commission income ✓
- D. Conversations held

Explanation shown to the reader: A lagging indicator tells you what already happened: closings, commission income and listings held. The other three are activities you control today.

Chapter source:
> A lagging indicator tells you what already happened. Closings, commission income and the number of listings you hold are all lagging.
> Conversations held, appointments set, follow-up tasks completed and contacts added to your database are leading.

Note: the shipped check asks the mirror question ("Which of these is a leading indicator?"). This one asks for the lagging item, with leading items as distractors.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 8. `ch1.leading-lagging.start-with`
*Set goals on leading indicators, because closings lag 60 to 120 days · multiple choice*

**Which three weekly numbers does the chapter tell you to start tracking?**

- A. Closings, listings held, commission income
- B. Conversations, appointments set, follow-ups completed ✓
- C. Calls dialed, emails sent, social posts published
- D. Open houses held, mailers sent, ads run

Explanation shown to the reader: Your three weekly numbers to start: conversations, appointments set and follow-ups completed. All three are leading indicators.

Chapter source:
> Your three weekly numbers to start: conversations, appointments set and follow-ups completed.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 9. `ch1.leading-lagging.flat-closings`
*Set goals on leading indicators, because closings lag 60 to 120 days · multiple choice · scenario*

**Your conversations have been up for three weeks running, but no new closings have come in. What does the chapter say to do?**

- A. Reset your goals on closings so you notice the gap
- B. Drop your lead sources and start over with new ones
- C. Cut back on activity until the market turns
- D. Keep goals on activity; closings lag 60 to 120 days ✓

Explanation shown to the reader: Closings do not respond for 60 to 120 days. Set your goals on activity, review them weekly, and let the closings arrive on their own schedule.

Chapter source:
> New agents who set goals only on closings get discouraged, because closings do not respond for 60 to 120 days. Set your goals on activity, review them weekly, and let the closings arrive on their own schedule.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 10. `ch1.goal-ladder.conversations-year`
*Work backward from an income goal to a daily conversation target · multiple choice*

**In Table 1.1's example, 13 closings at about 3 appointments per closing and about 20 conversations per appointment need about how many conversations in the year?**

- A. 39
- B. 260
- C. 780 ✓
- D. 1,560

Explanation shown to the reader: 13 closings x 3 = 39 appointments, and 39 x 20 = about 780 conversations: about 16 a week over 48 working weeks, or 3 to 4 a day.

Chapter source (Table 1.1, `../../content/data/goal.ts`):
> Closings needed (goal ÷ average): 13
> Appointments needed per closing (new agents: about 3): 39 appointments
> Conversations needed per appointment (new agents: about 20, blended across sources): ≈ 780 conversations
> Working weeks: 48
> Conversations per week: ≈ 16
> Conversations per working day: 3 to 4

Note: 39 is the appointment count and 260 is 13 x 20 (skipping the appointment step); 1,560 has no source in the chapter and is there as an overshoot.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 11. `ch1.goal-ladder.own-ratio`
*Work backward from an income goal to a daily conversation target · multiple choice · scenario*

**After your first year, your own tracking shows about eight conversations per appointment, not the example's 20. What does the chapter say?**

- A. Build your daily plan from your own ratio ✓
- B. Keep using 20 until your first year is up
- C. Raise your income goal to match the ratio
- D. Drop the daily target and track closings

Explanation shown to the reader: Use your own local numbers and track your own ratios. If your ratio turns out to be eight conversations per appointment, your daily plan writes itself from that number.

Chapter source:
> Use your own local numbers; the ones below are an example.
> Your ratios will be worse than the example in your first six months and better after a year. Track your own. For example, if your own ratio turns out to be eight conversations to book one appointment, your daily plan writes itself from that number. Table 1.1's example uses about 20.

Note: the stem says "after your first year" because the field note says ratios are worse than the example in the first six months and better after a year.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 12. `ch1.goal-ladder.worst-day`
*Work backward from an income goal to a daily conversation target · fill in the blank*

**Work backward from income to a daily conversation target you can hit on your ______ day.**

Keyed answer: **worst**. Also accepted: bad, worst day, bad day.

Explanation shown to the reader: A daily target you can hit on a bad day is worth more than a heroic target you hit twice and abandon.

Chapter source:
> Work backward from income to a daily conversation target you can hit on your worst day.
> A daily target you can hit on a bad day is worth more than a heroic target you hit twice and abandon.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 13. `ch1.runway.formula`
*Plan your runway and set aside part of every commission check · multiple choice*

**How does Table 1.2 work out the runway you need?**

- A. Monthly business costs times twelve months
- B. Living costs divided by your average commission
- C. Your first commission minus a year of costs
- D. (Business + living costs) x months to first check ✓

Explanation shown to the reader: Runway needed is (business costs + living costs) x months to first check. Savings, a working partner or part-time income has to cover it.

Chapter source (Table 1.2):
> Runway needed: (Business costs + living costs) × months to first check. Savings, a working partner or part-time income has to cover it.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 14. `ch1.runway.check-order`
*Plan your runway and set aside part of every commission check · multiple choice*

**In what order does the chapter say to divide each commission check?**

- A. Pay yourself, then taxes, then the business
- B. Taxes first, a tenth to the business, then you ✓
- C. The business, then pay yourself, then taxes
- D. Pay and taxes evenly, the business from the rest

Explanation shown to the reader: Set aside a share for taxes first (a tax professional sets the share), then a tenth for the business, then pay yourself.

Chapter source (Table 1.2):
> From every commission check: Set aside a share for taxes first (you are self-employed; a tax professional sets the share, and many new agents start at a quarter to a third), then a tenth for the business, then pay yourself.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 15. `ch1.runway.example`
*Plan your runway and set aside part of every commission check · multiple choice · scenario*

**Your business costs are $600 a month, your living costs $3,400 a month, and you plan on 5 months to your first check. What runway does Table 1.2 say you need?**

- A. $3,000
- B. $4,000
- C. $17,000
- D. $20,000 ✓

Explanation shown to the reader: ($600 + $3,400) x 5 = $20,000. Months to first check is planned at four to six, because closings lag activity and a contract takes another 30 to 45 days to close.

Chapter source (Table 1.2, example column):
> Monthly business costs: $600
> Monthly living costs: $3,400
> Months to first check: Closings lag activity by 60 to 120 days, and a contract takes another 30 to 45 days to close. Plan on four to six. 5
> Runway needed: (Business costs + living costs) × months to first check. $20,000

Note: the distractors are the usual slips: $3,000 counts business costs only, $4,000 is one month, $17,000 counts living costs only.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 16. `ch1.crm-headquarters.first-three`
*Your CRM is your headquarters: open it first, update it last · multiple choice*

**Which are the first three things to check in your CRM each morning?**

- A. Your inbox, social notifications and the MLS
- B. Last month's closings, commission and listings
- C. Your calendar, your weekly scorecard and your marketing
- D. Overnight leads, tasks due today, moved Opportunities ✓

Explanation shown to the reader: The first three things to check are the new leads that arrived overnight, the tasks due today, and the Opportunities that moved. Chapter 4 builds the full daily rhythm around them.

Chapter source:
> The first three things to check are the new leads that arrived overnight, the tasks due today, and the Opportunities that moved; Chapter 4 builds the full daily rhythm around them.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 17. `ch1.crm-headquarters.first-90-days`
*Your CRM is your headquarters: open it first, update it last · fill in the blank*

**The habit that matters most in your first ______ days is opening your CRM first thing every morning and updating it before you stop working.**

Keyed answer: **90**. Also accepted: ninety.

Explanation shown to the reader: The habit that matters most in your first 90 days is simple: open your CRM first thing every morning and update it before you stop working.

Chapter source:
> The habit that matters most in your first 90 days is simple: open your CRM first thing every morning and update it before you stop working.

Note: the stem rephrases the chapter sentence ("is simple: open ... and update" becomes "is opening ... and updating") so it reads as one clause. It tests the time frame the chapter attaches to the habit, not the habit's wording, which `ch4.daily-rhythm.opens-closes` already covers.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 18. `ch1.crm-headquarters.sticky-notes`
*Your CRM is your headquarters: open it first, update it last · multiple choice · scenario*

**A new agent keeps contacts in their phone, on sticky notes and in their inbox instead of the CRM. What does the chapter predict?**

- A. They will forget contacts and fall behind within a quarter ✓
- B. It works fine until the database passes a few hundred names
- C. Nothing, as long as they back up their phone each week
- D. They will be slower, but no leads will actually be lost

Explanation shown to the reader: Contacts that live in your phone, sticky notes and inbox are contacts you will forget. Without the CRM habit you fall behind within a quarter, and the leads you lose are hard to win back.

Chapter source:
> Contacts that live in your phone, sticky notes and inbox are contacts you will forget. If you treat your CRM as non-negotiable, you stay organized. If you do not, you will fall behind within a quarter, and the leads you lose in that stretch are hard to win back.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:
