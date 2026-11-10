# Chapter 9 question bank: draft questions for review

Prepared 9 November 2026. Six concepts and eighteen questions were written from the Chapter 9 text for the coach (`../../content/data/concepts.ts` and `../../content/data/questions.ts`, between the `// ch9` and `// end ch9` comments). Every question is marked `draft: true`. **None of them is shown to readers yet.** Status of every item: draft, awaiting owner review.

## What I am asking you to check

You have worked as an agent, so the useful things only you can judge are below. Mark each question **Approve**, **Change** (say what) or **Drop**.

1. **Is the keyed answer the right one**, and are the other options clearly wrong rather than arguable?
2. **Does it match what a working agent would do**, not just what the chapter says?
3. **Is it too easy, too tricky, or testing the wording rather than the idea?**
4. **Does the explanation say anything the chapter does not?**

Every keyed answer is traceable to a sentence in `../../content/pages/ch9.html`; the quoted passages below were copied from that file. That shows the question matches the **book**. It does not show the book is right.

## How approved questions get used

Chapter 9 had no tagged questions before this bank, so it keeps its plain end-of-chapter check until you approve something. `chapterCheck()` in `../../lib/coach/check.ts` serves every non-draft question for a chapter, so **the first approval turns Chapter 9's check into a coach check made of whatever is approved**. Approve at least three multiple-choice questions and one fill-in-the-blank together, or the check will be short and lopsided. A concept enters the review deck only once it has at least one approved question.

| Concept | Anchor | Reviewed now | Draft awaiting you |
| --- | --- | --- | --- |
| Every consultation has five steps: frame, ask, listen, present, agree | `#the-consultation-sequence` | 0 | 3 |
| Asking and listening take at least half the meeting and come before presenting | `#the-consultation-sequence` | 0 | 3 |
| Answer an objection in four steps: acknowledge, clarify, respond, check | `#objections-are-questions-in-disguise` | 0 | 3 |
| Each common objection has a response framework and a goal | `#objection-quick-reference` | 0 | 3 |
| A two-minute CRM note after every client conversation | `#document-everything` | 0 | 3 |
| From yes to closing and after: one contact, weekly updates, a call before every deadline | `#between-yes-and-closing` | 0 | 3 |

## Things I would look at first

- **`ch9.objection-responses.buyer-agreement`**: the newest row in Table 9.2. The chapter defers the rule to Chapter 11 and the form and timing to your broker; check the question does not imply more than "sign before the first showing".
- **`ch9.objection-responses.fee`**: the keyed option compresses "focus on value and net proceeds ... confirm the structure with my broker". Check the compression is fair.
- **`ch9.keep-informed.closing-table`**: tests content under "After the transaction", while the concept's review link points at `#between-yes-and-closing`, the heading just above it.
- Option lengths were evened out deliberately (the ch4 review found the keyed answer was usually the longest), and again after the cross-chapter review. The keyed option is still the longest in three questions: by one character in `ch9.objection-responses.buyer-agreement` and `ch9.conversation-note.contents`, and in the one-word `ch9.consultation-steps.seller-present` ("Present"). In `ch9.conversation-note.why` and `ch9.keep-informed.closing-table` a distractor is now the longest option.

## The questions

### 1. `ch9.consultation-steps.order`
*Every consultation has five steps · multiple choice*

**In what order do the five steps of a buyer or seller consultation run?**

- A. Frame, present, ask, listen, agree
- B. Frame, ask, listen, present, agree ✓
- C. Ask, listen, frame, agree, present
- D. Present, frame, ask, agree, listen

Explanation shown to the reader: Both buyer and seller consultations follow the same shape: set the frame, ask, listen, present, agree on next steps.

Chapter source:
> Both buyer and seller consultations follow the same shape. Set the frame, ask, listen, present, agree on next steps.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 2. `ch9.consultation-steps.seller-present`
*Every consultation has five steps · multiple choice · scenario*

