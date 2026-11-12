import Link from 'next/link';
import { copyright, HELP_LINKS, LEGAL_NOTE, POLICY_LINKS } from '@/lib/footer';
import { BOOK_TITLE } from '@/lib/pages';

export function PublicFooter() {
  return (
    <footer className="pub-footer">
      <div className="pub-wrap">
        <div className="pub-footer-grid">
          <div>
            <p><strong>{BOOK_TITLE}</strong></p>
            <p>A 90-day implementation handbook with interactive tools for new real estate agents.</p>
          </div>
          <nav aria-label="Product">
            <h2>Product</h2>
            <ul role="list">
              <li><Link href="/preview">Sample lesson</Link></li>
              <li><Link href="/pricing">Pricing</Link></li>
              <li><Link href="/handbook">Open the handbook</Link></li>
              <li><Link href="/account">Account and progress</Link></li>
            </ul>
          </nav>
          <nav aria-label="Company">
            <h2>About</h2>
            <ul role="list">
              <li><Link href="/about">About the handbook</Link></li>
              {HELP_LINKS.map((link) => <li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}
            </ul>
          </nav>
          <nav aria-label="Policies">
            <h2>Policies</h2>
            <ul role="list">
              {POLICY_LINKS.map((link) => <li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}
            </ul>
          </nav>
        </div>
        <p className="pub-legal">
          {LEGAL_NOTE}
          {copyright() ? ` ${copyright()}` : ''}
        </p>
      </div>
    </footer>
  );
}
