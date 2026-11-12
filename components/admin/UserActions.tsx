'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, type ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AdminAction } from '@/lib/admin/validate';
import type { Role, UserStatus } from '@/lib/users/types';

// The admin state-setters, each a small form. The page is server-rendered; this leaf only posts the form as JSON
// to /api/admin/users/<id>/<action> (the handler wants JSON and answers JSON, with `changed` saying whether the
// row moved) and refreshes the page so the facts above it are read again. The server refuses a self-change too;
// the disabled controls here only say so sooner.
export type UserActionsProps = {
  userId: string;
  self: boolean;
  role: Role;
  status: UserStatus;
  suspended: boolean;
  /** The grants that can still be revoked, as the revoke form lists them. */
  liveGrants: { id: string; label: string }[];
};

type Reply = { ok: true; changed: boolean } | { ok: false; error: string; message?: string };
const isReply = (value: unknown): value is Reply => typeof value === 'object' && value !== null && 'ok' in value && typeof value.ok === 'boolean';

// the same box as the Input primitive, for the native selects (a native control posts with the form and needs no hydration to show)
const selectClass = 'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30';

function ActionForm({ userId, action, title, description, submit, disabled, destructive, children }: { userId: string; action: AdminAction; title: string; description: string; submit: string; disabled?: boolean; destructive?: boolean; children?: ReactNode }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState<{ text: string; failed: boolean } | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // empty fields are left out, so an optional date or note is absent rather than ''
    const body = Object.fromEntries([...new FormData(event.currentTarget)].filter(([, value]) => typeof value === 'string' && value !== ''));
    setPending(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const reply: unknown = await res.json().catch(() => null);
      if (!isReply(reply)) setNote({ text: `Failed (${res.status}).`, failed: true });
      else if (!reply.ok) setNote({ text: reply.message ?? `Refused: ${reply.error}.`, failed: true });
      else {
        setNote({ text: reply.changed ? 'Done.' : 'Already so; nothing changed.', failed: false });
        if (reply.changed) router.refresh();
      }
    } catch {
      setNote({ text: 'The request did not get through.', failed: true });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="gap-3 shadow-none">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-3" aria-label={title}>
          <fieldset disabled={disabled || pending} className="flex flex-col gap-3">
            {children}
            <div className="flex items-center gap-3">
              <Button type="submit" variant={destructive ? 'destructive' : 'outline'} size="sm">{submit}</Button>
              {note ? <span role="status" className={`text-xs ${note.failed ? 'text-destructive' : 'text-muted-foreground'}`}>{note.text}</span> : null}
            </div>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}

export function UserActions({ userId, self, role, status, suspended, liveGrants }: UserActionsProps) {
  const deleted = status === 'deleted';
  const selfNote = self ? ' You are looking at your own account, so this is off.' : '';
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ActionForm userId={userId} action="set-role" title="Role" description={`Administrators can open this area; the role opens no content by itself.${selfNote}`} submit="Set role" disabled={self || deleted}>
        <Label htmlFor="role">Role</Label>
        <select id="role" name="role" defaultValue={role} className={selectClass}>
          <option value="reader">reader</option>
          <option value="admin">admin</option>
        </select>
      </ActionForm>

      <ActionForm userId={userId} action="set-status" title="Account status" description={`Disabling stops sign-in and ends every session; a reason is required.${selfNote}`} submit="Set status" disabled={self || deleted} destructive={status === 'active'}>
        <Label htmlFor="status">Status</Label>
        <select id="status" name="status" defaultValue={status === 'active' ? 'disabled' : 'active'} className={selectClass}>
          <option value="active">active</option>
          <option value="disabled">disabled</option>
        </select>
        <Label htmlFor="status-reason">Reason (for disabling)</Label>
        <Input id="status-reason" name="reason" maxLength={500} placeholder="Why" />
      </ActionForm>

      <ActionForm userId={userId} action="create-grant" title="Add a grant" description="A complimentary or promo grant by you; paid grants come from the billing record." submit="Add grant" disabled={deleted}>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="grant-kind">Kind</Label>
            <select id="grant-kind" name="kind" defaultValue="complimentary" className={selectClass}>
              <option value="complimentary">complimentary</option>
              <option value="promo">promo</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="grant-tier">Tier</Label>
            <select id="grant-tier" name="tier" defaultValue="pro" className={selectClass}>
              <option value="basic">basic</option>
              <option value="pro">pro</option>
            </select>
          </div>
        </div>
        <Label htmlFor="grant-ends">Ends (optional, UTC)</Label>
        <Input id="grant-ends" name="endsAt" type="datetime-local" />
        <Label htmlFor="grant-note">Note</Label>
        <Input id="grant-note" name="grantNote" maxLength={500} placeholder="Why this grant" />
      </ActionForm>

      <ActionForm userId={userId} action="revoke-grant" title="Revoke a grant" description={liveGrants.length ? 'Takes paid content away from the moment you press the button.' : 'No grant is in force.'} submit="Revoke grant" disabled={liveGrants.length === 0} destructive>
        <Label htmlFor="revoke-grant">Grant</Label>
        <select id="revoke-grant" name="grantId" className={selectClass}>
          {liveGrants.map(grant => <option key={grant.id} value={grant.id}>{grant.label}</option>)}
        </select>
        <Label htmlFor="revoke-reason">Reason</Label>
        <select id="revoke-reason" name="reason" defaultValue="admin" className={selectClass}>
          {['admin', 'abuse', 'refund', 'chargeback', 'expired_promo'].map(reason => <option key={reason} value={reason}>{reason}</option>)}
        </select>
      </ActionForm>

      {/* keyed, or React keeps one form's note when the refresh swaps it for the other */}
      {suspended ? (
        <ActionForm key="unsuspend" userId={userId} action="unsuspend" title="Lift the suspension" description="Paid content opens again as the grants on file allow." submit="Unsuspend" />
      ) : (
        <ActionForm key="suspend" userId={userId} action="suspend" title="Suspend the membership" description="Pauses paid content only; sign-in, the account page and the free chapters stay open." submit="Suspend" disabled={deleted} destructive>
          <Label htmlFor="suspend-reason">Reason</Label>
          <Input id="suspend-reason" name="reason" maxLength={500} required placeholder="Why" />
        </ActionForm>
      )}

      <ActionForm userId={userId} action="link-billing" title="Link a billing record" description="Points a purchase made under another address at this account (plan 10.2)." submit="Link record" disabled={deleted}>
        <Label htmlFor="billing-record">Billing record id</Label>
        <Input id="billing-record" name="billingRecordId" required placeholder="uuid" />
      </ActionForm>

      <ActionForm userId={userId} action="resync-billing" title="Resync billing" description="Re-reads this account's records from the billing provider." submit="Resync" />
      <ActionForm userId={userId} action="resend-ready-email" title="Resend the ready email" description="Sends the 'your handbook is ready' sign-in link again." submit="Resend" />
    </div>
  );
}
