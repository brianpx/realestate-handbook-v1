import { describe, expect, it } from 'vitest';
import { replay } from './replay';
import type { Attempt } from './types';

const TZ = 'America/New_York';
const V = { 'ch4.pipeline': 1 };

let n = 0;
const att = (over: Partial<Attempt> & { answeredAt: string }): Attempt => ({
  id: `a${String(++n).padStart(4, '0')}`,
  questionId: 'q1',
  questionVersion: 1,
  conceptId: 'ch4.pipeline',
  conceptVersion: 1,
  correct: true,
  confidence: 'sure',
  kind: 'chapter_check',
  deviceId: 'd1',
  ...over,
});

describe('replay', () => {
  it('advances at most one box for several correct answers in one local day', () => {
    const attempts = ['14', '15', '16', '17', '18'].map(h => att({ answeredAt: `2026-10-19T${h}:00:00Z` }));
    const s = replay(attempts, V, TZ)['ch4.pipeline']!;
    expect(s.box).toBe(1);
    expect(s.due).toBe('2026-10-20');
    expect(s.seen).toBe(5);
  });

  it('advances on a later scheduled review', () => {
    const s = replay(
      [att({ answeredAt: '2026-10-19T14:00:00Z' }), att({ answeredAt: '2026-10-20T14:00:00Z', kind: 'review' })],
      V, TZ,
    )['ch4.pipeline']!;
    expect(s.box).toBe(2);
    expect(s.due).toBe('2026-10-23');
  });

  it('gives no credit for a correct answer before the concept is due', () => {
    const s = replay(
      [att({ answeredAt: '2026-10-19T14:00:00Z' }), att({ answeredAt: '2026-10-19T14:00:00Z', id: 'z' }), att({ answeredAt: '2026-10-21T14:00:00Z' })],
      V, TZ,
    )['ch4.pipeline']!;
    // Day 1 credits box 1 (due 10-20). 10-21 is past due, so it is scheduled and advances to 2.
    expect(s.box).toBe(2);
    const early = replay(
      [att({ answeredAt: '2026-10-19T14:00:00Z' }), att({ answeredAt: '2026-10-20T14:00:00Z' }), att({ answeredAt: '2026-10-21T14:00:00Z' })],
      V, TZ,
    )['ch4.pipeline']!;
    // Box 2 is due 10-23, so the 10-21 answer is early and earns nothing.
    expect(early.box).toBe(2);
    expect(early.due).toBe('2026-10-23');
  });

  it('is independent of arrival order', () => {
    const a = [
      att({ answeredAt: '2026-10-19T14:00:00Z' }),
      att({ answeredAt: '2026-10-20T14:00:00Z', correct: false }),
      att({ answeredAt: '2026-10-22T14:00:00Z' }),
    ];
    const forward = replay(a, V, TZ);
    expect(replay([...a].reverse(), V, TZ)).toEqual(forward);
    expect(replay([a[1]!, a[2]!, a[0]!], V, TZ)).toEqual(forward);
  });

  it('counts a duplicated attempt once', () => {
    const a = att({ answeredAt: '2026-10-19T14:00:00Z' });
    expect(replay([a, a, { ...a }], V, TZ)['ch4.pipeline']!.seen).toBe(1);
  });

  it('merges two offline devices to the same state on both', () => {
    const d1 = [att({ answeredAt: '2026-10-19T14:00:00Z', deviceId: 'd1' })];
    const d2 = [att({ answeredAt: '2026-10-20T14:00:00Z', deviceId: 'd2', kind: 'review' })];
    expect(replay([...d1, ...d2], V, TZ)).toEqual(replay([...d2, ...d1], V, TZ));
  });

  it('clamps a device clock that runs ahead to the server receive time', () => {
    const ahead = att({ answeredAt: '2026-10-26T14:00:00Z', receivedAt: '2026-10-19T14:05:00Z' });
    expect(replay([ahead], V, TZ)['ch4.pipeline']!.due).toBe('2026-10-20');
  });

  it('lets later answers from another device override a clock running far behind', () => {
    const late = att({ answeredAt: '2026-10-05T14:00:00Z', correct: true });
    const later = att({ answeredAt: '2026-10-19T14:00:00Z', correct: false });
    const s = replay([later, late], V, TZ)['ch4.pipeline']!;
    expect(s.flagged).toBe(true);
    expect(s.box).toBe(1);
  });

  it('uses the learner zone for the once-per-day rule', () => {
    // 03:30Z and 12:00Z on 10-20 are 10-19 evening and 10-20 morning in New York: two different days.
    const s = replay(
      [att({ answeredAt: '2026-10-20T03:30:00Z' }), att({ answeredAt: '2026-10-20T12:00:00Z' })],
      V, TZ,
    )['ch4.pipeline']!;
    expect(s.box).toBe(2);
  });

  it('ignores attempts on an old concept version and unknown concepts', () => {
    const stale = att({ answeredAt: '2026-10-19T14:00:00Z', conceptVersion: 0 });
    const stray = att({ answeredAt: '2026-10-19T14:00:00Z', conceptId: 'nope' });
    expect(replay([stale, stray], V, TZ)).toEqual({});
  });
});
