import { describe, expect, it } from 'vitest';
import type { Question } from '../../content/data/questions';
import { buildDeck, dueLabel, requeueMiss, reviewQuestionIds } from './review';
import { newConceptState, type Attempt, type ConceptState } from './types';

const T = '2026-10-20';
const st = (due: string | null, box = 1): ConceptState => ({ ...newConceptState(), due, box, seen: 1 });
const mcq = (id: string, concept: string, draft?: true): Question => ({
  id, version: 1, concept, kind: 'mcq', prompt: id, options: ['a', 'b', 'c'], answer: 0, explain: 'because it is so', ...(draft ? { draft } : {}),
});
const attempt = (questionId: string, conceptId: string, at: string): Attempt => ({
  id: `${questionId}@${at}`, questionId, questionVersion: 1, conceptId, conceptVersion: 1, correct: true, confidence: 'sure',
  kind: 'review', answeredAt: at, deviceId: 'd',
});
const bank = [mcq('a1', 'ch4.speed-to-lead'), mcq('a2', 'ch4.speed-to-lead'), mcq('d1', 'ch4.speed-to-lead', true), mcq('b1', 'ch4.optional-tools'), mcq('c1', 'ch4.crm-setup', true)];

describe('reviewQuestionIds', () => {
  it('leaves draft questions out', () => {
    expect(reviewQuestionIds('ch4.speed-to-lead', bank)).toEqual(['a1', 'a2']);
    expect(reviewQuestionIds('ch4.crm-setup', bank)).toEqual([]);
  });
});

describe('buildDeck', () => {
  it('serves only what is due, and says when the next review is', () => {
    const deck = buildDeck({ 'ch4.speed-to-lead': st('2026-10-20'), 'ch4.optional-tools': st('2026-10-23') }, [], T, { bank });
    expect(deck.items.map(i => i.conceptId)).toEqual(['ch4.speed-to-lead']);
    expect(deck.nextDue).toBe('2026-10-23');
    expect(deck.hasHistory).toBe(true);
    expect(deck.deferred).toBe(0);
  });

  it('asks a different question than last time when there is one', () => {
    const states = { 'ch4.speed-to-lead': st(T) };
    const first = buildDeck(states, [attempt('a1', 'ch4.speed-to-lead', '2026-10-19T14:00:00Z')], T, { bank });
    expect(first.items[0]!.questionId).toBe('a2');
    const second = buildDeck(states, [attempt('a1', 'ch4.speed-to-lead', '2026-10-18T14:00:00Z'), attempt('a2', 'ch4.speed-to-lead', '2026-10-19T14:00:00Z')], T, { bank });
    expect(second.items[0]!.questionId).toBe('a1');
  });

  it('repeats the only question rather than skipping the concept', () => {
    const deck = buildDeck({ 'ch4.optional-tools': st(T) }, [attempt('b1', 'ch4.optional-tools', '2026-10-19T14:00:00Z')], T, { bank });
    expect(deck.items.map(i => i.questionId)).toEqual(['b1']);
  });

  it('skips concepts with no reviewed question', () => {
    const deck = buildDeck({ 'ch4.crm-setup': st(T) }, [], T, { bank });
    expect(deck.items).toEqual([]);
    expect(deck.deferred).toBe(0);
  });

  it('caps the deck, serving oldest due first, and reports the rest as deferred', () => {
    const states = { 'ch4.speed-to-lead': st('2026-10-10'), 'ch4.optional-tools': st('2026-10-15') };
    const deck = buildDeck(states, [], T, { bank, cap: 1 });
    expect(deck.items.map(i => i.conceptId)).toEqual(['ch4.speed-to-lead']);
    expect(deck.deferred).toBe(1);
  });

  it('reports no history for a learner who has answered nothing', () => {
    expect(buildDeck({}, [], T, { bank })).toEqual({ items: [], deferred: 0, nextDue: null, hasHistory: false });
  });
});

describe('requeueMiss', () => {
  const deck = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'].map(c => ({ conceptId: c, questionId: `${c}.q` }));

  it('puts a miss back at least three questions later, as a retest', () => {
    const out = requeueMiss(deck, 0, 'alt');
    expect(out).toHaveLength(7);
    expect(out[4]).toEqual({ conceptId: 'c1', questionId: 'alt', retest: true });
    expect(out.slice(0, 4).map(i => i.conceptId)).toEqual(['c1', 'c2', 'c3', 'c4']);
  });

  it('puts it at the end when fewer than three remain', () => {
    const out = requeueMiss(deck, 4, 'alt');
    expect(out.at(-1)).toEqual({ conceptId: 'c5', questionId: 'alt', retest: true });
    expect(out).toHaveLength(7);
  });

  it('does not requeue a retest again, and does not mutate its input', () => {
    const withRetest = [{ conceptId: 'c1', questionId: 'x', retest: true }];
    expect(requeueMiss(withRetest, 0, 'alt')).toEqual(withRetest);
    const before = JSON.stringify(deck);
    requeueMiss(deck, 2, 'alt');
    expect(JSON.stringify(deck)).toBe(before);
  });
});

describe('dueLabel', () => {
  it('reads naturally', () => {
    expect(dueLabel(T, T)).toBe('today');
    expect(dueLabel(T, '2026-10-21')).toBe('tomorrow');
    expect(dueLabel(T, '2026-10-27')).toBe('in 7 days');
  });
});