**In a seller consultation, you walk through comparable sales, your pricing recommendation and the reasoning, and your marketing plan. Which step is that?**

- A. Frame
- B. Ask
- C. Agree
- D. Present ✓

Explanation shown to the reader: In a seller consultation, Present covers comparable sales, your pricing recommendation and the reasoning, your marketing plan and what happens week by week.

Chapter source (Table 9.1, row 4, seller column):
> 4. Present ... Comparable sales, your pricing recommendation and the reasoning, your marketing plan (Chapter 3), what happens week by week.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 3. `ch9.consultation-steps.buyer-agree`
*Every consultation has five steps · fill in the blank*

**A buyer consultation ends at the Agree step with a buyer representation agreement, a lender introduction and a first ______ date.**

Keyed answer: **showing**. Also accepted: none.

Explanation shown to the reader: Agree for a buyer: buyer representation agreement, lender introduction, first showing date. For a seller: listing agreement, price, photography date, go-live date.

Chapter source (Table 9.1, row 5):
> 5. Agree Buyer representation agreement, lender introduction, first showing date. Listing agreement, price, photography date, go-live date.

Note: one accepted word. "Tour" would be marked wrong; add it to `accept` if you want it.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 4. `ch9.ask-before-presenting.half`
*Asking and listening come before presenting · multiple choice*

**How much of a consultation should the Ask and Listen steps take?**

- A. A few minutes before you present
- B. Whatever time is left after presenting
- C. At least half the meeting ✓
- D. Only the last few minutes

Explanation shown to the reader: Steps 2 and 3, Ask and Listen, should take at least half the meeting.

Chapter source:
> Table 9.1. The five-step consultation. Steps 2 and 3 should take at least half the meeting.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 5. `ch9.ask-before-presenting.skip`
*Asking and listening come before presenting · multiple choice*

**What does the chapter say happens to agents who skip the asking and go straight to presenting?**

- A. They lose the client's trust before earning it ✓
- B. They win the client by showing expertise early
- C. They save time for a longer agreement step
- D. Nothing, if the presentation is thorough enough

Explanation shown to the reader: Agents who skip the asking and go straight to presenting lose the client's trust before they have earned it. A consultation is a conversation, not a pitch.

Chapter source:
> Agents who skip the asking and go straight to presenting lose the client's trust before they have earned it.
> A good consultation is a conversation, not a pitch.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 6. `ch9.ask-before-presenting.repeat-back`
*Asking and listening come before presenting · multiple choice · scenario*

**A buyer says the school district is the priority and a yard matters more than square footage. What does the Listen step ask you to do next?**

- A. Book showings that fit those needs
- B. Repeat back what you heard ✓
- C. Explain how offers work in this market
- D. Ask them to sign the agreement

Explanation shown to the reader: Listen means repeating back what you heard: "So the priority is the school district, and a yard matters more than square footage."

Chapter source (Table 9.1, row 3, buyer column):
> 3. Listen Repeat back what you heard. "So the priority is the school district, and a yard matters more than square footage."

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 7. `ch9.objection-pattern.steps`
*Answer an objection in four steps · multiple choice*

**What are the four steps for answering an objection, in order?**

- A. Clarify, defend, respond, close
- B. Acknowledge, respond, agree, stop
- C. Acknowledge, clarify, respond, check ✓
- D. Respond, clarify, acknowledge, check

Explanation shown to the reader: Acknowledge ("That makes sense"), clarify ("Can I ask what's behind that?"), respond to the real concern, and check ("Does that address it?").

Chapter source:
> Acknowledge. "That makes sense." You are not agreeing; you are showing you heard.
> Clarify. "Can I ask what's behind that?" Find the real concern.
> Respond. Answer the real concern with facts, a story, or a demonstration.
> Check. "Does that address it?" Then stop talking.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 8. `ch9.objection-pattern.which-step`
*Answer an objection in four steps · multiple choice · scenario*

