'use client';

import { useState, type ReactNode } from 'react';
import type { Question } from '@/content/data/questions';
import { isCorrect } from '@/lib/coach/check';
import type { Confidence } from '@/lib/coach/types';
import { ConfidencePrompt } from './ConfidencePrompt';

export type Answer = { correct: boolean; confidence: Confidence };

// One question: stem, then "How sure are you?", then the options (or the blank's input), then feedback. It owns the
// reader's progress through those steps and reports the committed answer once. Shared by the chapter check and /review.
export function QuestionItem({ q, label, name, onAnswer, after }: {
  q: Question;
  /** Prefix for the stem, such as "2." Empty for none. */
  label: string;
  /** Unique radio-group name. */
  name: string;
  onAnswer: (answer: Answer) => void;
  /** Extra content under the feedback once answered (a passage link, the next review date, a Next button). */
  after?: (answer: Answer) => ReactNode;
}) {
  const [confidence, setConfidence] = useState<Confidence>();
  const [pick, setPick] = useState<number>();
  const [typed, setTyped] = useState('');
  const [answer, setAnswer] = useState<Answer>();
  const prefix = label ? `${label} ` : '';

  const commit = (response: number | string) => {
    if (!confidence || answer) return;
    const result = { correct: isCorrect(q, response), confidence };
    setAnswer(result);
    onAnswer(result);
  };

  const feedback = answer && (
    <>
      <strong>{answer.correct ? '✓ Correct. ' : '✗ Not quite. '}</strong>
      {q.kind === 'blank' && !answer.correct ? `The answer is "${q.answer}". ` : ''}
      {q.explain}
      {!answer.correct && answer.confidence === 'sure' ? ' You were sure about this one, which makes it the most useful one to get straight.' : ''}
    </>
  );
  const feedbackBox = <div className={`drill-feedback${answer ? (answer.correct ? ' ok' : ' no') : ''}`} aria-live="polite">{feedback}</div>;

  if (q.kind === 'mcq') {
    return (
      <fieldset className="quiz-item">
        <legend className="cp-q">{prefix}{q.prompt}</legend>
        {!confidence && <ConfidencePrompt onPick={setConfidence} />}
        {confidence && q.options.map((text, i) => (
          <label key={text} className={`opt-item quiz-opt${answer && i === q.answer ? ' is-right' : ''}${answer && i === pick && i !== q.answer ? ' is-wrong' : ''}`}>
            <input
              type="radio"
              name={name}
              checked={pick === i}
              disabled={answer !== undefined}
              autoFocus={i === 0}
              onChange={() => { setPick(i); commit(i); }}
            />
            <span>{text}</span>
            <span className="quiz-mark">{answer && i === q.answer ? ' ✓ Correct answer' : answer && i === pick ? ' ✗ Your answer' : ''}</span>
          </label>
        ))}
        {feedbackBox}
        {answer && after?.(answer)}
      </fieldset>
    );
  }

  return (
    <div className="quiz-item">
      <div className="cp-q">{prefix}Fill in the blank.</div>
      <p className="quiz-sentence">
        {q.before}{' '}
        {confidence ? (
          <input
            type="text"
            className="calc-input quiz-blank"
            autoComplete="off"
            autoFocus
            aria-label="Your answer for the blank"
            value={typed}
            disabled={answer !== undefined}
            onChange={e => setTyped(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && typed.trim()) commit(typed); }}
          />
        ) : <span aria-label="blank">______</span>}{' '}
        {q.after}
      </p>
      {!confidence && <ConfidencePrompt onPick={setConfidence} />}
      {confidence && !answer && (
        <div className="script-actions">
          <button type="button" className="btn-mini" disabled={!typed.trim()} onClick={() => commit(typed)}>Check answer</button>
        </div>
      )}
      {feedbackBox}
      {answer && after?.(answer)}
    </div>
  );
}
