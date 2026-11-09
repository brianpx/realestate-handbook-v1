import { deliver, type MailConfig, type Message } from '@/lib/leads/mail';
import type { EmailStatus } from '@/lib/leads/store';
import { TOKEN_TTL_SECONDS } from './config';

/**
 * The sign-in message uses the same sender and providers as the follow-up note, with one difference: it is a
 * transactional message the reader asked for a moment ago, so it goes out without the postal address the
 * marketing note needs. It still needs a from-address, which must be verified (SPF, DKIM) before any real send.
 */
export function authMailFromEnv(env: Record<string, string | undefined>): MailConfig {
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
  return {
    subject: 'Your sign-in link',
    text: [
      'Open this link to sign in to Finding, Nurturing, and Keeping Clients:',
      '',
      link,
      '',
      `It works once and expires in ${minutes} minutes. If you did not ask for it, ignore this message; nothing happens without the link.`,
    ].join('\n'),
  };
}

export const sendSignInLink = (cfg: MailConfig, to: string, link: string, fetchImpl: typeof fetch = fetch): Promise<EmailStatus> =>
  deliver(cfg, to, signInMessage(link), fetchImpl, 'sign-in email');
