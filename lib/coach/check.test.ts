import { describe, expect, it } from 'vitest';
import { KNOWLEDGE_CHECKS } from '../../content/data/knowledge-checks';
import { QUESTIONS } from '../../content/data/questions';
import { attemptInput, chapterCheck, hasCoachCheck, isCorrect } from './check';

describe('chapterCheck', () => {
  const chapters = Object.keys(KNOWLEDGE_CHECKS);

  it.each(chapters)('%s asks the same four questions the chapter shipped with, in the same order', chapter => {
    const legacy = KNOWLEDGE_CHECKS[chapter]!;
    const check = chapterCheck(chapter);
    expect(check.map(q => q.kind)).toEqual(['mcq', 'mcq', 'mcq', 'blank']);
    check.slice(0, 3).forEach((q, i) => {
      if (q.kind !== 'mcq') throw new Error('expected mcq');
      expect({ prompt: q.prompt, options: q.options, answer: q.answer, explain: q.explain })
        .toEqual({ prompt: legacy.mcq[i]!.q, options: legacy.mcq[i]!.options, answer: legacy.mcq[i]!.answer, explain: legacy.mcq[i]!.explain });
    });
    const blank = check[3]!;
    if (blank.kind !== 'blank') throw new Error('expected blank');
    expect(blank).toMatchObject({ before: legacy.blank.before, after: legacy.blank.after, answer: legacy.blank.answer, accept: legacy.blank.accept, explain: legacy.blank.explain });
    expect(check.every(q => q.version === 1)).toBe(true);
  });

  it('leaves draft questions out', () => {
    for (const chapter of chapters) expect(chapterCheck(chapter).some(q => q.draft), chapter).toBe(false);
    expect(QUESTIONS.some(q => q.draft)).toBe(true);
  });

  it('gives all 13 chapters a coach check and nothing to a page without tagged questions', () => {
    expect(chapters).toHaveLength(13);
    for (const chapter of chapters) expect(hasCoachCheck(chapter), chapter).toBe(true);
    expect(chapterCheck('app-a')).toEqual([]);
    expect(hasCoachCheck('app-a')).toBe(false);
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
