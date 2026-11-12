import { OWNER } from '@/lib/offer';
import { BOOK_TITLE } from '@/lib/pages';

/**
 * The shared shell for handbook mail, taken from the sign-in email artboard: a sage canvas, one white card,
 * the mark and the name, a navy button, then a quiet footer. Tables, not flex: the clients that matter
 * (including Outlook) do not lay out with flex. The wordmark is real text, so a blocked image still names the book.
 */

export const EMAIL_NAVY = '#14304D';
export const EMAIL_INK = '#1C2733';
export const EMAIL_MUTED = '#4F5B67';
export const EMAIL_LINE = '#DDE5DF';
export const EMAIL_CANVAS = '#F1F5F2';
export const EMAIL_GREEN = '#2F7D2A';

const FONT = "Inter, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function originOf(link: string): string {
  return new URL(link).origin;
}

const supportEmail = (): string => OWNER.supportEmail ?? 'support@findnurturekeep.com';

export type EmailAction = { href: string; label: string };

export type EmailCard = {
  /** Absolute site origin, used for the mark. */
  origin: string;
  preheader: string;
  headline: string;
  intro: string;
  action?: EmailAction;
  /** One line under the button, with the small clock. */
  expires?: string;
  /** The raw link, for a reader whose button does nothing. */
  fallback?: { label: string; href: string };
  /** Short muted lines after the rule. */
  closing?: readonly string[];
  /** Set on a commercial message. Transactional mail leaves it off. */
  postalAddress?: string;
};

function button(action: EmailAction): string {
  const href = escapeHtml(action.href);
  const label = escapeHtml(action.label);
  return `<table role="presentation" cellspacing="0" cellpadding="0" class="btn"><tr><td bgcolor="${EMAIL_NAVY}" style="border-radius:8px;background:${EMAIL_NAVY};">
<a href="${href}" style="display:inline-block;padding:14px 36px;background:${EMAIL_NAVY};border:1px solid ${EMAIL_NAVY};border-radius:8px;color:#ffffff;font-family:${FONT};font-size:16px;line-height:24px;font-weight:600;text-decoration:none;">${label}</a>
</td></tr></table>`;
}

