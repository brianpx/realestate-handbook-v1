'use client';

import { useEffect, useRef, useState } from 'react';
import { announce } from '@/lib/announce';
import { setScript, useHandbookState } from '@/lib/state';

type Mode = 'idle' | 'practicing' | 'revealed';
const PRACTICE_LABEL: Record<Mode, string> = { idle: 'Practice', practicing: 'Stop practicing', revealed: 'Practice again' };

export function ScriptBox({ titleHtml, bodyHtml, storageKey }: { titleHtml: string; bodyHtml: string; storageKey: string }) {
  const { scripts } = useHandbookState();
  const [mode, setMode] = useState<Mode>('idle');
  const [copyLabel, setCopyLabel] = useState('Copy script');
  const bodyRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const saved = typeof scripts[storageKey] === 'string' ? (scripts[storageKey] as string) : '';

  const copy = async () => {
    // everything before "Purpose:" is the words to say; the rest is coaching
    const text = (bodyRef.current?.innerText ?? '').split('Purpose:')[0]!.trim();
    try {
      await navigator.clipboard.writeText(text);
      setCopyLabel('Copied');
      announce('Script copied to clipboard');
    } catch {
      setCopyLabel('Copy failed');
      announce('Copy failed');
    }
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopyLabel('Copy script'), 1500);
  };

  const togglePractice = () => {
    const next: Mode = mode === 'practicing' ? 'idle' : 'practicing';
    setMode(next);
    if (next === 'practicing') queueMicrotask(() => textRef.current?.focus());
  };

  return (
    <div className={`box script${mode === 'practicing' ? ' practicing' : ''}`} data-widget="script-practice" tabIndex={-1}>
      <div className="box-title" dangerouslySetInnerHTML={{ __html: titleHtml }} />
      <div className="script-body" ref={bodyRef} dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      <div className="script-actions">
        <span className="interactive-pill"><span aria-hidden="true">◉ </span>INTERACTIVE</span>
        <button type="button" className="btn-mini" onClick={copy}>{copyLabel}</button>
        <button type="button" className="btn-mini" onClick={togglePractice}>{PRACTICE_LABEL[mode]}</button>
      </div>
      <div className="practice-area" hidden={mode === 'idle'}>
        <label className="practice-label">
          Say it in your own words (the script is hidden):
          <textarea ref={textRef} className="practice-text" rows={4} value={saved} onChange={e => setScript(storageKey, e.target.value)} />
        </label>
        <button type="button" className="btn-mini" hidden={mode !== 'practicing'} onClick={() => setMode('revealed')}>Reveal script to compare</button>
      </div>
    </div>
  );
}
