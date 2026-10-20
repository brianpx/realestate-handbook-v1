'use client';

import Link from 'next/link';
import { useState } from 'react';
import { markStep, recordAttempt } from '@/lib/coach';
import { COACH_ENABLED } from '@/lib/coach/enabled';
import { attemptInput, chapterCheck, hasCoachCheck } from '@/lib/coach/check';
import { trackingProgress, useSettings } from '@/lib/state';
import { InteractiveHeader } from './InteractiveHeader';
import { KnowledgeCheck } from './KnowledgeCheck';
import { QuestionItem } from './QuestionItem';

// The registry entry for "Test your knowledge": chapters with tagged questions get the coach version (confidence
// first, answers recorded); every other chapter keeps the plain check until its questions are tagged.
export function KnowledgeCheckEntry({ page }: { page: string }) {
  return hasCoachCheck(page) ? <CoachCheck page={page} /> : <KnowledgeCheck page={page} />;
}

function CoachCheck({ page }: { page: string }) {
  const [round, setRound] = useState(0); // Start over remounts the questions
  const tracking = trackingProgress(useSettings());
  return (
    <div className="box quiz">
      <div className="box-title">● TEST YOUR KNOWLEDGE</div>
      <InteractiveHeader
        hint={tracking
          ? 'Say how sure you are, then answer. Your answers are saved on this device so the ideas you miss can come back later.'
          : 'Say how sure you are, then answer. Progress tracking is off in Settings, so nothing here is saved.'}
        widgetKey="knowledge-check"
        label="Test your knowledge"
      />
      <Round key={round} page={page} retest={round > 0} tracking={tracking} onRestart={() => setRound(r => r + 1)} />
    </div>
  );
}

function Round({ page, retest, tracking, onRestart }: { page: string; retest: boolean; tracking: boolean; onRestart: () => void }) {
  const questions = chapterCheck(page);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const mcq = questions.filter(q => q.kind === 'mcq');
  const mcqDone = mcq.every(q => results[q.id] !== undefined);
  const allDone = questions.every(q => results[q.id] !== undefined);

  return (
    <>
      {questions.map((q, n) => (
        <QuestionItem
          key={q.id}
          q={q}
          label={`${n + 1}.`}
          name={`quiz-${page}-${q.id}`}
          onAnswer={({ correct, confidence }) => {
            const next = { ...results, [q.id]: correct };
            setResults(next);
            recordAttempt(attemptInput(q, correct, confidence, retest ? 'retest' : 'chapter_check'));
            if (questions.every(x => next[x.id] !== undefined)) markStep(page, 'checked');
          }}
        />
      ))}
      <div className="quiz-score" aria-live="polite">
        {mcqDone ? `You got ${mcq.filter(q => results[q.id]).length} of ${mcq.length} multiple-choice questions right.` : ''}
        {allDone ? ' All questions answered.' : ''}
      </div>
      <div className="script-actions">
        <button type="button" className="btn-mini" onClick={onRestart}>Start over</button>
        {COACH_ENABLED && allDone && tracking && <Link className="btn-mini" href="/review">Open your review deck</Link>}
      </div>
    </>
  );
}
