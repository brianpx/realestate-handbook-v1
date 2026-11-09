import Link from 'next/link';
import { ProductCard } from '@/components/shell/ProductCard';
import { HANDBOOK } from '@/lib/routes';

// Reached by notFound() inside the product (a tool that is switched off), so the reader keeps the sidebar and
// can carry on from it. URLs that match no route at all go to app/not-found.tsx instead.
export default function ProductNotFound() {
  return (
    <ProductCard>
      <h1>Page not found</h1>
      <p>That page is not part of the handbook, or is not available in this edition.</p>
      <p><Link href={HANDBOOK}>Back to the handbook home</Link></p>
    </ProductCard>
  );
}
