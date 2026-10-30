// Keeps the reader's place while layout changes (e.g. toggling full width). The anchor is the first heading on
// screen plus how far below the top edge it sits, which survives anything above it changing height.
const HEADINGS = 'h1, h2, h3, h4';
const text = (node: Element) => (node.textContent ?? '').replace(/\s+/g, ' ').trim();
const isPhone = () => window.matchMedia('(max-width: 900px)').matches;

const viewTop = () =>
  isPhone() ? document.getElementById('sidebar')!.getBoundingClientRect().bottom : document.getElementById('main-content')!.getBoundingClientRect().top;
const scrollRoot = () => (isPhone() ? document.scrollingElement! : document.getElementById('main-content')!);

export type ScrollAnchor = { text: string; occurrence: number; offset: number };

export function captureScrollAnchor(): ScrollAnchor | null {
  const top = viewTop();
  const seen: Record<string, number> = {};
  for (const node of document.querySelectorAll<HTMLElement>(`.chapter-section ${HEADINGS.split(', ').join(', .chapter-section ')}`)) {
    const t = text(node);
    const occurrence = (seen[t] = (seen[t] ?? -1) + 1);
    const nodeTop = node.getBoundingClientRect().top;
    if (node.closest('dialog') || nodeTop + node.offsetHeight <= top) continue;
    return { text: t, occurrence, offset: nodeTop - top };
  }
  return null;
}

export function applyScrollAnchor(anchor: ScrollAnchor | null): void {
  if (!anchor) return;
  const matches = [...document.querySelectorAll<HTMLElement>('.chapter-section h1, .chapter-section h2, .chapter-section h3, .chapter-section h4')].filter(n => text(n) === anchor.text);
  const target = matches[anchor.occurrence];
  if (target) scrollRoot().scrollTop += target.getBoundingClientRect().top - viewTop() - anchor.offset;
}
