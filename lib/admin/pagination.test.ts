import { describe, expect, it } from 'vitest';
import { pageIndexFrom, pageItems } from './pagination';

describe('pageIndexFrom', () => {
  it('reads a one-based page from the query and falls back to the first page', () => {
    expect(pageIndexFrom(undefined)).toBe(0);
    expect(pageIndexFrom('1')).toBe(0);
    expect(pageIndexFrom('3')).toBe(2);
    expect(pageIndexFrom(['4', '9'])).toBe(3);
    expect(pageIndexFrom('0')).toBe(0);
    expect(pageIndexFrom('-2')).toBe(0);
    expect(pageIndexFrom('abc')).toBe(0);
    expect(pageIndexFrom('10000000000000000000000')).toBe(0); // past the safe integers: the database would refuse the offset
  });
});

describe('pageItems', () => {
  it('is empty for no pages and lists every page when there are few', () => {
    expect(pageItems(0, 0)).toEqual([]);
    expect(pageItems(0, 1)).toEqual([0]);
    expect(pageItems(2, 5)).toEqual([0, 1, 2, 3, 4]);
  });
  it('keeps the ends and the neighbours of the current page, with gaps between', () => {
    expect(pageItems(0, 20)).toEqual([0, 1, 'gap', 19]);
    expect(pageItems(10, 20)).toEqual([0, 'gap', 9, 10, 11, 'gap', 19]);
    expect(pageItems(19, 20)).toEqual([0, 'gap', 18, 19]);
  });
  it('shows a single left-out page instead of a gap for it', () => {
    expect(pageItems(3, 20)).toEqual([0, 1, 2, 3, 4, 'gap', 19]);
    expect(pageItems(16, 20)).toEqual([0, 'gap', 15, 16, 17, 18, 19]);
  });
});
