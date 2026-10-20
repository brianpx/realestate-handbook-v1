import { describe, expect, it } from 'vitest';
import { CONCEPTS } from '../../content/data/concepts';
import { QUESTIONS } from '../../content/data/questions';

const conceptIds = new Set(CONCEPTS.map(c => c.id));

describe('coach item bank', () => {
  it('has unique concept ids and question ids', () => {
    expect(conceptIds.size).toBe(CONCEPTS.length);
    expect(new Set(QUESTIONS.map(q => q.id)).size).toBe(QUESTIONS.length);
  });

  it('points every question at a known concept', () => {
    for (const q of QUESTIONS) expect(conceptIds.has(q.concept), q.id).toBe(true);
  });

  it('gives every concept at least two questions, differently worded', () => {
    for (const c of CONCEPTS) {
      const qs = QUESTIONS.filter(q => q.concept === c.id);
      expect(qs.length, c.id).toBeGreaterThanOrEqual(2);
      const stems = qs.map(q => (q.kind === 'mcq' ? q.prompt : q.before));
      expect(new Set(stems).size, c.id).toBe(stems.length);
    }
  });

  it('has a valid answer index and no duplicate options on every mcq', () => {
    for (const q of QUESTIONS) {
      if (q.kind !== 'mcq') continue;
      expect(q.options.length, q.id).toBeGreaterThanOrEqual(3);
      expect(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length, q.id).toBe(true);
      expect(new Set(q.options).size, q.id).toBe(q.options.length);
    }
  });

  it('accepts the stated answer on every fill-in-the-blank', () => {
    const norm = (s: string) => s.trim().toLowerCase();
    for (const q of QUESTIONS) {
      if (q.kind === 'blank') expect(q.accept.map(norm), q.id).toContain(norm(q.answer));
    }
  });

  it('keeps the answer position from clustering', () => {
    const positions = QUESTIONS.flatMap(q => (q.kind === 'mcq' ? [q.answer] : []));
    const counts = positions.reduce<Record<number, number>>((m, p) => ({ ...m, [p]: (m[p] ?? 0) + 1 }), {});
    expect(Math.max(...Object.values(counts))).toBeLessThan(positions.length * 0.75);
  });

  it('has an explanation on every question', () => {
    for (const q of QUESTIONS) expect(q.explain.length, q.id).toBeGreaterThan(10);
  });
});
