import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { pageItems } from '@/lib/admin/pagination';
import { cn } from '@/lib/utils';

// Server-rendered paging for the user and audit lists: the page number travels in the URL (?page=2, one-based),
// so every page is a plain link and the list needs no JavaScript. Same shape as the leads table's footer.
export function PageLinks({ pageIndex, pageCount, href }: { pageIndex: number; pageCount: number; href: (pageIndex: number) => string }) {
  if (pageCount <= 1) return null;
  const link = (page: number, label: string, children: ReactNode, current = false) => (
    <Link href={href(page)} aria-label={label} aria-current={current ? 'page' : undefined} className={cn(buttonVariants({ variant: current ? 'outline' : 'ghost', size: 'icon-sm' }), 'tabular-nums')}>
      {children}
    </Link>
  );
  const still = (label: string, children: ReactNode) => (
    <span aria-label={label} aria-disabled="true" className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }), 'pointer-events-none opacity-50')}>
      {children}
    </span>
  );
  return (
    <nav className="ml-auto flex items-center gap-1" aria-label="Pagination">
      {pageIndex > 0 ? link(pageIndex - 1, 'Previous page', <ChevronLeftIcon />) : still('Previous page', <ChevronLeftIcon />)}
      {pageItems(pageIndex, pageCount).map((item, i) =>
        item === 'gap' ? (
          <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-muted-foreground">…</span>
        ) : (
          <span key={item}>{link(item, `Page ${item + 1}`, item + 1, item === pageIndex)}</span>
        ),
      )}
      {pageIndex < pageCount - 1 ? link(pageIndex + 1, 'Next page', <ChevronRightIcon />) : still('Next page', <ChevronRightIcon />)}
    </nav>
  );
}

/** "1-25 of 1,203" for a list footer. */
export function PageRange({ pageIndex, pageSize, shown, total }: { pageIndex: number; pageSize: number; shown: number; total: string }) {
  const first = shown === 0 ? 0 : pageIndex * pageSize + 1;
  return (
    <span className="text-sm text-muted-foreground tabular-nums">
      {first}-{pageIndex * pageSize + shown} of <span className="font-medium text-foreground">{total}</span>
    </span>
  );
}
