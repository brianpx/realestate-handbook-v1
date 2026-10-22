'use client';

import { useState } from 'react';
import type { CheckpointAnswer } from '@/content/data/checkpoints';
import { updateWidget, useHandbookState, widgetOf } from '@/lib/state';
import { InteractiveHeader } from './InteractiveHeader';

type Entry = { text?: unknown; status?: unknown };
const entryOf = (saved: Record<string, unknown>, key: string): Entry => (typeof saved[key] === 'object' && saved[key] !== null ? (saved[key] as Entry) : {});

export function CheckpointBox({ page, titleHtml, questions, answers }: { page: string; titleHtml: string; questions: string[]; answers: CheckpointAnswer[] }) {
  const saved = widgetOf(useHandbookState(), 'checkpoints');
  const got = questions.filter((_, i) => entryOf(saved, `${page}:${i}`).status === 'got').length;
  return (
    <aside className="box checkpoint iw">
      <h3 className="box-title" dangerouslySetInnerHTML={{ __html: titleHtml }} />
      <InteractiveHeader hint="Answer in your own words first, then check the key points. Your answers save on this device." widgetKey="checkpoint" label="Checkpoint self-test">
        <span className="cp-count">{got} of {questions.length} confident</span>
      </InteractiveHeader>
      <ol className="cp-list">
        {questions.map((question, i) => (
          <Item key={i} id={`${page}:${i}`} question={question} answer={answers[i]!} entry={entryOf(saved, `${page}:${i}`)} />
        ))}
      </ol>
    </aside>
  );
}

function Item({ id, question, answer, entry }: { id: string; question: string; answer: CheckpointAnswer; entry: Entry }) {
  const [open, setOpen] = useState(false);
  const [rated, setRated] = useState(false); // once the key has been opened the rating buttons stay
  const points = Array.isArray(answer);
  const idleLabel = points ? 'Check against the book' : 'Show a tip';
  const status = typeof entry.status === 'string' ? entry.status : undefined;
  const set = (patch: Entry) => updateWidget('checkpoints', w => { w[id] = { ...(typeof w[id] === 'object' && w[id] !== null ? (w[id] as object) : {}), ...patch }; });

  return (
    <li className="cp-item">
      <div className="cp-q">{question}</div>
      <label className="practice-label">
        Your answer
        <textarea className="practice-text" rows={2} value={typeof entry.text === 'string' ? entry.text : ''} onChange={e => set({ text: e.target.value })} />
      </label>
      <div className="script-actions">
        <button type="button" className="btn-mini" aria-expanded={open} onClick={() => { setOpen(!open); if (!open) setRated(true); }}>
          {open ? 'Hide key points' : idleLabel}
        </button>
      </div>
      <div className="cp-key" hidden={!open}>
        {points ? (
          <>
            <strong>Key points from the chapter</strong>
            <ul>{answer.map(point => <li key={point}>{point}</li>)}</ul>
          </>
        ) : (
          <p>{answer.reflect}</p>
        )}
      </div>
      <div className="script-actions" role="group" aria-label="How did you do?" hidden={!status && !rated}>
        <button type="button" className="btn-mini" aria-pressed={status === 'got'} onClick={() => set({ status: 'got' })}>I&apos;ve got it</button>
        <button type="button" className="btn-mini" aria-pressed={status === 'review'} onClick={() => set({ status: 'review' })}>Review this</button>
      </div>
    </li>
  );
}
