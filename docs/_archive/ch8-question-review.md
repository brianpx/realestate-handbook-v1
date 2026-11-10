# Chapter 8 question bank: draft questions for review

Prepared 9 November 2026. Sixteen questions across six new concepts were written from the Chapter 8 text for the spaced-review bank (`../../content/data/questions.ts`, each marked `draft: true`; the concepts are in `../../content/data/concepts.ts`). **None of them is shown to readers yet.** The four questions that already ship with the chapter's knowledge check (`../../content/data/knowledge-checks.ts`) are unchanged, were not moved into the bank, and are not listed here.

Status of every item below: **draft, awaiting owner review** (OD-30: the owner reviews and clears drafts until a working agent is named).

## What I am asking you to check

Mark each question **Approve**, **Change** (say what) or **Drop**.

1. **Is the keyed answer the right one**, and are the other options clearly wrong rather than arguable?
2. **Does it match what a working agent would do**, not just what the chapter says?
3. **Is it too easy, too tricky, or testing the wording rather than the idea?**
4. **Does the explanation say anything the chapter does not?**

Every keyed answer is traceable to a sentence in `../../content/pages/ch8.html`; the quoted passages below were copied from that file. That shows the question matches the **book**. It does not show the book is right. The Table 8.2 targets used here match `WEEKLY_TARGETS` in `../../content/data/rules.ts`.

## How approved questions get used

Approved questions lose their `draft` flag and join the review deck. They also join the end-of-chapter check: `chapterCheck()` in `../../lib/coach/check.ts` serves every non-draft question for the chapter, and once Chapter 8 has one, its check switches from the four legacy questions to the tagged bank. Approving all 16 would make a 16-question chapter quiz, so decide whether to migrate the four shipped questions first (as Chapters 4, 5 and 12 did) and approve a few per concept.

| Concept | Anchor | Reviewed now | Draft awaiting you |
| --- | --- | --- | --- |
| Your CRM is the only list: a conversation not logged did not happen | `#one-source-of-truth` | 0 | 2 |
| Lead generation goes first in the day, in the same place every day | `#time-blocking-the-week` | 0 | 3 |
| Table 8.2 sets the weekly targets: start low, or track the five core numbers | `#weekly-activity-targets` | 0 | 3 |
| The appointment target follows from your conversations-per-appointment ratio | `#weekly-activity-targets` | 0 | 2 |
| Score leading indicators, not closings, and keep the three motivation habits | `#motivation-that-lasts` | 0 | 3 |
| Decide in advance what you do on a slow day | `#when-it-is-quiet` | 0 | 3 |

## Things I would look at first

- **No item depends on the "A sample day" prose**, which a parallel lane is trimming. The morning-block concept is anchored on `#time-blocking-the-week` and quotes Table 8.1, the field note and Table 8.2 only.
- **`ch8.weekly-targets.not-core`** overlaps `ch12.scorecard.core-numbers` (both test the five core numbers). Chapter 8 is where the list is defined; keep one or both.
- **`ch8.morning-block.tell-people`**: the field note's script says "I'm with clients until 11:00" during a prospecting block. The chapter calls that true; check you are comfortable teaching it.
- **Blanks** accept only the listed forms: "four"/"4", "15"/"fifteen", "20"/"twenty". "4+" or "at least four" would be marked wrong.
- **Option length**: the keyed option is never the single longest; in `ch8.appointment-ratio.why-one-or-two` it ties with a distractor.
- **Cross-chapter review (9 November 2026)**: `ch8.leading-indicators.closings-fail` no longer keys on "60 to 90 days" (Chapter 1 says 60 to 120); `ch8.leading-indicators.which-one` was replaced by `ch8.leading-indicators.friday-review` because it duplicated Chapter 1 items; `ch8.appointment-ratio.better-ratio` was dropped because it overlapped `ch1.goal-ladder.own-ratio`.

## The questions

### 1. `ch8.one-source-of-truth.second-list`
*Your CRM is the only list · multiple choice*

**Why does the chapter warn against keeping a second contact list next to your CRM?**

- A. Your broker's data rules forbid any list outside the CRM
- B. You have two places to check, and one will be wrong ✓
- C. Your CRM deletes contacts it finds elsewhere
- D. A paper list cannot hold notes or tasks

Explanation shown to the reader: The moment you keep a second list, you have two places to check and one of them will be wrong.

Chapter source:
> The moment you keep a second list, you have two places to check and one of them will be wrong.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 2. `ch8.one-source-of-truth.what-lives`
*Your CRM is the only list · multiple choice*

**Which of these belongs in your CRM?**

- A. Only active clients and your hottest leads
- B. Contacts, with tasks kept in a planner
- C. The important contacts and your notes on them
- D. Every contact, note, task and opportunity ✓

