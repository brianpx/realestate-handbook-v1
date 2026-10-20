import { describe, expect, it } from 'vitest';
import { KNOWLEDGE_CHECKS } from '../../content/data/knowledge-checks';
import { QUESTIONS } from '../../content/data/questions';
import { attemptInput, chapterCheck, hasCoachCheck, isCorrect } from './check';

describe('chapterCheck', () => {
  it('asks the same four questions the chapter shipped with, in the same order', () => {
    const legacy = KNOWLEDGE_CHECKS.ch4!;
    const check = chapterCheck('ch4');
    expect(check.map(q => q.kind)).toEqual(['mcq', 'mcq', 'mcq', 'blank']);
    check.slice(0, 3).forEach((q, i) => {
      if (q.kind !== 'mcq') throw new Error('expected mcq');
      expect({ prompt: q.prompt, options: q.options, answer: q.answer, explain: q.explain })
        .toEqual({ prompt: legacy.mcq[i]!.q, options: legacy.mcq[i]!.options, answer: legacy.mcq[i]!.answer, explain: legacy.mcq[i]!.explain });
    });
    const blank = check[3]!;
    if (blank.kind !== 'blank') throw new Error('expected blank');
    expect(blank).toMatchObject({ before: legacy.blank.before, after: legacy.blank.after, answer: legacy.blank.answer, accept: legacy.blank.accept, explain: legacy.blank.explain });
  });

  it('leaves draft questions out', () => {
    expect(chapterCheck('ch4').some(q => q.draft)).toBe(false);
    expect(QUESTIONS.some(q => q.draft)).toBe(true);
  });

  it('is empty for an untagged chapter, which keeps the plain check', () => {
    expect(chapterCheck('ch1')).toEqual([]);
    expect(hasCoachCheck('ch1')).toBe(false);
    expect(hasCoachCheck('ch4')).toBe(true);
  });
});

describe('isCorrect', () => {
  const check = chapterCheck('ch4');
  const mcq = check[0]!;
  const blank = check[3]!;

  it('marks a multiple-choice answer by index', () => {
    if (mcq.kind !== 'mcq') throw new Error('expected mcq');
    expect(isCorrect(mcq, mcq.answer)).toBe(true);
    expect(isCorrect(mcq, mcq.answer + 1)).toBe(false);
  });

  it('accepts typed blank answers ignoring case and surrounding space', () => {
    expect(isCorrect(blank, ' Five ')).toBe(true);
    expect(isCorrect(blank, '5')).toBe(true);
    expect(isCorrect(blank, 'six')).toBe(false);
    expect(isCorrect(blank, '')).toBe(false);
  });
});

describe('attemptInput', () => {
  it('carries the question and concept versions', () => {
    const q = chapterCheck('ch4')[0]!;
    expect(attemptInput(q, false, 'sure', 'chapter_check')).toEqual({
      questionId: q.id, questionVersion: 1, conceptId: q.concept, conceptVersion: 1, correct: false, confidence: 'sure', kind: 'chapter_check',
    });
  });
});
