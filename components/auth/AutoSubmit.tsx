'use client';

import { useEffect, useRef, useState } from 'react';

const RETRY_AFTER_MS = 8000;

// The one-button form that consumes a single-use link (a sign-in link, or a confirmation link for the notes list).
// The page itself consumes nothing, so a mail scanner or a link preview that fetches the URL leaves the link
// usable; the reader's browser submits this form on arrival, and the button is there for anyone whose JavaScript
// did not run.
export function AutoSubmit({ action, token, label = 'Sign me in', busyLabel = 'Signing you in…' }: { action: string; token: string; label?: string; busyLabel?: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const fired = useRef(false); // development runs effects twice; the token is single-use, so submit once
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    const form = ref.current;
    if (!form) return;
    if (!fired.current) {
      fired.current = true;
      setSubmitted(true);
      form.requestSubmit();
    }
    // a submit that stalls would otherwise leave a disabled button and no way forward
    const retry = setTimeout(() => setSubmitted(false), RETRY_AFTER_MS);
    return () => clearTimeout(retry);
  }, []);
  return (
    <form ref={ref} method="post" action={action} onSubmit={() => setSubmitted(true)}>
      <input type="hidden" name="token" value={token} />
      <button type="submit" className="pub-btn pub-btn-primary" disabled={submitted}>{submitted ? busyLabel : label}</button>
    </form>
  );
}
