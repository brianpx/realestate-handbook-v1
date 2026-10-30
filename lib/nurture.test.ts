import { describe, expect, it } from 'vitest';
import { NURTURE_TOUCHES } from '@/content/data/nurture';
import { inZone, NURTURE_FILTERS, touchLabel, touchNote } from './nurture';

const touch = (n: number) => NURTURE_TOUCHES[n - 1]!;
const count = (key: string) => NURTURE_TOUCHES.filter(NURTURE_FILTERS.find(f => f.key === key)!.test).length;

describe('the 13-touch plan', () => {
  it('has 13 numbered touches over 90 days, front-loaded', () => {
    expect(NURTURE_TOUCHES.map(t => t.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    expect(NURTURE_TOUCHES.at(-1)!.day).toBe(90);
    expect(NURTURE_TOUCHES.filter(t => t.day <= 14).length).toBe(7); // "Seven touches in the first 14 days"
  });
  it('gives value on every third touch: 3, 6, 9 and 12', () => {
    expect(NURTURE_TOUCHES.filter(t => t.value).map(t => t.n)).toEqual([3, 6, 9, 12]);
  });
});

describe('filters', () => {
  it('counts touches by channel (touch 1 is both a text and an email)', () => {
    expect(count('all')).toBe(13);
    expect(count('call')).toBe(5);
    expect(count('text')).toBe(4);
    expect(count('email')).toBe(5);
    expect(count('value')).toBe(4);
  });
});

describe('touchNote and labels', () => {
  it('says where most new agents stop and where conversions happen', () => {
    expect(touchNote(touch(2))).toMatch(/^This is where most new agents stop/);
    expect(touchNote(touch(4))).toMatch(/^Early touches/);
    expect(touchNote(touch(5))).toMatch(/^Inside touches 5 to 12/);
    expect(touchNote(touch(13))).toMatch(/^After touch 13/);
  });
  it('marks touches 5 to 12 as the zone', () => {
    expect(NURTURE_TOUCHES.filter(inZone).map(t => t.n)).toEqual([5, 6, 7, 8, 9, 10, 11, 12]);
    expect(touchLabel(touch(6))).toBe('Touch 6, day 10, Email, value touch, in the conversion zone');
  });
});
