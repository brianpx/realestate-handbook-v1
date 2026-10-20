'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CONCEPTS } from '@/content/data/concepts';
import { QUESTIONS } from '@/content/data/questions';
import { QuestionItem } from '@/components/widgets/QuestionItem';
import { browserTimeZone, deriveConceptStates } from '@/lib/coach/actions';
import { attemptInput } from '@/lib/coach/check';
import { localDate } from '@/lib/coach/dates';
import { coachStore, recordAttempt, useCoachState } from '@/lib/coach';
import { pickQuestion } from '@/lib/coach/queue';
import { buildDeck, dueLabel, requeueMiss, reviewQuestionIds, type Deck, type DeckItem } from '@/lib/coach/review';
import { isPageId, pageById } from '@/lib/pages';
import { trackingProgress, useSettings } from '@/lib/state';

const CONCEPT = new Map(CONCEPTS.map(c => [c.id, c]));
const QUESTION = new Map(QUESTIONS.map(q => [q.id, q]));
const chapterLabel = (chapter: string) => (isPageId(chapter) ? pageById(chapter).label : chapter);

type Snapshot = { deck: Deck; tz: string; today: string };
type Run = Snapshot & { items: DeckItem[]; index: number; firstPass: Record<string, boolean> };

/** The deck as of right now, from what is stored. Read once per sitting so answering does not reshuffle it. */
function snapshot(): Snapshot {
  const state = coachStore.get();
  const tz = state.plan?.tz ?? browserTimeZone();
  const today = localDate(new Date(), tz);
  return { deck: buildDeck(deriveConceptStates(state, tz), state.attempts, today), tz, today };
}

const startRun = (s: Snapshot): Run => ({ ...s, items: s.deck.items, index: 0, firstPass: {} });

export function ReviewDeck() {
  const tracking = trackingProgress(useSettings());
  const [run, setRun] = useState<Run | null>(null);
  const [outlook, setOutlook] = useState<Snapshot | null>(null); // what is waiting, for the empty and finished screens

  // Browser-only data: build after mount so the server and first client render agree.
  useEffect(() => {
    const s = snapshot();
    setOutlook(s);
    if (s.deck.items.length > 0) setRun(startRun(s));
  }, []);

  if (!tracking) {
    return <div className="box"><p>Review needs progress tracking, which is off in Settings. Turn it on and your answers will be saved on this device so the ideas you miss can come back.</p></div>;
  }
  if (!outlook) return <p aria-live="polite">Loading your review…</p>;
  if (!run) return <EmptyState outlook={outlook} />;
  if (run.index >= run.items.length) {
    return <Finished run={run} outlook={outlook} onMore={s => { setOutlook(s); setRun(startRun(s)); }} />;
  }
  return (
    <Question
      key={`${run.index}-${run.items[run.index]!.questionId}`}
      run={run}
      onNext={(next, firstPassResult) => {
        const advanced = { ...run, items: next, index: run.index + 1, firstPass: firstPassResult ?? run.firstPass };
        setRun(advanced);
        if (advanced.index >= advanced.items.length) setOutlook(snapshot());
      }}
    />
  );
}

function EmptyState({ outlook }: { outlook: Snapshot }) {
  const { deck, today } = outlook;
  const checked = [...new Set(CONCEPTS.map(c => c.chapter))];
  return (
    <div className="box" aria-live="polite">
      {deck.hasHistory ? (
        <p>
          Nothing is due today.
          {deck.nextDue ? ` Your next review is ${dueLabel(today, deck.nextDue)}.` : ''}
        </p>
      ) : (
        <p>
          Nothing to review yet. Answer a chapter&apos;s &ldquo;Test your knowledge&rdquo; questions and the ideas you meet will come back here on a schedule.
          {' '}Chapters that feed this deck: {checked.map((c, i) => (
            <span key={c}>{i > 0 ? ', ' : ''}<Link href={`/${c}`}>{chapterLabel(c)}</Link></span>
          ))}.
        </p>
      )}
    </div>
  );
}

function Question({ run, onNext }: { run: Run; onNext: (items: DeckItem[], firstPass?: Record<string, boolean>) => void }) {
  const item = run.items[run.index]!;
  const q = QUESTION.get(item.questionId)!;
  const concept = CONCEPT.get(item.conceptId)!;
  const [result, setResult] = useState<{ correct: boolean; next: DeckItem[]; nextDue: string | null }>();

  return (
    <div className="box">
      <div className="box-title" aria-live="polite">
        ● REVIEW · {run.index + 1} OF {run.items.length}{item.retest ? ' · ONE MORE TRY' : ''}
      </div>
      <p className="quiz-sentence"><em>{concept.title}</em></p>
      <QuestionItem
        q={q}
        label=""
        name={`review-${run.index}`}
        onAnswer={({ correct, confidence }) => {
          recordAttempt(attemptInput(q, correct, confidence, item.retest ? 'retest' : 'review'));
          const due = deriveConceptStates(coachStore.get(), run.tz)[item.conceptId]?.due ?? null;
          const alt = pickQuestion(reviewQuestionIds(item.conceptId), item.questionId)!;
          setResult({ correct, next: correct ? run.items : requeueMiss(run.items, run.index, alt), nextDue: due });
        }}
        after={() => result && (
          <>
            {!result.correct && (
              <p>
                <Link href={`/${concept.chapter}#${concept.anchor}`}>Read the passage in {chapterLabel(concept.chapter)}</Link>
              </p>
            )}
            {result.nextDue && !item.retest && <p>Next review: {dueLabel(run.today, result.nextDue)}.</p>}
            {!result.correct && !item.retest && <p>You will see this idea again in a few questions.</p>}
            <div className="script-actions">
              <button
                type="button"
                className="btn-mini"
                autoFocus
                onClick={() => onNext(result.next, item.retest ? undefined : { ...run.firstPass, [item.conceptId]: result.correct })}
              >
                {run.index + 1 >= result.next.length ? 'Finish' : 'Next question'}
              </button>
            </div>
          </>
        )}
      />
    </div>
  );
}

function Finished({ run, outlook, onMore }: { run: Run; outlook: Snapshot; onMore: (s: Snapshot) => void }) {
  const total = Object.keys(run.firstPass).length;
  const right = Object.values(run.firstPass).filter(Boolean).length;
  const missed = Object.entries(run.firstPass).filter(([, ok]) => !ok).map(([id]) => CONCEPT.get(id)!);
  const waiting = outlook.deck.items.length + outlook.deck.deferred;
  return (
    <div className="box" aria-live="polite">
      <div className="box-title">● DONE FOR NOW</div>
      <p><strong>{right} of {total} right on the first try.</strong></p>
      {missed.length > 0 && (
        <>
          <p>Ideas to look at again:</p>
          <ul>
            {missed.map(c => (
              <li key={c.id}><Link href={`/${c.chapter}#${c.anchor}`}>{c.title}</Link></li>
            ))}
          </ul>
        </>
      )}
      {waiting > 0 ? (
        <>
          <p>{waiting} more {waiting === 1 ? 'idea is' : 'ideas are'} waiting. That is plenty for one sitting, but you can keep going.</p>
          <div className="script-actions"><button type="button" className="btn-mini" onClick={() => onMore(snapshot())}>Keep going</button></div>
        </>
      ) : (
        <p>{outlook.deck.nextDue ? `Nothing else is due. Your next review is ${dueLabel(outlook.today, outlook.deck.nextDue)}.` : 'Nothing else is due.'}</p>
      )}
    </div>
  );
}
