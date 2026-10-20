# Chapter 4 question bank: draft questions for review

Prepared 20 October 2026. Fifteen questions were written from the Chapter 4 text for the spaced-review bank (`content/data/questions.ts`, each marked `draft: true`). **None of them is shown to readers yet.** The four questions that already shipped with the chapter are unchanged and are not listed here.

## What I am asking you to check

You have worked as an agent, so the useful things only you can judge are below. Mark each question **Approve**, **Change** (say what) or **Drop**.

1. **Is the keyed answer the right one**, and are the other options clearly wrong rather than arguable?
2. **Does it match what a working agent would do**, not just what the chapter says?
3. **Is it too easy, too tricky, or testing the wording rather than the idea?**
4. **Does the explanation say anything the chapter does not?** (I removed the explanations I found going beyond the text. Say if any others do.)

Every keyed answer is traceable to a sentence in `content/pages/ch4.html`; the quoted passages below were checked against that file word for word. That shows the question matches the **book**. It does not show the book is right.

## How approved questions get used

Approved questions lose their `draft` flag and join the review deck, where a concept the reader missed is asked again with a different question than last time. Today `ch4.daily-rhythm`, `ch4.speed-to-lead` and `ch4.optional-tools` each have at least one reviewed question, but **`ch4.crm-setup` and `ch4.text-permission` have none**, so those two ideas never enter the review loop until at least one of their questions is approved.

| Concept | Reviewed now | Draft awaiting you |
| --- | --- | --- |
| The six-part CRM setup, in order, in week one | 0 | 4 |
| The daily rhythm: open and close in the CRM, follow-ups before prospecting | 1 | 3 |
| Speed-to-lead: automated first touch in a minute, live call in minutes | 2 | 3 |
| An inquiry is not permission for automated texts | 0 | 3 |
| Add optional tools only when two conditions are true | 1 | 2 |

## Things I would look at first

- **`ch4.speed-to-lead.showing`**: the chapter now says "step out of whatever you are doing, unless you are with a client", then "if you are with a client, let the automated first touch buy you time". The question teaches the second. Make sure that is what you want agents to do at a showing.
- **`ch4.speed-to-lead.no-call-in-hour`**: the "short text" now carries the consent condition ("if you have permission to text them") that the text-permission questions insist on.
- **`ch4.crm-setup.pipeline-honest`**: a one-word blank with one accepted answer.
- **`ch4.text-permission.inquiry`**: wording about permission to text; worth a second pair of eyes.

## Reviewer pre-pass: two things that affect every decision

Added by Claude after reading each draft against `content/pages/ch4.html`. The per-question notes below are leanings, not decisions. Every keyed answer matches the chapter text.

1. **Approved questions also join the end-of-chapter check, not only the review deck.** `chapterCheck()` in `lib/coach/check.ts` serves every non-draft question for the chapter, and `check.test.ts` pins it to the original four. Approving all 15 would grow the chapter-end quiz to about 19 questions. Decide whether to cap the check or mark some questions review-only before approving in bulk.
2. **The keyed answer is the longest option in 7 of the 11 multiple-choice drafts and all 3 shipped ones.** A test-savvy reader can pick it without knowing the chapter. Even out option lengths when editing.

If every leaning is followed: four drafts are dropped (4, 7, 15, and 10 unless reframed), about five are edited, and `text-permission` has two or three live questions. Its review link also points at `#speed-to-lead`, the top of a section covering two concepts; a dedicated anchor on that paragraph would be better.

## The questions

### 1. `ch4.crm-setup.profile-first`
*The six-part CRM setup, in order, in week one · multiple choice*

**What is the first of the six CRM setup steps?**

- A. Import your contacts
- B. Complete your profile and Marketing Profile ✓
- C. Create your follow-up plans
- D. Install the mobile app

Explanation shown to the reader: Step one of the six is your profile and Marketing Profile. Everything your CRM generates for you pulls from there.

Chapter source:
> Complete your profile and Marketing Profile. Photo, bio, phone, email, license number, social links, brand colors. Everything your CRM generates for you pulls from here.
> Do these six things in order during your first week.

Note: The chapter lists the six steps "in order", so "first" is supported. Check that "Marketing Profile" is a term your readers will recognise or whether it is one CRM's name for a feature.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

Reviewer note (Claude, pre-pass; the decision is yours): Leaning approve. The keyed option is the longest (43 vs 27 characters). "Marketing Profile" may be one CRM's feature name; you would know whether readers recognise it.

