import { productionDatabaseRefused } from '@/lib/db/production-refusal';
import { emailHtml, emailText, type EmailCard } from '@/lib/email/layout';
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
  const safeLink = link.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  return {
    subject: 'Your sign-in link',
    text: [
      'Open this link to sign in to Finding, Nurturing, and Keeping Clients:',
      '',
      link,
      '',
      `It works once and expires in ${minutes} minutes. If you did not ask for it, ignore this message; nothing happens without the link.`,
    ].join('\n'),
    html: `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Your sign-in link</title></head>
<body style="margin:0;padding:0;background:#f5f3ee;color:#242824;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f3ee;"><tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #deded6;border-radius:12px;"><tr><td style="padding:32px 24px;">
      <p style="margin:0 0 28px;font-size:14px;line-height:22px;color:#515c50;">Finding, Nurturing, and Keeping Clients</p>
      <h1 style="margin:0 0 16px;font-size:28px;line-height:36px;">Your sign-in link</h1>
      <p style="margin:0 0 24px;font-size:16px;line-height:26px;">Sign in to your handbook. No password needed.</p>
      <table role="presentation" cellspacing="0" cellpadding="0"><tr><td bgcolor="#304b3a" style="border-radius:6px;text-align:center;">
        <a href="${safeLink}" style="display:inline-block;padding:14px 28px;border:1px solid #304b3a;border-radius:6px;color:#ffffff;font-size:16px;line-height:24px;font-weight:bold;text-decoration:none;">Sign in</a>
      </td></tr></table>
      <p style="margin:24px 0 0;font-size:14px;line-height:22px;">This link works once and expires in ${minutes} minutes.</p>
      <p style="margin:16px 0 0;font-size:14px;line-height:22px;color:#515c50;">If you did not ask for it, you can ignore this email.</p>
      <hr style="margin:28px 0;border:0;border-top:1px solid #deded6;">
      <p style="margin:0 0 8px;font-size:13px;line-height:21px;color:#515c50;">If the button does not work, copy and paste this link into your browser:</p>
      <p style="margin:0;font-size:13px;line-height:21px;word-break:break-all;overflow-wrap:anywhere;"><a href="${safeLink}" style="color:#304b3a;word-break:break-all;">${safeLink}</a></p>
    </td></tr></table>
  </td></tr></table>
</body>
</html>`,
  };
}

export const sendSignInLink = (cfg: MailConfig, to: string, link: string, fetchImpl: typeof fetch = fetch): Promise<EmailStatus> =>
  deliver(cfg, to, signInMessage(link), fetchImpl, 'sign-in email');

/** The note a buyer gets once a paid order is on file. Same one-time link as sign-in, with no price and no postal address. */
export function readyMessage(link: string): Message {
  const minutes = Math.round(TOKEN_TTL_SECONDS / 60);
  return {
    subject: 'Your handbook is ready',
    text: [
      'Your copy of Finding, Nurturing, and Keeping Clients is ready. Open this link to sign in:',
      '',
      link,
      '',
      `It works once and expires in ${minutes} minutes. If you did not buy the handbook, ignore this message.`,
    ].join('\n'),
  };
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

export const sendWelcome = (cfg: MailConfig, to: string, origin: string, fetchImpl: typeof fetch = fetch): Promise<EmailStatus> =>
  deliver(cfg, to, welcomeMessage(origin), fetchImpl, 'welcome email');

export const sendAccountDeleted = (cfg: MailConfig, to: string, origin: string, notesRemoved: boolean, fetchImpl: typeof fetch = fetch): Promise<EmailStatus> =>
  deliver(cfg, to, accountDeletedMessage(origin, notesRemoved), fetchImpl, 'deletion email');
