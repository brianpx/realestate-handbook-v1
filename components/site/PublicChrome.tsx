import type { ReactNode } from 'react';
import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';

// Marketing header and footer around ordinary page scrolling. app/(public)/layout.tsx wraps every public page in
// it and says whether the visitor carries a session cookie; app/not-found.tsx composes it by hand because the
// root 404 renders outside that layout.
export function PublicChrome({ children, signedIn = false }: { children: ReactNode; signedIn?: boolean }) {
  return (
    <div className="pub">
      <a className="skip-link" href="#site-main">Skip to content</a>
      {/* announce() in lib/announce.ts speaks through this region; the sample lesson's tools use it too */}
      <div id="pageStatus" className="visually-hidden" role="status" aria-live="polite" aria-atomic="true" />
      <PublicHeader signedIn={signedIn} />
      <main id="site-main" className="pub-main" tabIndex={-1}>{children}</main>
      <PublicFooter />
    </div>
  );
}
