import type { Metadata } from 'next';
import { BOOK_TITLE } from '@/lib/pages';

export const metadata: Metadata = { title: 'Coming soon', robots: { index: false, follow: false } };

// What proxy.ts shows in place of every page while COMING_SOON is on. Outside the (public) group on purpose: the
// site header and footer would only link to pages the visitor cannot open yet.
export default function ComingSoonPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 text-center text-foreground">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{BOOK_TITLE}</h1>
        <p className="mt-3 text-lg text-muted-foreground">Coming soon</p>
      </div>
    </main>
  );
}
