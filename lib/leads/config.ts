// The email gate's shared constants. The consent text is what the reader was shown when they submitted; the
// server stores the text for the version they name, never text the browser sends.
export const GATE_KEY = 'handbookAccess'; // same key as the static site, so readers who skipped it stay skipped on the same origin

export const CONSENT_VERSION = 'v1';
export const CONSENT_PURPOSE = 'Leave your email for a follow-up note about the handbook. This form is not a key to the book.';
export const CONSENT_DETAILS =
  'Your address is stored by the author and sent through SendGrid, the email service. It is used only to send follow-up notes about this handbook. Reply "unsubscribe" to any note and they stop. It is not sold, and it is not an account. If you continue without email, nothing is sent.';
export const CONSENT_TEXTS: Record<string, string> = { [CONSENT_VERSION]: `${CONSENT_PURPOSE} ${CONSENT_DETAILS}` };

// Attempts count whether or not they succeed, so retrying a broken request cannot be used to spam either.
export const RATE_LIMIT = { attempts: 5, windowSeconds: 600 } as const;
export const MAX_BODY_BYTES = 2048;
