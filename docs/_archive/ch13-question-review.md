# Chapter 13 question bank: draft questions for review

Prepared 9 November 2026. Seventeen questions were written from the Chapter 13 text for the spaced-review bank (`../../content/data/questions.ts`, each marked `draft: true`), testing six new concepts (`../../content/data/concepts.ts`). **None of them is shown to readers yet.** Chapter 13 had no tagged questions before, so its end-of-chapter check stays the plain one until at least one question here is approved.

Status of every item: **draft, awaiting owner review** (OD-30).

## What I am asking you to check

You have worked as an agent, so the useful things only you can judge are below. Mark each question **Approve**, **Change** (say what) or **Drop**.

1. **Is the keyed answer the right one**, and are the other options clearly wrong rather than arguable?
2. **Does it match what a working agent would do**, not just what the chapter says?
3. **Is it too easy, too tricky, or testing the wording rather than the idea?**
4. **Does the explanation say anything the chapter does not?**

Every keyed answer is traceable to a sentence in `../../content/pages/ch13.html`; the quoted passages below were copied from that file. That shows the question matches the **book**. It does not show the book is right.

Deliberately not tested: "Do these this week", the speed-to-lead sentence in "The two habits that matter most", the card's Friday line and the figure, because a parallel lane trimmed those passages (MASTER-PROMPT M4 step 10, PR #32). The quotes below use the wording after PR #32: "Speed-to-lead: answer every new lead to the standard in Chapter 4." and "Review every Friday and change one thing. Ask your broker before anything unusual."

## How approved questions get used

Approved questions lose their `draft` flag and join the review deck. `chapterCheck()` in `../../lib/coach/check.ts` also serves every non-draft question of a chapter in its end-of-chapter check, so the first approval here switches Chapter 13 from the plain check to a recorded one. Approving all 17 would make a 17-question chapter check; decide on a cap before approving in bulk.

| Concept | Anchor | Draft awaiting you |
| --- | --- | --- |
| `ch13.two-habits`: the two habits that matter most | `#the-two-habits-that-matter-most` | 3 |
| `ch13.help-network`: name the people you will actually use | `#where-to-get-help` | 3 |
| `ch13.broker-before`: broker for anything legal, contractual or unusual, before, not after | `#where-to-get-help` | 3 |
| `ch13.ninety-day-review`: one-paragraph review of the first 90 days, shared with one person | `#plan-the-next-90-days` | 3 |
| `ch13.own-numbers`: next 90 days from your own conversion ratios | `#plan-the-next-90-days` | 3 |
| `ch13.implementation-intention`: one implementation intention for next Monday morning | `#plan-the-next-90-days` | 2 |

## Things I would look at first

- **`ch13.two-habits.when-stalled`**: the keyed option names speed-to-lead. After PR #32 the section still names it as one of the two habits ("Speed-to-lead: answer every new lead to the standard in Chapter 4."), and the explanation quotes only the unchanged "first things to check when results stall" sentence.
- **`ch13.own-numbers.which-three`**: the distractors were lengthened after the cross-chapter review; the keyed option is still the longest, but only just (75 characters against 63, 71 and 68).
- **`ch13.implementation-intention.form`**: the keyed option's "9:30 a.m." is an illustrative example of the form, matching the start of the prospecting block in Table 8.1; Chapter 13 itself states no time.
- **`ch13.help-network.partner-tag`** and **`ch13.broker-before.kinds`**: one-word blanks close to the chapter's wording; they reward recall of the line.

## The questions

### 1. `ch13.two-habits.when-stalled`
*The two habits that matter most · multiple choice · scenario*

**Your results have stalled. Which two habits does Chapter 13 say to check first?**

- A. Cold calling and door knocking
- B. Speed-to-lead and multi-touch follow-up ✓
- C. Open houses and paid online leads
- D. Social posts and monthly mailers

Explanation shown to the reader: Speed-to-lead and multi-touch follow-up are the two habits that matter most. The seven lines on the card are the system; these two are the first things to check when results stall.

Chapter source:
> If you remember nothing else from this handbook, remember these two. Speed-to-lead: answer every new lead to the standard in Chapter 4. Multi-touch follow-up: stay in touch for 90 days and then forever. [...] The seven lines on the card below are the system; these two are the first things to check when results stall.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 2. `ch13.two-habits.forever`
*The two habits that matter most · fill in the blank*

**Multi-touch follow-up means you stay in touch for 90 days and then ______.** (accepted: forever)

Explanation shown to the reader: These two habits separate agents who grow from agents who stay stuck.

