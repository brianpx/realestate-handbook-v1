'use client';

import Link from 'next/link';
import { fixChapter, rankErrors, type ErrorRow } from '@/lib/drills';
import { updateWidget, useHandbookState, widgetOf } from '@/lib/state';
import { InteractiveHeader } from './InteractiveHeader';

export function ErrorScoreCard({ errors }: { errors: ErrorRow[] }) {
  const saved = widgetOf(useHandbookState(), 'selfscore');
  const ranked = rankErrors(errors, saved);
  const top = ranked[0];
  const chapter = top && fixChapter(top.fix);
  return (
    <aside className="box try-it iw">
      <h3 className="box-title">● SELF-SCORE · THE SIX ERRORS</h3>
      <InteractiveHeader hint="Rate how often each error shows up in your week, from 1 (never) to 5 (every day)." widgetKey="error-self-score" label="Six-errors self-score" />
      <div className="score-rows">
        {errors.map((err, i) => (
          <fieldset key={err.name} className="score-row">
            <legend>{err.name}</legend>
            <div className="score-options">
              {[1, 2, 3, 4, 5].map(v => (
                <label key={v} className="score-opt">
                  <input type="radio" name={`err-${i}`} value={v} checked={saved[i] === v} onChange={() => updateWidget('selfscore', w => { w[i] = v; })} />
                  <span>{v}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <p className="calc-note">1 = never, 5 = every day</p>
      <div className="score-result" aria-live="polite">
        {!top ? (
          <p className="calc-empty">Rate at least one error to see where to start.</p>
        ) : (
          <>
            <div className="score-bars">
              {ranked.map(e => (
                <div key={e.name} className="score-bar-row">
                  <span className="score-bar-name">{e.name}</span>
                  <span className="score-bar-track"><span className="score-bar-fill" style={{ width: `${(e.score / 5) * 100}%` }} /></span>
                  <span className="score-bar-num">{e.score}</span>
                </div>
              ))}
            </div>
            <div className="drill-feedback ok">
              <strong>Start with: {top.name}</strong>
              <p>What it costs: {top.cost}</p>
              <p>Fix: {top.fix} {chapter && <Link className="goto" href={`/ch${chapter}`}>Go to Chapter {chapter}</Link>}</p>
              {ranked.length < errors.length && <p className="calc-note">You have rated {ranked.length} of {errors.length} so far.</p>}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
