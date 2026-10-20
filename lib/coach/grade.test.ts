import { describe, expect, it } from 'vitest';
import { grade, INTERVALS } from './grade';
import { newConceptState, type ConceptState } from './types';

const T = '2026-10-19';
const at = (box: number): ConceptState => ({ ...newConceptState(), box, due: T, seen: 1 });
const ok = { correct: true, confidence: 'sure', scheduled: true } as const;

describe('grade', () => {
  it('advances boxes 0-4 by one and uses the interval of the new box', () => {
    const expected = ['2026-10-20', '2026-10-22', '2026-10-26', '2026-11-02', '2026-11-18'];
    for (let box = 0; box <= 4; box++) {
      const r = grade(at(box), ok, T);
      expect(r.box).toBe(box + 1);
      expect(r.due).toBe(expected[box]);
      expect(INTERVALS[r.box]).toBeDefined();
    }
  });

  it('keeps box 5 at box 5 and recurs in 30 days', () => {
    const r = grade(at(5), ok, T);
    expect(r.box).toBe(5);
    expect(r.due).toBe('2026-11-18');
  });

  it('gives no credit for a correct guess and sees it tomorrow', () => {
    const r = grade(at(3), { ...ok, confidence: 'guess' }, T);
    expect(r.box).toBe(3);
    expect(r.due).toBe('2026-10-20');
  });

  it('drops to box 1 on a confident miss, otherwise by two, and flags', () => {
    expect(grade(at(4), { correct: false, confidence: 'sure', scheduled: true }, T)).toMatchObject({ box: 1, flagged: true, due: '2026-10-20' });
    expect(grade(at(4), { correct: false, confidence: 'think', scheduled: true }, T)).toMatchObject({ box: 2, flagged: true });
    expect(grade(at(1), { correct: false, confidence: 'guess', scheduled: true }, T)).toMatchObject({ box: 1, flagged: true });
    expect(grade(at(0), { correct: false, confidence: 'think', scheduled: true }, T).box).toBe(1);
  });

  it('gives practice answers no credit, but still demotes on a miss', () => {
    const r = grade(at(2), { ...ok, scheduled: false }, T);
    expect(r.box).toBe(2);
    expect(r.due).toBe(T);
    expect(grade(at(3), { correct: false, confidence: 'think', scheduled: false }, T).box).toBe(1);
  });

  it('clears the flag on a credited correct answer', () => {
    expect(grade({ ...at(1), flagged: true }, ok, T).flagged).toBe(false);
  });

  it('does not mutate its input', () => {
    const c = at(2);
    grade(c, ok, T);
    expect(c).toEqual(at(2));
  });
});
