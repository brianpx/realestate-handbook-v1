import type { Metadata } from 'next';
import { AdminPage } from '@/components/admin/AdminShell';
import { LeadsTable } from '@/components/admin/LeadsTable';
import { NoStore } from '@/components/admin/NoStore';
import { requireAdmin } from '@/lib/auth/dal';
import { LEAD_LIST_CAP, storeFromEnv } from '@/lib/leads/store';

export const metadata: Metadata = { title: 'Leads' };

export default async function AdminLeadsPage() {
  await requireAdmin();
  const store = storeFromEnv(process.env);
  if (!store) return <AdminPage title="Leads"><NoStore /></AdminPage>;
  const leads = await store.list();
  return (
    <AdminPage title="Leads" description={leads.length >= LEAD_LIST_CAP ? `The newest ${LEAD_LIST_CAP} addresses; older ones are in the store but not listed.` : 'Every address left through the email form.'}>
      <LeadsTable leads={leads.map(lead => ({ ...lead, createdAt: lead.createdAt.toISOString(), confirmedAt: lead.confirmedAt?.toISOString() ?? null, unsubscribedAt: lead.unsubscribedAt?.toISOString() ?? null }))} />
    </AdminPage>
  );
}
