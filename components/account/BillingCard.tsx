'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import type { BillingField, BillingFields } from '@/lib/users/billing-info';
import { SettingsCard } from './SettingsCard';

const GENERIC_ERROR = 'Something went wrong. Please try again in a moment.';

type State = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved' } | { kind: 'error'; message: string; fields: readonly string[] };
export type CardRender = { busy: boolean; invalid: (field: BillingField) => true | undefined; describedBy: string | undefined; errorId: string };
type Props = {
  id: string;
  title: string;
  description: ReactNode;
  footer: ReactNode;
  /** Whether the card holds something other than what is saved; Save stays off until it does. */
  dirty: boolean;
  /** The one card's fields as typed, the PUT body to send; the server trims, and reads a blank as "not given". */
  body: () => Partial<Record<BillingField, string>>;
  /** What the server stored for them, to show and to compare against from now on. */
  onSaved: (saved: BillingFields) => void;
  /** Said under the card when the server refuses the values as malformed. */
  invalidMessage: string;
  children: (render: CardRender) => ReactNode;
};

// One card of the billing page: a SettingsCard that is a form, saved with a PUT of its own fields to
// /api/account/billing-info. The card is rendered with the server's values, so nothing is fetched on load; the button
// stays off until hydration (an early Enter would otherwise submit the boxes as a page query) and while the card still
// holds what is saved. The outcome is announced where the reader is looking, below the controls. Values are never
// echoed into a message or logged.
export function BillingCard({ id, title, description, footer, dirty, body, onSaved, invalidMessage, children }: Props) {
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [ready, setReady] = useState(false);
  const busy = useRef(false);
  const noteRef = useRef<HTMLParagraphElement>(null);
  const errorId = `${id}-error`;

  useEffect(() => setReady(true), []);
  useEffect(() => { if (state.kind === 'saved' || state.kind === 'error') noteRef.current?.focus(); }, [state]);

  const fail = (message: string, fields: readonly string[] = []) => setState({ kind: 'error', message, fields });

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setState({ kind: 'saving' });
    try {
      const res = await fetch('/api/account/billing-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body()),
      });
      const reply = (await res.json().catch(() => ({}))) as { error?: string; fields?: unknown; billingInfo?: BillingFields };
      if (res.ok && reply.billingInfo) {
        onSaved(reply.billingInfo);
        setState({ kind: 'saved' });
        return;
      }
      if (res.status === 400 && reply.error === 'invalid_billing_info') fail(invalidMessage, Array.isArray(reply.fields) ? reply.fields.map(String) : []);
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
  const saving = state.kind === 'saving';
  return (
    <SettingsCard
      id={id}
      title={title}
      description={description}
      footer={footer}
      form={{ noValidate: true, onSubmit: submit }}
      action={<Button type="submit" disabled={!ready || saving || !dirty}>{saving ? 'Saving…' : 'Save'}</Button>}
    >
      {children({ busy: saving, invalid: field => (error?.fields.includes(field) ? true : undefined), describedBy: error ? errorId : undefined, errorId })}
      {error && <p ref={noteRef} tabIndex={-1} className="m-0 text-sm text-destructive" id={errorId} role="alert">{error.message}</p>}
      {state.kind === 'saved' && <p ref={noteRef} tabIndex={-1} className="m-0 text-sm text-muted-foreground" role="status">Saved.</p>}
    </SettingsCard>
  );
}
