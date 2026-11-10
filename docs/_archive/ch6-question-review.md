# Chapter 6 question bank: draft questions for review

Prepared 9 November 2026. Seventeen questions were written from the Chapter 6 text for the coach (`../../content/data/questions.ts`, each marked `draft: true`), tagged to six new concepts in `../../content/data/concepts.ts`. **None of them is shown to readers yet.** Chapter 6 had no tagged questions before, so its end-of-chapter check stays the plain one until you approve some.

Status of every question below: **draft, awaiting owner review**.

## What I am asking you to check

You have worked as an agent, so the useful things only you can judge are below. Mark each question **Approve**, **Change** (say what) or **Drop**.

1. **Is the keyed answer the right one**, and are the other options clearly wrong rather than arguable?
2. **Does it match what a working agent would do**, not just what the chapter says?
3. **Is it too easy, too tricky, or testing the wording rather than the idea?**
4. **Does the explanation say anything the chapter does not?**

Every keyed answer is traceable to a sentence in `../../content/pages/ch6.html`; the quoted passages below were copied from that file. That shows the question matches the **book**. It does not show the book is right. No question is about the "I'm just looking" objection script, which may become a pointer to Table 9.2.

## How approved questions get used

Approved questions lose their `draft` flag. They then join both the review deck and Chapter 6's end-of-chapter check (`chapterCheck()` in `../../lib/coach/check.ts` serves every non-draft question for the chapter, multiple choice first). Approving all 17 would make a 17-question chapter check; decide on a cap before approving in bulk. A concept enters the review loop only once at least one of its questions is approved.

| Concept | Review link | Reviewed now | Draft awaiting you |
| --- | --- | --- | --- |
| A script succeeds when it reaches its next step, not when you say it word for word | `#how-to-use-a-script` | 0 | 2 |
| Rehearse out loud and on recording: reading is not rehearsal | `#how-to-use-a-script` | 0 | 3 |
| Three rules for every script: be specific, ask one question, stop talking | `#three-rules-to-read-every-script-by` | 0 | 3 |
| Open a new lead by phone, voicemail or text by naming what they asked about | `#three-rules-to-read-every-script-by` | 0 | 3 |
| Give before you ask: the sphere announcement, the referral ask and partner introductions | `#three-rules-to-read-every-script-by` | 0 | 3 |
| Keep the relationship going after closing: the one-week call, the 30-day ask and the quarterly call | `#three-rules-to-read-every-script-by` | 0 | 3 |

The chapter has only two content headings, and every script box sits under the second, so four concepts share one review link. Per-script headings with ids would give each concept its own link.

## Things I would look at first

- **`ch6.new-lead-openers.automated-text`** restates the consent rule; it says "personal, non-automated text unless their consent to texts is recorded in your CRM", which matches the signed sentence in `content/data/rules.ts`.
- **`ch6.rehearsal.no-paper`**, **`ch6.three-rules.silence`** and **`ch6.after-the-sale.quarterly`** are blanks built on a line of the chapter; they reward remembering the wording. Consider dropping any you find too verbatim.
- **`ch6.next-step.keep-in-mind`** asks the reader to count "I'll keep you in mind" as success. That is what the chapter says; confirm it is the habit you want.

## The questions

### 1. `ch6.next-step.worked`
*A script succeeds when it reaches its next step · multiple choice*

**How do you know a script worked?**

- A. You said every word exactly as it is written
- B. The conversation reached the script's next step ✓
- C. You got through the whole script without a pause
- D. The other person stayed on the line to the end

Explanation shown to the reader: Each script has a purpose and a next step. If you reach the next step, the script worked, even if you said none of the exact words.

Chapter source:
> Each script below has a purpose and a next step. If you reach the next step, the script worked, even if you said none of the exact words.
> A script succeeds when it reaches its next step, not when you say it word for word.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 2. `ch6.next-step.keep-in-mind`
*A script succeeds when it reaches its next step · multiple choice · scenario*

**You use the sphere referral ask on a friend, who answers "I'll keep you in mind" but gives no name. How did the script do?**

- A. It failed, because the purpose was a name
- B. It failed, so ask again until you get a name
- C. It worked only if you also booked a coffee
- D. It worked: that reply is one of its next steps ✓

Explanation shown to the reader: The referral ask's next step is a name and permission to reach out, or "I'll keep you in mind." Either is a win. Thank them and keep in touch.

Chapter source:
> Next step: a name and permission to reach out, or "I'll keep you in mind." Either is a win. Thank them and keep in touch.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 3. `ch6.rehearsal.record`
*Rehearse out loud and on recording · multiple choice*

