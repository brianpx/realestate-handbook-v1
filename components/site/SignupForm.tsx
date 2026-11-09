'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { TERMS_TEXT, TERMS_VERSION, type Source } from '@/lib/auth/config';
import { CONSENT_TEXTS, CONSENT_VERSION } from '@/lib/leads/config';

const RESEND_AFTER_SECONDS = 30;
const GENERIC_ERROR = 'Something went wrong. Please try again in a moment.';

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
  const inputRef = useRef<HTMLInputElement>(null);
  const trapRef = useRef<HTMLInputElement>(null);
  const busy = useRef(false);
  const id = `signup-${source}`;

  // counts the seconds down to "Send again"
  useEffect(() => {
    if (state.kind !== 'sent') return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [state.kind]);

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
    const input = inputRef.current!;
    const email = input.value.trim();
    if (!input.checkValidity() || !email) {
      setState({ kind: 'error', message: 'Please enter a valid email address.' });
      return;
    }
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
      if (body.error === 'invalid_email') setState({ kind: 'error', message: 'Please enter a valid email address.' });
      else if (res.status === 429) setState({ kind: 'error', message: 'Too many tries. Please wait a few minutes and try again.' });
      else if (res.status === 503) setState({ kind: 'error', message: 'Sign-in email is not available right now. Please try again later.' });
      else setState({ kind: 'error', message: GENERIC_ERROR });
    } catch {
      setState({ kind: 'error', message: GENERIC_ERROR });
    } finally {
      busy.current = false;
    }
  };

  if (state.kind === 'sent') {
    const wait = Math.max(0, RESEND_AFTER_SECONDS - Math.floor((now - state.at) / 1000));
    return (
      <div className={`signup-sent signup-${variant}`} role="status" data-source={source}>
        <p><strong>Check your inbox.</strong> If {state.email} can receive mail, a sign-in link is on its way. It works once and expires in 15 minutes. Look in spam if it has not arrived in a minute.</p>
        {state.notes === 'sent' && <p>A second email asks you to confirm the notes. Nothing is sent until you open that link.</p>}
        {state.notes === 'failed' && <p>The notes sign-up did not go through. You can try again from the form after the sample lesson.</p>}
        <p className="signup-actions">
          <button type="button" className="pub-btn" disabled={wait > 0} onClick={() => setState({ kind: 'idle' })}>{wait > 0 ? `Send again in ${wait}s` : 'Send again'}</button>
          <button type="button" className="pub-link-btn" onClick={() => { setState({ kind: 'idle' }); queueMicrotask(() => inputRef.current?.focus()); }}>Use a different email</button>
        </p>
      </div>
    );
  }

  const sending = state.kind === 'sending';
  const error = state.kind === 'error' ? state.message : '';
  return (
    <form className={`signup-form signup-${variant}`} noValidate onSubmit={submit} data-source={source}>
      <div className="signup-row">
        <div className="pub-field">
          <label htmlFor={`${id}-email`} className={variant === 'card' ? undefined : 'visually-hidden'}>Email address</label>
          <input ref={inputRef} className="calc-input" type="email" id={`${id}-email`} name="email" autoComplete="email" inputMode="email" placeholder="you@example.com" required />
        </div>
        <button type="submit" className="pub-btn pub-btn-primary" disabled={sending}>{sending ? 'Sending…' : buttonLabel}</button>
      </div>
      <input ref={trapRef} type="text" name="_gotcha" tabIndex={-1} autoComplete="off" className="signup-trap" aria-hidden="true" />
      <p className="signup-error" role="alert" hidden={!error}>{error}</p>
      <label className="signup-optin" htmlFor={`${id}-notes`}>
        <input type="checkbox" id={`${id}-notes`} name="notes" checked={optIn} onChange={e => setOptIn(e.target.checked)} />
        <span>Also email me occasional notes about the handbook. A confirmation link comes first.</span>
      </label>
      <p className="pub-small signup-terms">{TERMS_TEXT}</p>
      {optIn && <p className="pub-small signup-terms">{CONSENT_TEXTS[CONSENT_VERSION]}</p>}
    </form>
  );
}
