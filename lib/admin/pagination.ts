export type PageItem = number | 'gap';

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
