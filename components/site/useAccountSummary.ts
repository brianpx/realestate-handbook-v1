'use client';

import { useEffect, useState } from 'react';
import type { AccountSummary } from '@/lib/account/me';

// 'loading' until /api/account/me answers; 'out' for a 401 (a stale sign-in flag); 'error' when the request failed or
// gave no summary, so the header can keep offering the account instead of asking a signed-in reader to sign in.
export type AccountState = { status: 'idle' | 'loading' | 'out' | 'error' } | { status: 'ready'; account: AccountSummary };

const isSummary = (value: unknown): value is AccountSummary =>
  typeof value === 'object' && value !== null
  && typeof (value as AccountSummary).displayName === 'string'
  && typeof (value as AccountSummary).email === 'string'
  && ((value as AccountSummary).avatarUrl === null || typeof (value as AccountSummary).avatarUrl === 'string');

// One request per page load, shared by every menu on the page and kept across client navigations. Only a definite
// answer is kept: a 401 or a summary. A failed request is asked again on the next mount.
let cached: AccountState | null = null;
let inflight: Promise<AccountState> | null = null;
// Every mounted menu, told when a change on the account page replaces what the cache holds.
const listeners = new Set<(state: AccountState) => void>();

async function load(): Promise<AccountState> {
  try {
    const res = await fetch('/api/account/me', { credentials: 'same-origin' });
    if (res.status === 401) return (cached = { status: 'out' });
    if (!res.ok) return { status: 'error' };
    const body: unknown = await res.json();
    if (!isSummary(body)) return { status: 'error' };
    return (cached = { status: 'ready', account: { displayName: body.displayName, email: body.email, avatarUrl: body.avatarUrl } });
  } catch {
    return { status: 'error' };
  }
}

export function resetAccountSummaryCache(): void {
  cached = null;
  inflight = null;
  listeners.clear();
}

/**
 * Puts a new picture (or none) into the summary the header shows, without asking the server again. Nothing happens
 * before the summary has loaded: its own request will carry the current picture.
 */
export function setAccountSummaryAvatar(avatarUrl: string | null): void {
  if (cached?.status !== 'ready') return;
  cached = { status: 'ready', account: { ...cached.account, avatarUrl } };
  for (const listener of listeners) listener(cached);
}

/** The signed-in reader's name, address and picture for the user menu; fetched after mount, and only when the sign-in flag is set. */
export function useAccountSummary(signedIn: boolean): AccountState {
  const [state, setState] = useState<AccountState>({ status: 'idle' });
  useEffect(() => {
    if (!signedIn) return;
    listeners.add(setState);
    if (cached) { setState(cached); return () => { listeners.delete(setState); }; }
    let live = true;
    setState({ status: 'loading' });
    inflight ??= load().finally(() => { inflight = null; });
    void inflight.then(result => { if (live) setState(result); });
    return () => { live = false; listeners.delete(setState); };
  }, [signedIn]);
  return signedIn ? state : { status: 'idle' };
}
