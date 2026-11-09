'use client';

import { useEffect, useRef, useState } from 'react';

// The one-button form that consumes a sign-in link. The page itself consumes nothing, so a mail scanner or a link
// preview that fetches the URL leaves the link usable; the reader's browser submits this form on arrival, and the
// button is there for anyone whose JavaScript did not run.
export function AutoSubmit({ action, token }: { action: string; token: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const fired = useRef(false); // development runs effects twice; the token is single-use, so submit once
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    const form = ref.current;
    if (!form || fired.current) return;
    fired.current = true;
    setSubmitted(true);
    form.requestSubmit();
  }, []);
  return (
    <form ref={ref} method="post" action={action} onSubmit={() => setSubmitted(true)}>
      <input type="hidden" name="token" value={token} />
      <button type="submit" className="pub-btn pub-btn-primary" disabled={submitted}>{submitted ? 'Signing you in…' : 'Sign me in'}</button>
    </form>
  );
}
