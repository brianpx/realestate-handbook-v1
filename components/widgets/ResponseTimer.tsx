'use client';

import { useEffect, useRef, useState } from 'react';
import { essentialOnly, useSettings } from '@/lib/state';
import { formatElapsed, RESPONSE_TOUCHES, stampResult } from '@/lib/speed';
import { InteractiveHeader } from './InteractiveHeader';

type Result = { key: string; meets: boolean; text: string };

// Backs the Field Note: a friend submits an inquiry, and the reader times each reply.
// Not built when "Essential tools only" is on, as before.
export function ResponseTimer() {
  const hidden = essentialOnly(useSettings());
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [clock, setClock] = useState('0:00');
  const [results, setResults] = useState<Result[]>([]);
  const startedRef = useRef<number | null>(null);

  // the clock runs only between Start and the last reply; the interval is cleared on unmount
  const running = startedAt !== null && results.length < RESPONSE_TOUCHES.length;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setClock(formatElapsed(performance.now() - startedRef.current!)), 500);
    return () => clearInterval(id);
  }, [running, startedAt]);

  if (hidden) return null;

  const start = () => {
    startedRef.current = performance.now();
    setStartedAt(startedRef.current);
    setResults([]);
    setClock('0:00');
  };
  const reset = () => {
    startedRef.current = null;
    setStartedAt(null);
    setResults([]);
    setClock('0:00');
  };
  const stamp = (t: (typeof RESPONSE_TOUCHES)[number]) => {
    const { meets, text } = stampResult(t, performance.now() - startedRef.current!);
    setResults(r => [...r, { key: t.key, meets, text }]);
  };

  return (
    <aside className="box try-it speed-timer iw">
      <h3 className="box-title">● TRY IT · TIME YOUR OWN RESPONSE</h3>
      <InteractiveHeader hint="Start the timer, then tap each button as the reply arrives." widgetKey="response-timer" label="Response-time stopwatch" />
      <p>Press Start the moment your friend submits the inquiry, then press each button as the reply arrives.</p>
      <div className="timer-clock" role="timer">{clock}</div>
      <div className="script-actions timer-actions">
        <button type="button" className="btn-mini" onClick={start}>{startedAt === null ? 'Start' : 'Restart'}</button>
        {RESPONSE_TOUCHES.map(t => (
          <button key={t.key} type="button" className="btn-mini" disabled={startedAt === null || results.some(r => r.key === t.key)} onClick={() => stamp(t)}>
            {t.label}
          </button>
        ))}
        <button type="button" className="btn-mini" onClick={reset}>Reset</button>
      </div>
      <ul className="timer-results">
        {results.map(r => <li key={r.key} className={r.meets ? 'timer-ok' : 'timer-slow'}>{r.text}</li>)}
      </ul>
    </aside>
  );
}
