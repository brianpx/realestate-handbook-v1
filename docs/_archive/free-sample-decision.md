# Free sample: what stays free, for how long, and whether it needs an email

Written 8 November 2026 after reading the preface, Chapters 1 to 13 and Appendix E in `content/pages/`, and the three places the site handed out free content. Built the same day in commit `699d62a`; the "Status" section says what landed. Paths are relative to the repository root.

## Status

- `/preview` carries Chapter 1 and Chapter 7 in full, with their checkpoints, quizzes, the pitfall cycle explorer and the six-errors self-score live, and keeps the two teasers (one Chapter 6 script, the Chapter 8 planner). `components/site/Excerpt.tsx` renders a whole page when no range is given.
- The `/signup` page ("the first four chapters free" for an email), its form, the header and footer links, the sitemap entry, its CSS and its e2e test were uncommitted work from an earlier session and were removed outright. Nothing had been committed or deployed, so no redirect was needed.
- The sample's description was updated on `/pricing`, `/about` and in `content/site/faq.ts`. `e2e/site.spec.ts` checks that both chapters, both checkpoint boxes, both quizzes and the two Chapter 7 tools render.
- Still open: the post-sample email offer (Decision 3) and the first-visit form in the handbook shell (open decision 3 below).

## Where things stood before the change

The repo had three free paths, and they did not agree with each other.

| Path | What it gave away | Gate | State |
|---|---|---|---|
| `/preview` (`app/(public)/preview/page.tsx`) | One Chapter 1 section with the income goal calculator, one Chapter 6 script with practice mode, the Chapter 8 time-block planner | None. The page and the FAQ (`content/site/faq.ts`) both promised "no sign-up" | Live and working. In the sitemap |
| `/signup` (since removed) | Promised Chapters 1 to 4 in full, "with every tool working", for an email address | Email, but the form was front-end only: it validated, showed "Check your inbox" and sent nothing. No link was mailed and nothing was unlocked | A promise with no delivery. Uncommitted |
| First-visit form in the handbook shell (`components/shell/Gate.tsx`, `/api/lead`, `lib/leads/`) | A follow-up note by email. Explicitly "not a lock" | Optional email, stored in Neon, welcome email through SendGrid | Working in code; the welcome text says "The book stays free to read" |

Separately, every `/handbook/*` route is publicly readable (launch blocker 1 in `docs/_archive/launch-handoff.md`). Until a real access gate exists, "free" and "paid" are labels, not enforcement. The decisions below are about what to promise and build toward, not what is protected today.

## Decision 1: what is free

The free sample, in full, with every tool, checkpoint and quiz working:

| Chapter | Why it is the sample | Words | Tools |
|---|---|---|---|
| Preface | Who the book is for, the reading plan, the box legend. It is sales copy already. Not on `/preview`: it belongs to the signed-in free set (`FREE_PAGE_IDS` in `docs/_archive/user-database-plan.md`, D1), where a reader needs the reading plan and legend to navigate | 691 | Script practice sample |
| Chapter 1, Mindset and business foundations | The thesis of the course: leading indicators, income goal to daily conversation number, CRM as headquarters. The reader leaves with a real number on a card. Names the system without describing it; every forward reference points at paid chapters | 1,184 | Income goal calculator, checkpoint, quiz |
| Chapter 7, Common errors and pitfalls | A diagnostic. The six-error table names the pain, the Sam case makes it concrete, and the self-score ends by pointing the reader at the paid chapter that fixes their worst habit (the Fix column names Chapters 2, 4, 8, 11, 12). Short and self-contained, and a different lesson type from Chapter 1 | 944 | Pitfall cycle explorer, six-errors self-score, checkpoint, quiz |

The two teasers on `/preview` stay: the one Chapter 6 script (new lead by phone, with practice mode) and the Chapter 8 planner with calendar export. They show two more tool types without releasing the chapters that contain them.

The Appendix E tool table can go on the sales page as "what is inside". It is a feature list, not teaching, and it costs nothing to show. Not done yet.

Together the sample is about 11 percent of the text (2,128 of 19,757 words) and 5 of the 18 named tools.

Everything else stays paid. The reasons, by chapter:

- Chapters 4, 5, 6 and 12 are the deliverables the preface promises by day 90: the CRM setup, the 13-touch plan, the scripts, the dated roadmap. Chapter 6 is eleven copyable scripts; one is a teaser, the chapter is the asset.
- Chapter 2 is the strongest tactical chapter and the longest. The open-house sequence and the cost-per-deal worked example are what people pay for. If a third taste is ever wanted, release only the "Sphere of influence and referrals" section, not the chapter.
- Chapter 13 contains "The whole handbook on one card." It is the payoff summary and would undercut the purchase.
- Chapters 3 and 11 would not hurt sales if released, but they sell nothing: Chapter 3 has no tool beyond the checkpoint, and Chapter 11 is deliberately generic and hedged.
- Chapters 9 and 10 have the best practice tools, but consultations and post-close plans are low urgency for someone who has not bought yet.

