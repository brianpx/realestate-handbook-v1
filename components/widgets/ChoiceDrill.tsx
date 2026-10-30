'use client';

import { useEffect, useRef, useState } from 'react';
import type { DrillItem } from '@/content/data/consult';
import { updateWidget, useHandbookState, widgetOf } from '@/lib/state';

// One question at a time; picking an option checks it at once. Ported from choiceDrill in legacy/js/widgets-practice.js.
export function ChoiceDrill({ stateKey, noun, items }: { stateKey: string; noun: string; items: DrillItem[] }) {
  const saved = widgetOf(useHandbookState(), stateKey);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const nextRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (picked !== null) nextRef.current?.focus(); }, [picked]);

  if (done) {
    const best = typeof saved.best === 'number' ? saved.best : correct;
    return (
      <div className="drill">
        <div className="drill-score">{correct} of {items.length} correct</div>
        <p>{correct === items.length ? 'Clean sweep. Reread the chapter section if any of these felt like a guess.' : 'Reread the explanations for the ones you missed, then run it again.'}</p>
        <p className="calc-note">Your best score on this device: {best} of {items.length}.</p>
        <div className="script-actions">
          <button type="button" className="btn-mini" onClick={() => { setIndex(0); setCorrect(0); setPicked(null); setDone(false); }}>Try again</button>
        </div>
      </div>
    );
  }

  const item = items[index]!;
  const answered = picked !== null;
  const right = picked === item.answer;
  const last = index === items.length - 1;

  const choose = (i: number) => {
    if (answered) return;
    setPicked(i);
    if (i === item.answer) setCorrect(c => c + 1);
  };
  const advance = () => {
    if (last) {
      updateWidget(stateKey, w => { w.best = Math.max(typeof w.best === 'number' ? w.best : 0, correct); });
      setDone(true);
    } else {
      setIndex(index + 1);
      setPicked(null);
    }
  };

  return (
    <div className="drill">
      <div className="drill-progress">{noun} {index + 1} of {items.length} · {correct} correct so far</div>
      {item.tag && <span className="drill-tag">{item.tag}</span>}
      <blockquote className="drill-prompt">{item.prompt}</blockquote>
      <div className="drill-options" role="group" aria-label={item.question || 'Choose one'}>
        {item.options.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`btn-mini drill-option${answered && i === item.answer ? ' is-right' : ''}${answered && i === picked && i !== item.answer ? ' is-wrong' : ''}`}
            disabled={answered}
            onClick={() => choose(i)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={`drill-feedback${answered ? (right ? ' ok' : ' no') : ''}`} aria-live="polite">
        {answered && (
          <>
            <strong>{right ? '✓ Correct. ' : `✗ Not quite. The answer is "${item.options[item.answer]}". `}</strong>
            {item.explain}
            <div className="script-actions">
              <button type="button" ref={nextRef} className="btn-mini" onClick={advance}>{last ? 'See your result' : `Next ${noun.toLowerCase()} →`}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
