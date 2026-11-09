import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { requireAdmin } from '@/lib/auth/dal';

// Its own shell, not the product's or the public site's. The proxy only checks that a cookie is present; the
// role check is here, before anything renders, and again on each page for when a page is reached another way.
export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const viewer = await requireAdmin();
  return <AdminShell viewerEmail={viewer.user.email}>{children}</AdminShell>;
}
