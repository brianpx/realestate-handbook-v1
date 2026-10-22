import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DeepLinks } from '@/components/shell/DeepLinks';
import { Gate } from '@/components/shell/Gate';
import { Sidebar } from '@/components/shell/Sidebar';
import { TermPopover } from '@/components/shell/TermPopover';

// The product is not for search results; the public sample at /preview is.
export const metadata: Metadata = { robots: { index: false, follow: false } };

// The product shell: handbook navigation, no marketing header. The public site has its own layout in app/(public).
export default function ProductLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div id="pageStatus" className="visually-hidden" role="status" aria-live="polite" aria-atomic="true" />
      <div className="shell-handbook">
        <Sidebar />
        <DeepLinks />
        <TermPopover />
        <main id="main-content" tabIndex={-1}>{children}</main>
      </div>
      <Gate enabled={process.env.LEAD_CAPTURE_ENABLED === 'true'} />
    </>
  );
}
