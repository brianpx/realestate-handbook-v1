'use client';

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type SyntheticEvent } from 'react';
import { CONSENT_DETAILS, CONSENT_PURPOSE, CONSENT_VERSION, GATE_KEY } from '@/lib/leads/config';
import { BOOK_TITLE } from '@/lib/pages';

const GENERIC_ERROR = 'Something went wrong. Please try again in a moment, or continue without email.';

// The first-visit email form: a follow-up note, not a lock (the chapters stay public). Ported from setupGate in
// legacy/js/app-with-cover.js; the form now posts to /api/lead instead of Formspree and the server does the
// throttling. Shown only when the build has lead capture switched on (LEAD_CAPTURE_ENABLED=true).
export function Gate({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const trapRef = useRef<HTMLInputElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const busy = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    try {
      if (localStorage.getItem(GATE_KEY)) return;
    } catch {
      // storage blocked: fall through and show the gate
    }
    setOpen(true);
  }, [enabled]);

  // showModal puts the dialog in the top layer. The inert flags are what the first-visit check reads.
  useLayoutEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    const behind = document.querySelectorAll<HTMLElement>('.skip-link, #sidebar, #main-content');
    behind.forEach(node => { node.inert = true; });
    inputRef.current?.focus();
    return () => {
      behind.forEach(node => { node.inert = false; });
      if (dialog?.open) dialog.close();
    };
  }, [open]);

  if (!enabled || !open) return null;

  const dismiss = () => {
    try { localStorage.setItem(GATE_KEY, String(Date.now())); } catch { /* unlocks for this visit only */ }
    if (dialogRef.current?.open) dialogRef.current.close();
    setOpen(false);
    queueMicrotask(() => document.getElementById('main-content')?.focus({ preventScroll: true }));
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy.current) return; // Enter can submit even while the button is disabled
    setError('');
    const input = inputRef.current!;
    if (!input.checkValidity() || !input.value.trim()) {
      setError('Please enter a valid email address.');
      return;
    }
    busy.current = true;
    setSending(true);
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: input.value.trim(), consentVersion: CONSENT_VERSION, _gotcha: trapRef.current?.value ?? '' }),
      });
      if (res.ok) { dismiss(); return; }
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (body.error === 'invalid_email') setError('Please enter a valid email address.');
      else if (res.status === 429) setError('Too many tries from this connection. Please wait a few minutes, or continue without email.');
      else setError(GENERIC_ERROR);
      if (body.error !== 'invalid_email') skipRef.current?.focus();
    } catch {
      setError(GENERIC_ERROR);
      skipRef.current?.focus();
    } finally {
      busy.current = false;
      setSending(false);
    }
  };

  const onCancel = (e: SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault();
    dismiss();
  };

  return (
    <dialog ref={dialogRef} id="gate" className="gate" aria-modal="true" aria-labelledby="gateTitle" aria-describedby="gatePurpose" onCancel={onCancel}>
      <form id="gateForm" className="gate-card" noValidate onSubmit={submit}>
        <h2 id="gateTitle">{BOOK_TITLE}</h2>
        <p id="gatePurpose">{CONSENT_PURPOSE}</p>
        <label htmlFor="gateEmail" className="gate-label">Email address</label>
        <input ref={inputRef} type="email" id="gateEmail" name="email" autoComplete="email" inputMode="email" placeholder="you@example.com" required />
        <input ref={trapRef} type="text" name="_gotcha" tabIndex={-1} autoComplete="off" className="gate-trap" aria-hidden="true" />
        <p id="gateError" className="gate-error" role="alert" hidden={!error}>{error}</p>
        <button type="submit" className="btn-nav" id="gateSubmit" disabled={sending}>{sending ? 'Submitting…' : 'Send me a note'}</button>
        <details className="gate-details">
          <summary>How your email is used</summary>
          <p>{CONSENT_DETAILS}</p>
        </details>
        <button type="button" className="gate-skip" id="gateSkip" ref={skipRef} onClick={dismiss}>Continue without email</button>
      </form>
    </dialog>
  );
}
