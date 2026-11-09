import { describe, expect, it } from 'vitest';
import { toCsv } from './csv';

describe('toCsv', () => {
  it('joins fields with commas and rows with CRLF, ending with one', () => {
    expect(toCsv([['a', 'b'], ['1', '2']])).toBe('a,b\r\n1,2\r\n');
  });
  it('quotes fields with a comma, a quote or a line break and doubles the quotes', () => {
    expect(toCsv([['x,y', 'say "hi"', 'two\nlines', 'plain']])).toBe('"x,y","say ""hi""","two\nlines",plain\r\n');
  });
  it('leaves an empty field empty', () => {
    expect(toCsv([['', 'b']])).toBe(',b\r\n');
  });
});
