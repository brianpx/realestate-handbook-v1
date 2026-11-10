# Chapter 3 question bank: draft questions for review

Prepared 9 November 2026 (M4 step 12, coach coverage). Six concepts (`../../content/data/concepts.ts`) and seventeen questions (`../../content/data/questions.ts`, each marked `draft: true`) were written from the Chapter 3 text. **None of them is shown to readers yet.** The four questions that ship with the chapter today live in `../../content/data/knowledge-checks.ts`; they are unchanged and are not listed here.

Status of every item below: **draft, awaiting owner review** (OD-30: the owner reviews and clears drafts until a working agent is named).

## What I am asking you to check

Mark each question **Approve**, **Change** (say what) or **Drop**.

1. **Is the keyed answer the right one**, and are the other options clearly wrong rather than arguable?
2. **Does it match what a working agent would do**, not just what the chapter says?
3. **Is it too easy, too tricky, or testing the wording rather than the idea?**
4. **Does the explanation say anything the chapter does not?**

Every keyed answer and explanation is traceable to a sentence in `../../content/pages/ch3.html`; the quoted passages below were copied from that file. That shows the question matches the **book**. It does not show the book is right.

## Before approving anything: approving switches the chapter check

`chapterCheck()` in `../../lib/coach/check.ts` serves every non-draft question for a chapter, and `components/widgets/CoachCheck.tsx` shows the tagged check instead of the plain one as soon as a chapter has one. Chapter 3 has no non-draft tagged question today, so it keeps its four shipped questions. **Approving even one draft here replaces those four with only the approved drafts** at the end of Chapter 3. The other tagged chapters avoided this by first moving their four shipped questions into `questions.ts` verbatim and non-draft (version 1). Do the same for Chapter 3 before, or together with, the first approval.

Two drafts overlap the shipped questions on purpose but with different stems: `ch3.paid-ads.nine-pm` (the shipped 9 p.m. question) and `ch3.listing-marketing.post-order` (the shipped "just sold" question is about the best seller-lead post; this one is about the order of all five).

| Concept | Anchor | Reviewed now | Draft awaiting you |
| --- | --- | --- | --- |
| Send everyone to one home base, and give reviews a place to land | `#your-home-base` | 0 | 3 |
| A brand is a one-sentence promise plus proof | `#what-people-should-say-about-you` | 0 | 3 |
| A modest content calendar you can keep on a busy week | `#a-content-calendar-you-can-keep` | 0 | 3 |
| Every listing should produce buyers and future sellers | `#market-every-listing-thoroughly` | 0 | 3 |
| Pay for leads only after the 9 p.m. test passes | `#paid-advertising` | 0 | 3 |
| Your first marketing budget is your calendar | `#paid-advertising` | 0 | 2 |

Keyed positions across the twelve multiple-choice drafts: A three times, B three, C three, D three. Option lengths were evened out so the keyed answer is not reliably the longest.

## Things I would look at first

- **`ch3.home-base.links`**: names the "Agent Site". The OD-05 CRM copy pass may rename that vocabulary in Chapter 3; if it does, this option and the explanation need the new term.
- **`ch3.paid-ads.nine-pm`**: the 9 p.m. test is a signed rule (`../../content/data/rules.ts`, `ninePmTest`). The explanation restates its three parts in the chapter's words; it does not paraphrase the rule's timing. `RULES.ninePmTest.concepts` lists only `ch2.online-leads`; consider adding `ch3.paid-ads`.
- **Verbatim blanks** (`home-base.not-write`, `content-calendar.batch`, `paid-ads.leak`, `calendar-budget.calendar`): each completes a line from the chapter, which rewards remembering the wording. They are short, but drop any you think test the line rather than the idea.
- **`ch3.calendar-budget`** shares its anchor with `ch3.paid-ads` because the pitfall box sits in the Paid advertising section; the line also opens the chapter, which has no heading id.

## The questions

### 1. `ch3.home-base.links`
*Send everyone to one home base, and give reviews a place to land · multiple choice*

**Where should every link on your social profiles and email signature point?**

- A. Your brokerage's main home page
- B. Your Agent Site, your home base ✓
- C. Whichever listing you posted last
- D. A different page for each platform

Explanation shown to the reader: Your Agent Site and Client App are the places you send everyone, so check that every social and signature link points to your Agent Site.

Chapter source:
> Your **Agent Site** (your public website profile, listings and home search) and your **Client App** (...) are the places you send everyone. [...] Check that every link on your social profiles and email signature points to your Agent Site.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 2. `ch3.home-base.reviews`
*Send everyone to one home base, and give reviews a place to land · multiple choice · scenario*

**Another new agent offers to write you a glowing review if you write one for them. What does the chapter say?**

- A. Accept: any review helps a new agent
- B. Accept, but post it only on Google
- C. Decline: never write or trade reviews ✓
- D. Accept, as long as you reply to it

Explanation shown to the reader: Ask only people you have actually served, never write or trade reviews, and reply to every one.

