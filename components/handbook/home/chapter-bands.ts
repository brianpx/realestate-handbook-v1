import { NAV, type PageId } from '@/lib/pages';

export type BandRow = { id: PageId; num: string; title: string };
export type Band = { key: string; eyebrow: string; name: string; rows: BandRow[] };

const ROW_TITLES: Partial<Record<PageId, string>> = { cover: 'Title page' };

function bandLabels(part: string | null): { eyebrow: string; name: string } {
  if (part === null) return { eyebrow: 'Start here', name: 'Front matter' };
  if (part === 'APPENDICES') return { eyebrow: 'Reference', name: 'Appendices' };
  const [eyebrow = part, name = part] = part.split(/:\s*/);
  return { eyebrow, name };
}

function rowOf(id: PageId, label: string): BandRow {
  const chapter = /^(\d+)\.\s+(.+)$/.exec(label);
  if (chapter) return { id, num: chapter[1]!, title: chapter[2]! };
  const appendix = /^App ([A-Z]):\s+(.+)$/.exec(label);
  if (appendix) return { id, num: appendix[1]!, title: appendix[2]! };
  return { id, num: '', title: ROW_TITLES[id] ?? label };
}

export const BANDS: readonly Band[] = NAV.map(g => ({
  key: g.part ?? 'front',
  ...bandLabels(g.part),
  rows: g.pages.map(p => rowOf(p.id, p.label)),
}));
