import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { COACH_ENABLED } from '@/lib/coach/enabled';
import { PlanApp } from '@/components/coach/PlanApp';
import { ProductCard } from '@/components/shell/ProductCard';

export const metadata: Metadata = { title: 'My plan', alternates: { canonical: '/handbook/plan' } };

export default function Page() {
  if (!COACH_ENABLED) notFound();
  return (
    <ProductCard>
      <h1>My reading plan</h1>
      <p>Pick a pace and the days you can study. This page shows only what is next. Everything here is saved on this device only.</p>
      <PlanApp />
    </ProductCard>
  );
}
