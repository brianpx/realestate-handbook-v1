'use client';

import { useState } from 'react';
import { QUALIFY_FIELDS, QUALIFY_SCENARIOS } from '@/content/data/qualify';
import { gradeQualify } from '@/lib/drills';
import { updateWidget, useHandbookState, widgetOf } from '@/lib/state';
import { InteractiveHeader } from './InteractiveHeader';

type Result = { right: boolean; missed: string[] };

export function QualifyCard({ phrasing }: { phrasing: Record<string, string> }) {
  const saved = widgetOf(useHandbookState(), 'qualify');
  const [index, setIndex] = useState(0);
  const s = QUALIFY_SCENARIOS[index]!;
  // each lead starts fresh: the key remounts the form so ticks and the chosen stage clear
  return (
    <div className="box try-it iw">
      <div className="box-title">● PRACTICE · QUALIFY AND STAGE A LEAD</div>
      <InteractiveHeader hint="Read each lead, tick the questions already answered, then choose where the lead belongs." widgetKey="qualifying-drill" label="Qualifying drill" />
      <div className="drill">
        <div className="drill-progress">Lead {index + 1} of {QUALIFY_SCENARIOS.length} · {Object.keys(saved).length} done</div>
        <blockquote className="drill-prompt">{s.quote}</blockquote>
        <Lead key={index} scenario={s} phrasing={phrasing} last={index === QUALIFY_SCENARIOS.length - 1} onNext={() => setIndex((index + 1) % QUALIFY_SCENARIOS.length)} index={index} />
      </div>
    </div>
  );
}

function Lead({ scenario: s, phrasing, last, onNext, index }: { scenario: (typeof QUALIFY_SCENARIOS)[number]; phrasing: Record<string, string>; last: boolean; onNext: () => void; index: number }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [stage, setStage] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [warn, setWarn] = useState(false);

  const check = () => {
    if (!stage) { setWarn(true); return; }
    const graded = gradeQualify(s, picked, stage);
    updateWidget('qualify', w => { w[String(index)] = graded.right; });
    setWarn(false);
    setResult(graded);
  };
  const open = QUALIFY_FIELDS.filter(f => !s.answered.includes(f));

  return (
    <>
      <fieldset className="drill-fieldset">
        <legend>Which questions has this person already answered?</legend>
        {QUALIFY_FIELDS.map(name => (
          <label key={name} className="opt-item">
            <input type="checkbox" value={name} checked={picked.includes(name)} onChange={e => setPicked(p => (e.target.checked ? [...p, name] : p.filter(x => x !== name)))} />
            <span>{name}</span>
          </label>
        ))}
      </fieldset>
      <fieldset className="drill-fieldset">
        <legend>Where does this lead belong this week?</legend>
        {([['active', 'Active opportunity (gets calls)'], ['nurture', 'Nurture (follow-up plan)']] as const).map(([value, text]) => (
          <label key={value} className="opt-item">
            <input type="radio" name={`stage-${index}`} value={value} checked={stage === value} onChange={() => setStage(value)} />
            <span>{text}</span>
          </label>
        ))}
      </fieldset>
      <div className="script-actions">
        <button type="button" className="btn-mini" disabled={result !== null} onClick={check}>Check my answer</button>
      </div>
      <div className={`drill-feedback${result ? (result.right ? ' ok' : ' no') : warn ? ' no' : ''}`} aria-live="polite">
        {warn && !result && 'Choose a stage first.'}
        {result && (
          <>
            <strong>{result.right ? '✓ Correct. ' : '✗ Not quite. '}</strong>
            <ul>
              {QUALIFY_FIELDS.map(f => (
                <li key={f}>{f}: {s.answered.includes(f) ? 'answered' : 'still to ask'}{result.missed.includes(f) ? ' (you marked this the other way)' : ''}</li>
              ))}
            </ul>
            <p>Stage: {s.stage === 'active' ? 'active opportunity' : 'nurture'}. {s.why}</p>
            {open.length > 0 && <p className="nurture-sample">Ask next ({open[0]}): {phrasing[open[0]!] ?? ''}</p>}
            <div className="script-actions">
              <button type="button" className="btn-mini" onClick={onNext}>{last ? 'Start over' : 'Next lead →'}</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
