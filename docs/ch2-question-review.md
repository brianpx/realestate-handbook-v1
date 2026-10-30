# Chapter 2 question bank: draft questions for review

Prepared 20 October 2026. Nine questions were written from the Chapter 2 text for the spaced-review bank (`content/data/questions.ts`, each marked `draft: true`). **None of them is shown to readers yet.** The four questions that already shipped with the chapter are unchanged and are not listed here.

## What I am asking you to check

You have worked as an agent, so the useful things only you can judge are below. Mark each question **Approve**, **Change** (say what) or **Drop**.

1. **Is the keyed answer the right one**, and are the other options clearly wrong rather than arguable?
2. **Does it match what a working agent would do**, not just what the chapter says?
3. **Is it too easy, too tricky, or testing the wording rather than the idea?**
4. **Does the explanation say anything the chapter does not?**

Every keyed answer is traceable to a sentence in `content/pages/ch2.html`; the quoted passages below were checked against that file word for word. That shows the question matches the **book**. It does not show the book is right.

## How approved questions get used

Approved questions lose their `draft` flag and join the review deck, and also the end-of-chapter check (`chapterCheck()` serves every non-draft question for the chapter). A concept the reader missed is asked again with a different question than last time, which is why each concept needs at least two. **`ch2.sphere`, `ch2.online-leads` and `ch2.advanced-sources` have no reviewed question**, so those ideas stay out of the review loop until at least one of their drafts is approved. The old knowledge-check question on sphere conversion ("five to ten times") was not carried over because the chapter gives no such figure; `ch2.sphere.why-best` and `ch2.sphere.list-size` replace it.

| Concept | Reviewed now | Draft awaiting you |
| --- | --- | --- |
| Your sphere is the cheapest, best-converting source: list 150 or more names first | 0 | 2 |
| Work the sphere in order: announce, give, ask, repeat | 1 | 1 |
| Online leads pay off only with speed and persistence | 0 | 2 |
| An open house is a lead-generation event: before, during, after | 1 | 1 |
| Farming and expired listings are slower or advanced sources | 0 | 2 |
| Tag every contact with a source and measure cost per closed deal | 1 | 1 |

## Things I would look at first

- **`ch2.sphere.why-best`**: replaces a knowledge-check question whose "five to ten times" claim is not in the chapter. Read its note, and decide whether the old claim should be fixed or removed.
- **`ch2.track-sources.worked-example`**: retells the chapter's own worked example, so it tests recall of the example rather than the method.
- **Option length**: the keyed answer is the longest option in 3 of the 9 multiple-choice drafts, which a test-savvy reader can use without knowing the chapter. Even the lengths out when editing.

## The questions

### 1. `ch2.sphere.why-best`
*Your sphere is the cheapest, best-converting source: list 150 or more names first · multiple choice*

**Why is your sphere of influence, for most agents, the highest-return lead source?**

- A. Referral fees make every contact profitable
- B. Trust is already built and the cost is only time ✓
- C. Sphere contacts always respond to a mass message
- D. It needs no follow-up once you have announced yourself

Explanation shown to the reader: Your sphere often converts far better than a portal lead, and the awkwardness of calling fades after the tenth call.

Chapter source:
> For most agents this is the highest-return source they will ever have, because trust is already built and the cost is only time.

Note: This replaces the old knowledge-check question, which said sphere contacts convert "five to ten times" better than portal leads. The chapter gives no such figure (it says "often converts far better"), so that question was not carried over. Confirm the replacement is the point you want taught, and decide whether the old claim should be fixed or removed from the knowledge check.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 2. `ch2.sphere.list-size`
*Your sphere is the cheapest, best-converting source: list 150 or more names first · multiple choice*

**When you build your sphere list from your phone, social media, email and holiday cards, how many names do most people find?**

- A. 25 to 50
- B. 60 to 100
- C. 150 to 300 ✓
- D. 500 to 1,000

Explanation shown to the reader: Import every one into your CRM and tag them by relationship so you can sort later.

Chapter source:
> Most people find 150 to 300 names.

Note: Easy to guess from the chapter's own "150" target in the Try It. Check the wrong ranges are far enough apart not to feel like a trick.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 3. `ch2.sphere-order.announce-how`
*Work the sphere in order: announce, give, ask, repeat · multiple choice*

**How should you send the announcement that you are in real estate?**

- A. As a mass email blast to your whole database
- B. Through an automated text tool, to save time
- C. As a social media post only
- D. As a personal call or text, after checking your broker's outreach rules ✓

