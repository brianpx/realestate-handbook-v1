# Reading plan coach: reminders, progress, and spaced review

Drafted 19 October 2026 against branch `next`; revised the same day after a design review. Nothing here has been built. File names, line numbers and word counts come from reading the repo; the learning-science choices are standard practice (retrieval practice, spacing, interleaving), not measurements from this handbook. **Provider requirements (SendGrid, Twilio, Vercel cron limits) have not been checked against current docs.** Verify them before building phases E and F.

## What changed in this revision

- **First release narrowed** to plan setup, explicit exercise completion, chapter checks, and a capped review queue. The concept map, adaptive skim recommendations, pre-test, weekly and final assessments, chapter weak banners and milestone messages are deferred (see "Release scope").
- **Final assessment** is now a sampled readiness check, not "every concept".
- **`grade` fixed**: one `nextBox` used for both box and interval; same-session answers cannot advance a concept; box 5 keeps recurring.
- **Reminder delivery** moved to a durable outbox with leases, retries and an explicit "uncertain" state; the daily cap is enforced by the schema.
- **Sync** is attempt-based and convergent, with content versions.
- **Schedule rules** written out: pace mapping, session completion, reflow, queue overflow.
- **Pre-test** demoted to a diagnostic; no chapter-level skipping without chapter-level evidence.
- **Send time, quiet hours and skip rules** made consistent.
- **Consent, suppression and signed links** given real boundaries.
- **Acceptance criteria** added for grading, reflow, sync and delivery.
- Email stays ahead of SMS; reminders use the phase 5 account system, not a second identity path.

## What exists today

- The reading plan is a four-item list in `content/pages/pref.html` (Week 1: Ch 1, 4, 12; Week 2: Ch 2, 5, 6; Week 3: Ch 7, 8, 9; Week 4: Ch 3, 10, 11, 13). It is static text. Nothing tracks it, reminds anyone, or adapts to a start date.
- Each chapter ends with a "Test your knowledge" box: **three multiple-choice questions plus one fill-in-the-blank, four per chapter, 52 in all** (`KNOWLEDGE_CHECKS`, `legacy/js/widgets-practice.js:~866`). Scores are not stored, and questions carry no concept label.
- The drills (`choiceDrill`) already have an optional `tag` field, but it is a display label, not a concept id.
- Progress is a `read` map in `localStorage` (`handbookState`), marked when a sentinel scrolls into view. Scrolling past a chapter counts as reading it.
- Chapters are small: 308 to 1,298 words (about 10,700 total, so 2 to 7 minutes of reading each). **The time cost is the "Try it today" exercises, which the preface sizes at up to an hour.** A plan that schedules reading minutes alone will under-budget every week.
- Headings in `content/pages/*.html` have no `id` attributes, so nothing can deep-link to "the section about 8x8".
- Port status: the state layer (migration phase 2), widgets (phase 3) and accounts (phase 5) are not built yet. See `docs/nextjs-migration-plan.md`.

## Goal and design principles

The goal is that a new agent can still *do* the thing in week 8, not that they finished the book. That points to five principles:

1. **Retrieval beats rereading.** Quizzing is the main learning tool here, not a grading step at the end. Questions come after reading, then again on a schedule.
2. **Space it.** A concept missed today returns tomorrow, then in about 3 days, a week, two weeks, a month. Passing moves it out; missing pulls it back in. Spacing only counts across days: repeating a question within one sitting is practice, not review.
3. **Mix it.** The review queue interleaves chapters. Block-by-chapter quizzes feel easier and teach less.
4. **Send the learner back to the exact passage.** A wrong answer should land on the paragraph that answers it, not "reread Chapter 5".
5. **Reminders should lower the cost of starting.** One small, specific next action with a link that opens straight to it. No guilt, no streak-loss threats, and an easy way to slow down or stop.

Everything in the learning loop works with no account and no network. Reminders and cross-device sync need an identity; the learning loop does not.

## Release scope

**v1 (the learning loop plus the plan):**

- Plan setup and the `/plan` Today view.
- Explicit exercise completion ("Did").
- Chapter checks writing concept states.
- A capped `/review` queue with the confidence prompt.
- Local-only, then synced once phase 5 ships. Email reminders follow as v1.1.

**Deferred until v1 has real usage data:**

- Pre-test, weekly mixed quiz, final readiness check, the "revisit these" list.
- Concept map, chapter weak banners (they need anchors on every page first).
- Adaptive "skim" recommendations.
- Milestone messages and review-due reminders.
- SMS.

**Why this cut:** the first four items are the smallest set that exercises grading, scheduling, reflow, sync and delivery, which is where the expensive design mistakes live. Everything deferred sits on top of them and is cheaper to add once they work.

**Build order inside v1:** one complete chapter-to-review flow first (see "First vertical slice"), then expand the item bank.

## The learner experience

### 1. Start the plan

On first visit to the preface (and from a "My plan" link in the sidebar):

