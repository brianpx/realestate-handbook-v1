'use client';

import { HomeIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { crumbsFor } from '@/lib/breadcrumbs';
import { HANDBOOK } from '@/lib/routes';

// Handbook pages link back to the handbook; public pages retain their home link.
export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const crumbs = crumbsFor(pathname);
  if (crumbs.length === 0) return null;
  const showHome = !pathname.startsWith(`${HANDBOOK}/`);
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {showHome && (
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>
              <HomeIcon aria-hidden="true" size={16} />
              <span className="sr-only">Home</span>
            </BreadcrumbLink>
          </BreadcrumbItem>
        )}
        {crumbs.map((crumb, i) => (
          <Fragment key={`${i}-${crumb.label}`}>
            {(showHome || i > 0) && <BreadcrumbSeparator> / </BreadcrumbSeparator>}
            <BreadcrumbItem>
              {i === crumbs.length - 1 ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : crumb.href ? (
                <BreadcrumbLink render={<Link href={crumb.href} />}>{crumb.label}</BreadcrumbLink>
              ) : (
                <span>{crumb.label}</span>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
