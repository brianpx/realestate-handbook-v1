import { describe, expect, it } from 'vitest';
import { placementStatsFrom } from './placements';

const NOW = new Date('2026-11-09T12:00:00Z');

describe('placementStatsFrom', () => {
  it('counts requests and consumed tokens per source, most requested first with ties by name', () => {
    const tokens = [
      { source: 'hero' as const, consumedAt: NOW },
      { source: 'hero' as const, consumedAt: null },
      { source: 'final' as const, consumedAt: NOW.toISOString() },
      { source: 'calculator' as const, consumedAt: null },
      { source: null, consumedAt: NOW },
    ];
    expect(placementStatsFrom(tokens)).toEqual([
      { source: 'hero', requested: 2, signedIn: 1 },
      { source: null, requested: 1, signedIn: 1 },
      { source: 'calculator', requested: 1, signedIn: 0 },
      { source: 'final', requested: 1, signedIn: 1 },
    ]);
  });
  it('is empty with no tokens', () => {
    expect(placementStatsFrom([])).toEqual([]);
  });
});