- Pick a **start date**, a **pace** (the 4-week default, a 2-week sprint, or an 8-week relaxed version), and **study days and time** (for example Mon/Wed/Fri, 8:00 a.m. Eastern).
- The screen shows the **effective schedule before confirming**: the dates sessions land on, the end date, the reminder time with its time zone, and a warning when the chosen study days cannot meet the pace (see "Schedule rules").
- Sessions are generated by one pure function from `{ startDate, pace, studyDays, timezone, completed }`. The week-to-chapter mapping lives in `content/data/plan.ts`, so the preface list and the planner cannot drift apart.
- (Deferred) An optional pre-test; see "Assessments".

### 2. Today

A page at `/plan` (and a small card at the top of the sidebar) shows only what is next:

> **Today: Chapter 4, Your CRM** · read 5 min · set up your pipeline 45 min · then 4 check questions

Below it: the review queue count, the week's sessions, and a "Reschedule" button. Falling behind **re-flows the remaining sessions** from today; it never shows a wall of red overdue items.

### 3. Follow progress

Three honest measures, shown separately, because "I read it" and "I know it" are different:

| Measure | Source | Shown as |
| --- | --- | --- |
| Read | scroll sentinel (existing) plus an explicit "Mark read" button, since scrolling past is not reading. Only the button counts toward session completion. | chapter ticks, bar |
| Did | explicit "I did this" on the Try-it exercise (and the existing checklist widgets, which pre-fill it but do not complete it) | per-chapter dot |
| Know | concept mastery from quiz attempts | per-chapter strength meter (the concept map is deferred) |

Also show: on pace or N days behind (a fact, not a grade), sessions completed this week, and concept count by state (new, learning, reviewing, mastered). Skip streak counters: they punish a missed sick day and reward gaming.

### 4. Review what was hard

- **Review queue** at `/review`: a short deck (up to 10 questions, capped so it never becomes a chore) of whatever is due, mixed across chapters.
- **After a miss**, the feedback screen shows the explanation, then a "Read the passage" link (deep link to the anchor, once anchors exist) and requeues the concept for later in the same sitting as practice, then tomorrow as review.
- (Deferred) Chapter-page banners: "You missed 2 ideas here: Speed to lead, 8x8 cadence", with a side rule on the section until the learner retests it.

## Schedule rules

The planner is a pure function. These rules are its specification.

**Units and sessions.** The existing four weeks are four ordered *units* (W1: 1, 4, 12; W2: 2, 5, 6; W3: 7, 8, 9; W4: 3, 10, 11, 13). Flatten them in order into 13 chapters. **One session = one chapter**: read, do, check. Unit boundaries matter only for labelling ("Week 2 of the handbook"), not for scheduling.

**Pace sets a weekly cap on sessions** (any 7-day block counted from the start date), not chapters per week:

| Pace | Target length | Weekly cap |
| --- | --- | --- |
| Sprint | 2 weeks | 7 (7 then 6 with daily study) |
| Default | 4 weeks | 4 (4, 4, 4, 1 with five study days) |
| Relaxed | 8 weeks | 2 (13 sessions over 7 weeks) |

**Study days.** The planner places one session on each study day, in order, up to the pace's weekly cap. If the learner picks fewer study days than the pace needs, the plan does not silently compress; it extends the end date and says so ("With Mon and Wed only, this finishes in week 7, not week 4"). If they pick more, extra days stay free.

**Workload.** Each chapter has a hand-written read time and exercise time. A session's total is shown. Sessions over 75 minutes are flagged on the setup screen so the learner can add a day or move to a slower pace. The exercise is part of the session, never optional filler.

**What counts as a completed session.** All three of: read explicitly marked, exercise explicitly marked done, chapter check fully answered. A learner can use "Do the exercise later", which marks the session *partly done* and puts a single "exercise outstanding" item on the Today card. It does not count as complete and does not block the next session. Partly done sessions never appear as overdue.

**Reflow.** Triggered by the Reschedule button, or by the catch-up prompt after missed days.

- Completed sessions are frozen with their original dates and never move.
- Remaining sessions are re-placed starting at the next study day on or after today, at the pace's sessions-per-week cap and at most one session per study day. Missed sessions never pile onto today.
- The end date moves; the learner sees the new end date before confirming.
- Outstanding exercises stay attached to their chapters and are listed, not rescheduled.

**Review is separate from the reading plan.** Reviews have their own due dates (see Mastery). Reflowing the reading plan never changes a concept's `due`. A session's chapter check *creates* concept states; it does not schedule reviews by calendar position.

**Queue overflow.** The daily review queue is capped at 10. **Serve oldest-due first; defer overflow without deleting it.** Deferred concepts keep their `due` and are served on later days. If more than 30 are due, show "backlog: N waiting" and offer an extra deck. Never auto-drop or reset due dates.

## How the learning loop works

### Concept tags

A **concept** is one idea a question can test, small enough that "I know it" is a yes or no. Roughly 3 to 5 per chapter, about 50 total.

```ts
// content/data/concepts.ts
export type Concept = {
  id: string;          // 'ch5.touch-cadence'
  chapter: string;     // 'ch5'
  title: string;       // 'The 13-touch nurture cadence'
  summary: string;     // one sentence, shown in review
  anchor: string;      // 'nurture-cadence'  -> /ch5#nurture-cadence
  version: number;     // bump when the idea being tested changes materially
};

// content/data/questions.ts
export type Question = {
  id: string;
  version: number;     // bump on any edit to prompt, options or answer
  concept: string;     // Concept.id; one primary concept per question
  kind: 'mcq' | 'blank';
  // mcq: prompt, options, answer index; blank: before/after/answer/accept[]
  explain: string;     // existing explain text, kept
};
```