Chapter source:
> Multi-touch follow-up: stay in touch for 90 days and then forever. These two habits separate agents who grow from agents who stay stuck.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 3. `ch13.two-habits.rest-of-book`
*The two habits that matter most · multiple choice*

**How does Chapter 13 describe the rest of the book in relation to the two habits?**

- A. It is optional once the habits are in place
- B. It matters more than the habits do
- C. It exists to make the two habits easy ✓
- D. It applies only after your first closing

Explanation shown to the reader: In the chapter's words: "Everything else in the book exists to make them easy."

Chapter source:
> These two habits separate agents who grow from agents who stay stuck. Everything else in the book exists to make them easy.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 4. `ch13.help-network.mentor`
*Name the people you will actually use · multiple choice*

**Where does the chapter tell you to go to ask for a mentor?**

- A. An online forum for agents in other markets
- B. The lender partner you picked from three
- C. Past clients who have already bought from you
- D. Your office, including agents two years ahead ✓

Explanation shown to the reader: Your office: the team leader, any coach your brokerage offers, and the agents who are two years ahead of you. Ask for a mentor.

Chapter source:
> Your office. Team leader, any coach your brokerage offers, and the agents who are two years ahead of you. Ask for a mentor.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 5. `ch13.help-network.lender`
*Name the people you will actually use · multiple choice*

**How does the chapter suggest choosing a lender partner?**

- A. Meet three lenders and pick one ✓
- B. Use the lender your first buyer already has
- C. Split your buyers evenly among several lenders
- D. Wait until a contract is signed, then pick one

Explanation shown to the reader: A good lender teaches you financing and sends you referrals. Meet three and pick one; Chapter 6 has the introduction script.

Chapter source:
> Your lender partners. A good lender teaches you financing and sends you referrals. Meet three and pick one; Chapter 6 has the introduction script.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 6. `ch13.help-network.partner-tag`
*Name the people you will actually use · fill in the blank*

**Put the mentor, class, lender and attorney or title contact you will use in your CRM with a ______ tag and a date for the first conversation.** (accepted: partner)

Explanation shown to the reader: Name the people you will actually use: one mentor, the next brokerage class you will attend, one lender, and one attorney or title contact.

Chapter source:
> Name the people from "Where to get help" you will actually use: one mentor, the next brokerage class you will attend, one lender, and one attorney or title contact. Put them in your CRM with a "Partner" tag and a date for the first conversation; Chapter 6 has the introduction script.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 7. `ch13.broker-before.timing`
*Broker for anything legal, contractual or unusual · multiple choice · scenario*

**Something contractual and unusual comes up in a deal. When does the chapter say to bring in your broker?**

- A. Before you act, not after ✓
- B. Once it is resolved, for the record
- C. Only if the client complains
- D. At your next monthly review

Explanation shown to the reader: Your broker is for anything legal, contractual or unusual. Before, not after.

Chapter source:
> Your broker. For anything legal, contractual or unusual. Before, not after.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 8. `ch13.broker-before.lender-rules`
*Broker for anything legal, contractual or unusual · multiple choice*

**You have picked a lender partner. What does the chapter say to do before you agree to anything with them?**

- A. Ask agents in your office what they accept
- B. Get the lender's offer in writing first
- C. Ask your broker what is and is not allowed ✓
- D. Run it past your accountability partner

Explanation shown to the reader: The chapter: "Ask your broker what is and is not allowed before you agree to anything."

Chapter source:
> Meet three and pick one; Chapter 6 has the introduction script. Ask your broker what is and is not allowed before you agree to anything.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 9. `ch13.broker-before.kinds`
*Broker for anything legal, contractual or unusual · fill in the blank*

**Go to your broker for anything legal, contractual or ______. Before, not after.** (accepted: unusual)

Explanation shown to the reader: Your broker is the help for anything legal, contractual or unusual, and you ask before you act.

Chapter source:
> Your broker. For anything legal, contractual or unusual. Before, not after.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 10. `ch13.ninety-day-review.start-from`
*One-paragraph review of the first 90 days · multiple choice*

**What should your one-paragraph review of the first 90 days start from?**

- A. Your memory of your best and worst weeks
- B. Your count of closings and commission earned
- C. Your scorecards, row by row against target ✓
- D. A survey of the clients you worked with

Explanation shown to the reader: Start from your scorecards (Appendix A): which rows hit target most weeks, and which never did. Then write what moved, what did not and what surprised you.

