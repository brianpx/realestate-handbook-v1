'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SettingsCard } from './SettingsCard';

const MAX_LENGTH = 32;
const GENERIC_ERROR = 'Something went wrong. Please try again in a moment.';

type State = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved' } | { kind: 'error'; message: string; invalid: boolean };
type Props = { initial: string | null; placeholder: string };

// The Display Name card: one box saved with a PUT to /api/account/preferences, which stores it against the signed-in
// reader. Rendered with the server's value, so nothing is fetched on load; the button stays off until hydration (an
// early Enter would otherwise submit the box as a page query) and while the box still holds what is saved.
export function DisplayNameForm({ initial, placeholder }: Props) {
  const [saved, setSaved] = useState(initial ?? '');
  const [value, setValue] = useState(initial ?? '');
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [ready, setReady] = useState(false);
  const busy = useRef(false);
  const noteRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => setReady(true), []);
  // the outcome is announced where the reader is looking, below the box
  useEffect(() => { if (state.kind === 'saved' || state.kind === 'error') noteRef.current?.focus(); }, [state]);

  const fail = (message: string, invalid = false) => setState({ kind: 'error', message, invalid });

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setState({ kind: 'saving' });
    try {
      const res = await fetch('/api/account/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ displayName: value }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; displayName?: unknown };
      if (res.ok && (typeof body.displayName === 'string' || body.displayName === null)) {
        setSaved(body.displayName ?? '');
        setValue(body.displayName ?? '');
        setState({ kind: 'saved' });
        return;
      }
      if (res.status === 400 && body.error === 'invalid_display_name') fail(`Use ${MAX_LENGTH} characters at most, with no control characters.`, true);
      else if (res.status === 401) fail('Your sign-in has ended. Sign in again, then come back to this page.');
      else if (res.status === 503) fail('Saving is not available right now. Please try again later.');
      else fail(GENERIC_ERROR);
    } catch {
      fail(GENERIC_ERROR);
    } finally {
      busy.current = false;
    }
  };

  const error = state.kind === 'error' ? state : null;
  return (
    <SettingsCard
      id="display-name"
      title="Display Name"
      description="Please enter the name you would like shown on your account."
      footer="Please use 32 characters at maximum."
      form={{ noValidate: true, onSubmit: submit }}
      action={<Button type="submit" disabled={!ready || state.kind === 'saving' || value.trim() === saved}>{state.kind === 'saving' ? 'Saving…' : 'Save'}</Button>}
    >
      <label htmlFor="displayName" className="sr-only">Display name</label>
      <Input
        id="displayName"
        name="displayName"
        type="text"
        autoComplete="nickname"
        maxLength={MAX_LENGTH}
        placeholder={placeholder}
        value={value}
        disabled={state.kind === 'saving'}
        onChange={e => setValue(e.target.value)}
        aria-invalid={error?.invalid || undefined}
        aria-describedby={error ? 'display-name-error' : undefined}
        className="h-10 max-w-sm"
      />
      {error && <p ref={noteRef} tabIndex={-1} className="m-0 text-sm text-destructive" id="display-name-error" role="alert">{error.message}</p>}
      {state.kind === 'saved' && <p ref={noteRef} tabIndex={-1} className="m-0 text-sm text-muted-foreground" role="status">Saved.</p>}
    </SettingsCard>
  );
}
