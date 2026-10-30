'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { BOOK_TITLE } from '@/lib/pages';

// Header links: preview, what is included, pricing, and the way into the handbook. There are no accounts, so the
// entry is "Open the handbook", not "Log in".
const LINKS = [
  { href: '/preview', label: 'Sample lesson' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#included', label: "What's included" },
  { href: '/pricing', label: 'Pricing' },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!navRef.current?.contains(t) && !buttonRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('click', onClick); };
  }, [open]);

  return (
    <header className="pub-header">
      <div className="pub-wrap pub-header-row">
        <Link href="/" className="pub-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo3-sidebar-transparent.png" width={36} height={36} alt="" />
          <span>{BOOK_TITLE}</span>
        </Link>
        <button ref={buttonRef} type="button" className="pub-menu-btn" aria-expanded={open} aria-controls="pubNav" onClick={() => setOpen(o => !o)}>
          {open ? 'Close' : 'Menu'}
        </button>
        <nav id="pubNav" ref={navRef} className={`pub-nav${open ? ' open' : ''}`} aria-label="Main">
          {LINKS.map(l => (
            <Link key={l.href} href={l.href} aria-current={pathname === l.href ? 'page' : undefined}>{l.label}</Link>
          ))}
          <Link href="/handbook" className="pub-nav-cta">Open the handbook</Link>
        </nav>
      </div>
    </header>
  );
}
