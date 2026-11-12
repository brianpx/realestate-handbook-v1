'use client';

import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { RETURN_PARAM, returnTarget, type ReturnTarget } from '@/lib/return-to';

// Policy pages always offer a way back, even when opened without the footer's ?from=.
const POLICY_PATHS = new Set(['/privacy', '/terms', '/refunds', '/updates']);
const HOME: ReturnTarget = { href: '/', label: 'home' };

// "Back to <page>" for a reader who arrived from the handbook footer. Without a valid ?from= only policy pages show a link, to home.
export function ReturnLink() {
  const pathname = usePathname();
  const from = returnTarget(useSearchParams().get(RETURN_PARAM));
  const target = from ?? (POLICY_PATHS.has(pathname.replace(/\/+$/, '')) ? HOME : null);
  if (!target) return null;
  return (
    <p className="pub-return">
      <Link href={target.href}>
        <ArrowLeftIcon aria-hidden="true" size={16} />
        <span>Back to {target.label}</span>
      </Link>
    </p>
  );
}
