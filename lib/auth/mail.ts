import { productionDatabaseRefused } from '@/lib/db/production-refusal';
import { emailHtml, emailText, originOf, type EmailCard } from '@/lib/email/layout';
import { deliver, type MailConfig, type Message } from '@/lib/leads/mail';
import type { EmailStatus } from '@/lib/leads/store';
import { BOOK_TITLE } from '@/lib/pages';
import { DEFAULT_NEXT_PATH, SIGN_IN_PATH, TOKEN_TTL_SECONDS } from './config';

const message = (subject: string, card: EmailCard): Message => ({ subject, text: emailText(card), html: emailHtml(card) });

/**
 * The sign-in message uses the same sender and providers as the follow-up note, with one difference: it is a
 * transactional message the reader asked for a moment ago, so it goes out without the postal address the
 * marketing note needs. It still needs a from-address, which must be verified (SPF, DKIM) before any real send.
 * A non-production deployment pointed at the production database returns no provider, so the ready email
 * cannot send either.
 */
export function authMailFromEnv(env: Record<string, string | undefined>): MailConfig {
  if (productionDatabaseRefused(env)) return { provider: 'none' };
  const from = env.LEAD_FROM_EMAIL;
  const common = { fromName: env.LEAD_FROM_NAME ?? 'Finding, Nurturing, and Keeping Clients', replyTo: env.LEAD_REPLY_TO ?? from, mailingAddress: env.LEAD_MAILING_ADDRESS ?? '' };
  if (env.SENDGRID_API_KEY) {
    if (!from) return { provider: 'none' };
    return { provider: 'sendgrid', apiKey: env.SENDGRID_API_KEY, from, ...common };
  }
  if (env.MAILPIT_URL) return { provider: 'mailpit', url: env.MAILPIT_URL.replace(/\/$/, ''), from: from ?? 'handbook@example.test', ...common };
  return { provider: 'none' };
}

export function signInMessage(link: string): Message {
  const minutes = Math.round(TOKEN_TTL_SECONDS / 60);
  return message('Your sign-in link', {
    origin: originOf(link),
    preheader: `It works once and expires in ${minutes} minutes.`,
    headline: 'Your sign-in link is ready',
    intro: `Select the button below to sign in to ${BOOK_TITLE}. No password needed.`,
    action: { href: link, label: 'Sign in' },
    expires: `Works once and expires in ${minutes} minutes.`,
    fallback: { label: 'Button not working? Paste this link into your browser:', href: link },
    closing: ["Didn't ask for this? You can ignore this email. Nothing happens unless the link is opened."],
  });
}

export const sendSignInLink = (cfg: MailConfig, to: string, link: string, fetchImpl: typeof fetch = fetch): Promise<EmailStatus> =>
  deliver(cfg, to, signInMessage(link), fetchImpl, 'sign-in email');

/** The note a buyer gets once a paid order is on file. Same one-time link as sign-in, with no price and no postal address. */
export function readyMessage(link: string): Message {
  const minutes = Math.round(TOKEN_TTL_SECONDS / 60);
  return message('Your handbook is ready', {
    origin: originOf(link),
    preheader: `Your copy is ready. The link works once and expires in ${minutes} minutes.`,
    headline: 'Your handbook is ready',
    intro: `Your copy of ${BOOK_TITLE} is ready. Select the button below to sign in. No password needed.`,
    action: { href: link, label: 'Sign in' },
    expires: `Works once and expires in ${minutes} minutes.`,
    fallback: { label: 'Button not working? Paste this link into your browser:', href: link },
    closing: ['If you did not buy the handbook, you can ignore this email.'],
  });
}

export const sendReadyLink = (cfg: MailConfig, to: string, link: string, fetchImpl: typeof fetch = fetch): Promise<EmailStatus> =>
  deliver(cfg, to, readyMessage(link), fetchImpl, 'ready email');

/** Sent once, the first time a sign-in creates the account. A later sign-in does not send it again. */
export function welcomeMessage(origin: string): Message {
  const handbook = `${origin}${DEFAULT_NEXT_PATH}`;
  return message(`Welcome to ${BOOK_TITLE}`, {
    origin,
    preheader: 'Your account is ready. There is no password.',
    headline: 'Your account is ready',
    intro: `This address now has an account for ${BOOK_TITLE}. There is no password. The title page, the overview, Chapter 1 and Chapter 7 are open with it.`,
    action: { href: handbook, label: 'Open the handbook' },
    closing: [
      `To sign in on another device, ask for a new link at ${origin}${SIGN_IN_PATH}. Signing in does not add you to the notes list.`,
      'If you did not just sign in, you can ignore this email.',
    ],
  });
}

/**
 * Sent after the account row has been anonymised. `notesRemoved` is false when the separate notes-list
 * deletion failed, so the reader is told how to stop those notes instead of being told they are already gone.
 */
export function accountDeletedMessage(origin: string, notesRemoved: boolean): Message {
  return message('Your account has been deleted', {
    origin,
    preheader: 'The account for this address is deleted.',
    headline: 'Your account is deleted',
    intro: 'The account for this address is deleted. Its sign-in links and sessions are ended, and the address on the account has been replaced.',
    action: { href: origin, label: 'Back to the site' },
    closing: [
      "What you saved while reading stays in this browser until you clear this site's data there.",
      notesRemoved
        ? 'This address was also taken off the notes list.'
        : 'The notes list is removed as a separate step. If a note still arrives, reply "unsubscribe".',
    ],
  });
}

// How long a first sign-in or an account deletion waits on the provider for one of these two notes. Both have already
// committed their work by then, so the reader should not wait on mail that stalls.
export const TRANSACTIONAL_SEND_TIMEOUT_MS = 5000;

export const sendWelcome = (cfg: MailConfig, to: string, origin: string, fetchImpl: typeof fetch = fetch): Promise<EmailStatus> =>
  deliver(cfg, to, welcomeMessage(origin), fetchImpl, 'welcome email', TRANSACTIONAL_SEND_TIMEOUT_MS);

export const sendAccountDeleted = (cfg: MailConfig, to: string, origin: string, notesRemoved: boolean, fetchImpl: typeof fetch = fetch): Promise<EmailStatus> =>
  deliver(cfg, to, accountDeletedMessage(origin, notesRemoved), fetchImpl, 'deletion email', TRANSACTIONAL_SEND_TIMEOUT_MS);
