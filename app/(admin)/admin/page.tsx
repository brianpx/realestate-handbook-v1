import type { Metadata } from 'next';
import { AdminPage } from '@/components/admin/AdminShell';
import { LeadsBySource } from '@/components/admin/LeadsBySource';
import { NoStore } from '@/components/admin/NoStore';
import { RecentLeads } from '@/components/admin/RecentLeads';
import { SignInPlacements } from '@/components/admin/SignInPlacements';
import { StatCards } from '@/components/admin/StatCards';
import { leadStats } from '@/lib/admin/lead-stats';
import { requireAdmin } from '@/lib/auth/dal';
import { authStoresFromEnv } from '@/lib/auth/store';
import { storeFromEnv } from '@/lib/leads/store';

export const metadata: Metadata = { title: 'Admin overview' };

export default async function AdminOverviewPage() {
  await requireAdmin();
  const store = storeFromEnv(process.env);
  if (!store) return <AdminPage title="Overview"><NoStore /></AdminPage>;
  const stats = leadStats(await store.list(), new Date());
  // the page got past requireAdmin(), so the auth stores exist; the guard only satisfies the type
  const placements = (await authStoresFromEnv(process.env)?.auth.placementStats()) ?? [];
  return (
    <AdminPage title="Overview" description="How the email forms are doing.">
      <StatCards
        stats={[
          { label: 'Total leads', value: stats.total, caption: `${stats.confirmed} confirmed by link` },
          { label: 'Last 7 days', value: stats.last7Days, caption: 'New in the past week' },
          { label: 'Last 30 days', value: stats.last30Days, caption: 'New in the past month' },
          { label: 'Email failures', value: stats.emailFailed, caption: `${stats.byEmailStatus.pending} still pending, ${stats.byEmailStatus.skipped} skipped` },
        ]}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_3fr]">
        <LeadsBySource sources={stats.bySource} />
        <RecentLeads leads={stats.recent} />
      </div>
      <SignInPlacements placements={placements} />
    </AdminPage>
  );
}
