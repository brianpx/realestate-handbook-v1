export type PageItem = number | 'gap';

/** Rows per page of the server-paged lists (users, audit); the leads table pages in the browser. */
export const PAGE_SIZE = 25;

/** The zero-based page a `?page=` value names (one-based in the URL, so the first page has no query); anything odd is the first page. */
export function pageIndexFrom(value: string | string[] | undefined): number {
  const n = Number.parseInt((Array.isArray(value) ? value[0] : value) ?? '', 10);
  // a safe integer, or the database would refuse the offset (bigint) and the page would throw
  return Number.isSafeInteger(n) && n >= 1 ? n - 1 : 0;
}

/**
 * Which page numbers to show: the first, the last, the current one and its neighbours, with a gap where pages are
 * left out. Zero-based in and out. A listing of 5000 leads at 10 a page must not render 500 buttons.
 */
export function pageItems(pageIndex: number, pageCount: number, around = 1): PageItem[] {
  if (pageCount <= 0) return [];
  const last = pageCount - 1;
  const keep = new Set<number>([0, last]);
  for (let i = pageIndex - around; i <= pageIndex + around; i++) if (i >= 0 && i <= last) keep.add(i);
  const items: PageItem[] = [];
  let previous = -1;
  for (const page of [...keep].sort((a, b) => a - b)) {
    // a gap of one page is shown as the page itself; shorter than an ellipsis
    if (page - previous === 2) items.push(page - 1);
    else if (page - previous > 2) items.push('gap');
    items.push(page);
    previous = page;
  }
  return items;
}
