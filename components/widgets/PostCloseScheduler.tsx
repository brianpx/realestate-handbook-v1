import { postCloseSchedule, type PostCloseRows } from '@/lib/plan';
import { pageTableRows } from '@/lib/page-html';
import { PostCloseCard } from './PostCloseCard';

// The touch and purpose wording comes from Table 10.1 in the page, so there is one copy of it.
export async function PostCloseScheduler() {
  const rows: PostCloseRows = Object.fromEntries((await pageTableRows('ch10', 'WHEN')).map(r => [r[0] ?? '', { touch: r[1] ?? '', purpose: r[2] ?? '' }]));
  postCloseSchedule(null, rows); // fails the build if a row the steps rely on is renamed or removed
  if (!rows.Annually) throw new Error('Table 10.1 has no "Annually" row');
  return <PostCloseCard rows={rows} />;
}
