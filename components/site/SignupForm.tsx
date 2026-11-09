'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { TERMS_TEXT, TERMS_VERSION, type Source } from '@/lib/auth/config';
import { CONSENT_TEXTS, CONSENT_VERSION } from '@/lib/leads/config';

const RESEND_AFTER_SECONDS = 30;
const GENERIC_ERROR = 'Something went wrong. Please try again in a moment.';
const INVALID_EMAIL = 'Please enter a valid email address.';

/** `hero`: a field and a button in one row, the label spoken only; `card`: the stacked form on its own page; `inline`: the row inside another card. */
export type SignupVariant = 'hero' | 'card' | 'inline';
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
  const [optIn, setOptIn] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [ready, setReady] = useState(false); // set after mount: the e2e suite waits for it before it types
  const inputRef = useRef<HTMLInputElement>(null);
  const trapRef = useRef<HTMLInputElement>(null);
  const sentRef = useRef<HTMLParagraphElement>(null);
  const busy = useRef(false);
  const id = `signup-${source}`;

  useEffect(() => setReady(true), []);

  // the form unmounts on success, so focus moves to the confirmation it is replaced by
  useEffect(() => { if (state.kind === 'sent') sentRef.current?.focus(); }, [state.kind]);

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

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy.current) return;
    const input = inputRef.current;
    if (!input) return;
    const email = input.value.trim();
    if (!input.checkValidity() || !email) return fail(INVALID_EMAIL);
    busy.current = true;
    setState({ kind: 'sending' });
    try {
      const res = await fetch('/api/auth/request-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, termsVersion: TERMS_VERSION, source, next, _gotcha: trapRef.current?.value ?? '' }),
      });
      if (res.ok) {
        // the sign-in link is on its way whatever happens to the notes; a failed subscription is reported, not hidden
        setState({ kind: 'sent', email, at: Date.now(), notes: optIn ? await subscribe(email) : 'none' });
        return;
      }
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (body.error === 'invalid_email') fail(INVALID_EMAIL);
      else if (res.status === 429) fail('Too many tries. Please wait a few minutes and try again.');
      else if (res.status === 503) fail('Sign-in email is not available right now. Please try again later.');
      else fail(GENERIC_ERROR);
    } catch {
      fail(GENERIC_ERROR);
    } finally {
      busy.current = false;
    }
  };

  const sent = state.kind === 'sent' ? state : null;
  const wait = sent ? Math.max(0, RESEND_AFTER_SECONDS - Math.floor((now - sent.at) / 1000)) : 0;
  const sending = state.kind === 'sending';
  const error = state.kind === 'error' ? state.message : '';
  return (
    <div className={`signup signup-${variant}`}>
      {/* always mounted, so a screen reader hears the outcome that replaces the form */}
      <p className="visually-hidden" role="status" aria-live="polite">{sent ? `Check your inbox at ${sent.email}.` : ''}</p>
      {sent ? (
        <div className="signup-sent" data-source={source}>
          <p ref={sentRef} tabIndex={-1}><strong>Check your inbox.</strong> If {sent.email} can receive mail, a sign-in link is on its way. It works once and expires in 15 minutes. Look in spam if it has not arrived in a minute.</p>
          {sent.notes === 'sent' && <p>If this address is not already on the notes list, a second email asks you to confirm it. Nothing is sent until you open that link.</p>}
          {sent.notes === 'failed' && <p>The notes sign-up did not go through. You can try again from the form after the sample lesson.</p>}
          <p className="signup-actions">
            <button type="button" className="pub-btn" disabled={wait > 0} onClick={() => setState({ kind: 'idle' })}>{wait > 0 ? `Send again in ${wait}s` : 'Send again'}</button>
            <button type="button" className="pub-link-btn" onClick={() => { setState({ kind: 'idle' }); queueMicrotask(() => inputRef.current?.focus()); }}>Use a different email</button>
          </p>
        </div>
      ) : (
        // method and action are for the moment before hydration: Enter then posts to the route instead of putting
        // the address in this page's URL
        <form className="signup-form" method="post" action="/api/auth/request-link" noValidate onSubmit={submit} data-source={source} data-ready={ready || undefined}>
          <div className="signup-row">
            <div className="pub-field">
              <label htmlFor={`${id}-email`} className={variant === 'card' ? undefined : 'visually-hidden'}>Email address</label>
              <input ref={inputRef} className="calc-input" type="email" id={`${id}-email`} name="email" autoComplete="email" inputMode="email" placeholder="you@example.com" required aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} />
            </div>
            <button type="submit" className="pub-btn pub-btn-primary" disabled={sending}>{sending ? 'Sending…' : buttonLabel}</button>
          </div>
          <input ref={trapRef} type="text" name="_gotcha" tabIndex={-1} autoComplete="off" className="signup-trap" aria-hidden="true" />
          {error && <p className="signup-error" id={`${id}-error`} role="alert">{error}</p>}
          <label className="signup-optin" htmlFor={`${id}-notes`}>
            <input type="checkbox" id={`${id}-notes`} name="notes" checked={optIn} onChange={e => setOptIn(e.target.checked)} />
            <span>Also email me occasional notes about the handbook. A confirmation link comes first.</span>
          </label>
          <p className="pub-small signup-terms">{TERMS_TEXT}</p>
          {optIn && <p className="pub-small signup-terms">{CONSENT_TEXTS[CONSENT_VERSION]}</p>}
        </form>
      )}
    </div>
  );
}
