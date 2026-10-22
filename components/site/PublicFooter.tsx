import Link from 'next/link';
import { OWNER } from '@/lib/offer';
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
            <ul>
              <li><Link href="/preview">Sample lesson</Link></li>
              <li><Link href="/pricing">Pricing</Link></li>
              <li><Link href="/handbook">Open the handbook</Link></li>
              <li><Link href="/account">Account and progress</Link></li>
            </ul>
          </nav>
          <nav aria-label="Company">
            <h2>About</h2>
            <ul>
              <li><Link href="/about">About the handbook</Link></li>
              <li><Link href="/support">Support</Link></li>
              <li><Link href="/updates">Access and updates</Link></li>
            </ul>
          </nav>
          <nav aria-label="Policies">
            <h2>Policies</h2>
            <ul>
              <li><Link href="/privacy">Privacy</Link></li>
              <li><Link href="/terms">Terms of use</Link></li>
              <li><Link href="/refunds">Refunds</Link></li>
            </ul>
          </nav>
        </div>
        <p className="pub-legal">
          Training material, not legal advice. Confirm forms, compensation and prospecting rules with your broker. Worked examples use
          Keller Williams Command; that is an example, not an endorsement.
          {OWNER.businessName ? ` © ${new Date().getFullYear()} ${OWNER.businessName}.` : ''}
        </p>
      </div>
    </footer>
  );
}
