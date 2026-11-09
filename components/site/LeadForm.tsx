'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CONSENT_TEXTS, CONSENT_VERSION, OPT_IN_OFFER, type LeadSource } from '@/lib/leads/config';

const GENERIC_ERROR = 'Something went wrong. Please try again in a moment.';

type State = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent'; email: string } | { kind: 'error'; message: string };
type Props = {
  source: LeadSource;
  /** Which offer the form makes (OD-02): the purchase notice while nothing is on sale, the daily number once it is. */
  offer: keyof typeof OPT_IN_OFFER;
  /** The host surface's button and input classes: the public site's or the handbook's. */
  buttonClassName?: string;
  inputClassName?: string;
};

// The standalone notes form: after the sample lesson and on the card a signed-in reader meets on a chapter outside
// their plan. Posts to /api/lead, which sends the confirmation link; the address is on the list only once that
// link is opened. A repeat address looks the same as a new one, so the form cannot be used to find out who is on it.
export function LeadForm({ source, offer, buttonClassName = 'pub-btn pub-btn-primary', inputClassName = 'calc-input' }: Props) {
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [ready, setReady] = useState(false); // set after mount: the e2e suite waits for it before it types
  const inputRef = useRef<HTMLInputElement>(null);
  const trapRef = useRef<HTMLInputElement>(null);
  const busy = useRef(false);
  const copy = OPT_IN_OFFER[offer];
  const id = `lead-${source}`;
  useEffect(() => setReady(true), []);

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
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, consentVersion: CONSENT_VERSION, source, _gotcha: trapRef.current?.value ?? '' }),
      });
      if (res.ok) { setState({ kind: 'sent', email }); return; }
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (body.error === 'invalid_email') setState({ kind: 'error', message: 'Please enter a valid email address.' });
      else if (res.status === 429) setState({ kind: 'error', message: 'Too many tries. Please wait a few minutes and try again.' });
      else if (res.status === 503) setState({ kind: 'error', message: 'The notes list is not available right now. Please try again later.' });
      else setState({ kind: 'error', message: GENERIC_ERROR });
    } catch {
      setState({ kind: 'error', message: GENERIC_ERROR });
    } finally {
      busy.current = false;
    }
  };

  if (state.kind === 'sent') {
    return (
      <div className="lead-sent" role="status" data-source={source}>
        <p><strong>Check your inbox.</strong> If {state.email} can receive mail, a confirmation link is on its way. Nothing is sent until you open it, and nothing is sent if you were already on the list.</p>
      </div>
    );
  }

  const sending = state.kind === 'sending';
  const error = state.kind === 'error' ? state.message : '';
  return (
    <form className="lead-form" noValidate onSubmit={submit} data-source={source} data-ready={ready || undefined} aria-labelledby={`${id}-title`}>
      <p className="lead-title" id={`${id}-title`}><strong>{copy.title}</strong></p>
      <p className="lead-text">{copy.text}</p>
      <div className="pub-field lead-field">
        <label htmlFor={`${id}-email`}>Email address</label>
        <input ref={inputRef} className={inputClassName} type="email" id={`${id}-email`} name="email" autoComplete="email" inputMode="email" placeholder="you@example.com" required />
      </div>
      <input ref={trapRef} type="text" name="_gotcha" tabIndex={-1} autoComplete="off" className="lead-trap" aria-hidden="true" />
      <p className="lead-error" role="alert" hidden={!error}>{error}</p>
      <button type="submit" className={buttonClassName} disabled={sending}>{sending ? 'Sending…' : copy.title}</button>
      <p className="lead-consent">{CONSENT_TEXTS[CONSENT_VERSION]}</p>
    </form>
  );
}
