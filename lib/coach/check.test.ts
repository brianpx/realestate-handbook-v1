import { describe, expect, it } from 'vitest';
import { CONCEPTS } from '../../content/data/concepts';
import { KNOWLEDGE_CHECKS } from '../../content/data/knowledge-checks';
import { QUESTIONS, type Question } from '../../content/data/questions';
import { attemptInput, chapterCheck, hasCoachCheck, isCorrect } from './check';

const CHAPTER_OF = new Map(CONCEPTS.map(c => [c.id, c.chapter]));

// The chapter's shipped quiz leads: its three multiple-choice questions come first, word for word and in order, and
// its blank is the first blank. Anything approved later follows them within its kind.
function expectShippedFirst(chapter: string, questions: Question[]) {
  const legacy = KNOWLEDGE_CHECKS[chapter]!;
  const mcq = questions.flatMap(q => (q.kind === 'mcq' ? [q] : []));
  const blank = questions.flatMap(q => (q.kind === 'blank' ? [q] : []));
  expect(mcq.slice(0, 3).map(q => ({ prompt: q.prompt, options: q.options, answer: q.answer, explain: q.explain })))
    .toEqual(legacy.mcq.map(m => ({ prompt: m.q, options: m.options, answer: m.answer, explain: m.explain })));
  expect(blank[0]).toMatchObject({ before: legacy.blank.before, after: legacy.blank.after, answer: legacy.blank.answer, accept: legacy.blank.accept, explain: legacy.blank.explain });
  for (const q of [...mcq.slice(0, 3), blank[0]!]) expect({ id: q.id, version: q.version, draft: q.draft }).toEqual({ id: q.id, version: 1, draft: undefined });
}

describe('chapterCheck', () => {
  const chapters = Object.keys(KNOWLEDGE_CHECKS);

  it.each(chapters)('%s opens with the four questions the chapter shipped with, in the same order', chapter => {
    const check = chapterCheck(chapter);
    expect(check.slice(0, 3).map(q => q.kind)).toEqual(['mcq', 'mcq', 'mcq']);
    expectShippedFirst(chapter, check);
  });

  it.each(chapters)('%s still opens with them once every draft is approved', chapter => {
    expectShippedFirst(chapter, QUESTIONS.filter(q => CHAPTER_OF.get(q.concept) === chapter));
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
