'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { UserAvatar } from '@/components/site/UserMenu';
import { setAccountSummaryAvatar } from '@/components/site/useAccountSummary';
import { Button } from '@/components/ui/button';
import type { AccountSummary } from '@/lib/account/me';
import { ACCEPTED_AVATAR_TYPES, AVATAR_PATH, MAX_AVATAR_BYTES } from '@/lib/users/avatar';
import { SettingsCard } from './SettingsCard';

const GENERIC_ERROR = 'Something went wrong. Please try again in a moment.';
const TOO_LARGE = 'That file is larger than 2 MB. Choose a smaller image.';
const WRONG_TYPE = 'Choose a PNG, JPEG or WebP image.';

type State = { kind: 'idle' } | { kind: 'working'; what: 'uploading' | 'removing' } | { kind: 'done'; message: string } | { kind: 'error'; message: string };
type Props = { account: AccountSummary };

const failureMessage = (status: number, error: unknown): string => {
  if (status === 401) return 'Your sign-in has ended. Sign in again, then come back to this page.';
  if (status === 403) return 'This request was blocked. Reload the page and try again.';
  if (status === 413) return TOO_LARGE;
  if (status === 415) return WRONG_TYPE;
  if (status === 422) return 'That image could not be read. Try a different one.';
  if (status === 503) return error === 'storage_unavailable' ? 'Avatars are not set up on this site yet, so nothing was changed.' : 'Saving is not available right now. Please try again later.';
  return GENERIC_ERROR;
};

// The Avatar card: the picture is the control, as on Vercel. The browser checks type and size only for a quick answer;
// the server decides from the bytes, re-encodes the picture to a small WebP and answers with the address to show.
// After a change the header refreshes without a reload: the product layout's menu is server-rendered, so the page
// is refreshed, and the public header's cached summary is updated.
export function AvatarCard({ account }: Props) {
  const [avatarUrl, setAvatarUrl] = useState(account.avatarUrl);
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const busy = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => setReady(true), []);
  useEffect(() => { if (state.kind === 'done' || state.kind === 'error') noteRef.current?.focus(); }, [state]);

  const working = state.kind === 'working';
  const fail = (message: string) => setState({ kind: 'error', message });

  async function send(what: 'uploading' | 'removing', init: RequestInit, done: string) {
    if (busy.current) return;
    busy.current = true;
    setState({ kind: 'working', what });
    try {
      const res = await fetch(AVATAR_PATH, { ...init, headers: { Accept: 'application/json' } });
      const body = (await res.json().catch(() => ({}))) as { error?: unknown; avatarUrl?: unknown };
      if (res.ok && (typeof body.avatarUrl === 'string' || body.avatarUrl === null)) {
        setAvatarUrl(body.avatarUrl);
        setAccountSummaryAvatar(body.avatarUrl);
        router.refresh();
        setState({ kind: 'done', message: done });
        return;
      }
      fail(failureMessage(res.status, body.error));
    } catch {
      fail(GENERIC_ERROR);
    } finally {
      busy.current = false;
    }
  }

  const choose = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // choosing the same file again must still fire a change
    if (!file) return;
    if (!(ACCEPTED_AVATAR_TYPES as readonly string[]).includes(file.type)) return fail(WRONG_TYPE);
    if (file.size > MAX_AVATAR_BYTES) return fail(TOO_LARGE);
    const form = new FormData();
    form.append('file', file);
    void send('uploading', { method: 'POST', body: form }, 'Avatar updated.');
  };

  return (
    <SettingsCard
      id="avatar"
      title="Avatar"
      description="This is your avatar. Click it to upload a custom one from your files."
      footer="An avatar is optional. PNG, JPEG or WebP, up to 2 MB."
      aside={(
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={!ready || working}
          aria-label={avatarUrl ? 'Change your avatar' : 'Upload an avatar'}
          aria-describedby="avatar-note"
          className="block rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
        >
          <UserAvatar account={{ ...account, avatarUrl }} className="size-16 text-lg" />
        </button>
      )}
      action={avatarUrl ? <Button type="button" variant="outline" className="h-9 px-4" disabled={!ready || working} onClick={() => void send('removing', { method: 'DELETE' }, 'Avatar removed.')}>Remove</Button> : undefined}
    >
      <input ref={inputRef} type="file" name="file" accept={ACCEPTED_AVATAR_TYPES.join(',')} onChange={choose} hidden tabIndex={-1} aria-label="Choose an avatar image" />
      <div id="avatar-note" className="min-h-5">
        {working && <p className="m-0 text-sm text-muted-foreground" role="status">{state.what === 'uploading' ? 'Uploading…' : 'Removing…'}</p>}
        {state.kind === 'done' && <p ref={noteRef} tabIndex={-1} className="m-0 text-sm text-muted-foreground" role="status">{state.message}</p>}
        {state.kind === 'error' && <p ref={noteRef} tabIndex={-1} className="m-0 text-sm text-destructive" role="alert">{state.message}</p>}
      </div>
    </SettingsCard>
  );
}
