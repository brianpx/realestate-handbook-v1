import { OWNER } from '../offer';
import type { EmailStatus } from './store';

// Confirmation email for the marketing list. SendGrid in production, Mailpit (a local mail catcher) in development,
// nothing otherwise. Both are plain HTTPS calls, so no client library is needed.
export type MailConfig =
  | { provider: 'none' }
  | { provider: 'mailpit'; url: string; from: string; fromName: string; replyTo?: string; mailingAddress: string }
  | { provider: 'sendgrid'; apiKey: string; from: string; fromName: string; replyTo?: string; mailingAddress: string };

export type Message = { subject: string; text: string; html?: string };

export function mailFromEnv(env: Record<string, string | undefined>): MailConfig {
  const from = env.LEAD_FROM_EMAIL;
  // The site's postal address fills the local notes footer. SendGrid ignores it: a commercial send needs
  // LEAD_MAILING_ADDRESS set on its own, so a stand-in on the site cannot start one.
  const mailingAddress = env.LEAD_MAILING_ADDRESS || OWNER.postalAddress || '';
  const common = { fromName: env.LEAD_FROM_NAME ?? 'Finding, Nurturing, and Keeping Clients', replyTo: env.LEAD_REPLY_TO ?? from, mailingAddress };
  if (env.SENDGRID_API_KEY) {
    if (!from || !env.LEAD_MAILING_ADDRESS) return { provider: 'none' };
    return { provider: 'sendgrid', apiKey: env.SENDGRID_API_KEY, from, ...common };
  }
  if (env.MAILPIT_URL) return { provider: 'mailpit', url: env.MAILPIT_URL.replace(/\/$/, ''), from: from ?? 'handbook@example.test', ...common, mailingAddress: mailingAddress || '(your mailing address goes here)' };
  return { provider: 'none' };
}

/** The one message the list sends on its own: the link that turns a form submission into a subscription. */
export function confirmationMessage(link: string, address: string): Message {
  return {
    subject: 'Confirm your email for handbook notes',
    text: [
      'You asked for notes about Finding, Nurturing, and Keeping Clients. Open this link to confirm your address:',
      '',
      link,
      '',
      'Nothing is sent until you do. If you did not ask for this, ignore this message and your address is not used.',
      'To stop the notes at any time afterwards, reply "unsubscribe".',
      '',
      address,
    ].join('\n'),
  };
}

/**
 * Sends one message with a plain-text fallback through whichever provider is configured. Logs carry the provider, the status and
 * the error name only, never the address. `label` names the caller in those logs.
 */
export async function deliver(cfg: MailConfig, to: string, { subject, text, html }: Message, fetchImpl: typeof fetch = fetch, label = 'email'): Promise<EmailStatus> {
  if (cfg.provider === 'none') return 'skipped';
  try {
    const res = cfg.provider === 'sendgrid'
      ? await fetchImpl('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: to }] }],
            from: { email: cfg.from, name: cfg.fromName },
            ...(cfg.replyTo ? { reply_to: { email: cfg.replyTo } } : {}),
            subject,
            content: [{ type: 'text/plain', value: text }, ...(html ? [{ type: 'text/html', value: html }] : [])],
          }),
        })
      : await fetchImpl(`${cfg.url}/api/v1/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ From: { Email: cfg.from, Name: cfg.fromName }, To: [{ Email: to }], Subject: subject, Text: text, ...(html ? { HTML: html } : {}) }),
        });
    if (!res.ok) { console.error(`${label}: ${cfg.provider} answered ${res.status}`); return 'failed'; }
    return 'sent';
  } catch (err) {
    console.error(`${label}: ${cfg.provider} request failed`, err instanceof Error ? err.name : 'error'); // never the address
    return 'failed';
  }
}

export function sendConfirmation(cfg: MailConfig, to: string, link: string, fetchImpl: typeof fetch = fetch): Promise<EmailStatus> {
  if (cfg.provider === 'none') return Promise.resolve('skipped');
  return deliver(cfg, to, confirmationMessage(link, cfg.mailingAddress), fetchImpl, 'lead email');
}