Chapter source:
> Ask only people you have actually served, never write or trade reviews, and reply to every one.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 3. `ch3.home-base.not-write`
*Send everyone to one home base, and give reviews a place to land · fill in the blank*

**Reviews are marketing you do not ______ .**

Keyed answer: **write**. Also accepted: write.

Explanation shown to the reader: An online lead reads them before deciding whether to answer your call, and three honest reviews make a new agent look established.

Chapter source:
> Reviews are marketing you do not write: an online lead reads them before deciding whether to answer your call, and three honest reviews make a new agent look established.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 4. `ch3.brand-promise.definition`
*A brand is a one-sentence promise plus proof · multiple choice*

**For a new agent, what does the chapter say a brand is?**

- A. A promise stated in one sentence, plus proof ✓
- B. A logo, a color scheme and a tagline
- C. A custom website and printed business cards
- D. A large following on two social platforms

Explanation shown to the reader: Fill in "I help [who] [do what] in [where]" and use that sentence in your bio, your profile and your first post.

Chapter source:
> For a new agent, a brand is a promise stated in one sentence, plus proof. Fill in the blanks: *"I help [who] [do what] in [where]."* [...] Use that sentence in your bio, your profile and your first post.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 5. `ch3.brand-promise.no-sales`
*A brand is a one-sentence promise plus proof · multiple choice · scenario*

**You have no sold homes of your own yet. Where does the chapter suggest you find proof for your promise?**

- A. Stock photos of homes that sold in the region
- B. Nowhere: hold off posting until your first closing
- C. Your brokerage's total sales, presented as yours
- D. A colleague's sale (with permission) or a local place ✓

Explanation shown to the reader: Until you have your own, borrow a colleague's with their permission, or profile a local business, a school or a park. Credibility starts with knowing the place.

Chapter source:
> Proof is the problem when you have no sold homes. Until you have your own, borrow a colleague's with their permission, or profile a local business, a school or a park. Credibility starts with knowing the place.

Note: "a local place" compresses "a local business, a school or a park"; the explanation spells it out.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 6. `ch3.brand-promise.proof`
*A brand is a one-sentence promise plus proof · fill in the blank*

**Once your one-sentence promise is in your bio, profile and first post, every post after that is ______ of the sentence.**

Keyed answer: **proof**. Also accepted: proof.

Explanation shown to the reader: A brand is a promise stated in one sentence, plus proof.

Chapter source:
> Use that sentence in your bio, your profile and your first post. Every post after that is proof of the sentence.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 7. `ch3.content-calendar.busy-week`
*A modest content calendar you can keep on a busy week · multiple choice*

**How does the chapter say to choose your content schedule?**

- A. Post every day for a month to build momentum
- B. Post only when you have something polished
- C. Pick one you can keep on a busy week, then keep it ✓
- D. Copy the schedule of the top agent in your market

Explanation shown to the reader: People hire the agent they remember. A modest, consistent content schedule beats bursts of brilliance.

Chapter source:
> People hire the agent they remember. [...] Pick a schedule that you can keep on a busy week, then keep it.
> A modest, consistent content schedule beats bursts of brilliance. (Key takeaway 2)

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 8. `ch3.content-calendar.market-numbers`
*A modest content calendar you can keep on a busy week · multiple choice*

**Which three numbers go in the monthly market update?**

- A. Listings taken, homes closed and commission earned
- B. Median price, days on market and months of inventory ✓
- C. Mortgage rates, price per square foot and new builds
- D. Showings, offers received and price reductions

Explanation shown to the reader: The monthly market update goes out as an email newsletter via your CRM and as a mailer to your farm.

Chapter source (Table 3.1, Monthly row):
> Market update with three numbers: median price, days on market, months of inventory. | Email newsletter via your CRM, mailer to farm

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 9. `ch3.content-calendar.batch`
*A modest content calendar you can keep on a busy week · fill in the blank*

**Batch-create a ______ of posts in one sitting.**

Keyed answer: **month**. Also accepted: month, a month.

Explanation shown to the reader: The Try It asks for next month's eight posts, two a week for four weeks, written in one sitting and scheduled.

Chapter source:
> Table 3.1. A minimum sustainable content calendar. Batch-create a month of posts in one sitting.
> Write next month's eight posts (two a week for four weeks) in one sitting, make every post answer your promise, and schedule them. (Try It Today)

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 10. `ch3.listing-marketing.two-leads`
*Every listing should produce buyers and future sellers · multiple choice*

**Besides selling the house, what does good listing marketing generate?**

- A. A higher commission on the sale
- B. Free placement from the portals
- C. Referrals from other agents
- D. Buyers who call and neighbor sellers ✓

Explanation shown to the reader: It generates buyers (who call about it) and sellers (neighbors who see you working). Every listing should produce buyers and future sellers, not only a closing.

Chapter source:
> Good listing marketing sells the house and also generates buyers (who call about it) and sellers (neighbors who see you working).
> Every listing should produce buyers and future sellers, not only a closing. (Key takeaway 3)

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 11. `ch3.listing-marketing.nearest-homes`
*Every listing should produce buyers and future sellers · multiple choice*

