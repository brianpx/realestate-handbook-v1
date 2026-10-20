import { describe, expect, it } from 'vitest';
import { dueQueue, interleave, pickQuestion } from './queue';
import { newConceptState, type ConceptState } from './types';

const s = (due: string | null, box = 1): ConceptState => ({ ...newConceptState(), due, box });

describe('dueQueue', () => {
  it('serves oldest-due first, capped, and defers the rest untouched', () => {
    const states = Object.fromEntries(
      Array.from({ length: 14 }, (_, i) => [`c${String(i).padStart(2, '0')}`, s(`2026-10-${String(1 + i).padStart(2, '0')}`)]),
    );
    const before = JSON.stringify(states);
    const { serve, deferred } = dueQueue(states, '2026-10-19');
    expect(serve).toHaveLength(10);
    expect(serve[0]).toBe('c00');
    expect(deferred).toEqual(['c10', 'c11', 'c12', 'c13']);
    expect(JSON.stringify(states)).toBe(before);
  });

  it('skips concepts that are not due or never answered', () => {
    const { serve } = dueQueue({ a: s('2026-10-20'), b: s(null, 0), c: s('2026-10-19') }, '2026-10-19');
    expect(serve).toEqual(['c']);
  });

  it('breaks due-date ties by lowest box, then id', () => {
    const { serve } = dueQueue({ b: s('2026-10-19', 3), a: s('2026-10-19', 3), c: s('2026-10-19', 1) }, '2026-10-19');
    expect(serve).toEqual(['c', 'a', 'b']);
  });
});

describe('interleave', () => {
  const ch = (id: string) => id[0]!;
  const longestRun = (xs: string[]) => xs.reduce((m, x, i) => { const r = i && ch(xs[i - 1]!) === ch(x) ? 1 : 0; return { run: r ? m.run + 1 : 1, max: Math.max(m.max, r ? m.run + 1 : 1) }; }, { run: 0, max: 0 }).max;

  it('never runs more than two from one chapter when the pool allows', () => {
    const out = interleave(['a1', 'a2', 'a3', 'a4', 'b1', 'b2', 'c1', 'c2'], ch);
    expect([...out].sort()).toEqual(['a1', 'a2', 'a3', 'a4', 'b1', 'b2', 'c1', 'c2']);
    expect(longestRun(out)).toBeLessThanOrEqual(2);
  });

  it('keeps the original order when nothing needs fixing', () => {
    expect(interleave(['a1', 'b1', 'a2', 'b2'], ch)).toEqual(['a1', 'b1', 'a2', 'b2']);
  });

  it('falls back to the remaining items when only one chapter is left', () => {
    expect(interleave(['a1', 'a2', 'a3'], ch)).toEqual(['a1', 'a2', 'a3']);
  });
});

describe('pickQuestion', () => {
  it('prefers a different question than last time', () => {
    expect(pickQuestion(['q1', 'q2', 'q3'], 'q1')).toBe('q2');
  });
  it('falls back to the only question', () => {
    expect(pickQuestion(['q1'], 'q1')).toBe('q1');
    expect(pickQuestion([], null)).toBeUndefined();
  });
});
