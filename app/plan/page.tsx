import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { COACH_ENABLED } from '@/lib/coach/enabled';
import { PlanApp } from '@/components/coach/PlanApp';

export const metadata: Metadata = { title: 'My plan', alternates: { canonical: '/plan' } };

export default function Page() {
  if (!COACH_ENABLED) notFound();
  return (
    <>
      <h2>My reading plan</h2>
      <p>Pick a pace and the days you can study. This page shows only what is next. Everything here is saved on this device only.</p>
      <PlanApp />
    </>
  );
}