---

### 2. `ch4.crm-setup.import`
*The six-part CRM setup, in order, in week one · multiple choice*

**You have imported your contacts. What does the chapter say to do next with them?**

- A. Delete everyone who has no email address
- B. Sort them alphabetically and start calling
- C. Send all of them the new-lead plan
- D. Deduplicate, then tag each contact by relationship and by source ✓

Explanation shown to the reader: Step two: import contacts, deduplicate, then tag each contact by relationship (sphere, past client, lead) and by source.

Chapter source:
> Import contacts. Phone, email, social and any spreadsheet you have. Deduplicate, then tag each contact by relationship (sphere, past client, lead) and by source.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

Reviewer note (Claude, pre-pass; the decision is yours): Leaning approve. Keyed option is the longest (64 vs 42); even out the option lengths.

---

### 3. `ch4.crm-setup.routing`
*The six-part CRM setup, in order, in week one · multiple choice · scenario*

**You are on a team and want every online inquiry to reach the right person instantly. Which setup step covers that?**

- A. Setting lead routing rules ✓
- B. Customizing your Opportunities pipeline
- C. Importing contacts
- D. Turning on mobile notifications

Explanation shown to the reader: Lead routing rules are step four, and the chapter says to set them if you are on a team.

Chapter source:
> Set lead routing rules if you are on a team, so inquiries reach the right person instantly.

Note: Distractor "Turning on mobile notifications" is step six and also helps you hear about a lead quickly. Confirm it is clearly the wrong answer to "reach the right person".

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

Reviewer note (Claude, pre-pass; the decision is yours): Leaning change. "Turning on mobile notifications" is a defensible answer to "reach the right person instantly" (step 6 notifies you of new leads). Reword to "route to the right team member" or swap that option. Labelled scenario but it is plain recall.

---

### 4. `ch4.crm-setup.pipeline-honest`
*The six-part CRM setup, in order, in week one · fill in the blank*

**Rename your pipeline stages to match how you actually work so your pipeline view is ______ .**

Keyed answer: **honest**. Also accepted: .

Explanation shown to the reader: For example: New, Contacted, Appointment set, Active, Under contract, Closed.

Chapter source:
> Customize your Opportunities pipeline. Rename stages to match how you actually work (for example: New, Contacted, Appointment set, Active, Under contract, Closed) so your pipeline view is honest.

Note: The only accepted answer is "honest". A reader who types "accurate" is marked wrong. Decide whether to add near-synonyms to the accepted list, or change this to multiple choice.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

Reviewer note (Claude, pre-pass; the decision is yours): Leaning drop or replace. One word, one accepted answer, tests the chapter's phrasing rather than the idea. A multiple-choice "why rename the stages" would test the idea.

---

### 5. `ch4.daily-rhythm.protect-blocks`
*The daily rhythm: open and close in the CRM, follow-ups before prospecting · multiple choice*

**Which blocks does Table 4.1 say to protect before you accept any appointment?**

- A. The first three: start-of-day review, follow-up tasks and prospecting ✓
- B. Only the prospecting block
- C. The end-of-day update and client appointments
- D. None: appointments always come first

Explanation shown to the reader: Table 4.1: protect the first three blocks before you accept any appointment.

Chapter source:
> Protect the first three blocks before you accept any appointment.
> Start of day
> Follow-up plan tasks
> Prospecting block

Note: Table 4.1 has five rows (start of day, follow-up tasks, prospecting, client appointments, end of day), and the learning objective now says "five blocks" and "protect the first three". Check the question reads clearly against both.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

Reviewer note (Claude, pre-pass; the decision is yours): Leaning approve. Keyed option is the longest (69 vs 45); even out the lengths.

---

### 6. `ch4.daily-rhythm.end-of-day`
*The daily rhythm: open and close in the CRM, follow-ups before prospecting · multiple choice · scenario*

**Your afternoon was all appointments. What does the rhythm still ask of you at the end of the day?**

- A. Nothing; appointments count as the day's work
- B. Start a second prospecting block
- C. Log every conversation, move Opportunities to the right stage and set tomorrow's top three ✓
- D. Rebuild your follow-up plans from scratch

Explanation shown to the reader: The end-of-day block (about 15 minutes) is: log every conversation, move Opportunities to the right stage and set tomorrow's top three.

Chapter source:
> Log every conversation, move Opportunities to the right stage, set tomorrow's top three.
> 15 min

