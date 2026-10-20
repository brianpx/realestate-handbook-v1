import { CHECKPOINT_TOTAL } from '@/content/data/checkpoints';
import type { Blank } from '@/content/data/knowledge-checks';
import { htmlText } from './html-text';

/** The questions in a Checkpoint box: the title is dropped and the bullets split on <br>. */
export function parseCheckpointQuestions(innerHtml: string): string[] {
  return innerHtml
    .replace(/<div class="box-title">[\s\S]*?<\/div>/, '')
    .split(/<br\s*\/?>/i)
    .map(part => htmlText(part).replace(/^[\s•]+/, '').trim())
    .filter(Boolean);
}

/** Questions the reader marked "I've got it", across every chapter. */
export function checkpointConfident(checkpoints: Record<string, unknown> | undefined): number {
  return Object.values(checkpoints ?? {}).filter(v => typeof v === 'object' && v !== null && (v as { status?: unknown }).status === 'got').length;
}

export const rollupText = (confident: number): string => `${confident} of ${CHECKPOINT_TOTAL} checkpoint questions confident`;

/** Result line for a typed fill-in-the-blank answer: empty when nothing was typed. */
export function blankVerdict(typed: string, blank: Blank): { prefix: string; text: string } {
  const t = typed.trim().toLowerCase();
  const hit = t !== '' && blank.accept.includes(t);
  return { prefix: t ? (hit ? '✓ Correct. ' : '✗ Not quite. ') : '', text: `The answer is "${blank.answer}". ` };
}