### Why the four-chapter offer was dropped

"The first four chapters free" would have released Part I and all of Part II: Chapters 1 to 4 are about 29 percent of the text (5,824 words), the whole "Find" outcome of the three the book promises, plus the CRM setup and speed-to-lead from Chapter 4. That is the payload, not a sample. The page also promised an emailed link that was never sent. A sales site should not carry two different free offers.

### What changed on `/preview`

- Chapter 1 is shown whole, so the objectives, Field Note, Try It, Checkpoint, Key Takeaways and quiz are visible. The FAQ says the sample "shows the level before you decide"; the lesson frame is the level.
- Chapter 7 is shown whole.
- `components/site/Excerpt.tsx` still imports only the widgets the sample uses, to keep the public bundle small; `checkpoints`, `knowledge-check`, `pitfall-cycle` and `error-self-score` joined its map. The chapter title is rendered as an h2 so every public page keeps one h1 (`e2e/site.spec.ts` checks this on every public route).
- The preview widgets are the real components under the handbook's instance ids, so whatever a visitor types in the calculator is still there after they buy, on the same browser. That is one reason the sample is unlimited (below).

## Decision 2: time limit

**Unlimited.** No expiry on the sample.

- There is nothing to protect. The sample is excerpt-sized and contains no payload. An expiring sample buys nothing that the chapter selection does not already buy.
- There is nothing to enforce it with. The handbook has no accounts and no server session; progress is in `localStorage`. A time limit would be either a client-side timer, which anyone can clear, or a signed cookie, which needs the access infrastructure that launch blocker 1 says does not exist. Build that for paid access, not for the sample.
- The sample is the search landing surface. `/preview` is in the sitemap and the product layout is `noindex`, so the sample is the only teaching content search engines see. Expiring content cannot do that job.
- Expiry punishes the buyer. The visitor's calculator entries carry into the paid handbook. A limit that blocks or wipes them is a worse first day.

Time limits suit full-product trials, where the whole book is exposed and the limit is the only thing creating urgency. If a full-product trial is ever wanted, it is a different offer: a short window (seven days) on a signed cookie issued after email confirmation, built on the same gate as paid access. Not now, and not instead of this sample.

## Decision 3: email requirement

**No email to read the sample.** Collect email after the sample, optionally, and confirm it before using it.

Why not gate the sample:

- The sample's one job is to show the level. A form in front of it halves the people who see the level, and the ones who bounce are the ones who were unsure, which is exactly who the sample is for.
- The site already promises it. `/preview` says "you do not need to sign up"; the pricing FAQ says the sample "is free and needs no sign-up". Keep the promise.
- The email path is not launch-ready. SendGrid needs a from-address and a postal mailing address (`LEAD_FROM_EMAIL`, `LEAD_MAILING_ADDRESS` in `lib/leads/mail.ts`) and sending-domain authentication (`docs/_archive/nextjs-migration-plan.md`), none of which the owner has supplied. Gating the sample on a flow that cannot send yet blocks every prospect.

What to do with email instead:

- Put one optional form after the sample, not before it. Two candidates, pick one: "Tell me when purchase opens" (the honest offer while `purchaseOpen()` in `lib/offer.ts` is false), or "Email me my daily number and the Chapter 1 card" (a reason to give the address that is tied to the sample's win).
- Send it through the existing lead handler (`lib/leads/handler.ts`) with a new `source` value. No new dependency.
- Use confirmed opt-in for that list: send a confirmation link and store the address as subscribed only after it is clicked. CAN-SPAM does not require it, but it keeps the list clean, protects the sending domain's reputation, and is the expected standard for a marketing list. This is a confirmation for the list, never a condition for reading.
- Rewrite the welcome email in `lib/leads/mail.ts` before any real send. "The book stays free to read" is no longer true once the handbook is sold.

The sign-in and lead-capture design in `docs/_archive/user-database-plan.md` is where this form should be built, so the sample stays ungated while the list gets a real back end.

## Open decisions for the owner

1. Confirm Chapter 1 and Chapter 7 as the sample, or name a different pair. Both are live on `/preview` now.
2. Choose the post-sample email offer (purchase notice or the Chapter 1 card), and supply the from-address and postal address so the confirmation email can go out.
3. Decide what the first-visit form in the handbook shell (`components/shell/Gate.tsx`) is for once the handbook is paid. A buyer has already given an email at checkout, so it is probably redundant there.
