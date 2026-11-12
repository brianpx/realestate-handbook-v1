'use client';

import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { RETURN_PARAM, returnTarget } from '@/lib/return-to';

// "Back to <page>" for a reader who arrived from the handbook footer. Renders nothing without a valid ?from=.
export function ReturnLink() {
  const target = returnTarget(useSearchParams().get(RETURN_PARAM));
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
