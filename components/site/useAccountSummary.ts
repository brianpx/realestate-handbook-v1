'use client';

import { useEffect, useState } from 'react';
import type { AccountSummary } from '@/lib/account/me';

// 'loading' until /api/account/me answers; 'out' when it did not give a summary (401 for a stale sign-in flag, or an error).
export type AccountState = { status: 'idle' | 'loading' | 'out' } | { status: 'ready'; account: AccountSummary };

const isSummary = (value: unknown): value is AccountSummary =>
  typeof value === 'object' && value !== null
  && typeof (value as AccountSummary).displayName === 'string'
  && typeof (value as AccountSummary).email === 'string'
  && ((value as AccountSummary).avatarUrl === null || typeof (value as AccountSummary).avatarUrl === 'string');

// One request per page load, shared by every menu on the page and kept across client navigations. Only a definite
// answer is kept: a 401 or a summary. A failed request is asked again on the next mount.
let cached: AccountState | null = null;
let inflight: Promise<AccountState> | null = null;

async function load(): Promise<AccountState> {
  try {
    const res = await fetch('/api/account/me', { credentials: 'same-origin' });
    if (res.status === 401) return (cached = { status: 'out' });
    if (!res.ok) return { status: 'out' };
    const body: unknown = await res.json();
    if (!isSummary(body)) return { status: 'out' };
    return (cached = { status: 'ready', account: { displayName: body.displayName, email: body.email, avatarUrl: body.avatarUrl } });
  } catch {
    return { status: 'out' };
  }
}

export function resetAccountSummaryCache(): void {
  cached = null;
  inflight = null;
}

/** The signed-in reader's name, address and picture for the user menu; fetched after mount, and only when the sign-in flag is set. */
export function useAccountSummary(signedIn: boolean): AccountState {
  const [state, setState] = useState<AccountState>({ status: 'idle' });
  useEffect(() => {
    if (!signedIn) return;
    if (cached) { setState(cached); return; }
    let live = true;
    setState({ status: 'loading' });
    inflight ??= load().finally(() => { inflight = null; });
    void inflight.then(result => { if (live) setState(result); });
    return () => { live = false; };
  }, [signedIn]);
  return signedIn ? state : { status: 'idle' };
}
