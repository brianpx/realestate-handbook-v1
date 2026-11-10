# Chapter 11 question bank: draft questions for review

Prepared 9 November 2026. Chapter 11 had no coach concepts. Six concepts and sixteen questions were written from the Chapter 11 text for the spaced-review bank (`../../content/data/concepts.ts` and `../../content/data/questions.ts`, between the `// ch11` and `// end ch11` lines, every question marked `draft: true`). **None of them is shown to readers yet.** Status of every item: draft, awaiting owner review.

## What I am asking you to check

You have worked as an agent, so the useful things only you can judge are below. Mark each question **Approve**, **Change** (say what) or **Drop**.

1. **Is the keyed answer the right one**, and are the other options clearly wrong rather than arguable?
2. **Does it match what a working agent would do**, not just what the chapter says?
3. **Is it too easy, too tricky, or testing the wording rather than the idea?**
4. **Does the explanation say anything the chapter does not?** This chapter is legal-adjacent, so the explanations only restate the chapter and keep its "ask your broker" wording. Say if any of them reads as legal advice.

Every keyed answer is traceable to a sentence in `../../content/pages/ch11.html`; the quoted passages below were copied from that file. That shows the question matches the **book**. It does not show the book is right. The chapter states no California-specific rule, so no question makes one.

A cross-chapter review on 9 November 2026 found no legal over-claims and confirmed that the consent items match the signed consent sentence. After it, the wrong options in `ch11.consent.who` and `ch11.consent.opt-out` were lengthened so the keyed option no longer stands out by length, and `ch11.professional-standards.refer` now asks a legal question instead of a tax one.

## How approved questions get used

Approved questions lose their `draft` flag and join the review deck. They also join Chapter 11's end-of-chapter check: `chapterCheck()` in `../../lib/coach/check.ts` serves every non-draft question for the chapter, and while all sixteen are drafts Chapter 11 keeps its plain knowledge check. Approving all sixteen would make a sixteen-question chapter check, so decide which ones are review-only before approving in bulk.

| Concept | Anchor | Reviewed now | Draft awaiting you |
| --- | --- | --- | --- |
| `ch11.agency-disclosure`: Disclose agency at first substantive contact and keep the signed copy | `#agency-disclosure` | 0 | 2 |
| `ch11.buyer-agreements`: A written buyer agreement before touring; compensation is negotiable | `#buyer-agreements-and-compensation` | 0 | 2 |
| `ch11.fair-housing`: Describe the property, never the people, and treat every inquiry the same | `#fair-housing` | 0 | 3 |
| `ch11.consent`: Automated texts and calls only with recorded consent; stop at the first opt-out | `#texts-and-calls` | 0 | 3 |
| `ch11.documentation`: Document the seven items the same day | `#what-to-document` | 0 | 3 |
| `ch11.professional-standards`: Refer legal, tax and structural questions, keep client information confidential, warn about wire fraud | `#professional-standards` | 0 | 3 |

## Things I would look at first

- **`ch11.consent` overlaps `ch4.text-permission`.** Chapter 11 is where `content/data/rules.ts` says the consent rule is defined (`anchor: 'texts-and-calls'`), and this concept tests the rule itself (recorded consent, where and when, stop and log at opt-out). `ch4.text-permission` tests the Chapter 4 point that an inquiry is not permission. If you keep both, `RULES.consent.concepts` could also list `ch11.consent`; that file belongs to another lane and was not changed.
- **`ch11.buyer-agreements.*`**: the chapter says to confirm both rules with your broker and that your state and broker set when the agreement must be signed. The questions keep that. Check they do not read as a statement of law.
- **`ch11.fair-housing.listing-line`**: one distractor ("An ideal first home for a newly married couple") describes a buyer by marital status, which the chapter's federal list does not name. It is wrong under the chapter's general rule ("Describe the property, not the ideal buyer"), not because of a listed class.
- **Three blanks** (`fair-housing.property`, `consent.where-and-when`, `professional-standards.confidential`) complete a chapter sentence. Each tests the idea in the missing word, but they still reward remembering the line.

