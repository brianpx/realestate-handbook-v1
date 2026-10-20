'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { setObjection, stateStore, useHandbookState } from '@/lib/state';
import { InteractiveHeader } from './InteractiveHeader';

export type Objection = { objection: string; response: string; goal: string };

// Picks something other than the current objection, preferring ones not yet mastered.
function pickIndex(items: Objection[], mastered: Record<string, unknown>, current: number | null): number {
  const pool = items.map((_, i) => i).filter(i => !mastered[items[i]!.objection]);
  const source = pool.length ? pool : items.map((_, i) => i);
  const choices = source.filter(i => i !== current);
  const from = choices.length ? choices : source;
  return from[Math.floor(Math.random() * from.length)]!;
}

export function ObjectionCard({ items }: { items: Objection[] }) {
  const { objections } = useHandbookState();
  // The server and the first client render show the first row; a random pick follows once saved progress is known.
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState('');
  const [shown, setShown] = useState(false);
  const [focusTick, setFocusTick] = useState(0);
  const showRef = useRef<HTMLButtonElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  // false while hydrating (when saved progress is not readable yet), true afterwards
  const hydrated = useSyncExternalStore(() => () => {}, () => true, () => false);

  useEffect(() => {
    if (hydrated) setIndex(pickIndex(items, stateStore.get().objections, null));
  }, [hydrated, items]);
  useEffect(() => { if (focusTick) showRef.current?.focus(); }, [focusTick]);

  const current = items[index]!;
  // the button that was clicked is now hidden, so focus moves to a visible control
  const next = (mastered: Record<string, unknown>) => {
    setIndex(pickIndex(items, mastered, index));
    setDraft('');
    setShown(false);
    setFocusTick(t => t + 1);
  };
  const masteredCount = items.filter(i => objections[i.objection]).length;

  return (
    <div className="box try-it objection-trainer iw">
      <div className="box-title">● PRACTICE · OBJECTION TRAINER</div>
      <InteractiveHeader hint="Read the objection, answer in your own words, reveal the framework, then rate yourself." widgetKey="objection-trainer" label="Objection trainer" />
      <p className="trainer-prompt" aria-live="polite">Client says: {current.objection}</p>
      <label className="practice-label">
        Your response (acknowledge, clarify, respond, check):
        <textarea className="practice-text" rows={3} value={draft} onChange={e => setDraft(e.target.value)} />
      </label>
      <div className="trainer-answer" tabIndex={-1} hidden={!shown} ref={answerRef}>
        <p><strong>Framework:</strong> {current.response}</p>
        <p><strong>Goal:</strong> {current.goal}</p>
      </div>
      <div className="script-actions">
        <button type="button" ref={showRef} className="btn-mini" hidden={shown} onClick={() => { setShown(true); queueMicrotask(() => answerRef.current?.focus()); }}>Show framework</button>
        <button type="button" className="btn-mini" hidden={!shown} onClick={() => { setObjection(current.objection, true); next({ ...objections, [current.objection]: true }); }}>Nailed it</button>
        <button type="button" className="btn-mini" hidden={!shown} onClick={() => { setObjection(current.objection, false); const { [current.objection]: _, ...rest } = objections; next(rest); }}>Needs work</button>
        <button type="button" className="btn-mini" onClick={() => next(objections)}>Next objection</button>
      </div>
      <p className="trainer-score" role="status">{masteredCount} of {items.length} objections mastered</p>
    </div>
  );
}