The existing `KNOWLEDGE_CHECKS` move into this shape, with a `concept` added to each item. Each concept needs **at least two questions** (ideally three, worded differently) or learners memorize the answer key instead of the idea. Today there are 4 questions per chapter (52 total) spread over 3 to 5 concepts, so many concepts have zero or one question and the bank has to roughly triple.

**Versioning rules.** Editing a question's wording bumps `Question.version`; old attempts stay on record but no longer count as "a different question than last time". Changing what a concept means bumps `Concept.version`; attempts against the old version are kept but excluded when deriving state, and the concept returns as *new* with a "content changed" note. Typo fixes may skip the bump; the reviewer decides.

### Confidence before the answer

Show the **question stem first, then ask "How sure are you?"** with three buttons (*Guessing / Think so / Sure*), then reveal the options. The learner must see what they are rating. For fill-in-the-blank, show the sentence with the blank, take the rating, then enable the input.

- A confident wrong answer is the most useful signal in the system. Treat it as a hard miss: back to box 1 and flag the concept.
- A correct guess does **not** advance the concept. Lucky answers should not graduate material.
- Confidence replaces the existing end-of-chapter "confidence" idea with one that feeds the scheduler.

### Mastery and scheduling (a small Leitner scheme)

Each concept the learner has seen has `box` (0 to 5), `due` (a date), and `flagged`. These are **derived** from the attempt log (see "State and storage"), never stored as the source of truth. No ML, easy to unit-test.

| Box | Meaning | Next review after a credited correct answer |
| --- | --- | --- |
| 0 | seen, never answered | n/a; first answer creates a state |
| 1 | missed recently | 1 day |
| 2 | | 3 days |
| 3 | | 7 days |
| 4 | | 14 days |
| 5 | "mastered" label | 30 days, and it **keeps recurring every 30 days** |

Box 5 is a label, not an exit. A concept never leaves the schedule, so long-term retention is actually measured. A correct, credited answer at box 5 keeps the box at 5 and sets the next due date 30 days out.

**Credited answers.** Only a **scheduled attempt** can advance a box: the learner's *first* attempt on that concept on a given local calendar day, made when the concept is due (or has never been answered). Later attempts that day (same-session re-tests, repeated sittings) are *practice*: a wrong practice answer still demotes and flags, but a correct practice answer never advances the box or moves `due`. That prevents graduating a concept through several boxes in one sitting.

```ts
const INTERVALS = [0, 1, 3, 7, 14, 30] as const; // days, indexed by box

type Confidence = 'guess' | 'think' | 'sure';

function grade(
  c: ConceptState,
  a: { correct: boolean; confidence: Confidence; scheduled: boolean },
  now: Date,
): ConceptState {
  if (!a.correct) {
    const box = a.confidence === 'sure' ? 1 : Math.max(1, c.box - 2);
    return { ...c, box, due: addDays(now, 1), flagged: true };
  }
  if (!a.scheduled) return c;                        // practice: no credit
  if (a.confidence === 'guess') {
    return { ...c, due: addDays(now, 1) };           // lucky guess: no credit, see it tomorrow
  }
  const nextBox = Math.min(5, c.box + 1);
  return { ...c, box: nextBox, due: addDays(now, INTERVALS[nextBox]), flagged: false };
}
```

`nextBox` is computed once and used for both the box and the interval, so box 5 can never read past the end of `INTERVALS`. `addDays` works in the learner's time zone on calendar dates, not 24-hour offsets, so DST and month ends behave.

Rules that keep it from getting annoying:

- **Cap the daily queue at 10 questions.** Overflow is deferred, oldest-due first, never deleted.
- **Serve a different question** for the same concept than last time when one exists.
- **Interleave**: sort the day's deck so no more than two questions from one chapter run in a row.
- **Same-session re-test** of a missed concept after other questions (at least 3 later), not immediately, so it tests memory rather than echo. This is practice, per above.

### Assessments

| Assessment | When | Length | Purpose | Release |
| --- | --- | --- | --- | --- |
| Chapter check (exists) | end of each chapter session | 3 mcq + 1 blank | first retrieval, creates concept states | v1 |
| Review queue | daily, on demand | up to 10 | spaced re-test across chapters | v1 |
| Pre-test (diagnostic) | optional, at plan start | 10 | shows the learner a starting point | later |
| Weekly mixed quiz | last session of each plan week | 10, interleaved | spaced re-test plus a cross-chapter read | later |
| Final readiness check | after the last session | about 25, sampled | readiness picture and "go back to" list | later |

**The final is a sampled readiness check, not a full audit.** With about 50 concepts and one primary concept per question, 25 questions can touch about half of them. The check samples with these rules: at least one question per chapter, then prefer flagged, lowest-box and never-credited concepts. The result says "checked 24 of 51 ideas" and never implies the rest were covered. Full coverage comes from the review queue running over the weeks; if a complete sweep is wanted, split it into short sessions of about 10, offered over a few days.

