import type { Metadata } from 'next';
import { BOOK_TITLE } from '@/lib/pages';

export const metadata: Metadata = { title: 'Coming soon', robots: { index: false, follow: false } };

// What proxy.ts shows in place of every page while COMING_SOON is on. Outside the (public) group on purpose: the
// site header and footer would only link to pages the visitor cannot open yet.
// Dark in both themes, so the colours are the dark palette's literal values rather than tokens that flip.
export default function ComingSoonPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#020617] bg-[radial-gradient(ellipse_at_center,#12304a_0%,#020617_70%)] px-4 text-center text-[#f8fafc] [color-scheme:dark]">
      <div>
        <img className="mx-auto mb-6" src="/images/logo3-sidebar-dark.png" width={96} height={96} alt="" />
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{BOOK_TITLE}</h1>
        <p className="mt-3 text-lg text-balance text-[#cbd5e1]">A 90-day handbook for new real estate agents</p>
        <p className="mt-6 text-sm font-medium tracking-widest text-[#4ade80] uppercase">Coming soon</p>
      </div>
    </main>
  );
}
