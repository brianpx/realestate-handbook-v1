import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PlanApp } from '@/components/coach/PlanApp';
import { UpsellCard } from '@/components/handbook/UpsellCard';
import { ProductCard } from '@/components/shell/ProductCard';
import { coachOpen } from '@/lib/access/entitlement';
import { requireViewer } from '@/lib/auth/dal';
import { COACH_ENABLED } from '@/lib/coach/enabled';
import { upgradeFor } from '@/lib/offer';

export const metadata: Metadata = { title: 'My plan', alternates: { canonical: '/handbook/plan' } };

export default async function Page() {
  const viewer = await requireViewer();
  if (!COACH_ENABLED) notFound();
  if (!coachOpen(viewer.entitlement)) return <UpsellCard feature="coach" entitlement={viewer.entitlement} upgrade={upgradeFor(viewer.entitlement, viewer.user)} />;
  return (
    <ProductCard>
      <h1>My reading plan</h1>
      <p>Pick a pace and the days you can study. This page shows only what is next. Everything here is saved on this device only.</p>
      <PlanApp />
    </ProductCard>
  );
}