function clockRow(text: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0"><tr>
<td valign="middle" style="padding:0 8px 0 0;line-height:0;">
<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="${EMAIL_GREEN}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6.25"></circle><path d="M8 4.5V8l2.25 1.5"></path></svg>
</td>
<td valign="middle" style="font-family:${FONT};font-size:14px;line-height:20px;color:${EMAIL_MUTED};">${escapeHtml(text)}</td>
</tr></table>`;
}

function linkBox(href: string): string {
  const safe = escapeHtml(href);
  return `<div style="background:${EMAIL_CANVAS};border-radius:8px;padding:12px 14px;font-family:${MONO};font-size:13px;line-height:20px;word-break:break-all;overflow-wrap:anywhere;">
<a href="${safe}" style="color:${EMAIL_NAVY};text-decoration:none;word-break:break-all;">${safe}</a>
</div>`;
}

/** Turns a bare address in a closing line into a link. A trailing period stays outside the href. */
function linkify(line: string): string {
  return line.split(/(https?:\/\/[^\s]+)/g).map(part => {
    if (!/^https?:\/\//.test(part)) return escapeHtml(part);
    const href = part.replace(/[.,);]+$/, '');
    const tail = part.slice(href.length);
    return `<a href="${escapeHtml(href)}" style="color:${EMAIL_NAVY};text-decoration:underline;word-break:break-all;">${escapeHtml(href)}</a>${escapeHtml(tail)}`;
  }).join('');
}

/** Plain-text twin of the card. The postal line, when set, is last so a commercial footer can be checked by its ending. */
export function emailText({ headline, intro, action, expires, fallback, closing = [], postalAddress }: EmailCard): string {
  const lines = [headline, '', intro];
  if (action) lines.push('', action.href);
  if (expires) lines.push('', expires);
  if (fallback) lines.push('', fallback.label, fallback.href);
  for (const line of closing) lines.push('', line);
  lines.push('', BOOK_TITLE, `Questions? Reply to this email or write to ${supportEmail()}`);
  if (postalAddress) lines.push('', postalAddress);
  return lines.join('\n');
}

/** HTML twin of the card. Image URLs are absolute so the mark loads from the site that sent the message. */
export function emailHtml(card: EmailCard): string {
  const { origin, preheader, headline, intro, action, expires, fallback, closing = [], postalAddress } = card;
  const contact = supportEmail();
  const logo = escapeHtml(`${origin}/images/logo3-sidebar-transparent.png`);
  const after = [
    fallback
      ? `<p style="margin:16px 0 8px;font-family:${FONT};font-size:14px;line-height:20px;color:${EMAIL_MUTED};">${escapeHtml(fallback.label)}</p>${linkBox(fallback.href)}`
      : '',
    ...closing.map(line => `<p style="margin:16px 0 0;font-family:${FONT};font-size:14px;line-height:22px;color:${EMAIL_MUTED};">${linkify(line)}</p>`),
  ].filter(Boolean).join('\n');
  const divided = after
    ? `<div style="border-top:1px solid ${EMAIL_LINE};font-size:0;line-height:0;">&nbsp;</div>\n${after}`
    : '';
  const address = postalAddress
    ? `<br>${escapeHtml(postalAddress)}`
    : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(headline)}</title>
<style>
body{margin:0;padding:0;background:${EMAIL_CANVAS}}
a{color:${EMAIL_NAVY}}
@media only screen and (max-width:600px){
  .email-pad{padding:20px 16px !important}
  .card-pad{padding:28px 24px !important}
  .email-h1{font-size:26px !important;line-height:32px !important}
  .btn, .btn tbody, .btn tr, .btn td{width:100% !important}
  .btn a{display:block !important;width:100% !important;box-sizing:border-box !important;text-align:center !important}
}
</style>
</head>
<body style="margin:0;padding:0;background:${EMAIL_CANVAS};color:${EMAIL_INK};">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_CANVAS};">
<tr><td align="center" class="email-pad" style="padding:48px 24px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;">
<tr><td>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;border:1px solid ${EMAIL_LINE};border-radius:12px;">
<tr><td class="card-pad" style="padding:40px 48px;">
<table role="presentation" cellspacing="0" cellpadding="0"><tr>
<td valign="middle" style="padding:0 14px 0 0;"><img src="${logo}" width="52" height="52" alt="" style="display:block;width:52px;height:52px;border:0;"></td>
<td valign="middle" style="font-family:${FONT};font-size:17px;line-height:22px;font-weight:700;color:${EMAIL_NAVY};">Finding, Nurturing,<br>and Keeping Clients</td>
</tr></table>
<h1 class="email-h1" style="margin:32px 0 0;font-family:${FONT};font-size:30px;line-height:38px;font-weight:700;letter-spacing:-0.01em;color:${EMAIL_NAVY};">${escapeHtml(headline)}</h1>
<p style="margin:12px 0 0;font-family:${FONT};font-size:16px;line-height:26px;color:${EMAIL_INK};">${escapeHtml(intro)}</p>
${action ? `<div style="margin:32px 0 0;">${button(action)}</div>` : ''}
${expires ? `<div style="margin:16px 0 0;">${clockRow(expires)}</div>` : ''}
${divided ? `<div style="margin:32px 0 0;">${divided}</div>` : ''}
</td></tr>
</table>
<p style="margin:24px 0 0;text-align:center;font-family:${FONT};font-size:13px;line-height:20px;color:${EMAIL_MUTED};">${escapeHtml(BOOK_TITLE)}<br>Questions? Reply to this email or write to <a href="mailto:${escapeHtml(contact)}" style="color:${EMAIL_NAVY};text-decoration:underline;">${escapeHtml(contact)}</a>${address}</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
