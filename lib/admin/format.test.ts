import { describe, expect, it } from 'vitest';
import { formatCount, formatShare, formatWhen } from './format';

describe('admin formatting', () => {
  it('prints a time in UTC the same way from a string or a Date', () => {
    expect(formatWhen('2026-11-08T09:05:00Z')).toBe('Nov 8, 2026, 09:05 UTC');
    expect(formatWhen(new Date('2026-11-08T23:59:00Z'))).toBe('Nov 8, 2026, 23:59 UTC');
  });
  it('groups thousands and rounds a share to whole percent', () => {
    expect(formatCount(12345)).toBe('12,345');
    expect(formatShare(0.5)).toBe('50%');
    expect(formatShare(2 / 3)).toBe('67%');
  });
});
