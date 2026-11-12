import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ReviewDeck } from '@/components/coach/ReviewDeck';
import { UpsellCard } from '@/components/handbook/UpsellCard';
import { ProductCard } from '@/components/shell/ProductCard';
import { coachOpen } from '@/lib/access/entitlement';
import { requireViewer } from '@/lib/auth/dal';
import { COACH_ENABLED } from '@/lib/coach/enabled';
import { upgradeFor } from '@/lib/offer';

export const metadata: Metadata = { title: 'Review', alternates: { canonical: '/handbook/review' } };

export default async function Page() {
  const viewer = await requireViewer();
  if (!COACH_ENABLED) notFound();
  if (!coachOpen(viewer.entitlement)) return <UpsellCard feature="coach" entitlement={viewer.entitlement} upgrade={upgradeFor(viewer.entitlement, viewer.user)} />;
  return (
    <ProductCard>
      <h1>Review</h1>
      <p>A short deck of the ideas due for another look, mixed across chapters. Everything here is saved on this device only.</p>
      <ReviewDeck />
    </ProductCard>
  );
}
