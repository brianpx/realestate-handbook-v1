'use client'; // error boundaries must be client components (error.md)

import Link from 'next/link';
import { useEffect } from 'react';
import { ProductCard } from '@/components/shell/ProductCard';
import { HANDBOOK } from '@/lib/routes';

// A throw inside a product page (a tool, a page read) lands here with the sidebar still up, instead of on Next's
// default error screen. The message is never rendered: a client-side throw can carry anything, and the server's is
// a generic one with a digest anyway, so it goes to the console only, where the digest matches the server log.
export default function ProductError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <ProductCard>
      <h1>Something went wrong</h1>
      <p>This page could not be shown. Trying again usually fixes it.</p>
      <p><button type="button" className="btn-mini" onClick={retry}>Try again</button></p>
      <p><Link href={HANDBOOK}>Back to the handbook home</Link></p>
    </ProductCard>
  );
}