Explanation shown to the reader: One message, personal, not a mass blast. Chapter 11 covers your broker's outreach rules.

Chapter source:
> Send it as a personal call or text, not through an automated tool, and check your broker's outreach rules first (Chapter 11).

Note: The keyed option is the longest by far. Even the lengths out when editing.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 4. `ch2.online-leads.two-things`
*Online leads pay off only with speed and persistence · multiple choice*

**Which two things decide whether online leads pay off?**

- A. Speed and persistence ✓
- B. Price and location
- C. Photos and listing descriptions
- D. Exclusivity and brand

Explanation shown to the reader: The first agent to make real contact usually wins the conversation, and most online leads need a long nurture plan.

Chapter source:
> Two things decide whether online leads pay off:
> Speed. The first agent to make real contact usually wins the conversation.
> Persistence. Most online leads are 6 to 18 months from a transaction.

Note: Easy: the other options are not about lead handling at all. Consider a more tempting distractor from real agents (for example "volume and price").

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 5. `ch2.online-leads.months-away`
*Online leads pay off only with speed and persistence · multiple choice*

**Most online leads are how far from a transaction?**

- A. A few days
- B. 6 to 18 months ✓
- C. About 3 years
- D. They are ready to sign now

Explanation shown to the reader: Without a long nurture plan you are paying to warm up a lead for someone else.

Chapter source:
> Most online leads are 6 to 18 months from a transaction.

Note: Tests a single number. The chapter gives it as a general statement, not a measured figure; confirm that matches your experience.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 6. `ch2.open-house.during`
*An open house is a lead-generation event: before, during, after · multiple choice*

**During an open house, what is the goal?**

- A. Sell the house to the first serious visitor
- B. Capture people (name, phone and email), not sell to them ✓
- C. Hand out your price list and leave the rest to the listing agent
- D. Collect paper sign-in sheets for next week

Explanation shown to the reader: Greet every visitor, ask one open question about their search, and offer a concrete next step.

Chapter source:
> During is about capturing people, not selling to them.
> Greet every visitor, ask one open question about their search, and capture name, phone and email.

Note: The last option (collecting paper sign-in sheets) echoes the chapter's advice to use digital sign-in; check it is clearly wrong rather than half right.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 7. `ch2.advanced-sources.farm-wait`
*Farming and expired listings are slower or advanced sources · multiple choice · scenario*

**You start farming a neighborhood this month. When does the chapter say listings usually begin to appear?**

- A. Within two weeks
- B. After about a month
- C. After six to twelve months ✓
- D. Only after the second year

Explanation shown to the reader: Farm only if you can afford the wait.

Chapter source:
> Expect six to twelve months before listings appear, so farm only if you can afford the wait.

Note: Tests a single timeframe. Check "about a month" is clearly wrong to a working agent.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 8. `ch2.advanced-sources.expired-opener`
*Farming and expired listings are slower or advanced sources · multiple choice*

**How should you open a call to an owner whose listing expired?**

- A. Lead with curiosity about what they want to do next ✓
- B. Point out what their last agent did wrong
- C. Tell them their price was too high
- D. Offer to cut your commission

Explanation shown to the reader: The chapter's opener: "I saw your home came off the market. What would you like to happen next?"

Chapter source:
> Lead with curiosity about what they want to do next, not with criticism of their last agent or their price.

Note: The wrong options are all the criticism or price-cutting the chapter warns against, so the answer may be obvious. The chapter also points to Do Not Call and consent rules for these owners (Chapter 11); the question does not test that.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

### 9. `ch2.track-sources.worked-example`
*Tag every contact with a source and measure cost per closed deal · multiple choice · scenario*

**An open house source costs $120 in materials plus 24 hours at $25 an hour and produces one closing. What is the cost per closed deal?**

- A. $120
- B. $600
- C. $720 ✓
- D. $3,000

Explanation shown to the reader: $120 + (24 x $25) = $720, and $720 divided by 1 closing is $720.

Chapter source:
> Cost: $120 in materials plus 24 hours at $25 an hour, or $720. Cost per closed deal: $720 ÷ 1 = $720.

Note: The stem retells the chapter's own worked example, so it tests recall of the example. A fresh set of numbers would test the method.

Decision: ☐ Approve  ☐ Change  ☐ Drop        Comments:

---

## After your review

Send back the decisions (the numbers are enough). Approved questions get `draft` removed; changed ones are edited and their `version` bumped; dropped ones are deleted. Then run `pnpm vitest run lib/coach` to confirm the bank is still consistent.