## The questions

### 1. `ch11.agency-disclosure.when`
*Disclose agency at first substantive contact and keep the signed copy · multiple choice*

**When does the chapter say to give a buyer or seller your state's agency disclosure?**

- A. Once they sign a purchase contract with you
- B. When a conversation turns from casual to substantive ✓
- C. After the first showing, if they keep working with you
- D. Only if they ask you directly whom you represent

Explanation shown to the reader: Your state sets the form and the timing, usually at first substantive contact: "If a conversation moves from casual to substantive, that is the moment to disclose." Learn your state's rule from your broker.

Chapter source:
> Your state has a required disclosure form and a required timing, usually at first substantive contact. Learn both in your first week. [...] If a conversation moves from casual to substantive, that is the moment to disclose.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 2. `ch11.agency-disclosure.signed-copy`
*Disclose agency at first substantive contact and keep the signed copy · multiple choice, scenario*

**A seller has just signed your state's agency disclosure form. What does the chapter say to do with it?**

- A. Hand it to the seller, since only they need a copy
- B. Keep it until the listing goes live, then discard it
- C. Keep the signed copy in your transaction system ✓
- D. Hold it in your car until the transaction closes

Explanation shown to the reader: Keep the signed copy in your transaction system, and note the disclosure, given and signed, with the date: it is the first item on the documentation list.

Chapter source:
> Present the form in plain language, answer questions, and keep the signed copy in your transaction system.
> Agency disclosure given and signed, with the date.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 3. `ch11.buyer-agreements.before-touring`
*A written buyer agreement before touring; compensation is negotiable · multiple choice*

**According to the chapter, when should you get a written buyer representation agreement?**

- A. Before you tour homes with the buyer ✓
- B. After the buyer's offer has been accepted
- C. Only if the buyer asks to sign one
- D. At closing, with the other documents

Explanation shown to the reader: Get it before you tour homes. Your state and your broker set when it has to be signed, so confirm the rule and the current form with your broker.

Chapter source:
> Get a written buyer representation agreement before you tour homes. Your state and your broker set when it has to be signed.
> This is a pointer, not legal advice. Your broker has the current form and the words to use.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 4. `ch11.buyer-agreements.compensation`
*A written buyer agreement before touring; compensation is negotiable · multiple choice, scenario*

**A buyer asks how their agent gets paid, and you have an old listing form that shows a number. What does the chapter say to do?**

- A. Quote the figure printed on the old listing form
- B. Read the buyer-agent compensation field in the MLS
- C. Say the seller always pays a fixed standard amount
- D. Treat it as negotiable and discuss it with your client ✓

Explanation shown to the reader: Compensation is negotiable and an offer to the buyer's agent is no longer an MLS field. Who pays, and how much, is a conversation with your client. Do not quote a number from an old listing form; your broker has the words to use.

Chapter source:
> Compensation is negotiable. An offer of compensation to the buyer's agent is no longer a field in the MLS. Who pays, and how much, is a conversation with your client. Do not quote a number from an old listing form.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 5. `ch11.fair-housing.listing-line`
*Describe the property, never the people, and treat every inquiry the same · multiple choice*

**Which listing line follows the chapter's Fair Housing guidance for marketing?**

- A. Great for families who want a quiet, safe street
- B. Perfect for young professionals starting out
- C. Four bedrooms, fenced yard, two blocks from the park ✓
- D. An ideal first home for a newly married couple

Explanation shown to the reader: Describe the property, not the ideal buyer. The chapter names "great for families" and "perfect for young professionals" as problems and "four bedrooms, fenced yard, two blocks from the park" as fine.

Chapter source:
> In marketing. Describe the property, not the ideal buyer. "Great for families" and "perfect for young professionals" are both problems. "Four bedrooms, fenced yard, two blocks from the park" is fine.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 6. `ch11.fair-housing.good-area`
*Describe the property, never the people, and treat every inquiry the same · multiple choice, scenario*

