'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { withReturn } from '@/lib/return-to';

type FooterLink = { href: string; label: string };

// The links carry the page they were clicked on, so the public page they open can offer a way back (lib/return-to.ts).
export function FooterLinks({ links }: { links: readonly FooterLink[] }) {
  const pathname = usePathname();
  return (
    <ul role="list">
      {links.map((link) => (
        <li key={link.href}><Link href={withReturn(link.href, pathname)}>{link.label}</Link></li>
      ))}
    </ul>
  );
}
