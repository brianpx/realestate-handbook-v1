import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHead } from '@/components/site/Draft';
import { PublicChrome } from '@/components/site/PublicChrome';
import { BOOK_TITLE } from '@/lib/pages';
import './(public)/site.css';

export const metadata: Metadata = { title: 'Page not found' };

// Unmatched URLs anywhere on the site land here, outside every route group's layout, so the public chrome is
// composed by hand. A notFound() inside the product keeps its shell through app/(product)/not-found.tsx.
export default function NotFound() {
  return (
    <PublicChrome>
      <PageHead eyebrow="Not found" title="Page not found">
        That address is not part of {BOOK_TITLE}. The link may be old, or the address may have a typo.
      </PageHead>
      <div className="pub-wrap pub-narrow pub-prose">
        <ul>
          <li><Link href="/">Go to the home page</Link></li>
          <li><Link href="/handbook">Open the handbook</Link></li>
          <li><Link href="/support">Get help</Link></li>
        </ul>
      </div>
    </PublicChrome>
  );
}
