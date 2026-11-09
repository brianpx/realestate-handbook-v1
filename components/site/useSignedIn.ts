'use client';

import { useEffect, useState } from 'react';
import { SIGNED_IN_COOKIE } from '@/lib/auth/cookie';

// Whether the browser carries the readable sign-in flag that goes beside the session cookie. Read after mount, so
// the server renders every public page the same for everyone (static) and a returning reader sees the signed-out
// markup for a moment before it switches. The flag is a hint for copy and links only: every gated page checks the
// real session, and a stale flag just leads to the sign-in page.
export function useSignedIn(): boolean {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => setSignedIn(document.cookie.split('; ').includes(`${SIGNED_IN_COOKIE}=1`)), []);
  return signedIn;
}
