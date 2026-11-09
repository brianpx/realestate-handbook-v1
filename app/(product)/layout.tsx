import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DeepLinks } from '@/components/shell/DeepLinks';
import { HydrationMark } from '@/components/shell/HydrationMark';
import { Sidebar } from '@/components/shell/Sidebar';
import { TermPopover } from '@/components/shell/TermPopover';
import { coachOpen, pageOpen, type Entitlement } from '@/lib/access/entitlement';
import { getViewer } from '@/lib/auth/dal';
import { PAGE_IDS } from '@/lib/pages';

// The product is not for search results; the public sample at /preview is.
export const metadata: Metadata = { robots: { index: false, follow: false } };

const NOBODY: Entitlement = { level: 'none' };

// The product shell: handbook navigation, no marketing header. The public site has its own layout in app/(public).
// Every page under it signs the reader in itself (requireViewer); the viewer is read here only to mark what the
// sidebar may not open. The first-visit email dialog is gone: readers arrive signed in (OD-18).
export default async function ProductLayout({ children }: { children: ReactNode }) {
  const entitlement = (await getViewer())?.entitlement ?? NOBODY;
  const locked: Record<string, string> = {};
  for (const id of PAGE_IDS) if (!pageOpen(entitlement, id)) locked[id] = 'Members';
  if (!coachOpen(entitlement)) locked.plan = locked.review = 'Pro';
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div id="pageStatus" className="visually-hidden" role="status" aria-live="polite" aria-atomic="true" />
      <div className="shell-handbook">
        <Sidebar locked={locked} />
        <DeepLinks />
        <TermPopover />
        <main id="main-content" tabIndex={-1}>{children}</main>
        <HydrationMark />
      </div>
    </>
  );
}