Explanation shown to the reader: Every contact, note, task and opportunity lives in your CRM. Not some of them. Not the important ones. All of them.

Chapter source:
> Every contact, note, task and opportunity lives in your CRM. Not some of them. Not the important ones. All of them.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 3. `ch8.morning-block.same-place`
*Lead generation goes first in the day · multiple choice*

**Why does the weekly time block put lead generation in the same place every day?**

- A. So it never depends on how you feel ✓
- B. So clients know when to book showings
- C. Because most new leads arrive in the morning
- D. So your broker can check on your calls

Explanation shown to the reader: Table 8.1: lead generation sits in the same place every day so it never depends on how you feel.

Chapter source:
> Table 8.1. A sample weekly time block. Lead generation sits in the same place every day so it never depends on how you feel.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 4. `ch8.morning-block.tell-people`
*Lead generation goes first in the day · multiple choice, scenario*

**Your lender asks to talk at 10:00, in the middle of your prospecting block. What does the chapter suggest?**

- A. Take the call, since lenders are often hard to reach later
- B. Skip the block today and make it up on Friday
- C. Say you are with clients until 11:00 and offer 1:00 ✓
- D. Let it ring and call back at the end of the day

Explanation shown to the reader: Protect the block by telling people about it. "I'm with clients until 11:00, can we talk at 1?" trains your sphere, your lender and your family to expect it.

Chapter source:
> Protect the block by telling people about it. "I'm with clients until 11:00, can we talk at 1?" is true, and it trains your sphere, your lender and your family to expect it.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 5. `ch8.morning-block.blocks-held`
*Lead generation goes first in the day · fill in the blank*

**Table 8.2 asks you to hold the 90-minute prospecting block, before 11:00, on at least ____ of the five weekdays.**

Answer: four (accepts "four", "4")

Explanation shown to the reader: The weekly target for morning blocks held (out of 5) is 4+.

Chapter source (Table 8.2 row):
> Morning blocks held (out of 5) | 4+ | The 90-minute prospecting block, before 11:00.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 6. `ch8.weekly-targets.first-30-days`
*Table 8.2 sets the weekly targets · multiple choice*

**In your first 30 days, where in each Table 8.2 range should you aim?**

- A. At the top of every range, from the first week
- B. Wherever you like, as long as closings are on track
- C. Below every range until your first closing arrives
- D. At the lower end, raising it as confidence grows ✓

Explanation shown to the reader: Start at the lower end of each range in your first 30 days while the habit and the system settle in, then raise them as your confidence grows.

Chapter source:
> Start at the lower end of each range in your first 30 days while the habit and the system settle in, then raise them as your confidence grows.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 7. `ch8.weekly-targets.not-core`
*Table 8.2 sets the weekly targets · multiple choice*

**Which of these is not one of the five core numbers the chapter suggests tracking when thirteen rows is too many?**

- A. Conversations
- B. Outbound calls ✓
- C. Morning blocks held
- D. New contacts added

Explanation shown to the reader: The five core numbers are conversations, appointments set, follow-ups completed, new contacts added and morning blocks held. Outbound calls stay on the Appendix A scorecard for when the habit is steady.

Chapter source:
> Thirteen rows is a lot to track. If you want a shorter list, track five core numbers: conversations, appointments set, follow-ups completed, new contacts added and morning blocks held. The other rows are on the Appendix A scorecard for when the habit is steady.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 8. `ch8.weekly-targets.new-contacts`
*Table 8.2 sets the weekly targets · fill in the blank*

**Table 8.2 sets a weekly target of ____ new contacts added, each one tagged with a source.**

Answer: 15 (accepts "15", "fifteen")

Explanation shown to the reader: New contacts added is one of the five core numbers; review it with the rest every Friday.

Chapter source:
> New contacts added | 15 | Each one tagged with a source.
> Review the numbers every Friday and set next week's plan from them.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 9. `ch8.appointment-ratio.why-one-or-two`
*The appointment target follows from your ratio · multiple choice*

**Why is the weekly target for appointments set only 1 to 2?**

- A. About 20 conversations per appointment gives roughly one a week ✓
- B. New agents should never take on more than two clients at a time
- C. Brokers cap appointments for agents in their first year
- D. More appointments would crowd out the morning block

Explanation shown to the reader: At about 20 conversations per appointment, 15 to 25 conversations a week produce roughly one appointment a week, so a new agent should aim for one or two, not a handful.

Chapter source:
> At about 20 conversations per appointment, 15 to 25 conversations a week produce roughly one appointment a week, so a new agent should aim for one or two, not a handful.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 10. `ch8.appointment-ratio.twenty`
*The appointment target follows from your ratio · fill in the blank*

**Unless your own ratio is better, the chapter works from about ____ conversations per appointment.**

Answer: 20 (accepts "20", "twenty")

Explanation shown to the reader: The appointment target comes from the same method as Chapter 1.

