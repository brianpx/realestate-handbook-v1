'use client';

import { useState } from 'react';
import { KNOWLEDGE_CHECKS } from '@/content/data/knowledge-checks';
import { blankVerdict } from '@/lib/checkpoints';
import { InteractiveHeader } from './InteractiveHeader';

// End-of-chapter "Test your knowledge". Nothing is saved. The Settings toggle hides it with a class on <html>.
export function KnowledgeCheck({ page }: { page: string }) {
  const quiz = KNOWLEDGE_CHECKS[page];
  const [round, setRound] = useState(0); // Start over remounts the questions
  if (!quiz) throw new Error(`${page}: no knowledge check in content/data/knowledge-checks.ts`);
  return (
    <div className="box quiz">
      <div className="box-title">● TEST YOUR KNOWLEDGE</div>
      <InteractiveHeader hint="Pick an answer to see right away whether it is correct, and why. Nothing is saved." widgetKey="knowledge-check" label="Test your knowledge" />
      <Round key={round} page={page} quiz={quiz} onRestart={() => setRound(r => r + 1)} />
    </div>
  );
}

function Round({ page, quiz, onRestart }: { page: string; quiz: NonNullable<(typeof KNOWLEDGE_CHECKS)[string]>; onRestart: () => void }) {
  const [picks, setPicks] = useState<Record<number, number>>({});
  const [typed, setTyped] = useState('');
  const [showBlank, setShowBlank] = useState(false);
  const answered = Object.keys(picks).length;
  const correct = quiz.mcq.filter((q, n) => picks[n] === q.answer).length;
  const blank = quiz.blank;
  const verdict = blankVerdict(typed, blank);

  return (
    <>
      {quiz.mcq.map((item, n) => {
        const pick = picks[n];
        const done = pick !== undefined;
        const right = pick === item.answer;
        return (
          <fieldset key={n} className="quiz-item">
            <legend className="cp-q">{n + 1}. {item.q}</legend>
            {item.options.map((label, i) => (
              <label key={label} className={`opt-item quiz-opt${done && i === item.answer ? ' is-right' : ''}${done && i === pick && i !== item.answer ? ' is-wrong' : ''}`}>
                <input type="radio" name={`quiz-${page}-${n}`} checked={pick === i} disabled={done} onChange={() => setPicks(p => ({ ...p, [n]: i }))} />
                <span>{label}</span>
                <span className="quiz-mark">{done && i === item.answer ? ' ✓ Correct answer' : done && i === pick ? ' ✗ Your answer' : ''}</span>
              </label>
            ))}
            <div className={`drill-feedback${done ? (right ? ' ok' : ' no') : ''}`} aria-live="polite">
              {done && (<><strong>{right ? '✓ Correct. ' : '✗ Not quite. '}</strong>{item.explain}</>)}
            </div>
          </fieldset>
        );
      })}
      <div className="quiz-item">
        <div className="cp-q">{quiz.mcq.length + 1}. Fill in the blank.</div>
        <p className="quiz-sentence">
          {blank.before}{' '}
          <input type="text" className="calc-input quiz-blank" autoComplete="off" aria-label="Your answer for the blank" value={typed} onChange={e => setTyped(e.target.value)} />{' '}
          {blank.after}
        </p>
        <div className="script-actions">
          <button type="button" className="btn-mini" aria-expanded={showBlank} onClick={() => setShowBlank(!showBlank)}>{showBlank ? 'Hide answer' : 'Show answer'}</button>
        </div>
        <div className="cp-key" hidden={!showBlank} aria-live="polite">
          {showBlank && (<><strong>{verdict.prefix}{verdict.text}</strong>{blank.explain}</>)}
        </div>
      </div>
      <div className="quiz-score" aria-live="polite">{answered === quiz.mcq.length ? `You got ${correct} of ${quiz.mcq.length} multiple-choice questions right.` : ''}</div>
      <div className="script-actions">
        <button type="button" className="btn-mini" onClick={onRestart}>Start over</button>
      </div>
    </>
  );
}