The result is not pass or fail. It is a ranked **"revisit these"** list of concepts with passage links, and it seeds the long-tail review queue.

**The pre-test is a diagnostic only.** Ten questions across thirteen chapters cannot identify which chapters to skim, so v1 and v1.1 never mark a chapter "skim" from it. If adaptive skimming is added later, require chapter-specific evidence first (for example at least two confident-correct answers on that chapter's concepts, drawn from different concepts). Pre-test versus final comparisons are shown **only on concepts tested in both**, using parallel items of comparable difficulty, labelled "indicative". There is no headline percentage improvement.

Scenario questions ("A buyer texts at 9 p.m. Day 2 of your nurture plan. What do you send?") are worth more than recall questions for the final. Writing them is a content job, listed below.

## Reminders

Email first, SMS later. v1.1 sends **Session** and **Weekly summary** only.

### What gets sent

| Kind | Trigger | Channel | Release | Example |
| --- | --- | --- | --- | --- |
| Session | morning of a scheduled study day, at the learner's chosen time | email | v1.1 | "Today: Chapter 4 (about 50 min including the CRM setup). Open it: <link>" |
| Weekly summary | end of week | email | v1.1 | what you finished, what to revisit, next week's chapters |
| Catch-up | 3 missed study days | email | v1.1 | "Want to move your plan? Pick a new pace: <link>" (re-plans; does not scold) |
| Review due | 5 or more questions due and none answered in 24 hours | email; SMS later | later | "5 quick review questions are ready (3 min): <link>" |
| Milestone | week quiz done, final done | email | later | what changed since the pre-test |
| Any kind via SMS | same triggers | SMS, opt-in only | later | |

**Hard rules**

- **At most one message per day per channel.** Enforced by the schema, not by convention (see outbox).
- **Priority when several kinds qualify** (one planner pass picks one): Catch-up, then Session, then Weekly summary, then Review due, then Milestone. Catch-up wins because a Session reminder for a plan the learner has fallen off is the wrong message.
- **Send window is 8:00 a.m. to 8:30 p.m. local, send time defaults to 8:00 a.m.** Quiet hours are before 8:00 a.m. and after 9:00 p.m.; the 30-minute margin lets retries finish. The setup screen only offers times inside the window and shows the effective time with its time zone ("Mon/Wed/Fri at 8:00 a.m. Eastern").
- **Skip on meaningful study activity, not any visit.** Skip a Session reminder if the session has any recorded activity today (read marked, exercise marked, or a check answered), or is complete. Skip a Review-due reminder if any question was answered in the last 24 hours. Opening the app, or visiting an unrelated chapter, suppresses nothing.
- A one-click pause ("pause for 2 weeks") and a way to change frequency without unsubscribing.

### Making the link do the work

Every message deep-links to the exact next thing (`/plan/today`, `/review`). Links are designed so an email scanner cannot burn them or change anything.

- **Opaque random token**, at least 128 bits, stored **hashed** in `link_tokens` (see tables) with `purpose`, `user_id`, `expires_at`, `used_at`. No user data is encoded in the token.
- **`GET /r/[token]` never changes state and never consumes the token.** It renders a small page ("Open today's plan") with a button. Mail scanners and link previewers fetch URLs but do not click buttons.
- **The button POSTs to exchange the token** atomically (`UPDATE ... SET used_at = now() WHERE used_at IS NULL AND expires_at > now() RETURNING`). Success sets a short-lived session cookie with a **narrow scope** (open the plan and review pages, record answers; no email change, no deletion, no account settings) and redirects to the target so the token leaves the URL. Send `Referrer-Policy: no-referrer` and `Cache-Control: no-store` on the interstitial.
- **Expiry:** 72 hours for session and review links. **Replay:** a used or expired token shows "this link was already used, sign in to continue", with no state change. If the browser already holds a valid session, skip the interstitial and go straight to the target.
- **Unsubscribe and pause links are a separate purpose.** They support RFC 8058 one-click (`List-Unsubscribe` plus `List-Unsubscribe-Post`) so mail clients can do it with a POST. A browser `GET` shows a confirmation button; it does not unsubscribe on load.
- **Tokens are not logged** and are excluded from any analytics.

### SendGrid (email) and Twilio (SMS)

Both are called from server code only; keys are never `NEXT_PUBLIC_*`.

- **SendGrid:** authenticate the sending domain (SPF, DKIM, and a DMARC record) before the first send, or reminders land in spam and the whole feature quietly fails. Use a dedicated sender subdomain. Every email carries an unsubscribe link and a physical mailing address (CAN-SPAM). Subscribe to the **Event Webhook** (delivered, bounce, spam report, unsubscribe) and write those back to the channel status and the outbox. Pass our `outbox.id` as custom data so events can be matched to rows.
- **Twilio** (later): use a **Messaging Service**, not a loose number. US application-to-person texting requires **A2P 10DLC brand and campaign registration**, which can take days or weeks to approve, so start it first. Point Twilio's inbound webhook at us so `STOP`, `START` and `HELP` update our consent and suppression records (Twilio blocks sending to a number that sent STOP, but our table must agree so the UI is truthful).
- **Both webhooks verify the provider's signature** before touching the database. Both are idempotent.
- Wrap each provider in a small interface (`sendEmail(msg)`, `sendSms(msg)`) so the scheduler never imports a vendor SDK. Both providers have plain REST APIs, so `fetch` may be enough and avoid a dependency. That is your call; see open questions.

### Consent, suppression and deletion

The handbook's own review flagged that the book prescribes automated texts without a consent step. The coach must not repeat that.

- Email and SMS are **separate, unchecked opt-ins**. A phone number is asked only when SMS is chosen.
- SMS uses **double opt-in**: learner enters a number, receives "Reply YES to get study reminders from <name>. Msg & data rates may apply. Reply STOP to quit." and nothing else is sent until YES.
- Store the exact consent text shown, a timestamp, and the IP or user agent, per channel.
- **Scope of an opt-out is stated in the UI and the message.** An email unsubscribe stops *reminder* email. It does not stop account-security email (sign-in links), which is a separate category and says so. SMS `STOP` stops SMS to that number from this service and does not change email. The two never silently affect each other; each shows its own status.
- **Suppression survives account deletion.** It lives in its own table keyed by `(channel, destination_hash)` with no foreign key to `users`, where `destination_hash` is a keyed hash (HMAC with a server-side secret) of the normalized email or E.164 number. The sender checks suppression *and* consent before every send. Deleting a user removes the user's consent rows' link to them (`user_id` set null), their prefs, outbox and attempts, but not the suppression row. Re-subscribing requires a fresh opt-in that clears the suppression row and logs why.
- **Retention:** suppression rows are kept indefinitely (they contain only a hash, a channel and a reason). Consent evidence (text shown, timestamp, IP) is kept for a period counsel specifies and then deleted or reduced to the hash. **Counsel decides the period; this doc does not.**
- Honor quiet hours and honor STOP immediately.
- Have counsel review the SMS wording, the retention period and registration before launch. This doc is a design, not legal advice.

## Architecture

It rides on the migration plan, not beside it.

### State and storage

**Attempts are the source of truth.** Concept state is derived by replaying attempts, so any device with the same attempts computes the same state.

```ts
type Attempt = {
  id: string;               // client-generated UUID (v7 preferred), immutable
  questionId: string;
  questionVersion: number;
  conceptId: string;
  conceptVersion: number;
  correct: boolean;
  confidence: 'guess' | 'think' | 'sure';
  kind: 'chapter_check' | 'review' | 'retest' | 'diagnostic';
  answeredAt: string;       // client clock, ISO
  deviceId: string;
};
```

Local store slices (same zod-validated, try/catch-guarded `localStorage` pattern from migration phase 2):

```ts
planPrefs:  { startDate, pace, studyDays: number[], time: string, tz: string, updatedAt }   // inputs only
completions: Record<SessionId, { read?: string; did?: string; checked?: string }>            // set-like, monotonic
attempts:   Attempt[]        // uncapped; compact, a few thousand rows is still small
concepts:   cache rebuilt from attempts; safe to discard
```

The session list is derived from `planPrefs` plus `completions`, not stored. Anonymous learners get the whole loop on-device.

### Sync (phase 5)

Signing in syncs through server tables, not through "newest-wins" blobs.

- **Attempts:** append-only. The server dedupes by `attempt.id` (`INSERT ... ON CONFLICT DO NOTHING`), so a device can re-send safely. Merge is set union; two devices cannot overwrite each other's attempts.
- **Replay order:** by `(min(answeredAt, receivedAt), id)`. Server `receivedAt` clamps any attempt claiming a time in the future (device clock ahead); a device clock far in the past only places its attempts earlier, where later attempts from other devices override them. The result is deterministic for a given set of attempts, which is what makes it convergent. Because mastery is a pure function of the set, one device cannot regress another's state except by genuinely contributing a wrong answer.
- **Credited-attempt rule across devices:** "first attempt on that concept that local day" is computed in replay, from the learner's `tz`, not at answer time, so two offline devices do not both claim credit.
- **Versions:** attempts store `questionVersion` and `conceptVersion`. Replay only counts attempts whose `conceptVersion` matches the current concept. A newer client talking to older content, or the reverse, is handled by version, not by timestamp.
- **Completions:** set union. A completion, once recorded, is never removed by sync; the earliest timestamp wins for display.
- **Plan preferences:** a single record with a server-assigned `updated_at`. Last write wins **per field** (start date, pace, study days, time, tz are merged independently). The server clock decides, not the device clock. The losing device is told what changed on its next sync ("your plan was updated on another device") instead of being silently overwritten.
- **Reminder prefs** are server-owned. Local edits go through `POST /api/coach/prefs`, and the server copy wins.
- The scheduler reads only the server copy, so **reminders require an account and a verified email.** Use the planned phase 5 account system; do not build a second identity path (see open questions).

### Server tables (Neon)

```sql
reminder_prefs (
  user_id      uuid primary key references users on delete cascade,
  tz           text not null,
  email_on     boolean not null default false,
  sms_on       boolean not null default false,
  phone_e164   text,                          -- only when sms_on
  send_time    time not null default '08:00'
               check (send_time between '08:00' and '20:30'),
  study_days   smallint[] not null,
  paused_until date,
  updated_at   timestamptz not null default now()
);

consent (
  id               bigserial primary key,
  user_id          uuid references users on delete set null,   -- evidence outlives the account
  channel          text not null check (channel in ('email','sms')),
  destination_hash text not null,
  action           text not null check (action in ('opt_in','confirm','opt_out')),
  text_shown       text not null,
  source           text not null,             -- 'web', 'sms_reply', 'sendgrid_unsub'
  ip               inet,
  at               timestamptz not null default now()
);

suppression (
  channel          text not null,
  destination_hash text not null,
  reason           text not null,             -- 'stop', 'unsubscribe', 'bounce', 'spam_report'
  at               timestamptz not null default now(),
  primary key (channel, destination_hash)     -- deliberately no reference to users
);

reminder_outbox (
  id             uuid primary key,
  user_id        uuid not null references users on delete cascade,
  channel        text not null,
  kind           text not null,
  local_date     date not null,               -- the learner's calendar day
  scheduled_for  timestamptz not null,
  expires_at     timestamptz not null,        -- stale morning reminders are never sent at night
  status         text not null check (status in
                   ('pending','claimed','sent','uncertain','failed','expired','skipped')),
  attempts       smallint not null default 0,
  lease_until    timestamptz,
  send_started_at timestamptz,
  provider_id    text,
  last_error     text,
  unique (user_id, channel, local_date)       -- the daily cap, enforced
);

link_tokens (
  token_hash  text primary key,               -- hash of the opaque token
  user_id     uuid not null references users on delete cascade,
  purpose     text not null,                  -- 'open_plan', 'open_review', 'unsubscribe', 'pause'
  outbox_id   uuid,
  expires_at  timestamptz not null,
  used_at     timestamptz
);
```

Server-side attempts table: `attempt_id uuid primary key`, the `Attempt` fields, `user_id`, and `received_at`. The primary key is the dedupe.

### Scheduling and delivery

A cron route (for example `GET /api/cron/reminders`, secured with a cron secret) runs in two steps. Check the current Vercel plan limits on cron frequency before relying on 15 minutes; if only daily is available, move to Vercel Queues or an external scheduler.

**1. Plan (once per user per day, in the send window).** Select users whose local send time has arrived, who are not paused, are consented, and are not in `suppression`. Evaluate all qualifying kinds together, apply the skip rules and the priority order, and insert **at most one** `pending` row with `ON CONFLICT (user_id, channel, local_date) DO NOTHING`. Because the unique key is `(user_id, channel, local_date)` and not per kind, two kinds can never both go out on the same day, and a duplicate cron run inserts nothing.

**2. Deliver (claim, send, record).**

1. Claim a row: `UPDATE ... SET status='claimed', lease_until = now() + interval '5 minutes', attempts = attempts + 1 WHERE id = (pending, or claimed with an expired lease, and not past expires_at) FOR UPDATE SKIP LOCKED RETURNING *`. Rows past `expires_at` become `expired` and are not sent.
2. Re-check consent, suppression and skip rules at send time (state may have changed since planning).
3. Set `send_started_at`, then call the provider, passing `outbox.id` as the provider's custom argument (and as an idempotency key where the provider supports one; verify).
4. On a definite success response: `sent` with `provider_id`. On a definite non-retryable rejection (bad address, suppressed): `failed` or `skipped`, and write suppression on hard bounce. On a retryable error (429, 5xx, network error *before* the request was written): back to `pending` with backoff, at most 3 attempts, never past `expires_at`.

**Uncertain delivery.** If the process dies or the connection drops *after* `send_started_at` is set and before we record the response, we do not know whether the provider accepted it. A claim whose lease expires with `send_started_at` set becomes `uncertain`, not `pending`. An `uncertain` row is reconciled by provider events (delivered, bounce) or a lookup by `outbox.id`. For email it may be retried **once** if, after 30 minutes and before `expires_at`, no provider record exists. For SMS (later) it is **never** automatically retried; a duplicate text costs money and trust. This trades a rare missed reminder for no duplicates.

A single sweep is enough for a few hundred learners. If volume grows, fan out through a queue so one slow provider call cannot stall the sweep.

### Routes

All validate input with zod, take the user id from the session (never the request), and re-check authorization server-side.

- `POST /api/coach/prefs` (create or update preferences, writes `consent` rows)
- `POST /api/coach/sms/verify` (later; double opt-in start, confirmation via the Twilio webhook)
- `POST /api/coach/progress` (sync, from phase 5; accepts attempts, completions and plan prefs)
- `GET /api/cron/reminders`
- `POST /api/webhooks/sendgrid`, `POST /api/webhooks/twilio` (later) (signature-verified)
- `GET /r/[token]` (interstitial, no state change) and `POST /r/[token]/exchange` (consumes the token, sets the narrow session, redirects)
- `POST /u/[token]` (one-click unsubscribe, RFC 8058) with a `GET` that only shows a confirm button

### Components

Server by default; `"use client"` at the leaves that need state: `PlanSetup`, `TodayCard`, `ReviewDeck`, `ConfidencePrompt`. (`ConceptMap` and `ChapterWeakBanner` are deferred.) The scheduling math (`buildPlan`, `reflow`, `grade`, `replay`, `dueQueue`, `interleave`) is pure TypeScript in `lib/coach/` with Vitest coverage, including time-zone, DST and month-end cases. Tests of the scheduler are where the bugs will live, as with the post-close scheduler in the migration plan.

## Acceptance criteria

These are the tests that must pass before a phase counts as done. Each should exist as a Vitest case, named for its rule.

### Grading (`grade`, `replay`)

- A correct credited answer at box 5 yields box 5 and `due = now + 30 days`, with no out-of-range index read.
- For every box 0 to 4, a credited correct answer yields `box + 1` and `due = now + INTERVALS[box + 1]`.
- A correct *guess* never changes the box and sets `due = tomorrow`.
- A wrong answer with `sure` sets box 1; otherwise `max(1, box - 2)`. Both set `flagged` and `due = tomorrow`.
- Five correct answers to the same concept on one local calendar day advance the box by at most one.
- A correct answer before `due` (not a scheduled attempt) never advances the box.
- `addDays` on the learner's calendar lands on the same wall-clock date across a DST change and at a month end.
- Replaying the same attempts in any arrival order produces the same state.
- Attempts with a stale `conceptVersion` are excluded from derived state; the concept shows as new.

### Schedule (`buildPlan`, `reflow`, `dueQueue`)

- Every pace places every chapter exactly once, in the unit order.
- Sessions per week never exceed the pace's cap, and never more than one per study day.
- Too few study days extends the end date and surfaces a message; it never compresses sessions.
- `reflow` leaves completed sessions unchanged and never places more than one remaining session on any single day, including today.
- `reflow` does not change any concept's `due`.
- A session with the exercise skipped is *partly done*, not complete, and never appears overdue.
- `dueQueue` returns at most 10, oldest-due first, and the deferred remainder is untouched.
- No chapter appears more than twice in a row in the interleaved deck, when the pool allows it.

### Sync

- Sending the same attempt twice stores one row.
- Two devices that answer offline and then sync converge to identical derived state on both.
- A device with a clock one week ahead cannot place an attempt in the future; one week behind cannot overwrite later attempts' effect.
- Concurrent plan-pref edits to different fields both survive; to the same field, the later server write wins and the other device is told.
- A completion is never removed by sync.

### Delivery

- Two overlapping cron runs produce at most one outbox row per `(user, channel, local_date)`.
- If two kinds qualify the same day, exactly one row exists, and it is the higher-priority kind.
- Killing the process between claim and send leaves the row retryable (`pending` after the lease), without a duplicate.
- Killing the process after `send_started_at` and before the response is recorded leaves the row `uncertain`, and the sender does not resend SMS and resends email at most once after reconciliation.
- A row past `expires_at` is `expired`, not sent.
- A suppressed or opted-out destination is never sent to, even after the user's account is deleted and recreated.
- A send time outside the 8:00 to 20:30 window is rejected by the form and by the DB constraint.
- A Session reminder is skipped after reading or a check answer that day, and not skipped after an unrelated page visit.
- A `GET` to a signed link changes no state; a second `POST` exchange of the same token fails; an expired token fails; the cookie it sets cannot reach account settings.
- A webhook with a bad signature changes nothing.

## First vertical slice

Before expanding the item bank, build one chapter from check to review, end to end, with real tags and real questions. Pick one mid-sized chapter (not the shortest; pick one with both a quick read and a real exercise).

1. Tag that chapter's concepts, add anchors to its page, and write 2 to 3 questions per concept.
2. Chapter check records attempts with confidence.
3. `replay` derives concept states; `grade` and `dueQueue` pass the acceptance cases above.
4. `/review` serves a capped deck the next day; a miss requeues correctly; a same-day repeat gives no credit.
5. The chapter's session appears on `/plan` with read, do and check, and reflows after a skipped day.
6. Two browser profiles with the same attempts show the same state (a stand-in for sync until phase 5).

Then review what was awkward before tagging the other twelve chapters. This flushes out the expensive mistakes (concept granularity, question count, plan placement, version handling) while they are cheap to fix.

## Content work that has to happen

1. **Fix the contradictions before tagging them** (`docs/handbook-webpage-review.md`): the 8x8 definition, 8 to 12 versus 13 touches, and the Chapter 2 checkpoint mismatch. A concept tag on a contradictory idea makes a quiz that teaches the wrong answer.
2. **Add anchors**: a stable `id` on every `h2` and `h3` that a concept points to. Done by a one-time script plus a unit test that every `Concept.anchor` exists in its page, so renaming a heading cannot silently break a review link.
3. **Write the item bank**: aim for 3 questions per concept (about 150 total from today's 52), at least a quarter scenario-style. The final readiness check needs its own sampled pool, and the pre-test, if built, needs parallel items for the concepts it shares with the final. This is the biggest cost in the project and should be reviewed by someone who has worked as an agent.
4. **Time estimates**: a per-chapter "minutes" figure for reading and for the Try-it exercise, written by hand (the exercise times vary too much to compute).
5. **Question and concept versions**: a convention for when an edit bumps a version, and who decides.

## Phases

Ordered by learning value per unit of effort. The first three need no vendor, no account and no database.

| Phase | Deliverable | Depends on | Rough size |
| --- | --- | --- | --- |
| A0 | **First vertical slice** (one chapter, check to review, with tests) | migration phase 2 (store) | 2 to 3 days |
| A | Concept registry, anchors, tagged and expanded bank for the remaining chapters, `grade`/`replay`/`dueQueue` with the grading and schedule tests | A0 | 3 to 5 days, mostly content |
| B | Plan setup, `/plan` Today view, explicit exercise completion, reflow, three progress measures, in-app only | A, migration phase 3 widgets | 2 to 3 days |
| C | `/review` deck, confidence prompt, capped queue (the v1 learning loop) | A, B | 2 to 3 days |
| D | Accounts and attempt/completion/plan-prefs sync | migration phase 5 | counted in that phase |
| E | Email reminders (Session, Weekly, Catch-up): SendGrid, consent, outbox, signed links, webhook, unsubscribe | D | 3 to 4 days, plus domain authentication lead time |
| Later | Pre-test, weekly mixed quiz, final readiness check, concept map and chapter banners, review-due and milestone reminders, adaptive skim | C, usage data | decide after v1 |
| Later | SMS reminders: Twilio, double opt-in, STOP/HELP sync | E | 2 to 3 days, plus 10DLC registration lead time |

Why this order: the habit loop (plan, retrieve, space, revisit) is what teaches. Reminders amplify a loop that already works, and a reminder that links to a thin experience just trains people to ignore the next one. Start the SendGrid domain setup during phase B anyway, because its approval time, not the code, will gate E. Twilio registration starts only when SMS is committed to.

Estimates are rough. Re-estimate after A0, since the item bank is the uncertain part.

## How we will know it works

Track, per learner, only what answers a question:

- **Plan completion**: share of scheduled sessions finished within 2 days of their date, by whether reminders are on. This is the direct test of the reminder feature.
- **Reminder to action**: percentage of sends followed by *meaningful study activity* (not a bare visit) within 24 hours, by kind and channel. Cut the kinds that nobody acts on.
- **Learning**: first-attempt correctness by concept, and 30-day retention on box-5 concepts (possible because box 5 keeps recurring). Pre-test versus final, when those exist, is reported only on shared concepts and labelled indicative.
- **Harm**: opt-out and unsubscribe rate per kind. A rising rate means cadence is too high.
- **Delivery health**: counts of `uncertain`, `failed` and `expired` outbox rows per week. Anything above a handful means the delivery design is leaking.

Do this with aggregate counts and no new third-party analytics unless you ask for one. The quiz and confidence data are personal; offer "delete my data" and mention it in the footer.

## Risks

- **Reminder fatigue.** Mitigated by the daily cap, skip-on-activity, pause, and fewer kinds by default. Start with Session and Weekly only; add Review-due after seeing the numbers.
- **Item-bank quality.** A poor question teaches a wrong thing quickly. Needs expert review and a "report this question" link feeding a short list.
- **Premature mastery or false confidence from sparse data.** Mitigated by credit rules, sampled-not-complete labelling on the final, and no skim recommendations from the pre-test.
- **Over-gamifying.** No streaks, leaderboards or badges in v1. The motivator is visible competence on a real job.
- **Delivery edge cases.** Crashes, lost responses and email scanners are real. The outbox, `uncertain` state and token interstitial exist for them; the acceptance criteria exercise each.
- **SMS compliance and deliverability.** Unregistered or badly worded campaigns get filtered or blocked. Treat registration and consent copy as launch blockers if SMS is built, not follow-ups.
- **Identity gap.** Reminders cannot work for anonymous learners. The ask for an email must say why (to remind you), not look like the old gate.
- **Time zones.** Store `tz` explicitly; do not infer from the server. Test the DST weeks.
- **Privacy of suppression data.** A hashed destination is still personal data in some regimes. Counsel reviews the retention and hashing approach.

## Open questions

Resolved by this revision (change them if you disagree):

- **Account model for reminders:** use the phase 5 accounts (Neon Auth). No second identity path unless a concrete deadline justifies the cost.
- **SMS in v1:** no. Email first; SMS once there is evidence that email nudges work.
- **Final assessment stakes:** private readiness report only.

Still open:

1. **Dependencies.** Official `@sendgrid/mail` and `twilio` SDKs, or plain `fetch` against their REST APIs plus manual webhook-signature checks? (Per your rule I have not added anything.)
2. **Scheduler.** Is Vercel Cron on your plan frequent enough, or should this use Vercel Queues or an external scheduler?
3. **Who authors the item bank**, and who reviews it for accuracy?
4. **Sender identity.** What name, domain and mailing address appear on messages (and, later, on the "Reply YES" text)?
5. **Retention period for consent evidence**, and whether hashed suppression rows are acceptable under counsel's reading of the rules that apply to you.
6. **Exercise completion wording.** Is "I did this" enough, or should some exercises (for example CRM setup) require evidence such as a short free-text note?
7. **Concept granularity.** Is about 50 concepts the right size, or does the first vertical slice suggest bigger or smaller ones?
