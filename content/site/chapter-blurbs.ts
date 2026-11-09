import type { PageId } from '@/lib/pages';

// One line per member page for the upsell card (components/handbook/UpsellCard.tsx): what the page teaches, in
// the chapter's own terms. The free pages need none; they always open.
export const CHAPTER_BLURBS: Partial<Record<PageId, string>> = {
  ch2: 'Where your first conversations come from: choosing two lead sources you can work every week, and what each one costs you per closing.',
  ch3: 'What people see once they look you up: a brand presence that holds up to the search a new contact makes before deciding to reply.',
  ch4: 'Your CRM as the daily operating system: one place every lead lands, with the setup and the morning routine that keep it honest.',
  ch5: 'Following up with leads that are not ready yet: plans by lead type, so curious and early contacts hear from you until the timing is right.',
  ch6: 'The words for every first contact and follow-up, with a practice mode: say the script out loud from memory, then check yourself.',
  ch8: 'The week as a system: protected prospecting blocks, a Friday review, and the habits that replace willpower.',
  ch9: 'The meeting itself: running a buyer or seller consultation, and answering objections without losing the relationship.',
  ch10: 'Keeping clients after the closing: the post-close plan that turns one transaction into the next referral.',
  ch11: 'The rules every touch sits inside: consent before automated texts, fair housing, agency disclosure and do-not-call, learned once and made habit.',
  ch12: 'Your first 90 days on a calendar: the daily, weekly and monthly plans, with the day 30, 60 and 90 milestones.',
  ch13: 'Resources and next steps once the system is running: where to keep learning and what to build next.',
  'app-a': 'The weekly activity scorecard: fill it in every Friday and compare your numbers with the first-90-days targets.',
  'app-b': 'Four follow-up plans to build into your CRM in one afternoon, each message written in your own voice.',
  'app-c': 'The CRM setup checklist: every item to finish in your first week, in the order Chapter 4 sets things up.',
  'app-d': 'The glossary: every term the handbook uses, in plain words.',
  'app-e': 'Every interactive tool in the handbook in one place, with where each one lives.',
  'app-f': 'Essential links: trusted sources to bookmark, from licensing to fair housing.',
};
