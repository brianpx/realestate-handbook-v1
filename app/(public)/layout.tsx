import type { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/shell/Breadcrumbs';
import { PublicChrome } from '@/components/site/PublicChrome';
import { hasSessionCookie } from '@/lib/auth/dal';
import './site.css';

// The public website: marketing header and footer, ordinary page scrolling. The product has its own shell in app/(product).
// The header reads the session cookie's presence (not the session), so every public page renders per request.
export default async function PublicLayout({ children }: { children: ReactNode }) {
  const signedIn = await hasSessionCookie();
  return (
    <PublicChrome signedIn={signedIn}>
      <div className="pub-wrap"><Breadcrumbs className="pub-crumbs" /></div>
      {children}
    </PublicChrome>
  );
}
