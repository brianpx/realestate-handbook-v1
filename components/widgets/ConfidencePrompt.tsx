'use client';

import { useId } from 'react';
import type { Confidence } from '@/lib/coach/types';

const CHOICES: { value: Confidence; label: string }[] = [
  { value: 'guess', label: 'Guessing' },
  { value: 'think', label: 'Think so' },
  { value: 'sure', label: 'Sure' },
];

// Asked after the question is visible and before its options, so the reader knows what they are rating.
// A confident wrong answer is the most useful signal the scheduler gets.
export function ConfidencePrompt({ onPick }: { onPick: (confidence: Confidence) => void }) {
  const labelId = useId();
  return (
    <div role="group" aria-labelledby={labelId}>
      <div className="quiz-sentence" id={labelId}>How sure are you? Choose before you see the answers.</div>
      <div className="script-actions">
        {CHOICES.map(c => (
          <button key={c.value} type="button" className="btn-mini" onClick={() => onPick(c.value)}>{c.label}</button>
        ))}
      </div>
    </div>
  );
}
