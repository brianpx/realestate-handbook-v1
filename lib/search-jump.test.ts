// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { findSearchTarget } from './search-jump';

const root = (html: string): HTMLElement => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div;
};

describe('findSearchTarget', () => {
  it('skips a screen-reader-only caption, as the index does', () => {
    const page = root('<table><caption class="visually-hidden">Same</caption></table><h3>Same</h3>');
    expect(findSearchTarget(page, { text: 'Same', occurrence: 0 })?.tagName).toBe('H3');
    expect(findSearchTarget(page, { text: 'Same', occurrence: 1 })).toBeNull();
  });

  it('finds a block by its full text, hidden inline text included', () => {
    const page = root('<p><a href="#">ARELLO<span class="visually-hidden"> (opens in a new tab)</span></a> finds regulators.</p>');
    expect(findSearchTarget(page, { text: 'ARELLO (opens in a new tab) finds regulators.', occurrence: 0 })?.tagName).toBe('P');
  });
});
