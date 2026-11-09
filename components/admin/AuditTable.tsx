import { ScrollTextIcon } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCount, formatWhen } from '@/lib/admin/format';
import type { AuditRow } from '@/lib/audit';
import { ADMIN } from '@/lib/routes';
import { PageLinks, PageRange } from './PageLinks';
import { userHref } from './UsersTable';

/** An audit row with its ids turned into names where the users table still knows them. */
export type AuditView = {
  id: string;
  at: Date;
  actor: string;
  action: string;
  subject: string;
  /** The user the row is about, when its subject is a user, a membership or a user's sessions: the detail page's link. */
  subjectUserId: string | null;
  reason: string | null;
  change: string | null;
};

// These tables key their subject by the user id, so the row can point at the user's page.
const USER_KEYED = new Set(['users', 'memberships', 'sessions']);
/** Which user ids a batch of rows names, as actor or as subject, so one lookup resolves them all. */
export function userIdsIn(rows: AuditRow[]): string[] {
  const ids = new Set<string>();
  for (const row of rows) {
    if (row.actorUserId) ids.add(row.actorUserId);
    if (row.subjectId && USER_KEYED.has(row.subjectTable)) ids.add(row.subjectId);
  }
  return [...ids];
}

const short = (id: string | null) => (id ? id.slice(0, 8) : '?');
const json = (value: unknown) => (value === null || value === undefined ? null : JSON.stringify(value));

export function toAuditView(rows: AuditRow[], emails: Map<string, string>): AuditView[] {
  return rows.map(row => {
    const subjectUser = row.subjectId && USER_KEYED.has(row.subjectTable) ? row.subjectId : null;
    const who = subjectUser ? (emails.get(subjectUser) ?? short(subjectUser)) : short(row.subjectId);
    const subject = row.subjectTable === 'users' ? who : row.subjectTable === 'memberships' ? `membership of ${who}` : row.subjectTable === 'sessions' ? `sessions of ${who}` : `${row.subjectTable.replace(/_/g, ' ')} ${who}`;
    const before = json(row.before);
    const after = json(row.after);
    return {
      id: row.id,
      at: row.at,
      actor: row.actorUserId ? (emails.get(row.actorUserId) ?? short(row.actorUserId)) : row.actorKind,
      action: row.action,
      subject,
      subjectUserId: subjectUser,
      reason: row.reason,
      change: before || after ? `${before ?? '—'} → ${after ?? '—'}` : null,
    };
  });
}

export function AuditTable({ rows, total, pageIndex, pageSize, title = 'Audit log', description }: { rows: AuditView[]; total: number; pageIndex: number; pageSize: number; title?: string; description?: string }) {
  const pageCount = Math.ceil(total / pageSize);
  return (
    <Card className="min-w-0 gap-0 py-0 shadow-none">
      <CardHeader className="flex flex-col gap-1.5 border-b py-5">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description ?? `${formatCount(total)} entries, newest first. Times are UTC.`}</CardDescription>
      </CardHeader>
      <CardContent className="px-0 pt-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {['When', 'Actor', 'Action', 'Subject', 'Reason', 'Change'].map(label => (
                <TableHead key={label} className="text-muted-foreground first:pl-4 last:pr-4">{label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map(row => (
                <TableRow key={row.id}>
                  <TableCell className="pl-4 tabular-nums">{formatWhen(row.at)}</TableCell>
                  <TableCell>{row.actor}</TableCell>
                  <TableCell><Badge variant="outline">{row.action}</Badge></TableCell>
                  <TableCell>{row.subjectUserId ? <Link href={userHref(row.subjectUserId)} className="underline-offset-4 hover:underline">{row.subject}</Link> : row.subject}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground" title={row.reason ?? undefined}>{row.reason ?? '—'}</TableCell>
                  <TableCell className="max-w-md pr-4">
                    {row.change ? <code className="block truncate text-xs text-muted-foreground" title={row.change}>{row.change}</code> : '—'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="p-0 whitespace-normal">
                  <Empty className="py-10">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <ScrollTextIcon />
                      </EmptyMedia>
                      <EmptyTitle>Nothing logged</EmptyTitle>
                      <EmptyDescription>Every change to a role, status, grant, membership or session is listed here once it happens.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      {pageCount > 1 || total > rows.length ? (
        <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t py-4">
          <PageRange pageIndex={pageIndex} pageSize={pageSize} shown={rows.length} total={formatCount(total)} />
          <PageLinks pageIndex={pageIndex} pageCount={pageCount} href={page => (page === 0 ? `${ADMIN}/audit` : `${ADMIN}/audit?page=${page + 1}`)} />
        </CardFooter>
      ) : null}
    </Card>
  );
}
