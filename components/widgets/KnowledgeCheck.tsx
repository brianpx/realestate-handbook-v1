'use client';

import { useEffect, useRef, useState } from 'react';
import { KNOWLEDGE_CHECKS } from '@/content/data/knowledge-checks';
import { blankVerdict } from '@/lib/checkpoints';
import { BoxTitle } from './BoxTitle';
import { InteractiveHeader } from './InteractiveHeader';

type Quiz = NonNullable<(typeof KNOWLEDGE_CHECKS)[string]>;

// End-of-chapter "Test your knowledge". Nothing is saved. The Settings toggle hides it with a class on <html>.
export function KnowledgeCheck({ page }: { page: string }) {
  const quiz = KNOWLEDGE_CHECKS[page];
  const [round, setRound] = useState(0); // Start over remounts the questions
  if (!quiz) throw new Error(`${page}: no knowledge check in content/data/knowledge-checks.ts`);
  return (
    <aside className="box quiz">
      <BoxTitle>● TEST YOUR KNOWLEDGE</BoxTitle>
      <InteractiveHeader hint="Pick an answer, then check it to see right away whether it is correct, and why. Nothing is saved." widgetKey="knowledge-check" label="Test your knowledge" />
      <Round key={round} page={page} quiz={quiz} onRestart={() => setRound(r => r + 1)} />
    </aside>
  );
}

function Round({ page, quiz, onRestart }: { page: string; quiz: Quiz; onRestart: () => void }) {
  const [picks, setPicks] = useState<Record<number, number>>({});
  const [typed, setTyped] = useState('');
  const [showBlank, setShowBlank] = useState(false);
  const answered = Object.keys(picks).length;
  const correct = quiz.mcq.filter((q, n) => picks[n] === q.answer).length;
  const blank = quiz.blank;
  const verdict = blankVerdict(typed, blank);

  return (
    <>
      {quiz.mcq.map((item, n) => (
        <McqItem key={n} item={item} label={`${n + 1}.`} name={`quiz-${page}-${n}`} pick={picks[n]} onCommit={i => setPicks(p => ({ ...p, [n]: i }))} />
      ))}
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

// One multiple-choice question. Selecting an option only selects it (arrow keys move through a radio group, so a
// selection cannot be the answer); Check answer commits it. `pick` is the committed answer, held by the round.
function McqItem({ item, label, name, pick, onCommit }: {
  item: Quiz['mcq'][number];
  label: string;
  name: string;
  pick: number | undefined;
  onCommit: (pick: number) => void;
}) {
  const [selected, setSelected] = useState<number>();
  const feedbackRef = useRef<HTMLDivElement>(null);
  const done = pick !== undefined;
  const right = pick === item.answer;

  // Committing removes the Check answer button under the focus; the feedback takes it instead of <body>.
  useEffect(() => {
    if (done && document.activeElement === document.body) feedbackRef.current?.focus();
  }, [done]);

  return (
    <fieldset className="quiz-item">
      <legend className="cp-q">{label} {item.q}</legend>
      {item.options.map((text, i) => (
        <label key={text} className={`opt-item quiz-opt${done && i === item.answer ? ' is-right' : ''}${done && i === pick && i !== item.answer ? ' is-wrong' : ''}`}>
          {/* aria-disabled rather than disabled: the locked options stay in the tab order so the reader can go back over them */}
          <input type="radio" name={name} checked={selected === i} aria-disabled={done} onChange={() => { if (!done) setSelected(i); }} />
          <span>{text}</span>
          <span className="quiz-mark">{done && i === item.answer ? ' ✓ Correct answer' : done && i === pick ? ' ✗ Your answer' : ''}</span>
        </label>
      ))}
      {!done && (
        <div className="script-actions">
          <button type="button" className="btn-mini" disabled={selected === undefined} onClick={() => { if (selected !== undefined) onCommit(selected); }}>Check answer</button>
        </div>
      )}
      <div ref={feedbackRef} tabIndex={-1} className={`drill-feedback${done ? (right ? ' ok' : ' no') : ''}`} aria-live="polite">
        {done && (<><strong>{right ? '✓ Correct. ' : '✗ Not quite. '}</strong>{item.explain}</>)}
      </div>
    </fieldset>
  );
}