**Why does the chapter have you record yourself saying a script and listen back?**

- A. To send your broker proof that you practiced
- B. To save one voicemail you can reuse for every lead
- C. You will hear every place where you rush or apologize ✓
- D. To learn the script word for word before using it

Explanation shown to the reader: Record yourself on your phone and listen back; you will hear every place where you rush or apologize.

Chapter source:
> Record yourself on your phone and listen back; you will hear every place where you rush or apologize.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 4. `ch6.rehearsal.read-five-times`
*Rehearse out loud and on recording · multiple choice · scenario*

**You have read the new-lead script five times and feel ready to call. What does the chapter say is still missing?**

- A. Nothing: five careful reads are enough to know it
- B. Memorizing it until you can recite each word exactly
- C. A printed copy to read from while you are on the call
- D. Saying it aloud in your own words and recording it ✓

Explanation shown to the reader: Practice out loud and on recording. Reading is not rehearsal. The loop is read, rewrite, say aloud, record, listen, repeat.

Chapter source:
> Practice out loud and on recording. Reading is not rehearsal.
> Practice loop: read, rewrite, say aloud, record, listen, repeat.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 5. `ch6.rehearsal.no-paper`
*Rehearse out loud and on recording · fill in the blank*

**Read a script, rewrite it in your own words, then say it out loud until you do not need the ______ .**

Keyed answer: **paper**. Also accepted: the paper, page, the page.

Explanation shown to the reader: The aim is to say it in your own words, not to read it: the checkpoint asks whether you can deliver the seller consultation opening without looking at the page.

Chapter source:
> Read it, rewrite it in your own words, then say it out loud until you do not need the paper.
> Can you deliver the seller consultation opening without looking at the page?

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 6. `ch6.three-rules.which`
*Three rules for every script · multiple choice*

**Which three rules does the chapter say to read every script by?**

- A. Be specific, ask one question, stop talking ✓
- B. Be brief, be friendly, be persistent
- C. Open warmly, state your value, close firmly
- D. Ask permission, give value, ask for business

Explanation shown to the reader: Every script follows them: name, specific detail, one question, then silence.

Chapter source:
> Apply three rules (be specific, ask one question, stop talking) to any message you write.
> Every script below follows them: name, specific detail, one question, then silence.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 7. `ch6.three-rules.one-question`
*Three rules for every script · multiple choice*

**Why should every message you write end on one question?**

- A. Several questions in a row make you look unprepared
- B. A message with no question rarely gets a reply ✓
- C. A question lets you skip their name and the detail
- D. A question keeps the call short enough to be polite

Explanation shown to the reader: Ask one question at the end. A message with no question rarely gets a reply.

Chapter source:
> Ask one question at the end. A message with no question rarely gets a reply.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 8. `ch6.three-rules.silence`
*Three rules for every script · fill in the blank*

**After you ask your one question, stop talking and wait. ______ is where the other person decides to engage.**

Keyed answer: **Silence**. Also accepted: silence (case is ignored).

Explanation shown to the reader: The third rule is to stop talking: after the question, wait.

Chapter source:
> Stop talking. After the question, wait. Silence is where the other person decides to engage.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 9. `ch6.new-lead-openers.late-call`
*Open a new lead by naming what they asked about · multiple choice · scenario*

**You are calling a new lead two days after the inquiry came in. What does the chapter say to change in the phone script?**

- A. Drop the address and ask about their budget instead
- B. Switch to an automated text, since the call is late
- C. Say "following up on your inquiry" instead of "I just saw" ✓
- D. Apologize for the delay before you give your name

Explanation shown to the reader: If you are calling later than the same day, say "following up on your inquiry" instead of "I just saw".

Chapter source:
> If you are calling later than the same day, say "following up on your inquiry" instead of "I just saw".

Note: The scenario is a late call; it does not teach that late calls are acceptable. The speed-to-lead standard (Chapter 4) still applies.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 10. `ch6.new-lead-openers.automated-text`
*Open a new lead by naming what they asked about · multiple choice*

**When may the new-lead text go out as an automated message rather than a personal one?**

- A. Whenever the inquiry came in through a property portal
- B. Only when their consent to texts is recorded in your CRM ✓
- C. Any time in the first hour, while the lead is still fresh
- D. Only after they have replied to your first personal email

Explanation shown to the reader: Send it as a personal, non-automated text unless their consent to texts is recorded in your CRM (the consent rule in Chapter 11).

