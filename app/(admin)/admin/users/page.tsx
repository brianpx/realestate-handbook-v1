import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdminPage } from '@/components/admin/AdminShell';
import { UsersTable, type UserListRow } from '@/components/admin/UsersTable';
import { PAGE_SIZE, pageIndexFrom } from '@/lib/admin/pagination';
import { requireAdmin } from '@/lib/auth/dal';
import { authStoresFromEnv } from '@/lib/auth/store';

export const metadata: Metadata = { title: 'Users' };

type Props = { searchParams: Promise<{ page?: string | string[] }> };

export default async function AdminUsersPage({ searchParams }: Props) {
  await requireAdmin();
  // the page got past requireAdmin(), so the auth stores exist; the guard only satisfies the type
  const stores = authStoresFromEnv(process.env);
  if (!stores) notFound();
  const pageIndex = pageIndexFrom((await searchParams).page);
  const { users, total } = await stores.users.list({ offset: pageIndex * PAGE_SIZE, limit: PAGE_SIZE });
  const summaries = new Map((await stores.access.accessSummaries(users.map(u => u.id))).map(s => [s.userId, s]));
  const rows: UserListRow[] = users.map(user => {
    const summary = summaries.get(user.id);
    const membership = summary?.membership ?? null;
    return { id: user.id, email: user.email, role: user.role, status: user.status, membership: membership ? { status: membership.status, tier: membership.tier } : null, billingRecords: summary?.billingRecords ?? 0, createdAt: user.createdAt, lastSignInAt: user.lastSignInAt };
  });
  return (
    <AdminPage title="Users" description="Every account, with its membership and billing beside it. Open one to change it.">
      <UsersTable rows={rows} total={total} pageIndex={pageIndex} pageSize={PAGE_SIZE} />
    </AdminPage>
  );
}