**A client says your fee is too high. You reply, "Can I ask what you're comparing it to?" Which step is that line?**

- A. Acknowledge
- B. Clarify ✓
- C. Respond
- D. Check

Explanation shown to the reader: Clarify finds the real concern: another agent's quote, a net figure, or a general worry. You respond only once you know which it is.

Chapter source:
> Clarify. "Can I ask what you're comparing it to?" (Find the real concern: another agent's quote, a net figure, or a general worry.)
> Respond. Walk through what they would net and what the work involves. (Answer the real concern, not the one you assumed.)

Note: this is the learning objective "identify which step each line of a sample answer performs".

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 9. `ch9.objection-pattern.stop`
*Answer an objection in four steps · fill in the blank*

**The last step is to check: "Does that address it?" Then stop ______ .**

Keyed answer: **talking**. Also accepted: none.

Explanation shown to the reader: Most objections are requests for more information or reassurance. Once you have answered the real concern and checked, let the client respond.

Chapter source:
> Check. "Does that address it?" Then stop talking.
> Most objections are requests for more information or reassurance.

Note: the explanation's "let the client respond" is a restatement of "stop talking", not a chapter sentence. One accepted word.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 10. `ch9.objection-responses.buyer-agreement`
*Each common objection has a response framework and a goal · multiple choice · scenario*

**A buyer asks, "Why do I have to sign an agreement before you show me homes?" What is the goal of your response?**

- A. Show a few homes first, then raise the agreement
- B. Call it a formality and move on to scheduling
- C. Offer to skip the agreement for the first showings
- D. Make it a clear expectation and sign before touring ✓

Explanation shown to the reader: Explain the rule and what they get: the agreement spells out what you will do and how you are paid. Turn a requirement into a clear expectation, and sign before the first showing. Chapter 11 has the rule; your broker has the form and the timing.

Chapter source (Table 9.2):
> "Why do I have to sign an agreement before you show me homes?" Explain the rule and what they get. "Fair question. Before we tour, I work under a written agreement. It spells out exactly what I'll do for you and how I'm paid, so there are no surprises later. Can I walk you through it now, before we pick a day to see homes?" Chapter 11 has the rule; your broker has the form and the timing. Turn a requirement into a clear expectation, and sign before the first showing.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 11. `ch9.objection-responses.fee`
*Each common objection has a response framework and a goal · multiple choice*

**What does the response framework for "Your fee is too high" focus on?**

- A. Value and net proceeds, confirmed with your broker ✓
- B. Matching the lowest quote the client has heard
- C. The rate printed on your old listing form
- D. Defending your rate as the standard in your market

Explanation shown to the reader: Compensation is something you agree in writing before you start. Show how you work and what they would net, and confirm the structure with your broker: shift from fee to outcome, and do not quote an old listing form.

Chapter source (Table 9.2):
> "Your fee is too high." Focus on value and net proceeds. "I understand. Compensation is something we agree in writing before we start. Let me show you how I work and what you'd net, and I'll confirm the structure with my broker." Chapter 11 has the short version of that rule. Shift from fee to outcome, and do not quote an old listing form.

Note: option D was changed after the cross-chapter review. The earlier distractor ("Moving the talk away from money to your marketing") was arguably right given "Shift from fee to outcome"; "Defending your rate as the standard in your market" is the opposite of focusing on value and net proceeds.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 12. `ch9.objection-responses.think-about-it`
*Each common objection has a response framework and a goal · multiple choice*

**A client says, "I need to think about it." What is the goal of the response?**

- A. Set a deadline for their decision
- B. Agree and wait for them to call
- C. Uncover the real objection ✓
- D. Offer a lower fee to close now

Explanation shown to the reader: Clarify the real concern: "Of course. What specifically would you like to think through? I'm happy to answer any questions that would help."

Chapter source (Table 9.2):
> "I need to think about it." Clarify the real concern. "Of course. What specifically would you like to think through? I'm happy to answer any questions that would help." Uncover the real objection.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 13. `ch9.conversation-note.contents`
*A two-minute CRM note after every client conversation · multiple choice*

**What goes in the CRM note you write after a client conversation?**

- A. A word-for-word record of everything that was said
- B. Only the numbers: budget, price and fee discussed
- C. The client's name and your opinion of the meeting
- D. Date, who, what was discussed, decided, what's next ✓

Explanation shown to the reader: Date, who, what was discussed, what was decided, what happens next. Write it after every consultation, offer discussion, price change or disclosure conversation.

Chapter source:
> After every consultation, offer discussion, price change or disclosure conversation, write a short note in your CRM: date, who, what was discussed, what was decided, what happens next.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 14. `ch9.conversation-note.length`
*A two-minute CRM note after every client conversation · fill in the blank*

**A good conversation note is ______ lines or fewer.**

Keyed answer: **5**. Also accepted: 'five'.

Explanation shown to the reader: Two minutes of typing is enough, and every conversation gets its note in your CRM the same day.

Chapter source:
> A good note is five lines or fewer.
> Two minutes of typing protects you from "but you said" months later and makes your follow-up specific.
> Document every conversation in your CRM the same day.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 15. `ch9.conversation-note.why`
*A two-minute CRM note after every client conversation · multiple choice*

**Why does the chapter say the two minutes spent writing a note are worth it?**

- A. They protect you from "but you said" and make follow-up specific ✓
- B. They are how your broker decides your commission split each year
- C. They replace the need to send the client anything else in writing
- D. They let you skip the weekly client update while under contract

Explanation shown to the reader: Two minutes of typing protects you from "but you said" months later and makes your follow-up specific. Chapter 11 covers what to document for legal protection.

Chapter source:
> Two minutes of typing protects you from "but you said" months later and makes your follow-up specific. Chapter 11 covers what to document for legal protection.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 16. `ch9.keep-informed.under-contract`
*From yes to closing and after · multiple choice*

**Between the signed agreement and the closing table, what does every client get from you?**

- A. A call whenever there is news, and quiet otherwise
- B. Updates from whoever on the team is free that week
- C. You as one contact, weekly updates, deadline calls ✓
- D. One summary email sent the week before closing day

Explanation shown to the reader: One named point of contact (you), a short update every week even when nothing has changed, and a call before every deadline, each logged in your CRM. A client who is well informed becomes a past client who refers.

Chapter source:
> A client who is well informed becomes a past client who refers. Between the signed agreement and the closing table, give every client one named point of contact (you), a short update every week even when nothing has changed, and a call before every deadline. Log each of those in your CRM.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 17. `ch9.keep-informed.weekly`
*From yes to closing and after · fill in the blank*

**Between the signed agreement and closing, send every client a short update once a ______ , even when nothing has changed.**

Keyed answer: **week**. Also accepted: none.

Explanation shown to the reader: Give every client a short update every week even when nothing has changed, and log it in your CRM.

Chapter source:
> give every client one named point of contact (you), a short update every week even when nothing has changed, and a call before every deadline. Log each of those in your CRM.

Note: reworded after the cross-chapter review; the earlier stem said "this week" and gave the answer away. One accepted word.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 18. `ch9.keep-informed.closing-table`
*From yes to closing and after · multiple choice*

**The after-closing habit starts at the closing table. What three things do you do there?**

- A. Hand over the keys, ask for a review, then close out the file
- B. Thank them, ask for a new listing, send your fee invoice
- C. Ask for an online review, give a gift, archive the contact
- D. Thank them, ask for the introduction, say you'll be in touch ✓

Explanation shown to the reader: Thank them, ask for the introduction, and tell them to expect to hear from you. Chapter 10 shows the post-close plan that follows.

Chapter source:
> Chapter 10 shows the post-close plan. The habit starts at the closing table: thank them, ask for the introduction, and tell them to expect to hear from you.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:
