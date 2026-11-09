import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdminPage } from '@/components/admin/AdminShell';
import { AuditTable, toAuditView, userIdsIn } from '@/components/admin/AuditTable';
import { PAGE_SIZE, pageIndexFrom } from '@/lib/admin/pagination';
import { requireAdmin } from '@/lib/auth/dal';
import { authStoresFromEnv } from '@/lib/auth/store';

export const metadata: Metadata = { title: 'Audit log' };

type Props = { searchParams: Promise<{ page?: string | string[] }> };

export default async function AdminAuditPage({ searchParams }: Props) {
  await requireAdmin();
  // the page got past requireAdmin(), so the auth stores exist; the guard only satisfies the type
  const stores = authStoresFromEnv(process.env);
  if (!stores) notFound();
  const pageIndex = pageIndexFrom((await searchParams).page);
  const { rows, total } = await stores.access.listAuditLog({ offset: pageIndex * PAGE_SIZE, limit: PAGE_SIZE });
  // one lookup for every actor and subject on the page; a deleted account resolves to its anonymised address
  const emails = new Map((await stores.users.findByIds(userIdsIn(rows))).map(u => [u.id, u.email]));
  return (
    <AdminPage title="Audit log" description="Who changed what, newest first. Append-only: nothing here can be edited or removed.">
      <AuditTable rows={toAuditView(rows, emails)} total={total} pageIndex={pageIndex} pageSize={PAGE_SIZE} />
    </AdminPage>
  );
}
