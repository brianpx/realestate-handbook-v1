import type { SearchEntry } from './search-query';

// Finding the block a search result points at, in the page as it is on screen. The index counts blocks in the
// page HTML, so tool markup (.iw) is left out here too and the nth block with the same text lines up.
const SELECTOR = 'h1, h2, h3, h4, dt, caption, figcaption, .diagram-title, p, li';
const EXCLUDED = 'dialog, .chapter-foot, .chapter-next, .nurture-static, .iw';

export function findSearchTarget(root: ParentNode, entry: Pick<SearchEntry, 'text' | 'occurrence'>): HTMLElement | null {
  const matches = [...root.querySelectorAll<HTMLElement>(SELECTOR)].filter(node => {
    if (node.closest(EXCLUDED)) return false;
    if (node.matches('p, li') && node.querySelector('p, li, h1, h2, h3, h4, caption, figcaption')) return false;
    return (node.textContent ?? '').replace(/\s+/g, ' ').trim() === entry.text;
  });
  return matches[entry.occurrence] ?? null;
}

export function revealSearchTarget(target: HTMLElement): void {
  target.scrollIntoView({ block: 'start' });
  target.tabIndex = -1;
  target.focus({ preventScroll: true });
  target.classList.add('widget-found');
  setTimeout(() => target.classList.remove('widget-found'), 2200);
}
