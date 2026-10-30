import { pageTableRows } from '@/lib/page-html';
import { QualifyCard } from './QualifyCard';

// The "natural phrasing" lines come from Table 5.2 in the page, so there is one copy of that wording.
export async function QualifyingDrill() {
  const rows = await pageTableRows('ch5', 'QUESTION');
  const phrasing = Object.fromEntries(rows.map(r => [r[0] ?? '', r[2] ?? '']));
  return <QualifyCard phrasing={phrasing} />;
}