Chapter source:
> Write a one-paragraph review of your first 90 days: what moved, what did not, what surprised you. Start from your Friday scorecards (Appendix A): which rows hit target most weeks, and which never did.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 11. `ch13.ninety-day-review.where-kept`
*One-paragraph review of the first 90 days · multiple choice*

**Where does the chapter say to keep your 90-day review once it is written?**

- A. In a notebook you take to the office
- B. In an email to yourself
- C. On the back of the one-page card
- D. In the CRM as a note dated day 90 ✓

Explanation shown to the reader: Put it in the CRM as a note dated day 90. If you are still reading, write it for the first 30.

Chapter source:
> Put it in the CRM as a note dated day 90. If you are still reading, write it for the first 30.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 12. `ch13.ninety-day-review.share`
*One-paragraph review of the first 90 days · fill in the blank*

**Choose one person to share the review with, such as your broker, a mentor or an accountability partner, and put a ______ on it.** (accepted: date)

Explanation shown to the reader: One person, named in advance, with a date for sharing the review.

Chapter source:
> Choose one person to share the review with: your broker, a mentor or an accountability partner (Chapter 8). Put a date on it.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 13. `ch13.own-numbers.targets`
*Next 90 days from your own conversion ratios · multiple choice*

**What does Chapter 13 say the next 90 days' targets should be set from?**

- A. Your own conversion ratios ✓
- B. The book's example numbers
- C. Your office's top producer
- D. Whatever your broker assigns

Explanation shown to the reader: Set the next 90 days' targets from your own conversion ratios, not the book's examples.

Chapter source (learning objective):
> **Set** the next 90 days' targets from your own conversion ratios, not the book's examples.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 14. `ch13.own-numbers.which-three`
*Next 90 days from your own conversion ratios · multiple choice*

**Which three of the book's example numbers does the chapter ask you to replace with your own?**

- A. Calls made per day, average sale price, listings taken per year
- B. Open houses held per month, ad spend per month, website visits per week
- C. Conversations per appointment, conversion by source, touches before a reply ✓
- D. Closings per quarter, commission per closed deal, referrals per year

Explanation shown to the reader: Conversations per appointment (Chapter 1), conversion by source (Chapter 2) and touches before a reply (Chapter 5).

Chapter source:
> Replace three of the book's example numbers with your own: conversations per appointment (Chapter 1), conversion by source (Chapter 2), touches before a reply (Chapter 5). Write the new ratio next to the old one.

Note: the keyed option is still the longest (75 characters against 63, 71 and 68) after the distractors were lengthened in review.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 15. `ch13.own-numbers.side-by-side`
*Next 90 days from your own conversion ratios · fill in the blank*

**When you replace one of the book's example numbers with your own, write the new ratio next to the ______ one.** (accepted: old)

Explanation shown to the reader: Replace three of the book's example numbers with your own and write the new ratio next to the old one, so the next 90 days' targets come from your own conversion ratios.

Chapter source:
> Replace three of the book's example numbers with your own [...]. Write the new ratio next to the old one.
> **Set** the next 90 days' targets from your own conversion ratios, not the book's examples.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 16. `ch13.implementation-intention.form`
*One implementation intention for next Monday morning · multiple choice*

**Which of these is written in the implementation-intention form the chapter gives?**

- A. I will make prospecting calls more often this quarter.
- B. On Monday, at 9:30 a.m., I will call my sphere contacts. ✓
- C. My goal is to close more deals than last year.
- D. Sometime soon I should update every contact in my CRM.

Explanation shown to the reader: The form is "On [day], at [time], I will [action]." Only this option names a day, a time and an action.

Chapter source:
> Write one implementation intention: "On [day], at [time], I will [action]." Make it next Monday morning.

Note: "9:30 a.m." is an illustrative filling of the template, chosen to match the start of the prospecting block in Table 8.1; Chapter 13 states no time.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 17. `ch13.implementation-intention.when`
*One implementation intention for next Monday morning · multiple choice*

**For when does the chapter say to make your one implementation intention?**

- A. The first day of next month
- B. Next Monday morning ✓
- C. Day 90 of the next plan
- D. Whenever your schedule frees up

Explanation shown to the reader: Write one implementation intention: "On [day], at [time], I will [action]." Make it next Monday morning.

Chapter source:
> Write one implementation intention: "On [day], at [time], I will [action]." Make it next Monday morning.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

## After your review

Send back the decisions (the numbers are enough). Approved questions get `draft` removed; changed ones are edited and their `version` bumped; dropped ones are deleted. Then run `pnpm test lib/coach` to confirm the bank is still consistent.