Note: The first option ("Nothing; appointments count as the day's work") may be too obviously wrong. Suggest a more tempting distractor if you have one from real agents.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

Reviewer note (Claude, pre-pass; the decision is yours): Leaning approve; the strongest daily-rhythm question. Keyed option is the longest (90 vs 45); even out the lengths.

---

### 7. `ch4.daily-rhythm.opens-closes`
*The daily rhythm: open and close in the CRM, follow-ups before prospecting · fill in the blank*

**The day opens and closes in your ______ .**

Keyed answer: **CRM**. Also accepted: 'crm', 'your crm'.

Explanation shown to the reader: Figure 3: start by reviewing the dashboard and tasks, end with the update in your CRM.

Chapter source:
> Start in your CRM, work the follow-ups it hands you, prospect, hold appointments, and end in your CRM.
> The day opens and closes in your CRM, and follow-ups come before new prospecting.

Note: Very easy. Keep it only as a recall item; consider dropping it if you want a harder bank. The explanation says "the update in your CRM", but Figure 3 now says "close your CRM", so that wording may need to follow the figure.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

Reviewer note (Claude, pre-pass; the decision is yours): Leaning drop. The answer is "CRM" and it overlaps `followups-first`.

---

### 8. `ch4.speed-to-lead.showing`
*Speed-to-lead: automated first touch in a minute, live call in minutes · multiple choice · scenario*

**A new inquiry arrives while you are showing a house. What is the right plan?**

- A. Wait until the end of the day, then call every lead at once
- B. Reply with a long email explaining all your services
- C. Ignore it; showings always come first and leads can wait until tomorrow
- D. Let the automated first touch go out, then call at your first break ✓

Explanation shown to the reader: The automated reply buys you time, and the live call still happens as soon as you can, always the same day.

Chapter source:
> If you are with a client, let the automated first touch buy you time and call at the first break.
> A new inquiry arrives while you are showing a house. Describe what happens in the first minute, the first hour and the same day.

Note: The chapter now says to "step out of whatever you are doing, unless you are with a client", and then to let the automated first touch buy you time when you are with a client. The question follows the second sentence. Confirm that is the advice you want taught, and that "call at your first break" is right for a showing.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

Reviewer note (Claude, pre-pass; the decision is yours): Leaning approve if you agree with the book's position at a showing (the automated touch buys time, call at the first break). It repeats the explanation on the shipped `two-layers` question, so a reader may pattern-match instead of think.

---

### 9. `ch4.speed-to-lead.no-call-in-hour`
*Speed-to-lead: automated first touch in a minute, live call in minutes · multiple choice*

**You cannot make a live call within the hour. What does the chapter suggest?**

- A. Send a personal voice note or, if you have permission to text them, a short text that names the property or area they asked about ✓
- B. Wait and call tomorrow
- C. Send the same automated message a second time
- D. Add them to the quarterly call plan

Explanation shown to the reader: Specificity proves a human read the inquiry.

Chapter source:
> If you cannot make a live call within the hour, send a personal voice note or, if you have permission to text them, a short text that names the property or area they asked about. Specificity proves a human read the inquiry.

Note: A text is only permitted with consent (see the text-permission questions). The chapter and the keyed answer now state that condition. Confirm the wording reads naturally as an answer option.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

Reviewer note (Claude, pre-pass; the decision is yours): Leaning change, lengths only. The keyed option is far the longest (129 vs 45 characters). The consent condition is already in the keyed option, so the earlier worry about it is closed.

---

### 10. `ch4.speed-to-lead.figure-4`
*Speed-to-lead: automated first touch in a minute, live call in minutes · multiple choice*

**How does the chapter describe the response-window shape in Figure 4?**

- A. Measured data from a national study
- B. A guarantee of conversion within five minutes
- C. An illustrative shape, not measured data ✓
- D. The average response time of top producers

Explanation shown to the reader: The figure caption says it is illustrative: highest inside five minutes, strong within about half an hour, falling sharply after.

Chapter source:
> This is an illustrative shape, not measured data

Note: This tests reading the caption rather than a skill. It guards against readers quoting the figure as a statistic. Keep or drop as you prefer.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

Reviewer note (Claude, pre-pass; the decision is yours): Leaning change or drop. It tests the figure caption ("illustrative, not measured") rather than a skill. Separate content issue: the shipped `five-minutes` blank states "conversion is highest under 5 minutes" as fact, while the chapter calls the figure illustrative.