Chapter source:
> Send this as a personal, non-automated text unless their consent to texts is recorded in your CRM (the consent rule in Chapter 11).

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 11. `ch6.new-lead-openers.name-the-property`
*Open a new lead by naming what they asked about · multiple choice*

**The new-lead call, voicemail and text all name the address or area the lead asked about. Why?**

- A. It proves you read their inquiry ✓
- B. It shows how many listings you have
- C. It replaces the need to ask a question
- D. It is what makes a text legal to send

Explanation shown to the reader: Say their name and the specific thing they asked about. Specificity proves you read the inquiry.

Chapter source:
> Say their name and the specific thing they asked about. Specificity proves you read the inquiry.
> "Hi [Name], this is [Your Name] with [Your Brokerage]. I just saw your inquiry about [address or area]. ..."

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 12. `ch6.give-before-asking.announcement`
*Give before you ask · multiple choice*

**What is the purpose of the sphere announcement?**

- A. Ask each person for the name of someone buying now
- B. Book a listing appointment with anyone thinking of selling
- C. Collect an email address for your monthly newsletter
- D. Tell people warmly, without asking for business ✓

Explanation shown to the reader: Purpose: tell people, warmly, without asking for business. Next step: a real conversation, logged as a conversation, not a pitch.

Chapter source:
> Purpose: tell people, warmly, without asking for business. Next step: a real conversation. Log it as a conversation, not a pitch.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 13. `ch6.give-before-asking.when-to-ask`
*Give before you ask · multiple choice · scenario*

**Someone on your sphere list has just heard your announcement. When does the chapter say to use the referral ask with them?**

- A. In the same conversation, while you have their attention
- B. After you have given them two or three helpful touches ✓
- C. Only once they have bought or sold a home with you
- D. Before you send them anything, so they know your goal

Explanation shown to the reader: Use the sphere referral ask after you have given two or three helpful touches (Chapter 2).

Chapter source:
> Purpose: an introduction. Use it after you have given two or three helpful touches (Chapter 2).

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 14. `ch6.give-before-asking.referral-fees`
*Give before you ask · fill in the blank*

**Before any money or favors change hands with a lender or attorney you refer clients to, ask your ______ about referral-fee rules.**

Keyed answer: **broker**. Also accepted: your broker.

Explanation shown to the reader: The referral partner introduction opens a two-way relationship by giving first; the money side is a question for your broker.

Chapter source:
> Purpose: open a two-way relationship by giving first. ... Ask your broker about referral-fee rules before any money or favors change hands.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 15. `ch6.after-the-sale.one-week`
*Keep the relationship going after closing · multiple choice*

**What do you ask your client for on the one-week call after closing?**

- A. A review on your Agent Site, while the move is fresh
- B. The name of a friend who might be thinking of moving
- C. Nothing: the call is to catch problems while you can help ✓
- D. Permission to add them to your monthly newsletter

Explanation shown to the reader: Purpose: catch problems while you can still help. Ask for nothing on this call.

Chapter source:
> Table 10.1, week one. Purpose: catch problems while you can still help. ... Ask for nothing on this call.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 16. `ch6.after-the-sale.thirty-day`
*Keep the relationship going after closing · multiple choice · scenario*

**You are making the 30-day call to a happy client. Which two asks does the chapter put in that one call?**

- A. A review, then the second referral ask ✓
- B. A review, then a request to list their old home
- C. A referral, then a request to join your newsletter
- D. Nothing yet: asks wait until the first anniversary

Explanation shown to the reader: The 30-day script asks for a review from clients you served, and the second referral ask follows in the same call. The first referral ask was at the closing table.

Chapter source:
> Table 10.1, day 30. Purpose: turn a happy client into public proof ... Ask only clients you served, and never write or trade reviews. The second referral ask (the box above) follows in the same call.
> Ask at the closing table and again at the 30-day check-in.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 17. `ch6.after-the-sale.quarterly`
*Keep the relationship going after closing · fill in the blank*

**The quarterly call to your whole database has one reason, one fact and one ______ .**

Keyed answer: **question**.

Explanation shown to the reader: Stay useful to the whole database four times a year, with a reason each time. Next step: a life change you log in your CRM, or next quarter's call stays scheduled.

Chapter source:
> Purpose: stay useful to the whole database four times a year, with a reason each time. Next step: a life change you log in your CRM, or nothing new and next quarter's call stays scheduled. One reason, one fact, one question.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

## After your review

Send back the decisions (the numbers are enough). Approved questions get `draft` removed; changed ones are edited and their `version` bumped; dropped ones are deleted. Then run `pnpm test lib/coach` to confirm the bank is still consistent.
