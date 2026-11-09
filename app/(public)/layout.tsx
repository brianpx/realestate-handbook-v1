import type { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/shell/Breadcrumbs';
import { PublicChrome } from '@/components/site/PublicChrome';
import './site.css';

// The public website: marketing header and footer, ordinary page scrolling. The product has its own shell in app/(product).
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <PublicChrome>
      <div className="pub-wrap"><Breadcrumbs className="pub-crumbs" /></div>
      {children}
    </PublicChrome>
  );
}
