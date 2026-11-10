import { describe, expect, it } from 'vitest';
import { CONCEPTS } from '@/content/data/concepts';
import { QUESTIONS, type Question } from '@/content/data/questions';
import { hasCoachCheck } from '@/lib/coach/check';
import { deckChapters } from './ReviewDeck';

const mcq = (id: string, concept: string, draft?: true): Question => ({
  id, version: 1, concept, kind: 'mcq', prompt: id, options: ['a', 'b', 'c'], answer: 0, explain: 'because it is so', ...(draft ? { draft } : {}),
});

describe('deckChapters, the chapters the empty review deck points to', () => {
  it('leaves out a chapter whose questions are all drafts', () => {
    const reviewed = CONCEPTS.find(c => c.chapter === 'ch4')!;
    const draftOnly = CONCEPTS.find(c => c.chapter === 'ch5')!;
    const bank = [mcq('r1', reviewed.id), mcq('d1', draftOnly.id, true), mcq('d2', draftOnly.id, true)];
    expect(deckChapters(bank)).toEqual(['ch4']);
  });

  it('lists exactly the chapters with an end-of-chapter coach check', () => {
    const chapters = [...new Set(CONCEPTS.map(c => c.chapter))];
    expect(deckChapters(QUESTIONS)).toEqual(chapters.filter(hasCoachCheck));
  });
});
