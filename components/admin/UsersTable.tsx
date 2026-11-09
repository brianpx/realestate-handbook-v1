import { UsersIcon } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { MembershipStatus, PaidTier } from '@/lib/access/types';
import { formatCount, formatWhen } from '@/lib/admin/format';
import { ADMIN } from '@/lib/routes';
import type { Role, UserStatus } from '@/lib/users/types';
import { PageLinks, PageRange } from './PageLinks';

/** One line of the admin user list: the user row and what the access store says beside it. */
export type UserListRow = {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  membership: { status: MembershipStatus; tier: PaidTier | null } | null;
  billingRecords: number;
  createdAt: Date;
  lastSignInAt: Date | null;
};

export const userHref = (id: string) => `${ADMIN}/users/${id}`;

const STATUS_VARIANT: Record<UserStatus, 'secondary' | 'destructive' | 'outline'> = { active: 'secondary', disabled: 'destructive', deleted: 'outline' };
const MEMBERSHIP_VARIANT: Record<MembershipStatus, 'secondary' | 'destructive' | 'outline'> = { active: 'secondary', suspended: 'destructive', lapsed: 'outline', none: 'outline' };

export function StatusBadge({ status }: { status: UserStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
}
export function RoleBadge({ role }: { role: Role }) {
  return <Badge variant={role === 'admin' ? 'default' : 'outline'}>{role}</Badge>;
}
export function MembershipBadge({ membership }: { membership: UserListRow['membership'] }) {
  if (!membership || membership.status === 'none') return <span className="text-muted-foreground">none</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge variant={MEMBERSHIP_VARIANT[membership.status]}>{membership.status}</Badge>
      {membership.tier ? <span className="text-muted-foreground">{membership.tier}</span> : null}
    </span>
  );
}

// Server-rendered: the list is paged in the store, so the browser only ever holds one page of it.
export function UsersTable({ rows, total, pageIndex, pageSize }: { rows: UserListRow[]; total: number; pageIndex: number; pageSize: number }) {
  const pageCount = Math.ceil(total / pageSize);
  return (
    <Card className="min-w-0 gap-0 py-0 shadow-none">
      <CardHeader className="flex flex-col gap-1.5 border-b py-5">
        <CardTitle className="text-lg">All users</CardTitle>
        <CardDescription>{formatCount(total)} accounts, newest first. Times are UTC.</CardDescription>
      </CardHeader>
      <CardContent className="px-0 pt-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {['Email', 'Status', 'Role', 'Membership', 'Billing', 'Created', 'Last sign-in'].map(label => (
                <TableHead key={label} className="text-muted-foreground first:pl-4 last:pr-4">{label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map(row => (
                <TableRow key={row.id}>
                  <TableCell className="pl-4">
                    <Link href={userHref(row.id)} className="font-medium underline-offset-4 hover:underline">{row.email}</Link>
                  </TableCell>
                  <TableCell><StatusBadge status={row.status} /></TableCell>
                  <TableCell><RoleBadge role={row.role} /></TableCell>
                  <TableCell><MembershipBadge membership={row.membership} /></TableCell>
                  <TableCell className="tabular-nums">{row.billingRecords === 0 ? <span className="text-muted-foreground">none</span> : `${row.billingRecords} ${row.billingRecords === 1 ? 'record' : 'records'}`}</TableCell>
                  <TableCell className="tabular-nums">{formatWhen(row.createdAt)}</TableCell>
                  <TableCell className="pr-4 tabular-nums">{row.lastSignInAt ? formatWhen(row.lastSignInAt) : <span className="text-muted-foreground">never</span>}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="p-0 whitespace-normal">
                  <Empty className="py-10">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <UsersIcon />
                      </EmptyMedia>
                      <EmptyTitle>{total === 0 ? 'No users yet' : 'Nothing on this page'}</EmptyTitle>
                      <EmptyDescription>{total === 0 ? 'Accounts are created at the first sign-in and listed here.' : 'The list ends before this page.'}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t py-4">
        <PageRange pageIndex={pageIndex} pageSize={pageSize} shown={rows.length} total={formatCount(total)} />
        <PageLinks pageIndex={pageIndex} pageCount={pageCount} href={page => (page === 0 ? `${ADMIN}/users` : `${ADMIN}/users?page=${page + 1}`)} />
      </CardFooter>
    </Card>
  );
}
