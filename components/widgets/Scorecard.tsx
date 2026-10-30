'use client';

import { useEffect, useRef, useState } from 'react';
import { SCORE_HEADINGS, SCORE_ROWS, SCORECARD_CAPTION, type ScoreRow } from '@/content/data/scorecard';
import { clearScorecard, setScore, setScoreChange, useHandbookState } from '@/lib/state';
import { AmountInput } from './AmountInput';
import { InteractiveHeader } from './InteractiveHeader';

const WEEKS = 4;
type Status = '' | 'hit' | 'close' | 'miss';
const STATUS_TEXT: Record<Exclude<Status, ''>, string> = { hit: '✓ Hit', close: '~ Close', miss: '✗ Miss' };

const MEASURABLE = SCORE_ROWS.filter(r => r.mode === 'min').length;

function statusFor(row: ScoreRow, value: number | undefined, previous: number | undefined, week: number): Status {
  if (value === undefined) return '';
  if (row.mode === 'min') {
    if (value >= row.min) return 'hit';
    return value >= row.min / 2 ? 'close' : 'miss';
  }
  if (row.mode === 'growing' && week > 0) {
    if (previous === undefined) return '';
    return value > previous ? 'hit' : 'miss';
  }
  return '';
}

const numberAt = (data: Record<string, unknown>, key: string): number | undefined => {
  const v = data[key];
  return typeof v === 'number' ? v : undefined;
};

export function Scorecard() {
  const { scorecard } = useHandbookState();
  const [clearCount, setClearCount] = useState(0); // remounts the inputs so text left in an invalid cell is dropped
  const [confirming, setConfirming] = useState(false);
  const [summary, setSummary] = useState('');
  const resetRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const announce = useRef(false);

  const hitsPerWeek: (number | null)[] = [];
  for (let w = 0; w < WEEKS; w++) {
    let hits = 0;
    let entered = 0;
    for (const row of SCORE_ROWS) {
      if (row.mode !== 'min') continue;
      const value = numberAt(scorecard, `${row.id}:${w}`);
      if (value === undefined) continue;
      entered++;
      if (statusFor(row, value, undefined, w) === 'hit') hits++;
    }
    hitsPerWeek.push(entered ? hits : null);
  }

  // Debounced so typing "12" does not announce for "1" and then "12".
  const hitsKey = hitsPerWeek.join(',');
  useEffect(() => {
    if (!announce.current) return;
    const timer = setTimeout(() => {
      const parts = hitsPerWeek.flatMap((h, w) => (h === null ? [] : [`week ${w + 1}: ${h} of ${MEASURABLE} targets hit`]));
      setSummary(parts.length ? parts.join('. ') : 'Scorecard cleared');
    }, 700);
    return () => clearTimeout(timer);
    // hitsPerWeek is derived from hitsKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hitsKey]);

  const closeConfirm = () => {
    setConfirming(false);
    // the reset button is hidden while confirming; focus can only return once it is shown again
    queueMicrotask(() => resetRef.current?.focus());
  };

  return (
    <>
      <InteractiveHeader
        hint="Type your weekly numbers. Cells change colour against each target and the chart updates as you type. Saved on this device."
        widgetKey="scorecard"
        label="Weekly activity scorecard"
      />
      <div className="table-wrapper">
        <table className="scorecard">
          <caption>{SCORECARD_CAPTION}</caption>
          <thead>
            <tr>{SCORE_HEADINGS.map(h => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {SCORE_ROWS.map(row => (
              <tr key={row.id} data-row={row.id} data-min={row.min} data-mode={row.mode}>
                <th scope="row">{row.label}</th>
                <td>{row.target}</td>
                {Array.from({ length: WEEKS }, (_, w) => {
                  const key = `${row.id}:${w}`;
                  const value = numberAt(scorecard, key);
                  const status = statusFor(row, value, numberAt(scorecard, `${row.id}:${w - 1}`), w);
                  const label = `${row.label}, week ${w + 1}`;
                  return (
                    <td key={w} data-status={status}>
                      <AmountInput
                        key={clearCount}
                        className="score-input"
                        label={status ? `${label}, ${STATUS_TEXT[status].slice(2).toLowerCase()}` : label}
                        hint="Numbers only."
                        value={value}
                        onValue={n => { announce.current = true; setScore(key, n); }}
                      />
                      <span className="score-status" aria-hidden="true">{status ? STATUS_TEXT[status] : ''}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="score-total">
              <th scope="row">Targets hit</th>
              <td />
              {hitsPerWeek.map((h, w) => <td key={w}>{h === null ? '' : `${h} of ${MEASURABLE}`}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="score-chart"><Chart hitsPerWeek={hitsPerWeek} /></div>
      <div className="visually-hidden" aria-live="polite">{summary}</div>
      <div className="scorecard-tools">
        {/* inline confirmation instead of window.confirm(): styled, keyboard-friendly, and doesn't block the page */}
        <button type="button" ref={resetRef} className="btn-nav btn-secondary" hidden={confirming} onClick={() => { setConfirming(true); queueMicrotask(() => cancelRef.current?.focus()); }}>
          Clear scorecard
        </button>
        <div className="scorecard-confirm" role="group" aria-label="Confirm clearing the scorecard" hidden={!confirming} onKeyDown={e => { if (e.key === 'Escape') closeConfirm(); }}>
          <span>Clear every number on the scorecard?</span>
          <button type="button" className="btn-nav" onClick={() => { announce.current = true; clearScorecard(); setClearCount(c => c + 1); closeConfirm(); }}>Yes, clear it</button>
          <button type="button" ref={cancelRef} className="btn-nav btn-secondary" onClick={closeConfirm}>Cancel</button>
        </div>
        {/* The static site loaded every chapter first so the whole book printed; here each chapter is its own page, so this prints this page. */}
        <button type="button" className="btn-nav btn-secondary" onClick={() => window.print()}>Print</button>
      </div>
    </>
  );
}

function Chart({ hitsPerWeek }: { hitsPerWeek: (number | null)[] }) {
  if (hitsPerWeek.every(h => h === null)) return <>Enter your numbers to see how many weekly targets you hit.</>;
  const barW = 56;
  const gap = 24;
  const height = 120;
  const width = WEEKS * (barW + gap) + gap;
  return (
    <>
      <div className="score-chart-title">Weekly targets hit (out of {MEASURABLE})</div>
      <svg viewBox={`0 0 ${width} ${height + 40}`} role="img" aria-label={`Weekly targets hit out of ${MEASURABLE}`} className="score-svg">
        {hitsPerWeek.map((hits, w) => {
          const x = gap + w * (barW + gap);
          const h = hits === null ? 0 : Math.round((hits / MEASURABLE) * height);
          return (
            <g key={w}>
              <rect x={x} y={height - h + 10} width={barW} height={h} rx={4} className="score-bar" />
              <text x={x + barW / 2} y={height - h + 4} textAnchor="middle" className="score-label">{hits === null ? '' : hits}</text>
              <text x={x + barW / 2} y={height + 30} textAnchor="middle" className="score-axis">Wk {w + 1}</text>
            </g>
          );
        })}
      </svg>
    </>
  );
}

// The free-text note under the table. It is stored with the numbers, so Clear scorecard empties it too.
export function ScoreChange() {
  const { scorecard } = useHandbookState();
  const change = typeof scorecard.change === 'string' ? scorecard.change : '';
  return (
    <label className="score-change" htmlFor="scoreChange">
      One change to make next week
      <textarea id="scoreChange" rows={2} value={change} onChange={e => setScoreChange(e.target.value)} />
    </label>
  );
}
