import type { ReactNode } from 'react';
import { PublicFooter } from '@/components/site/PublicFooter';
import { PublicHeader } from '@/components/site/PublicHeader';
import './site.css';

// The public website: marketing header and footer, ordinary page scrolling. The product has its own shell in app/(product).
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="pub">
      <a className="skip-link" href="#site-main">Skip to content</a>
      <PublicHeader />
      <main id="site-main" className="pub-main" tabIndex={-1}>{children}</main>
      <PublicFooter />
    </div>
  );
}
