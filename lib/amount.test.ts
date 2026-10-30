import { describe, expect, it } from 'vitest';
import { checkAmount, parseAmount } from './amount';

describe('parseAmount', () => {
  it.each([['1500', 1500], ['$1,500', 1500], [' 1 500 ', 1500], ['12.5', 12.5], ['.5', 0.5], ['7.', 7]])('parses %j', (raw, n) => {
    expect(parseAmount(raw)).toBe(n);
  });
  it.each(['', 'abc', '1e3', '-5', '1.2.3', '$'])('rejects %j', raw => {
    expect(parseAmount(raw)).toBeUndefined();
  });
});

describe('checkAmount', () => {
  it('treats an empty field as no value and no message', () => {
    expect(checkAmount('  ')).toEqual({ value: undefined, message: '' });
  });
  it('returns the number when valid', () => {
    expect(checkAmount('$40')).toEqual({ value: 40, message: '' });
  });
  it('explains unparseable input and drops the value', () => {
    expect(checkAmount('abc')).toEqual({ value: undefined, message: 'Numbers only, for example 1500.' });
    expect(checkAmount('abc', { hint: 'Numbers only.' }).message).toBe('Numbers only.');
  });
  it('enforces bounds', () => {
    expect(checkAmount('3', { min: 5 })).toEqual({ value: undefined, message: 'Enter 5 or more.' });
    expect(checkAmount('9', { max: 8 })).toEqual({ value: undefined, message: 'Enter 8 or fewer.' });
    expect(checkAmount('0')).toEqual({ value: 0, message: '' });
  });
});
