'use client';

import type { ReactNode } from 'react';
import { useSignedIn } from './useSignedIn';

/** Renders `signedOut` on the server and for visitors, `signedIn` once the browser reports the sign-in flag. */
export function SignedInSwitch({ signedIn, signedOut }: { signedIn: ReactNode; signedOut: ReactNode }) {
  return <>{useSignedIn() ? signedIn : signedOut}</>;
}
