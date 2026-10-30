import { pageTableRows } from '@/lib/page-html';
import { ErrorScoreCard } from './ErrorScoreCard';

// The six errors, what each costs and its fix come from the table in Chapter 7.
export async function ErrorSelfScore() {
  const rows = await pageTableRows('ch7', 'ERROR');
  const errors = rows.map(r => ({ name: r[0] ?? '', cost: r[2] ?? '', fix: r[3] ?? '' }));
  if (errors.length === 0 || errors.some(e => !e.name || !e.cost || !e.fix)) throw new Error('ch7: error table has no usable rows');
  return <ErrorScoreCard errors={errors} />;
}