**A client asks you, "Is this a good area?" What does the chapter say to do?**

- A. Share the same third-party sources you give every client ✓
- B. Describe the kind of people who live in the neighborhood
- C. Give your honest personal opinion of the area
- D. Steer them toward areas you think would suit them

Explanation shown to the reader: Give every client the same third-party sources on schools, crime statistics and amenities; do not editorialize or describe who lives there. Some brokerages have their own guidance on crime statistics, so confirm the wording with your broker first.

Chapter source:
> When a client asks "is this a good area?", give every client the same third-party sources on schools, crime statistics and amenities. Do not editorialize, and do not describe who lives there. Some brokerages have their own guidance on crime statistics, so confirm the wording with your broker before you share any source.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 7. `ch11.fair-housing.property`
*Describe the property, never the people, and treat every inquiry the same · fill in the blank*

**In your marketing, describe the ______ , not the ideal buyer.**

Keyed answer: **property**. Also accepted: the property.

Explanation shown to the reader: The same rule runs through conversation and service: do not characterize neighborhoods by who lives there, and give every inquiry the same response time, information and options.

Chapter source:
> In marketing. Describe the property, not the ideal buyer.
> In conversation. Do not characterize neighborhoods by who lives there.
> In service. Give every inquiry the same response time, the same information and the same options.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 8. `ch11.consent.who`
*Automated texts and calls only with recorded consent; stop at the first opt-out · multiple choice*

**Which contacts may you put on an automated text plan, according to the chapter?**

- A. Anyone whose mobile number is already saved in your CRM
- B. Only people whose consent you have recorded in the CRM ✓
- C. Anyone who has not yet asked you to stop texting them
- D. Past clients, since they already know and trust you

Explanation shown to the reader: Send automated texts or calls only to people whose consent you have recorded in the CRM, and stop at the first opt-out. Having someone's number is not consent.

Chapter source:
> Send automated texts or calls only to people whose consent you have recorded in the CRM, and stop at the first opt-out.
> Do not: add a contact to an automated text plan because you have their number.

Note: the explanation's first sentence is the signed consent sentence from `content/data/rules.ts`, verbatim.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 9. `ch11.consent.opt-out`
*Automated texts and calls only with recorded consent; stop at the first opt-out · multiple choice, scenario*

**A contact replies to one of your automated texts asking you to stop. What does the chapter say to do?**

- A. Finish the current plan, then remove them
- B. Switch them to automated calls, which are a different channel
- C. Pause the plan for a month, then restart it
- D. Stop all texts and automated plans now, and log it ✓

Explanation shown to the reader: Stop all texts and automated plans the moment someone opts out, and log it in your CRM. The professional standards repeat it: honor every opt-out immediately.

Chapter source:
> Do: stop all texts and automated plans the moment someone opts out, and log it.
> Respect do-not-call and anti-spam rules (see Texts and calls above). Honor every opt-out immediately in your CRM.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 10. `ch11.consent.where-and-when`
*Automated texts and calls only with recorded consent; stop at the first opt-out · fill in the blank*

**In each contact's CRM record, note where and ______ the person agreed to receive texts.**

Keyed answer: **when**. Also accepted: (none).

Explanation shown to the reader: That record is what lets you send automated texts at all: only people whose consent you have recorded in the CRM get them.

Chapter source:
> Do: record where and when each person agreed to receive texts, in the contact's CRM record.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 11. `ch11.documentation.declined-advice`
*Document the seven items the same day · multiple choice, scenario*

**You recommend a further inspection and your client decides against it. What does the chapter say to do?**

- A. Nothing, since no transaction step took place
- B. Record it only if the deal later falls apart
- C. Note the advice and their decision, with the date ✓
- D. Stop working with them until they agree

Explanation shown to the reader: "Any advice you gave that the client declined to follow" is one of the seven items, and inspection findings discussed with the client's choices is another. Each note has the date, parties, what was said and what was decided.