---

### 11. `ch4.text-permission.inquiry`
*An inquiry is not permission for automated texts · multiple choice · scenario*

**A lead submits an online inquiry. What does the chapter say about starting an automated text sequence?**

- A. An inquiry is permission, so go ahead
- B. Texts are never allowed in the first week
- C. Text first and ask for permission in the third message
- D. An inquiry is not, by itself, permission for an automated text sequence; text only if you have permission ✓

Explanation shown to the reader: The automated email goes out at once; a text is sent only if you have permission to text them.

Chapter source:
> An inquiry is not, by itself, permission for an automated text sequence.
> a text only if you have permission to text them

Note: Legal wording. Have counsel or your broker confirm this matches how you want the book to put it (the chapter text is the source here, not the law).

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

Reviewer note (Claude, pre-pass; the decision is yours): Leaning approve. Keyed option is the longest (105 vs 54); even out the lengths. The chapter never says how to obtain permission; the legal-wording note above still stands.

---

### 12. `ch4.text-permission.first-touch`
*An inquiry is not permission for automated texts · multiple choice*

**What should the automated first touch sound like, and what should it ask?**

- A. Like you, asking one easy question ✓
- B. Formal, with your full price list and a request for their budget
- C. Short, with only a link to your website
- D. Like a form letter, asking them to call your office

Explanation shown to the reader: It should sound like you and ask one easy question.

Chapter source:
> It should sound like you and ask one easy question.

Note: The question asks two things (tone and content) but the answer is one phrase. Check the wrong options do not accidentally fit one half.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

Reviewer note (Claude, pre-pass; the decision is yours): Leaning change. The wrong options are obviously silly, and tone of the first touch belongs to `speed-to-lead`, not `text-permission`. Retag it, or replace it with a question about getting permission.

---

### 13. `ch4.text-permission.opt-out`
*An inquiry is not permission for automated texts · fill in the blank*

**Honor quiet hours and stop on the first ______ .**

Keyed answer: **opt-out**. Also accepted: 'opt out', 'optout'.

Explanation shown to the reader: The automated first touch should honor quiet hours and stop on the first opt-out.

Chapter source:
> Honor quiet hours and stop on the first opt-out.

Note: Accepted answers: "opt-out", "opt out", "optout". "Opt-out" is hyphenated in the chapter; check the accepted list covers what readers will type.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

Reviewer note (Claude, pre-pass; the decision is yours): Leaning approve. It is a verbatim blank, but it tests the one rule that matters legally.

---

### 14. `ch4.optional-tools.second-crm`
*Add optional tools only when two conditions are true · multiple choice · scenario*

**An agent has a working CRM setup and about 30 leads a month. Should they add a second CRM?**

- A. Yes, every agent needs two
- B. Yes, but only after a year
- C. No: with a working setup and that volume they do not need one ✓
- D. Only if it is free

Explanation shown to the reader: The chapter's own example: a new agent with a working CRM setup and 30 leads a month does not need a second CRM.

Chapter source:
> A new agent with a working CRM setup and 30 leads a month does not need a second CRM.

Note: The prompt copies the chapter's own example. Because the stem nearly quotes the answer, it tests recognition more than judgement.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

Reviewer note (Claude, pre-pass; the decision is yours): Leaning approve with one edit: "Yes, but only after a year" is not clearly wrong (the chapter does not rule out adding a second CRM later). Replace it with a clearly wrong option. Keyed option is the longest (61 vs 26).

---

### 15. `ch4.optional-tools.lost`
*Add optional tools only when two conditions are true · fill in the blank*

**A tool you have not mastered is one more place for a lead to get ______ .**

Keyed answer: **lost**. Also accepted: .

Explanation shown to the reader: Master the basic CRM first; add tools when volume justifies them.

Chapter source:
> A tool you have not mastered is one more place for a lead to get lost.

Note: This is a verbatim-sentence blank. It rewards memorising the line. Consider replacing it with a scenario.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

Reviewer note (Claude, pre-pass; the decision is yours): Leaning drop. Verbatim blank; `optional-tools.when` and `second-crm` already cover the concept.

---

## After your review

Send back the decisions (the numbers are enough). Approved questions get `draft` removed; changed ones are edited and their `version` bumped; dropped ones are deleted. Then run `pnpm vitest run lib/coach` to confirm the bank is still consistent.
