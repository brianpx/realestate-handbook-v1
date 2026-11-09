'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { TERMS_TEXT, TERMS_VERSION, type Source } from '@/lib/auth/config';

const RESEND_AFTER_SECONDS = 30;
const GENERIC_ERROR = 'Something went wrong. Please try again in a moment.';

type State = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent'; email: string; at: number } | { kind: 'error'; message: string };

// The sign-in form: an address, the terms sentence, a hidden field a person never sees, and the placement that
// shows it. Posts to /api/auth/request-link and then waits for the reader to open their inbox. The server never
// says whether an address is known, so neither does this.
export function SignupForm({ source, next, buttonLabel = 'Email me a sign-in link' }: { source: Source; next?: string; buttonLabel?: string }) {
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [now, setNow] = useState(() => Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const trapRef = useRef<HTMLInputElement>(null);
  const busy = useRef(false);

  // counts the seconds down to "Send again"
  useEffect(() => {
    if (state.kind !== 'sent') return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [state.kind]);

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
      if (res.ok) { setState({ kind: 'sent', email, at: Date.now() }); return; }
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
      <div className="signup-sent" role="status">
        <p><strong>Check your inbox.</strong> If {state.email} can receive mail, a sign-in link is on its way. It works once and expires in 15 minutes. Look in spam if it has not arrived in a minute.</p>
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
    <form className="signup-form" noValidate onSubmit={submit} data-source={source}>
      <div className="pub-field">
        <label htmlFor={`signup-email-${source}`}>Email address</label>
        <input ref={inputRef} className="calc-input" type="email" id={`signup-email-${source}`} name="email" autoComplete="email" inputMode="email" placeholder="you@example.com" required />
      </div>
      <input ref={trapRef} type="text" name="_gotcha" tabIndex={-1} autoComplete="off" className="signup-trap" aria-hidden="true" />
      <p className="signup-error" role="alert" hidden={!error}>{error}</p>
      <button type="submit" className="pub-btn pub-btn-primary" disabled={sending}>{sending ? 'Sending…' : buttonLabel}</button>
      <p className="pub-small signup-terms">{TERMS_TEXT}</p>
    </form>
  );
}
