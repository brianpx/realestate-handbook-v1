'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { ArrowRightIcon, MenuIcon, XIcon } from 'lucide-react';
import { useSignedIn } from './useSignedIn';

// Header links: preview, what is included, pricing, and the way into the handbook: "Sign in" for a visitor,
// "Open handbook" once the browser reports the sign-in flag (useSignedIn, after mount).
const LINKS = [
  { href: '/preview', label: 'Sample lesson' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#included', label: "What's included" },
  { href: '/pricing', label: 'Pricing' },
];
// Only exact page links are current; pathname alone cannot identify the active section.
const currentFor = (href: string, pathname: string): 'page' | undefined => {
  const [path, hash] = href.split('#');
  return !hash && path === pathname ? 'page' : undefined;
};

export function PublicHeader() {
  const pathname = usePathname();
  const signedIn = useSignedIn();
  const signingIn = pathname === '/signin' || pathname === '/signup';
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const measure = () => document.documentElement.style.setProperty('--pub-header-actual-h', `${header.getBoundingClientRect().height}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--pub-header-actual-h');
    };
  }, []);

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
    <header ref={headerRef} className="pub-header">
      <div className="pub-header-row">
        <Link href="/" className="pub-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo3-sidebar-transparent.png" width={44} height={44} alt="" />
          {/* the title always breaks after "Nurturing,"; the space between the spans keeps the link's name one sentence */}
          <span className="pub-brand-title"><span>Finding, Nurturing,</span> <span>and Keeping Clients</span></span>
        </Link>
        <button ref={buttonRef} type="button" className="pub-menu-btn" aria-label="Menu" aria-expanded={open} aria-controls="pubNav" onClick={() => setOpen(o => !o)}>
          {open ? <XIcon aria-hidden="true" /> : <MenuIcon aria-hidden="true" />}
        </button>
        <nav id="pubNav" ref={navRef} className={`pub-nav${open ? ' open' : ''}`} aria-label="Main" onClick={onNavClick}>
          {LINKS.map(l => (
            <Link key={l.href} href={l.href} aria-current={currentFor(l.href, pathname)}>{l.label}</Link>
          ))}
          {!signingIn && (signedIn
            ? <Link href="/handbook" className="pub-nav-cta">Open handbook<ArrowRightIcon aria-hidden="true" /></Link>
            : <Link href="/signin" className="pub-nav-cta">Sign in<ArrowRightIcon aria-hidden="true" /></Link>)}
        </nav>
      </div>
    </header>
  );
}
