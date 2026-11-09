import type { EmailStatus } from './store';

// Follow-up email. SendGrid in production, Mailpit (a local mail catcher) in development, nothing otherwise.
// Both are plain HTTPS calls, so no client library is needed.
export type MailConfig =
  | { provider: 'none' }
  | { provider: 'mailpit'; url: string; from: string; fromName: string; replyTo?: string; mailingAddress: string }
  | { provider: 'sendgrid'; apiKey: string; from: string; fromName: string; replyTo?: string; mailingAddress: string };

export type Message = { subject: string; text: string };

export function mailFromEnv(env: Record<string, string | undefined>): MailConfig {
  const from = env.LEAD_FROM_EMAIL;
  const common = { fromName: env.LEAD_FROM_NAME ?? 'Finding, Keeping, and Nurturing Clients', replyTo: env.LEAD_REPLY_TO ?? from, mailingAddress: env.LEAD_MAILING_ADDRESS ?? '' };
  if (env.SENDGRID_API_KEY) {
    // a commercial email needs a real sender and the author's postal address (CAN-SPAM); without them send nothing
    if (!from || !common.mailingAddress) return { provider: 'none' };
    return { provider: 'sendgrid', apiKey: env.SENDGRID_API_KEY, from, ...common };
  }
  if (env.MAILPIT_URL) return { provider: 'mailpit', url: env.MAILPIT_URL.replace(/\/$/, ''), from: from ?? 'handbook@example.test', ...common, mailingAddress: common.mailingAddress || '(your mailing address goes here)' };
  return { provider: 'none' };
}

export function welcomeMessage(address: string): Message {
  return {
    subject: 'Your handbook follow-up note',
    text: [
      'Thanks for opening Finding, Keeping, and Nurturing Clients.',
      '',
      'You asked for a follow-up note about the handbook, and this is the first one. The book stays free to read, and you do not need this email for anything. If there is a part you would like more of, reply and say so.',
      '',
      'To stop these notes at any time, reply "unsubscribe".',
      '',
      address,
    ].join('\n'),
  };
}

/**
 * Sends one plain-text message through whichever provider is configured. Logs carry the provider, the status and
 * the error name only, never the address. `label` names the caller in those logs.
 */
export async function deliver(cfg: MailConfig, to: string, { subject, text }: Message, fetchImpl: typeof fetch = fetch, label = 'email'): Promise<EmailStatus> {
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
            content: [{ type: 'text/plain', value: text }],
          }),
        })
      : await fetchImpl(`${cfg.url}/api/v1/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ From: { Email: cfg.from, Name: cfg.fromName }, To: [{ Email: to }], Subject: subject, Text: text }),
        });
    if (!res.ok) { console.error(`${label}: ${cfg.provider} answered ${res.status}`); return 'failed'; }
    return 'sent';
  } catch (err) {
    console.error(`${label}: ${cfg.provider} request failed`, err instanceof Error ? err.name : 'error'); // never the address
    return 'failed';
  }
}

export function sendWelcome(cfg: MailConfig, to: string, fetchImpl: typeof fetch = fetch): Promise<EmailStatus> {
  if (cfg.provider === 'none') return Promise.resolve('skipped');
  return deliver(cfg, to, welcomeMessage(cfg.mailingAddress), fetchImpl, 'lead email');
}