Chapter source:
> The appointment target comes from the same method as Chapter 1. At about 20 conversations per appointment, 15 to 25 conversations a week produce roughly one appointment a week

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 11. `ch8.leading-indicators.closings-fail`
*Score leading indicators, not closings · multiple choice*

**Why does a scoreboard of closings alone wear down a new agent's motivation?**

- A. Closings are hard to count accurately
- B. Your broker already tracks closings, so yours adds nothing
- C. Closings depend only on the market, not on you
- D. Closings can sit at zero for months while you work ✓

Explanation shown to the reader: Motivation fails when you measure the wrong thing. Leading indicators move every day you do the work.

Chapter source:
> Motivation fails when you measure the wrong thing. If the only scoreboard is closings, you will go 60 to 90 days with a score of zero, and nobody stays motivated through that. Keep a scoreboard of leading indicators instead: calls, conversations, follow-ups completed, appointments set. Those numbers move every day you do the work.

Note: the keyed option deliberately states no number. Chapter 8 says "60 to 90 days" while Chapter 1 says "60 to 120 days" (another item keys on that), so the item stays clear of the conflict. The chapters themselves still disagree; that is a content fix, not a question fix.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 12. `ch8.leading-indicators.friday-review`
*Score leading indicators, not closings · multiple choice*

**What does the Friday review end with?**

- A. Plan every call for next week, then keep working through Saturday
- B. Email your numbers to your broker for sign-off
- C. Decide one thing to do differently, then stop until Monday ✓
- D. Count closings and compare them with the office

Explanation shown to the reader: Compare this week's numbers to last week's. Decide one thing to do differently. Then stop working on it until Monday.

Chapter source (checked on main and on this branch):
> Review every Friday. Compare this week's numbers to last week's. Decide one thing to do differently. Then stop working on it until Monday.

Note: replaces `ch8.leading-indicators.which-one`, which duplicated the shipped Chapter 1 check and `ch1.leading-lagging.lagging`. The shipped Chapter 8 knowledge check's blank also ends on "until Monday"; this item asks for the whole closing step as a multiple choice.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:
---

### 13. `ch8.leading-indicators.habits`
*Score leading indicators, not closings · multiple choice*

**Which is one of the three habits the chapter says protect motivation?**

- A. Work through the weekend after a slow week
- B. Check your closings total every morning
- C. Celebrate small wins, like a booked appointment ✓
- D. Keep a private list of your very best leads outside the CRM

Explanation shown to the reader: The three habits: celebrate small wins, review every Friday, and stay close to the office.

Chapter source:
> Three habits protect motivation:
> Celebrate small wins. A booked appointment is a win. [...]
> Review every Friday. [...] Then stop working on it until Monday.
> Stay close to the office. Training, accountability partners, team meetings.

Note: option A contradicts "stop working on it until Monday"; option D contradicts the one-source-of-truth rule.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 14. `ch8.quiet-days.first-action`
*Decide in advance what you do on a slow day · multiple choice, scenario*

**It is a day with no conversations. What does the chapter say to start with?**

- A. Fifty cold calls in a row, to force at least one conversation
- B. A text, not a call: the lowest-barrier task ✓
- C. Rewriting your bio and website copy
- D. Waiting until the afternoon to try again

Explanation shown to the reader: Start with the lowest-barrier task: a text, not a call. One reply is enough to restart the day.

Chapter source:
> On a day with no conversations, start with the lowest-barrier task: a text, not a call. One reply is enough to restart the day.

Note: the chapter does not say whom to text. Chapter 11's consent rule covers automated texts, not a personal one, so no conflict with `rules.ts`.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 15. `ch8.quiet-days.colleague`
*Decide in advance what you do on a slow day · multiple choice, scenario*

**On Friday you hear that a colleague closed first. What should you compare their result to?**

- A. Your closings so far
- B. Their lead sources
- C. The office average for new agents
- D. Your leading indicators ✓

Explanation shown to the reader: Their closing is the product of work they did months ago. Yours is on the way.

Chapter source:
> When a colleague closes first, compare their result to your leading indicators, not to your closings. Their closing is the product of work they did months ago. Yours is on the way.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 16. `ch8.quiet-days.pitfall`
*Decide in advance what you do on a slow day · multiple choice*

**What mistake turns a slow week into a slow month?**

- A. Waiting for things to pick up on their own ✓
- B. Calling too many people in a single day
- C. Telling your broker about the slow week
- D. Taking the weekend off after the Friday review

Explanation shown to the reader: Nothing picks up on its own. Go back to the morning block and the daily number; the market usually responds to activity.

Chapter source (Pitfall box):
> Letting a slow week become a slow month by "waiting for things to pick up". Nothing picks up on its own. Go back to the morning block and the daily number; the market usually responds to activity.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:
