# Chapter 10 question bank: draft questions for review

Prepared 9 November 2026. Seventeen questions on six concepts were written from the Chapter 10 text for the spaced-review bank (`../../content/data/questions.ts` and `../../content/data/concepts.ts`, each question marked `draft: true`). **None of them is shown to readers yet.** Status of every item: draft, awaiting owner review (OD-30).

## What I am asking you to check

You have worked as an agent, so the useful things only you can judge are below. Mark each question **Approve**, **Change** (say what) or **Drop**.

1. **Is the keyed answer the right one**, and are the other options clearly wrong rather than arguable?
2. **Does it match what a working agent would do**, not just what the chapter says?
3. **Is it too easy, too tricky, or testing the wording rather than the idea?**
4. **Does the explanation say anything the chapter does not?**

Every keyed answer is traceable to a sentence in `../../content/pages/ch10.html`; the quoted passages below were checked against that file word for word (table rows are quoted cell by cell, cells separated by " | "; "[...]" marks skipped text). That shows the question matches the **book**. It does not show the book is right. No question tests the number of steps in the post-close table or the referral circle, or names a figure, because a trim lane may merge those enumerations. The "seven dated touches" question tests the signed post-close sentence in `../../content/data/rules.ts`, not the step count.

## How approved questions get used

Chapter 10 has no tagged reviewed questions today, so its end-of-chapter quiz is the plain four-question check in `../../content/data/knowledge-checks.ts` (including "Within a decade or two", fixed in M4 step 3). Adding these drafts does not change that: `chapterCheck()` in `../../lib/coach/check.ts` drops draft questions, so `hasCoachCheck('ch10')` stays false and the plain check still renders.

**Approving even one question switches the chapter's quiz.** Once any Chapter 10 question loses its `draft` flag, the quiz serves only the approved tagged questions and the four plain questions stop showing. Before approving, decide whether the four plain questions should be moved into tagged form first (as Chapters 2, 4, 5 and 12 did) so the quiz keeps them.

| Concept | Anchor | Reviewed now | Draft awaiting you |
| --- | --- | --- | --- |
| `ch10.remembered`: Past clients are the most valuable asset: being remembered is a schedule, not an accident | `#the-post-close-plan` | 0 | 2 |
| `ch10.post-close-plan`: Every closed client goes on the post-close plan: seven dated touches in the first year | `#the-post-close-plan` | 0 | 3 |
| `ch10.touch-purposes`: Each post-close touch has a job | `#the-post-close-plan` | 0 | 3 |
| `ch10.value-test`: The value test: would they be glad to get it if they were never going to move again? | `#adding-value-without-selling` | 0 | 3 |
| `ch10.reactivation`: Reactivate a quiet database without apologizing: one useful message, then small batches | `#reactivating-a-quiet-database` | 0 | 3 |
| `ch10.referrals`: Ask for referrals at three moments, thank every one within a day, and track the source | `#asking-for-referrals` | 0 | 3 |

## Things I would look at first

- **`ch10.remembered.cheapest`**: its source sentence is in the chapter introduction, just above the `#the-post-close-plan` heading the review link opens.
- **`ch10.value-test.which-passes`**: options C and D (a listing flyer, a reminder that you are still an agent) are not named in the chapter; they fail the chapter's test because they only market. Confirm they are clearly wrong.
- **`ch10.reactivation.pace`**: "Only the people who replied in the last month" is a distractor the chapter does not mention directly; it is wrong because the chapter sends the first message to everyone and calls in batches from there.
- **`ch10.referrals.referred-by`**: a two-word blank with one accepted answer.
- **Option lengths**: distractors were lengthened and keys shortened so the keyed answer is not reliably the longest option. Keep that balance if you edit wording.

## The questions

### 1. `ch10.remembered.move-again`
*Past clients are the most valuable asset · multiple choice*

**Why does the chapter say staying in touch after closing pays off?**

- A. Brokerages rank agents by the number of cards they send
- B. Most homeowners move again within a decade or two ✓
- C. Most past clients will move again within their first year
- D. A closing gift alone is enough to earn every future referral

Explanation shown to the reader: Most homeowners move again within a decade or two, and know several people who will move before then. The agent they remember gets those transactions.

Chapter source:
> Most homeowners move again within a decade or two, and know several people who will move before then. The agent they remember gets those transactions. Being remembered is a schedule, not an accident.

Consistent with the plain Chapter 10 quiz ("Within a decade or two").

Status: draft, awaiting owner review.        Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 2. `ch10.remembered.cheapest`
*Past clients are the most valuable asset · fill in the blank*

**A database of past clients and sphere contacts who hear from you regularly is the most valuable asset you will build, and the ______ one to maintain.**

Keyed answer: **cheapest**. Also accepted: none.

Explanation shown to the reader: Being remembered is a schedule, not an accident. The chapter makes "still being there" a schedule instead of a hope.

Chapter source:
> A database of past clients and sphere contacts who hear from you regularly is the most valuable asset you will build, and the cheapest one to maintain. This chapter makes "still being there" a schedule instead of a hope.

Status: draft, awaiting owner review.        Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 3. `ch10.post-close-plan.assign-activate`
*Every closed client goes on the post-close plan · multiple choice*

**When is the post-close plan assigned to a client, and when does it start running?**

- A. Assigned at the listing appointment, started at the first offer
- B. Assigned and started together at the 30-day call
- C. Assigned under contract, activated on closing day ✓
- D. Assigned on closing day, started at the home anniversary

Explanation shown to the reader: The post-close plan is built once, assigned on the day the contract goes under contract, and activated on closing day; it runs seven dated touches in the first year, starting with the closing-day note.

Chapter source:
> The post-close plan is built once, assigned on the day the contract goes under contract, and activated on closing day; it runs seven dated touches in the first year, starting with the closing-day note.

Status: draft, awaiting owner review.        Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 4. `ch10.post-close-plan.seven-touches`
*Every closed client goes on the post-close plan · fill in the blank*

**In the first year, the post-close plan runs ______ dated touches, starting with the closing-day note.**

Keyed answer: **seven**. Also accepted: 7.

Explanation shown to the reader: Build the plan once as a follow-up plan and apply it at every closing. The annual appreciation event or gift is yours to schedule once a year, not a separate dated touch per client.

Chapter source:
> it runs seven dated touches in the first year, starting with the closing-day note.
> Build it once as a follow-up plan and apply it at every closing. [...] The annual appreciation event or gift is yours to schedule once a year, not a separate dated touch per client.

Status: draft, awaiting owner review.        Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 5. `ch10.post-close-plan.after-year`
*Every closed client goes on the post-close plan · multiple choice · scenario*

**A client has finished their first year on the post-close plan. What happens next?**

- A. They come off your list until they call you
- B. They start the post-close plan again from closing day
- C. They move onto the 90-day new-lead plan
- D. They stay on the Quarterly Call Plan ✓

Explanation shown to the reader: After the first year, the client stays on the Quarterly Call Plan, where quarterly calls keep you useful and let you hear about life changes early.

Chapter source:
> After the first year, the client stays on the Quarterly Call Plan (Appendix B.3).
> Quarterly | Call with a reason: market update, tax season, seasonal maintenance. | Stay useful. Hear about life changes early.

Status: draft, awaiting owner review.        Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 6. `ch10.touch-purposes.one-week`
*Each post-close touch has a job · multiple choice*

**What is the one-week call after closing for?**

- A. Catch problems early and offer vendor introductions ✓
- B. Ask for a review on your Agent Site and a referral
- C. Deliver an updated value for the home
- D. Invite them to your client appreciation event

Explanation shown to the reader: The one-week call ("How's the move going? Anything you need?") is there to catch problems early and offer vendor introductions.

Chapter source:
> 1 week | Call: "How's the move going? Anything you need?" | Catch problems early. Offer vendor introductions.

Status: draft, awaiting owner review.        Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 7. `ch10.touch-purposes.review-ask`
*Each post-close touch has a job · multiple choice*

**At which touch does the post-close plan ask the client for a review on your Agent Site?**

- A. On closing day, with the note
- B. At the one-week check-in call
- C. At the 30-day call or visit ✓
- D. At the home anniversary card or call

Explanation shown to the reader: At 30 days you call or visit and ask for a review on your Agent Site. Reviews drive online leads, and it is the second referral ask.

Chapter source:
> 30 days | Call or visit. Ask for a review on your Agent Site. | Reviews drive online leads. Second referral ask.

Status: draft, awaiting owner review.        Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 8. `ch10.touch-purposes.anniversary-estimate`
*Each post-close touch has a job · multiple choice · scenario*

**For a client's home anniversary you pull an updated value from an automated estimate. What should you tell them about it?**

- A. That it is as reliable as a full market analysis of the home
- B. Nothing; the number speaks for itself
- C. That they should list now while values are up
- D. That an automated estimate is not a market analysis ✓

Explanation shown to the reader: Send a card or call with an updated home value. An automated estimate is not a market analysis; say so. The anniversary is the most natural seller conversation you will ever have.

Chapter source:
> Home anniversary | Card or call with an updated home value. An automated estimate is not a market analysis; say so. | The most natural seller conversation you will ever have.

Status: draft, awaiting owner review.        Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 9. `ch10.value-test.which-passes`
*The value test · multiple choice*

**Which of these touches passes the chapter's test for adding value?**

- A. A "Thinking of selling?" note every month
- B. A reminder to change the furnace filters ✓
- C. A flyer for your newest listing
- D. A note reminding them that you are still an agent

Explanation shown to the reader: Would they be glad to receive it if they were never going to move again? Local insights, a furnace-filter reminder, trusted contractors, a property tax deadline or a neighborhood event pass. "Thinking of selling?" every month does not.

Chapter source:
> The test for every touch: would the person be glad to receive it if they were never going to move again? Local insights, a reminder to change furnace filters, a list of trusted contractors, a note on a property tax deadline, an invitation to a neighborhood event. These pass the test. "Thinking of selling?" every month does not.

Status: draft, awaiting owner review.        Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 10. `ch10.value-test.never-move`
*The value test · fill in the blank*

**Before you send a touch, ask: would the person be glad to receive it if they were never going to ______ again?**

Keyed answer: **move**. Also accepted: none.

Explanation shown to the reader: This is the test for every touch. A card for a new baby, a promotion or a graduation beats a market update.

Chapter source:
> The test for every touch: would the person be glad to receive it if they were never going to move again?
> Life events. A new baby, a promotion, a graduation. A card beats a market update.

Note: the plain Chapter 10 quiz already asks this test as multiple choice; this blank is the review-deck variant.

Status: draft, awaiting owner review.        Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 11. `ch10.value-test.vendor-intro`
*The value test · multiple choice · scenario*

**A past client asks you to recommend a plumber. How does the chapter say to make the introduction?**

- A. Accept a small thank-you fee from the plumber
- B. Insist they use your plumber so you can vouch for the work
- C. Take nothing for it, and say they may choose anyone ✓
- D. Decline, since vendor introductions are not an agent's job

Explanation shown to the reader: Introducing a vendor you trust is a gift that costs you nothing, as long as you accept nothing of value for it and tell the client they are free to choose anyone (Chapter 11).

Chapter source:
> Vendor list. Keep a short list of a plumber, electrician, handyman, painter and cleaner you trust. Introducing them is a gift that costs you nothing, as long as you accept nothing of value for it and tell the client they are free to choose anyone (Chapter 11).

Status: draft, awaiting owner review.        Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 12. `ch10.reactivation.first-step`
*Reactivate a quiet database · multiple choice*

