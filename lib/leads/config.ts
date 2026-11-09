// The lead form's shared constants. The consent text is what the reader was shown when they submitted; the
// server stores the text for the version they name, never text the browser sends.
export const CONSENT_VERSION = 'v1';
export const CONSENT_PURPOSE = 'Leave your email for a follow-up note about the handbook. This form is not a key to the book.';
export const CONSENT_DETAILS =
  'Your address is stored by the author and sent through SendGrid, the email service. It is used only to send follow-up notes about this handbook. Reply "unsubscribe" to any note and they stop. It is not sold, and it is not an account. If you continue without email, nothing is sent.';
export const CONSENT_TEXTS: Record<typeof CONSENT_VERSION, string> = { [CONSENT_VERSION]: `${CONSENT_PURPOSE} ${CONSENT_DETAILS}` };

// Which form the address came through: the optional checkbox under a sign-in form, the offer after the sample
// lesson, or the card a signed-in reader meets on a chapter outside their plan. Stored on the lead so the admin
// overview can compare placements.
export const LEAD_SOURCES = ['signup', 'sample', 'upsell'] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

// The list is confirmed opt-in: the address is stored at once but counts as subscribed only when the reader opens
// the emailed link. The page at CONFIRM_PATH shows the one-button form that posts to /api/lead/confirm.
export const CONFIRM_PATH = '/subscribe/confirm';

// What the standalone form offers (decision OD-02): a purchase notice while nothing is on sale, the daily-number
// offer once it is. The open-state email that carries the number is not built yet; the owner confirms this copy
// before purchaseOpen() flips.
export const OPT_IN_OFFER = {
  closed: { title: 'Tell me when purchase opens', text: 'One email when the handbook goes on sale, and an occasional note about it until then. We email you a link to confirm first.' },
  open: { title: 'Email me my daily number and the Chapter 1 card', text: 'Your daily conversation target and the Chapter 1 summary card, then an occasional note about the handbook. We email you a link to confirm first.' },
} as const;

// Attempts count whether or not they succeed, so retrying a broken request cannot be used to spam either.
export const RATE_LIMIT = { attempts: 5, windowSeconds: 600 } as const;
export const MAX_BODY_BYTES = 2048;