Chapter source:
> Keep notes in your CRM or your transaction system for every item below. Date, parties, what was said or delivered, and what was decided.
> Inspection findings discussed and the client's choices.
> Any advice you gave that the client declined to follow.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 12. `ch11.documentation.four-details`
*Document the seven items the same day · multiple choice*

**Which four details does the chapter say go in every documentation note?**

- A. Date, time of day, the location, and how long it lasted
- B. Date, parties, what was said or delivered, what was decided ✓
- C. Client name, phone number, email address and lead source
- D. List price, commission, lender name and closing date

Explanation shown to the reader: Date, parties, what was said or delivered, and what was decided, kept in your CRM or transaction system the same day.

Chapter source:
> Keep notes in your CRM or your transaction system for every item below. Date, parties, what was said or delivered, and what was decided.
> Document decisions the same day. (Key takeaway 3)

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 13. `ch11.documentation.referral`
*Document the seven items the same day · multiple choice*

**You refer a client to a lender. What does the chapter say your note should record?**

- A. The lender's rate quote for the client
- B. The referral fee you were offered
- C. Nothing, since referrals are not on the list
- D. That the client chose the lender freely ✓

Explanation shown to the reader: Referrals to lenders, inspectors or attorneys are on the list, "with a note that the client chose freely". Do not accept anything of value for a referral until your broker has told you what is allowed.

Chapter source:
> Referrals to lenders, inspectors or attorneys, with a note that the client chose freely.
> Do not pay or accept anything of value for referring a client to a lender, vendor or another agent until your broker has told you what is allowed.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 14. `ch11.professional-standards.refer`
*Refer legal, tax and structural questions, keep client information confidential, warn about wire fraud · multiple choice, scenario*

**A client asks you a legal question about their contract. What does the chapter say to do?**

- A. Refer them to the right professional instead of answering ✓
- B. Give your best answer, then suggest they double-check it
- C. Answer only if you have seen the same situation before
- D. Look it up online and pass on what you find

Explanation shown to the reader: Never give legal, tax or structural advice; refer to the professional. The chapter's line: "That's a question for your attorney. I can introduce you to two."

Chapter source:
> Never give legal, tax or structural advice. Refer to the professional. Say: "That's a question for your attorney. I can introduce you to two."

Note: the stem asks a legal question so that it matches the chapter's sample line, which sends the client to an attorney. An earlier draft asked a tax question.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 15. `ch11.professional-standards.wire-fraud`
*Refer legal, tax and structural questions, keep client information confidential, warn about wire fraud · multiple choice*

**What does the chapter's wire fraud warning tell every client before closing?**

- A. Wire instructions will come to them by text from you
- B. Send the funds as soon as any instructions arrive
- C. You will never email them wire instructions ✓
- D. Emailed instructions from the title company are safe

Explanation shown to the reader: If an email or text with wire instructions arrives, even one that looks like it is from you or the title company, they call you at the number you gave them before sending anything. Log that you gave the warning, and use the wording your broker or title company prefers.

Chapter source:
> Know your office policy on wire fraud warnings, and repeat the warning to every client before closing.
> "Before closing, I want you to know that I will never email you wire instructions. If you get an email or text with wire instructions, even one that looks like it's from me or the title company, call me at the number I gave you before you send anything."
> Next step: log in the CRM that you gave the warning, with the date. Use the wording your broker or title company prefers.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 16. `ch11.professional-standards.confidential`
*Refer legal, tax and structural questions, keep client information confidential, warn about wire fraud · fill in the blank*

**Keep client information confidential, including ______ the transaction.**

Keyed answer: **after**. Also accepted: (none).

Explanation shown to the reader: Confidentiality does not end at closing. The standards also include following the National Association of REALTORS® Code of Ethics and your local MLS rules.

Chapter source:
> Keep client information confidential, including after the transaction.
> Follow the National Association of REALTORS® Code of Ethics and your local MLS rules.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

## After your review

Send back the decisions (the numbers are enough). Approved questions get `draft` removed; changed ones are edited and their `version` bumped; dropped ones are deleted. Then run `pnpm test lib/coach` to confirm the bank is still consistent.