**You have let your database go cold. What does the chapter say to do first?**

- A. Send one useful piece of market information to everyone ✓
- B. Send everyone an apology for being out of touch so long
- C. Call every contact in one long day
- D. Buy a fresh batch of online leads instead

Explanation shown to the reader: Do not apologize for the silence. Send one useful piece of market information to everyone, then start calling in small batches.

Chapter source:
> If you have let your database go cold, do not apologize for it. Send one useful piece of market information to everyone, then start calling in small batches with a simple "thinking of you" and one question about how things are.

Status: draft, awaiting owner review.        Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 13. `ch10.reactivation.pace`
*Reactivate a quiet database · multiple choice · scenario*

**Your useful market message has gone out to the whole database. How should you work through the calls?**

- A. Everyone in one weekend, working down the list alphabetically
- B. Only the people who replied to you within the last month
- C. The oldest contacts first, as many as you can reach in a day
- D. 10 a day, starting with those who liked your last message ✓

Explanation shown to the reader: Call in small batches with a simple "thinking of you" and one question about how things are. A workable pace is a batch of 10 a day, starting with the people who liked your last message.

Chapter source:
> then start calling in small batches with a simple "thinking of you" and one question about how things are. [...] A workable pace is a batch of 10 a day, starting with the people who liked your last message.

Status: draft, awaiting owner review.        Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 14. `ch10.reactivation.back-on-plan`
*Reactivate a quiet database · fill in the blank*

**Put everyone you reach back on the ______ plan so the database does not go cold again.**

Keyed answer: **quarterly**. Also accepted: quarterly call.

Explanation shown to the reader: Most people will be glad to hear from you. Putting everyone you reach back on the quarterly plan stops the database going cold again.

Chapter source:
> Most people will be glad to hear from you. Put everyone you reach back on the quarterly plan so it does not go cold again.

Status: draft, awaiting owner review.        Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 15. `ch10.referrals.three-moments`
*Ask for referrals at three moments · multiple choice*

**When does the chapter say to ask a client for a referral?**

- A. Only once a year, at the home anniversary card or call
- B. At closing, at the 30-day call, and when thanked unprompted ✓
- C. In every monthly email, so nobody forgets who you are
- D. At the first appointment, at the offer, and again at closing

Explanation shown to the reader: Ask at those three moments, plainly, using the script from Chapter 6, and then stop.

Chapter source:
> Ask at three moments: at closing, at the 30-day call, and any time a client thanks you unprompted. Ask plainly, using the script from Chapter 6, and then stop.

Status: draft, awaiting owner review.        Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 16. `ch10.referrals.thank`
*Ask for referrals at three moments · multiple choice · scenario*

**A past client sends you a friend, and the friend decides not to buy. What do you owe the past client?**

- A. A thank-you within a day, by phone or a handwritten note ✓
- B. A thank-you, but only if the friend goes on to buy later
- C. A thank-you, saved for the card at their home anniversary
- D. Nothing; a referral that does not close needs no thanks

Explanation shown to the reader: Thank every referral within a day, by phone or a handwritten note, whether or not it becomes a transaction.

Chapter source:
> Thank every referral within a day, by phone or a handwritten note, whether or not it becomes a transaction.

Status: draft, awaiting owner review.        Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 17. `ch10.referrals.referred-by`
*Ask for referrals at three moments · fill in the blank*

**Track each referral in your CRM with a ______ field, so you can see how many of your leads come from past clients.**

Keyed answer: **Referred by**. Also accepted: referred by (case is ignored).

Explanation shown to the reader: Also track referrals received per month. When that number grows, your business becomes less dependent on paid leads every year.

Chapter source:
> Track each one in your CRM with a "Referred by" field, so you can see how many of your leads come from past clients.
> Track one more number: referrals received per month. When this number grows, your business becomes less dependent on paid leads every year.

Status: draft, awaiting owner review.        Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:
