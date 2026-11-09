import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdminPage } from '@/components/admin/AdminShell';
import { AuditTable, toAuditView, userIdsIn } from '@/components/admin/AuditTable';
import { UserActions } from '@/components/admin/UserActions';
import { MembershipBadge, RoleBadge, StatusBadge } from '@/components/admin/UsersTable';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { grantLive } from '@/lib/access/entitlement';
import { formatWhen } from '@/lib/admin/format';
import { requireAdmin } from '@/lib/auth/dal';
import { authStoresFromEnv } from '@/lib/auth/store';
import { z } from '@/lib/zod';

export const metadata: Metadata = { title: 'User' };

type Props = { params: Promise<{ id: string }> };

// One account: the facts, the state-setters, the grants on file and the audit rows about it. The id from the URL
// is checked for shape and then looked up; anything else is a 404, never a query.
export default async function AdminUserPage({ params }: Props) {
  const viewer = await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const stores = authStoresFromEnv(process.env);
  if (!stores) notFound();
  const user = await stores.users.findById(id);
  if (!user) notFound();
  const now = new Date();
  const [snapshot, userAudit, membershipAudit] = await Promise.all([stores.access.loadAccess(id), stores.access.listAudit('users', id), stores.access.listAudit('memberships', id)]);
  const audit = [...userAudit, ...membershipAudit].sort((a, b) => b.at.getTime() - a.at.getTime());
  const emails = new Map((await stores.users.findByIds(userIdsIn(audit))).map(u => [u.id, u.email]));
  const membership = snapshot.membership;
  const live = snapshot.grants.filter(g => grantLive(g, now));

  return (
    <AdminPage title={user.email} description={`Account ${user.id}`}>
      <Card className="gap-3 shadow-none">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Facts</CardTitle>
          <CardDescription>Times are UTC.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div><dt className="text-muted-foreground">Status</dt><dd><StatusBadge status={user.status} /></dd></div>
            <div><dt className="text-muted-foreground">Role</dt><dd><RoleBadge role={user.role} /></dd></div>
            <div><dt className="text-muted-foreground">Membership</dt><dd><MembershipBadge membership={membership ? { status: membership.status, tier: membership.tier } : null} /></dd></div>
            <div><dt className="text-muted-foreground">Created</dt><dd className="tabular-nums">{formatWhen(user.createdAt)}</dd></div>
            <div><dt className="text-muted-foreground">Last sign-in</dt><dd className="tabular-nums">{user.lastSignInAt ? formatWhen(user.lastSignInAt) : 'never'}</dd></div>
            <div><dt className="text-muted-foreground">Billing records</dt><dd>{snapshot.billing.length === 0 ? 'none' : snapshot.billing.map(b => `${b.kind} ${b.tier} (${b.status})`).join(', ')}</dd></div>
            {membership?.suspendedAt ? (
              <div className="sm:col-span-2 lg:col-span-3"><dt className="text-muted-foreground">Suspended</dt><dd>{formatWhen(membership.suspendedAt)} by {membership.suspendedBy ? (emails.get(membership.suspendedBy) ?? membership.suspendedBy) : 'unknown'}: {membership.suspendReason}</dd></div>
            ) : null}
          </dl>
        </CardContent>
      </Card>

      <UserActions
        userId={user.id}
        self={user.id === viewer.user.id}
        role={user.role}
        status={user.status}
        suspended={Boolean(membership?.suspendedAt)}
        liveGrants={live.map(g => ({ id: g.id, label: `${g.kind} ${g.tier}${g.endsAt ? ` until ${formatWhen(g.endsAt)}` : ''}` }))}
      />

      <Card className="min-w-0 gap-0 py-0 shadow-none">
        <CardHeader className="flex flex-col gap-1.5 border-b py-5">
          <CardTitle className="text-lg">Grants</CardTitle>
          <CardDescription>{snapshot.grants.length === 0 ? 'No grant on file: this reader has the free set.' : 'Every grant ever made, revoked ones included.'}</CardDescription>
        </CardHeader>
        {snapshot.grants.length ? (
          <CardContent className="px-0 pt-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  {['Kind', 'Tier', 'Starts', 'Ends', 'Made by', 'State'].map(label => <TableHead key={label} className="text-muted-foreground first:pl-4 last:pr-4">{label}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshot.grants.map(grant => (
                  <TableRow key={grant.id}>
                    <TableCell className="pl-4">{grant.kind}</TableCell>
                    <TableCell>{grant.tier}</TableCell>
                    <TableCell className="tabular-nums">{formatWhen(grant.startsAt)}</TableCell>
                    <TableCell className="tabular-nums">{grant.endsAt ? formatWhen(grant.endsAt) : <span className="text-muted-foreground">open-ended</span>}</TableCell>
                    <TableCell className="text-muted-foreground">{grant.grantedBy ? (emails.get(grant.grantedBy) ?? grant.grantedBy.slice(0, 8)) : grant.billingRecordId ? `billing ${grant.billingRecordId.slice(0, 8)}` : '—'}{grant.grantNote ? ` · ${grant.grantNote}` : ''}</TableCell>
                    <TableCell className="pr-4">
                      {grant.revokedAt ? <Badge variant="destructive">revoked ({grant.revokeReason})</Badge> : grantLive(grant, now) ? <Badge variant="secondary">live</Badge> : <Badge variant="outline">{grant.startsAt > now ? 'not yet' : 'ended'}</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        ) : null}
      </Card>

      <AuditTable rows={toAuditView(audit, emails)} total={audit.length} pageIndex={0} pageSize={Math.max(audit.length, 1)} title="History" description="Audit rows about this account and its membership, newest first. Grant rows are keyed by grant and listed on the audit page." />
    </AdminPage>
  );
}
