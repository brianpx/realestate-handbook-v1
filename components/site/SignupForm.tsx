'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { CircleAlertIcon, MailIcon } from 'lucide-react';
import { TERMS_TEXT, TERMS_VERSION, TOKEN_TTL_SECONDS, type Source } from '@/lib/auth/config';
import { CONSENT_TEXTS, CONSENT_VERSION } from '@/lib/leads/config';
import { emailSchema } from '@/lib/validate/email';

const RESEND_AFTER_SECONDS = 30;
const GENERIC_ERROR = 'Something went wrong. Please try again in a moment.';
const FORBIDDEN_ERROR = 'This address can’t send sign-in links. Open the site at its main address and try again.';
const INVALID_EMAIL = 'Please enter a valid email address.';

/** `hero`: a field and a button in one row, the label spoken only; `card`: the stacked form on its own page; `inline`: the row inside another card. */
export type SignupVariant = 'hero' | 'card' | 'inline' | 'page';
type Notes = 'none' | 'sent' | 'failed';
type State = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent'; email: string; at: number; notes: Notes } | { kind: 'error'; message: string };

type Props = { source: Source; next?: string; variant?: SignupVariant; buttonLabel?: string };

// The sign-in form: an address, the terms sentence, a hidden field a person never sees, and the placement that
// shows it. Posts to /api/auth/request-link and then waits for the reader to open their inbox. The server never
// says whether an address is known, so neither does this. The notes checkbox is separate and off by default:
// ticking it posts the same address to /api/lead, which sends its own confirmation link; signing in alone
// subscribes nobody (OD-22).
export function SignupForm({ source, next, variant = 'card', buttonLabel = 'Email me a sign-in link' }: Props) {
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [emailDraft, setEmailDraft] = useState('');
  const [optIn, setOptIn] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [ready, setReady] = useState(false); // set after mount: the e2e suite waits for it before it types
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const trapRef = useRef<HTMLInputElement>(null);
  const busy = useRef(false);
  const focusInput = useRef(false);
  const id = `signup-${source}`;
  const page = variant === 'page';

  useEffect(() => setReady(true), []);

  useEffect(() => {
    if (!page || state.kind !== 'sent') return;
    const title = document.title;
    const sentTitle = title.replace(/^Sign in/, 'Check your email');
    document.title = sentTitle;
    return () => { if (document.title === sentTitle) document.title = title; };
  }, [page, state.kind]);

  useEffect(() => {
    if (state.kind === 'idle' && focusInput.current) {
      inputRef.current?.focus();
      focusInput.current = false;
    }
  }, [state.kind]);

  // counts the seconds down to "Send again"
  useEffect(() => {
    if (state.kind !== 'sent') return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [state.kind]);

  const fail = (message: string) => {
    setState({ kind: 'error', message });
    inputRef.current?.focus();
  };

  const subscribe = async (email: string): Promise<Notes> => {
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, consentVersion: CONSENT_VERSION, source: 'signup', _gotcha: trapRef.current?.value ?? '' }),
      });
      return res.ok ? 'sent' : 'failed';
    } catch {
      return 'failed';
    }
  };

  const send = async (email: string, previous?: Extract<State, { kind: 'sent' }>) => {
    if (busy.current) return;
    busy.current = true;
    setResendError('');
    if (previous) setResending(true);
    else setState({ kind: 'sending' });
    try {
      const res = await fetch('/api/auth/request-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, termsVersion: TERMS_VERSION, source, next, _gotcha: trapRef.current?.value ?? '' }),
      });
      if (res.ok) {
        // the sign-in link is on its way whatever happens to the notes; a failed subscription is reported, not hidden
        const notes = previous ? previous.notes : optIn ? await subscribe(email) : 'none';
        const at = Date.now();
        setNow(at);
        setState({ kind: 'sent', email, at, notes });
        return;
      }
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      const message = body.error === 'invalid_email' ? INVALID_EMAIL
        : res.status === 429 ? 'Too many tries. Please wait a few minutes and try again.'
        : res.status === 403 ? FORBIDDEN_ERROR
        : res.status === 503 ? 'Sign-in email is not available right now. Please try again later.' : GENERIC_ERROR;
      if (previous) setResendError(message);
      else fail(message);
    } catch {
      if (previous) setResendError(GENERIC_ERROR);
      else fail(GENERIC_ERROR);
    } finally {
      busy.current = false;
      setResending(false);
    }
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = inputRef.current;
    if (!input || busy.current) return;
    const email = input.value.trim();
    if (!email) return fail(page ? 'Enter your email address to get a sign-in link.' : INVALID_EMAIL);
    if (!emailSchema.safeParse(email).success) return fail(page ? 'That doesn’t look like an email address. Check for a typo.' : INVALID_EMAIL);
    await send(email);
  };

  const sent = state.kind === 'sent' ? state : null;
  const wait = sent ? Math.max(0, RESEND_AFTER_SECONDS - Math.floor((now - sent.at) / 1000)) : 0;
  const sending = state.kind === 'sending';
  const error = state.kind === 'error' ? state.message : '';
  const SentHeading = page ? 'h1' : 'h2';
  return (
    <div className={`signup signup-${variant}`}>
      {/* always mounted, so a screen reader hears the outcome that replaces the form */}
      <p className="visually-hidden" role="status" aria-live="polite">{sent ? `Check your inbox at ${sent.email}.` : ''}</p>
      {page && !sent && <div className="auth-intro">
        <p className="pub-eyebrow">Sign in</p>
        <h1 className="pub-h1">Sign in to the handbook</h1>
        <p>We email you a one-time link. No password, no card.</p>
        <p>Chapters 1 and 7 are free once you’re signed in. The rest opens when you buy the handbook.</p>
      </div>}
      {sent ? (
        <div className={`signup-sent${page ? '' : ' signup-notice'}`} data-source={source} role={page ? undefined : 'region'} aria-labelledby={page ? undefined : `${id}-sent-title`}>
          {page ? <>
            <span className="auth-mail"><MailIcon aria-hidden="true" /></span><p className="pub-eyebrow">Link sent</p>
            <SentHeading className="pub-h1">Check your email</SentHeading>
            <p>We sent a sign-in link to <strong>{sent.email}</strong>.</p><p>Open it on this device to go straight to the handbook. The link works once and expires after {TOKEN_TTL_SECONDS / 60} minutes.</p>
          </> : <>
            <div className="signup-notice-header">
              <span className="signup-notice-icon"><MailIcon aria-hidden="true" /></span>
              <div>
                <SentHeading className="pub-h3" id={`${id}-sent-title`}>Check your inbox.</SentHeading>
                <p className="signup-notice-email">{sent.email}</p>
              </div>
            </div>
            <p>If this address can receive mail, a sign-in link is on its way. It works once and expires in {TOKEN_TTL_SECONDS / 60} minutes.</p>
            <p className="signup-notice-help"><strong>Don’t see it after a minute?</strong> Check spam or promotions.</p>
          </>}
          {sent.notes === 'sent' && <p>If this address is not already on the notes list, a second email asks you to confirm it. Nothing is sent until you open that link.</p>}
          {sent.notes === 'failed' && <p>The notes sign-up did not go through. You can try again from the form after the sample lesson.</p>}
          <p className="signup-actions">
            <button type="button" className="pub-btn" disabled={wait > 0 || resending} onClick={() => { if (page) void send(sent.email, sent); else { focusInput.current = true; setState({ kind: 'idle' }); } }}>{page ? resending ? 'Sending…' : wait > 0 ? `Resend link in ${Math.floor(wait / 60)}:${String(wait % 60).padStart(2, '0')}` : 'Resend link' : wait > 0 ? `Send again in ${wait}s` : 'Review and send again'}</button>
            <button type="button" disabled={resending} className={page ? 'pub-btn' : 'pub-link-btn'} onClick={() => { focusInput.current = true; setEmailDraft(''); setState({ kind: 'idle' }); }}>Use a different email</button>
          </p>
          {resendError && <p className="signup-error" role="alert">{resendError}</p>}
          {page && <>
            <p className="pub-small">Resend unlocks after a short wait so links don’t pile up in your inbox.</p>
            <div className="auth-help"><p><strong>Don’t see it?</strong> Check spam or promotions, and search for “Finding, Nurturing, and Keeping Clients”. Still nothing after a few minutes? <Link href="/support">Contact support</Link>.</p></div>
            <p className="auth-alternative">While you wait, <Link href="/preview">try the sample lesson</Link>.</p>
          </>}
        </div>
      ) : (
        // method and action are the post target, but the button stays disabled until mount: Enter before hydration
        // would post a form body, and the route accepts JSON only
        <form className={`signup-form${page ? ' pub-card' : ''}`} method="post" action="/api/auth/request-link" noValidate onSubmit={submit} data-source={source} data-ready={ready || undefined}>
          <div className="signup-row">
            <div className="pub-field">
              <label htmlFor={`${id}-email`} className={variant === 'card' || page ? undefined : 'visually-hidden'}>Email address</label>
              <input ref={inputRef} className="calc-input" type="email" id={`${id}-email`} name="email" autoComplete="email" inputMode="email" value={emailDraft} onChange={e => setEmailDraft(e.target.value)} placeholder="you@example.com" required aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} />
              {error && <p className="signup-error" id={`${id}-error`} role="alert"><CircleAlertIcon aria-hidden="true" />{error}</p>}
            </div>
            <button type="submit" className="pub-btn pub-btn-primary" disabled={!ready || sending}>{sending ? 'Sending…' : buttonLabel}</button>
          </div>
          <input ref={trapRef} type="text" name="_gotcha" tabIndex={-1} autoComplete="off" className="signup-trap" aria-hidden="true" />
          <label className="signup-optin" htmlFor={`${id}-notes`}>
            <input type="checkbox" id={`${id}-notes`} name="notes" checked={optIn} onChange={e => setOptIn(e.target.checked)} />
            <span>{page ? 'Also send me occasional notes about the handbook. We’ll ask you to confirm first.' : 'Also email me occasional notes about the handbook. A confirmation link comes first.'}</span>
          </label>
          <p className="pub-small signup-terms">{page ? 'New here? This same form creates your account. By continuing you agree to the ' : TERMS_TEXT.split('Terms of Use')[0]}<Link href="/terms">Terms of Use</Link> and {page ? '' : 'the '}<Link href="/privacy">Privacy Policy</Link>. {page ? 'Signing in doesn’t subscribe you to anything.' : 'Signing in does not subscribe you to anything.'}</p>
          {optIn && <p className="pub-small signup-terms">{CONSENT_TEXTS[CONSENT_VERSION]}</p>}
        </form>
      )}
      {page && !sent && <p className="auth-alternative">Just want a look? <Link href="/preview">Try the sample lesson</Link>, no email needed. Or <Link href="/pricing">see pricing and availability</Link>.</p>}
    </div>
  );
}
