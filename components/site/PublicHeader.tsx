'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { BOOK_TITLE } from '@/lib/pages';

// Header links: preview, what is included, pricing, and the way into the handbook: "Sign in" for a visitor,
// "Open the handbook" once a session cookie is present (the layout decides).
const LINKS = [
  { href: '/preview', label: 'Sample lesson' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#included', label: "What's included" },
  { href: '/pricing', label: 'Pricing' },
];
// A plain link is the current page when the path matches; a same-page hash link is a location within it (CR-M9).
const currentFor = (href: string, pathname: string): 'page' | 'location' | undefined => {
  const [path, hash] = href.split('#');
  if ((path || '/') !== pathname) return undefined;
  return hash ? 'location' : 'page';
};

export function PublicHeader({ signedIn = false }: { signedIn?: boolean }) {
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
    const onClick = (e: globalThis.MouseEvent) => {
      const t = e.target as Node;
      if (!navRef.current?.contains(t) && !buttonRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('click', onClick); };
  }, [open]);

  // a hash link on the current page changes no pathname, so the phone menu closes on the activation itself (CR-M9)
  const onNavClick = (e: MouseEvent<HTMLElement>) => { if ((e.target as HTMLElement).closest('a')) setOpen(false); };

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
        <nav id="pubNav" ref={navRef} className={`pub-nav${open ? ' open' : ''}`} aria-label="Main" onClick={onNavClick}>
          {LINKS.map(l => (
            <Link key={l.href} href={l.href} aria-current={currentFor(l.href, pathname)}>{l.label}</Link>
          ))}
          {signedIn
            ? <Link href="/handbook" className="pub-nav-cta">Open the handbook</Link>
            : <Link href="/signin" className="pub-nav-cta">Sign in</Link>}
        </nav>
      </div>
    </header>
  );
}