**Before the open house, mailers or door-knocks should reach how many of the nearest homes?**

- A. 10
- B. 25
- C. 50 ✓
- D. 200

Explanation shown to the reader: The minimum for every listing includes mailers or door-knocks to the 50 nearest homes before the open house.

Chapter source:
> For every listing, at minimum: [...] Mailers or door-knocks to the 50 nearest homes before the open house.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 12. `ch3.listing-marketing.post-order`
*Every listing should produce buyers and future sellers · multiple choice*

**In what order do the five posts for one listing go out?**

- A. Coming soon, just listed, open house, under contract, just sold ✓
- B. Just listed, coming soon, open house, just sold, under contract
- C. Open house, coming soon, just listed, under contract, just sold
- D. Coming soon, open house, just listed, just sold, under contract

Explanation shown to the reader: The "just sold" update, with a line about how many showings or offers it received, is the single best seller-lead post you can make.

Chapter source:
> Per listing | Coming soon, just listed, open house, under contract, just sold. (Table 3.1)
> A "just sold" update with a line about how many showings or offers it received. This is the single best seller-lead post you can make.

Note: The order also follows from the listing's life, so a reader can reason it out; that is intended, since the learning objective is to list the five posts.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 13. `ch3.paid-ads.nine-pm`
*Pay for leads only after the 9 p.m. test passes · multiple choice · scenario*

**A 9 p.m. lead gets an instant automated reply, but there is no 90-day plan and the morning call depends on your memory. Are you ready to pay for leads?**

- A. Yes: the immediate automated reply is what counts
- B. No: all three must happen without you remembering ✓
- C. Yes, as long as you make the call sometime that week
- D. Only for portal placements, not for social media ads

Explanation shown to the reader: The 9 p.m. test needs an immediate automated reply, a call by the next morning and a 90-day plan, all without you having to remember. You build all three in Chapters 4 and 5.

Chapter source (the signed `ninePmTest` sentence):
> Before you pay for leads, pass the 9 p.m. test: a lead arriving at 9 p.m. tonight gets an immediate automated reply, a call by the next morning and a 90-day plan, all without you having to remember. You will build all three in Chapters 4 and 5.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 14. `ch3.paid-ads.start-small`
*Pay for leads only after the 9 p.m. test passes · multiple choice*

**Once your system passes the test, how does the chapter say to start paid advertising?**

- A. Run every source at once and keep whichever wins
- B. Spend the full budget in the first month for speed
- C. Copy the ads a top agent in your market is running
- D. Start small, one source at a time for 90 days ✓

Explanation shown to the reader: Track cost per appointment and cost per closed deal before scaling.

Chapter source:
> When you do start, start small, run one source at a time for 90 days, and track cost per appointment and cost per closed deal before scaling.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 15. `ch3.paid-ads.leak`
*Pay for leads only after the 9 p.m. test passes · fill in the blank*

**Buying leads before your follow-up system can catch and nurture them is buying a ______ .**

Keyed answer: **leak**. Also accepted: leak, a leak.

Explanation shown to the reader: Paid ads amplify a system. They cannot replace one.

Chapter source:
> They are worth it only when your follow-up system is already catching and nurturing leads reliably. [...] Until you have, hold off: buying leads before then is buying a leak.
> Paid ads amplify a system. They cannot replace one. (Key takeaway 4)

Note: The explanation repeats the shipped blank's sentence ("Paid ads amplify a ___"); that is the chapter's own takeaway, not a second answer.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 16. `ch3.calendar-budget.pitfall`
*Your first marketing budget is your calendar · multiple choice*

**Which spending does the chapter's pitfall warn against?**

- A. Branding before spending time on conversations ✓
- B. Professional photography for every listing
- C. Mailers to the homes nearest your listing
- D. A small, tracked test of one paid source

Explanation shown to the reader: Logos, car magnets and a custom website produce nothing on their own.

Chapter source:
> PITFALL: Spending on branding before spending time on conversations. Logos, car magnets and a custom website produce nothing on their own. Your first marketing budget is your calendar.

Note: Options B to D are things the chapter recommends, which makes them clearly wrong answers to "warn against".

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 17. `ch3.calendar-budget.calendar`
*Your first marketing budget is your calendar · fill in the blank*

**Your first marketing budget is your ______ .**

Keyed answer: **calendar**. Also accepted: calendar.

Explanation shown to the reader: Be easy to find, easy to remember and easy to trust without spending money you do not yet need to spend.

Chapter source:
> This chapter shows you how to be easy to find, easy to remember and easy to trust, without spending money you do not yet need to spend. Your first marketing budget is your calendar.

Status: draft, awaiting owner review.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

## After your review

Send back the decisions (the numbers are enough). Approved questions get `draft` removed; changed ones are edited and their `version` bumped; dropped ones are deleted. Move the four shipped Chapter 3 questions into `questions.ts` first (see above). Then run `pnpm test lib/coach` to confirm the bank is still consistent.
