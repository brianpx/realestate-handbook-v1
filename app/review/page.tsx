import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { COACH_ENABLED } from '@/lib/coach/enabled';
import { ReviewDeck } from '@/components/coach/ReviewDeck';

export const metadata: Metadata = { title: 'Review', alternates: { canonical: '/review' } };

export default function Page() {
  if (!COACH_ENABLED) notFound();
  return (
    <>
      <h2>Review</h2>
      <p>A short deck of the ideas due for another look, mixed across chapters. Everything here is saved on this device only.</p>
      <ReviewDeck />
    </>
  );
}
