'use client';

import Link from 'next/link';
import { markStep, reschedule } from '@/lib/coach';
import { hasCoachCheck } from '@/lib/coach/check';
import { outstandingExercises, sessionStatus, type SessionStatus } from '@/lib/coach/plan';
import type { CoachState } from '@/lib/coach/schema';
import { formatDay, nextUp, progressCounts, scheduleRows } from '@/lib/coach/today';
import { isPageId, pageById } from '@/lib/pages';

const label = (chapter: string) => (isPageId(chapter) ? pageById(chapter).label : chapter);
type Plan = NonNullable<CoachState['plan']>;

// Shows only what is next. Falling behind is stated as a fact with a Reschedule button, never as a wall of overdue items.
export function TodayCard({ plan, completions, today, dueForReview, onEdit }: {
  plan: Plan;
  completions: CoachState['completions'];
  today: string;
  dueForReview: number;
  onEdit: () => void;
}) {
  const next = nextUp(plan.sessions, completions, today);
  const { complete, total } = progressCounts(plan.sessions, completions);
  const open = outstandingExercises(completions).filter(id => plan.sessions.some(s => s.id === id));

  return (
    <>
      <div className="box try-it" aria-live="polite">
        {next ? <NextSession next={next} status={sessionStatus(completions[next.session.id])} /> : (
          <>
            <div className="box-title">● PLAN COMPLETE</div>
            <p>You have finished every session. Keep the ideas fresh with your review deck.</p>
          </>
        )}
      </div>

      <div className="box">
        <p>
          <strong>{complete} of {total} sessions complete.</strong>{' '}
          {next && next.daysBehind > 0
            ? `Your next session was planned ${next.daysBehind} ${next.daysBehind === 1 ? 'day' : 'days'} ago.`
            : next ? 'On pace.' : ''}
        </p>
        {open.length > 0 && (
          <>
            <p>Exercises still open:</p>
            <ul>
              {open.map(id => (
                <li key={id}>
                  {label(id)}{' '}
                  <button type="button" className="btn-mini" onClick={() => markStep(id, 'did')}>I did this</button>
                </li>
              ))}
            </ul>
          </>
        )}
        <p>
          {dueForReview > 0
            ? <><Link href="/review">{dueForReview} {dueForReview === 1 ? 'idea is' : 'ideas are'} due for review</Link>.</>
            : 'Nothing is due for review.'}
        </p>
        <div className="script-actions">
          <button type="button" className="btn-mini" onClick={() => reschedule(today)}>Reschedule from today</button>
          <button type="button" className="btn-mini" onClick={onEdit}>Change plan</button>
        </div>
      </div>

      <details className="box">
        <summary><strong>Full schedule</strong></summary>
        <ol>
          {scheduleRows(plan.sessions, completions, today).map(r => (
            <li key={r.session.id}>
              {formatDay(r.session.date)}: <Link href={`/${r.session.chapter}`}>{label(r.session.chapter)}</Link>
              {r.status === 'complete' ? ' ✓' : r.status === 'partly' ? ' (exercise still open)' : r.isNext ? ' ← next' : ''}
            </li>
          ))}
        </ol>
      </details>
    </>
  );
}

function NextSession({ next, status }: { next: NonNullable<ReturnType<typeof nextUp>>; status: SessionStatus }) {
  const { session, steps, when } = next;
  const chapter = session.chapter;
  const heading = when === 'today' ? 'TODAY' : when === 'later' ? `NEXT · ${formatDay(session.date).toUpperCase()}` : 'NEXT UP';
  return (
    <>
      <div className="box-title">● {heading}</div>
      <p><strong>{label(chapter)}</strong></p>
      {when === 'behind' && <p>This was planned for {formatDay(session.date)}. Start it whenever you are ready, or move the schedule.</p>}
      <ul>
        <li>
          {steps.read ? '✓' : '○'} Read the chapter.{' '}
          <Link href={`/${chapter}`}>Open it</Link>{' '}
          {!steps.read && <button type="button" className="btn-mini" onClick={() => markStep(chapter, 'read')}>Mark read</button>}
        </li>
        <li>
          {steps.did ? '✓' : '○'} Do the exercise (&ldquo;Try it today&rdquo;).{' '}
          {!steps.did && <button type="button" className="btn-mini" onClick={() => markStep(chapter, 'did')}>I did this</button>}
        </li>
        <li>
          {steps.checked ? '✓' : '○'} Answer the questions at the end of the chapter.{' '}
          {!steps.checked && (hasCoachCheck(chapter)
            ? <Link href={`/${chapter}`}>Go to the questions</Link>
            : <button type="button" className="btn-mini" onClick={() => markStep(chapter, 'checked')}>I answered them</button>)}
        </li>
      </ul>
      {status === 'partly' && <p>The exercise is still open.</p>}
    </>
  );
}
