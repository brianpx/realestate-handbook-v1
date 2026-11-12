import { describe, expect, it } from 'vitest';
import { withProOnly } from './content';

describe('withProOnly', () => {
  const html = '<p>a</p><!--pro-only--><p>b</p><!--/pro-only--><p>c</p>';
  it('keeps the block for Pro and drops it, markers and all, for everyone else', () => {
    expect(withProOnly(html, true)).toBe('<p>a</p><p>b</p><p>c</p>');
    expect(withProOnly(html, false)).toBe('<p>a</p><p>c</p>');
  });
  it('leaves a page without the marker alone', () => {
    expect(withProOnly('<p>a</p>', false)).toBe('<p>a</p>');
  });
});
